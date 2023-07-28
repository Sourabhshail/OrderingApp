const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./app/models");
const app = express();
const Redis = require('ioredis');
const ORDER_CHANNEL = 'new_order';
const ORDER_LOGISTICS = 'logistics';
const subscriber = new Redis();
const Logistics = db.logistics;
var corsOptions = {
    origin: "http://localhost:8081"
};

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(express.json());


app.get("/", (req, res) => {
    res.json({ message: "Welcome to Order app application." });
});

subscriber.subscribe(ORDER_CHANNEL);

// Handle messages from Redis Pub/Sub and send to clients
subscriber.on('message', (channel, message) => {
    if (channel === ORDER_CHANNEL) {

        let data = JSON.parse(message)
        let destination = data.destination;
        saveDataIntoLogistics(destination,data.orderId);

    }
});


const redisSubscriber = new Redis();
redisSubscriber.subscribe('order-shipment-channel', (err, count) => {
    if (err) {
        console.error('Error subscribing to channel:', err);
    } else {
        redisSubscriber.on('message', async (channel, message) => {
            console.log(`Received message from channel "${channel}": ${message}`);
            if (channel === 'order-shipment-channel') {
                let order = JSON.parse(message);
                let orderId = order.orderId;
                const data = await Logistics.findOne({
                    where: { "orderId": orderId },
                    raw: true,
                })
                console.log("Result >>", data);
                const redisPublisher = new Redis();
                redisPublisher.publish('order-shipment-channel', JSON.stringify(data), (err, count) => {
                    if (err) {
                        console.error('Error publishing message:', err);
                    } else {
                        redisPublisher.quit();
                    }
                });
            }
        });
    }
});



async function saveDataIntoLogistics(destination,orderId) {
    const logisticsDetails = {
        "orderId":orderId,
        "city": destination.city,
        "address": destination.address,
        "pin": destination.pin
    }

    Logistics.create(logisticsDetails)
        .then(data => {
            const redisPublisher = new Redis();
            
            const message = JSON.stringify({ result: true });
            redisPublisher.publish(ORDER_LOGISTICS, message, (err, count) => {
                if (err) {
                    console.error('Error publishing message:', err);
                } else {
                    redisPublisher.quit();
                }
            });
        })
        .catch(err => {
            const redisPublisher = new Redis();
            const message = JSON.stringify({ result: false });
            redisPublisher.publish(ORDER_LOGISTICS, message, (err, count) => {
                if (err) {
                    console.error('Error publishing message:', err);
                } else {
                    redisPublisher.quit();
                }
            });
        });
}




// set port, listen for requests
const PORT = process.env.PORT || 8082;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});