require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const axios = require("axios");
const mqtt = require("mqtt");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" },
});

// เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// สร้าง Schema สำหรับเก็บข้อมูล
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
    timestamp: { type: Date, default: Date.now }
});

const DataModel = mongoose.model("SensorData", DataSchema);

// ดึงข้อมูลจาก OpenWeather
async function getWeather() {
    try {
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Bangkok&appid=${process.env.OPENWEATHER_API_KEY}`);
        return res.data;
    } catch (err) {
        console.error("Error fetching weather:", err);
        return null;
    }
} 

setInterval(getWeather, 600000);

// รับข้อมูลจาก Arduino ผ่าน MQTT
const mqttClient = mqtt.connect("mqtt://broker.emqx.io:1883");

mqttClient.on("connect", () => mqttClient.subscribe("sensor/data"));
mqttClient.on("message", async (topic, message) => {
    if (topic === "sensor/data") {
        const sensorData = JSON.parse(message.toString());
        console.log("Received from Arduino:", sensorData);

        // บันทึกข้อมูลลง MongoDB
        const newData = new DataModel(sensorData);
        await newData.save();

        // ส่งข้อมูลไปยัง Frontend ผ่าน WebSockets
        io.emit("newData", sensorData);
    }
});


mqttClient.on("error", (err) => console.error("MQTT Error:", err));
mqttClient.on("close", () => console.warn("MQTT Disconnected. Attempting to reconnect..."));

// API สำหรับดึงข้อมูลย้อนหลัง
app.get("/api/data", async (req, res) => {
    try {
        const data = await DataModel.find().sort({ timestamp: -1 }).limit(10);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error fetching data" });
    }
});

// API ดึงข้อมูลพยากรณ์จาก Model AI (Random Forest)
app.get("/api/predict", async (req, res) => {
    try {
        const response = await axios.get("http://localhost:5000/predict");
        io.emit("predictionData", response.data);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: "AI Model Error" });
    }
});

// WebSocket เมื่อมีการเชื่อมต่อจาก Frontend
io.on("connection", (socket) => {
    console.log("Client connected");
    socket.on("disconnect", () => console.log("Client disconnected"));
});

// เปิดเซิร์ฟเวอร์
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
