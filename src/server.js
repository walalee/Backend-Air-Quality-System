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
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error(err));

// สร้าง Schema สำหรับเก็บข้อมูล
const DataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    airQuality: Number,
    timestamp: { type: Date, default: Date.now }
});

const DataModel = mongoose.model("SensorData", DataSchema);

// ดึงข้อมูลจาก OpenWeather
async function getWeather() {
    try {
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=YOUR_CITY&appid=${process.env.OPENWEATHER_API_KEY}`);
        return res.data;
    } catch (err) {
        console.error("Error fetching weather:", err);
        return null;
    }
}

// รับข้อมูลจาก Arduino ผ่าน MQTT
const mqttClient = mqtt.connect("mqtt://your-mqtt-broker");
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

// API สำหรับดึงข้อมูลย้อนหลัง
app.get("/api/data", async (req, res) => {
    const data = await DataModel.find().sort({ timestamp: -1 }).limit(10);
    res.json(data);
});

// API ดึงข้อมูลพยากรณ์จาก Model AI (Random Forest)
app.get("/api/predict", async (req, res) => {
    // เรียกใช้งาน Model AI (เช่น Python Flask)
    try {
        const response = await axios.get("http://localhost:5000/predict");
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
