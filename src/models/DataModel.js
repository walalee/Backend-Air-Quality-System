const mongoose = require("mongoose");

const DataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    airQuality: Number,
    pm2_5: Number,
    pm10: Number,
    co: Number,
    o3: Number,
    no2:Number,
    so2: Number,
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SensorData", DataSchema);
