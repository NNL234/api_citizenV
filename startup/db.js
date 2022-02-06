const mongoose = require("mongoose");
const config = require("config");

const mongooseOpts = {    
    useNewUrlParser: true,
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
    poolSize: 10,
};

module.exports = function () {
  const db = config.get("db");
  mongoose.connect(db, mongooseOpts).then(() => console.log("Connected!"));
};