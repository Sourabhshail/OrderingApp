const express = require("express");
const cors = require("cors");
const db = require("./app/models");
const Order = db.orderhistory;
var app = require('express')();
const Redis = require('ioredis');
const publisher = new Redis();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
let ORDER_CHANNEL = 'new_order';
let ORDER_HISTORY = 'order_history';
let ORDER_LOGISTICS = 'logistics';
let ORDER_INVENTORY = 'inventory'
let ORDER_INFO = 'order_info';

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(express.json());

db.sequelize.sync({ force: false, alter: true })
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });


app.get("/", (req, res) => {
  res.json({ message: "Welcome to Order app application." });
});


app.post("/placeorder", async (req, res) => {

  //let order = JSON.stringify(req.body);
  let order = req.body;
  const count = await Order.count();
  console.log(count);
  order["orderId"] = count;
  const orderData = JSON.stringify(order);

  publisher.publish(ORDER_CHANNEL, orderData);

  const redisSubscriber1 = new Redis();

  redisSubscriber1.subscribe(ORDER_HISTORY, (err, count) => {
    if (err) {
      console.error('Error subscribing to channel:', err);
    } else {
      redisSubscriber1.on('message', (subscribedChannel, message) => {
        console.log(`Received message from channel "${subscribedChannel}": ${message}`);
      });
    }
  });

  const redisSubscriber2 = new Redis();
  redisSubscriber2.subscribe(ORDER_LOGISTICS, (err, count) => {
    if (err) {
      console.error('Error subscribing to channel:', err);
    } else {
      redisSubscriber2.on('message', (subscribedChannel, message) => {
        console.log(`Received message from channel "${subscribedChannel}": ${message}`);
      });
    }
  });

  const redisSubscriber3 = new Redis();
  redisSubscriber3.subscribe(ORDER_INVENTORY, (err, count) => {
    if (err) {
      console.error('Error subscribing to channel:', err);
    } else {
      redisSubscriber3.on('message', (subscribedChannel, message) => {
        console.log(`Received message from channel "${subscribedChannel}": ${message}`);
      });
    }
  });

  res.status(200).send({ "msg": "Order Placed Successfully, Your Order Id is : " + count });
});

// set port, listen for requests
const PORT = 4000;

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});


io.on('connection', function (socket) {
  console.log('user has connected!');

  socket.on('disconnect', function () {
    console.log('user disconnected');
  });

  socket.on('order-info-event', function (upvote_flag) {
    const redisSubscriber = new Redis();
    redisSubscriber.publish('order-history-channel', upvote_flag, (err, count) => {
      if (err) {
        console.error('Error subscribing to channel:', err);
      } else {
        redisSubscriber.subscribe('message', (channel, message) => {
          console.log(`Received message from channel "${channel}": ${message}`);
          if (channel === 'order-history-channel') {
            io.emit('order-info-status', JSON.parse(message));
          }
          else {
            
          }
        });
      }
    });
  });

  socket.on('shipment-status-event', function (upvote_flag) {
    
    const redisSubscriber = new Redis();
    redisSubscriber.publish('order-shipment-channel', upvote_flag, (err, count) => {
      if (err) {
        console.error('Error subscribing to channel:', err);
      } else {
        redisSubscriber.subscribe('message', (channel, message) => {
          console.log(`Received message from channel "${channel}": ${message}`);
          if (channel === 'order-shipment-channel') {
            io.emit('order-shipment-status', JSON.parse(message));
          }
          else {
            
          }
        });
      }
    });
   
  });

});