const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./app/models");
const OrderHistory = db.orderhistory;
const app = express();
const Redis = require('ioredis');
const subscriber = new Redis();
const ORDER_CHANNEL = 'new_order';
const ORDER_HISTORY = 'order_history';
const ORDER_INFO = 'order_info';





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
        let orderData = JSON.parse(message)
        saveDataintoOrderHistory(orderData);

    }
});


const orderInfo_client = new Redis();
orderInfo_client.subscribe(ORDER_INFO);
// Listen to Redis messages
orderInfo_client.on('message', (channel, message) => {
    if (channel === ORDER_INFO) {
        console.log(channel, message);
    }
});


const redisSubscriber = new Redis();
redisSubscriber.subscribe('order-history-channel', (err, count) => {
    if (err) {
        console.error('Error subscribing to channel:', err);
    } else {
        redisSubscriber.on('message', async (channel, message) => {
            if (channel === 'order-history-channel') {
                let order = JSON.parse(message);
                console.log(order.orderId)
                let orderId = order.orderId;
                fetchOrderInfo(orderId);

            }
        });
    }
});


async function fetchOrderInfo(orderId) {

    const data = await OrderHistory.findOne({
        where: { "orderId": orderId },
        raw: true
    })

    if (data) {
        const redisPublisher = new Redis();
        redisPublisher.publish('order-history-channel', JSON.stringify(data), (err, count) => {
            if (err) {
                console.error('Error publishing message:', err);
            } else {
                console.log(JSON.stringify(data))
            }
        });
    }

}



async function saveDataintoOrderHistory(data) {

    const orderHistory = {
        "itemId": data.itemId,
        "orderId": data.orderId,
        "quantity": data.quantity,
        "totalCost": data.totalCost,
        "perItemCost": data.perItemCost,
        "shippingCharges": data.shippingCharges,
        "estimatedDeliveryDate": data.estimatedDeliveryDate,
        "deliveryType": data.deliveryType
    }

    OrderHistory.create(orderHistory)
        .then(data => {
            const redisPublisher = new Redis();
            const message = JSON.stringify({ result: true });
            redisPublisher.publish(ORDER_HISTORY, message, (err, count) => {
                if (err) {
                    console.error('Error publishing message:', err);
                } else {
                    redisPublisher.quit();
                }
            });

        })
        .catch(err => {
            console.log(err);
            const redisPublisher = new Redis();
            const message = JSON.stringify({ result: false });
            redisPublisher.publish(ORDER_HISTORY, message, (err, count) => {
                if (err) {
                    console.error('Error publishing message:', err);
                } else {
                    redisPublisher.quit();
                }
            });
        });
}




// set port, listen for requests
const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});