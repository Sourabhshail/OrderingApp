const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./app/models");
const app = express();
const Redis = require('ioredis');
const ORDER_CHANNEL = 'new_order';
const ORDER_INVENTORY = 'inventory'
const subscriber = new Redis();
const Inventory = db.inventory;
let inventoryCount = 1000;
var corsOptions = {
    origin: "http://localhost:8081"
};

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Order Inventory application." });
});

subscriber.subscribe(ORDER_CHANNEL);

// Handle messages from Redis Pub/Sub and send to clients
subscriber.on('message', (channel, message) => {
    if (channel === ORDER_CHANNEL) {
        const orderData = JSON.parse(message);
        updateInventory(orderData);
    }

});


async function updateInventory(orderData) {
    try {
        const { itemId, quantity, orderId } = orderData;
        if (inventoryCount >= quantity) {
            inventoryCount -= quantity;
            const inventoryDetails = {
                "itemId": itemId,
                "orderId":orderId,
                "quantityAvailable": inventoryCount
            }
            Inventory.update(inventoryDetails, {
                where: { itemId: itemId }
            })
                .then(num => {
                    if (num == 1) {
                        const redisPublisher = new Redis();
                        
                        const message = JSON.stringify({ result: true });
                        redisPublisher.publish(ORDER_INVENTORY, message, (err, count) => {
                            if (err) {
                                console.error('Error publishing message:', err);
                            } else {
                                redisPublisher.quit();
                            }
                        });
                    } else {
                        console.log(`Cannot update Inventory with id=${itemId}. Maybe Inventory was not found!`)
                        
                        Inventory.create(inventoryDetails);
                        const redisPublisher = new Redis();
                        const message = JSON.stringify({ result: true });
                        redisPublisher.publish(ORDER_INVENTORY, message, (err, count) => {
                            if (err) {
                                console.error('Error publishing message:', err);
                            } else {
                                redisPublisher.quit();
                            }
                        });
                    }
                })
                .catch(err => {
                    const redisPublisher = new Redis();
                    
                    const message = JSON.stringify({ result: false });
                    redisPublisher.publish(ORDER_INVENTORY, message, (err, count) => {
                        if (err) {
                            console.error('Error publishing message:', err);
                        } else {
                            redisPublisher.quit();
                        }
                    });
                });
        }
    } catch (error) {
        const redisPublisher = new Redis();
        const message = JSON.stringify({ result: false });
        redisPublisher.publish(ORDER_INVENTORY, message, (err, count) => {
            if (err) {
                console.error('Error publishing message:', err);
            } else {
                redisPublisher.quit();
            }
        });
    }
}

// set port, listen for requests
const PORT = process.env.PORT || 8083;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});