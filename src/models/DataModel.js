const mongoose = require("mongoose");

const DataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    airQuality: Number,
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SensorData", DataSchema);
