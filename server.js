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

// เชื่อมต่อ MongoDB (เชื่อมต่อครั้งเดียว)
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Connection Error:", err));

// สร้าง Schema สำหรับเก็บข้อมูล
const DataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    airQuality: Number,
    pm2_5: Number,
    pm10: Number,
    co: Number,
    o3: Number,
    no2: Number,
    so2: Number,
    timestamp: { type: Date, default: Date.now }
});

const DataModel = mongoose.model("SensorData", DataSchema);

// ฟังก์ชันดึงข้อมูลจาก OpenWeather API
async function getWeather() {
    try {
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Bangkok&appid=${process.env.OPENWEATHER_API_KEY}`);
        return res.data;
    } catch (err) {
        console.error("Error fetching weather:", err);
        return null;
    }
}

// หากต้องการดึงข้อมูลจาก OpenWeather ทุกๆ 10 นาที (600,000 ms)
setInterval(async () => {
    const weatherData = await getWeather();
    if (weatherData) {
        // ส่งข้อมูลไปยัง Frontend ผ่าน WebSockets
        io.emit("weatherData", weatherData);
    }
}, 600000);  // 10 นาที

// รับข้อมูลจาก Arduino ผ่าน MQTT
const mqttClient = mqtt.connect("mqtt://broker.emqx.io:1883");

mqttClient.on("connect", () => {
    console.log("Connected to MQTT Broker");
    mqttClient.subscribe("sensor/data", (err) => {
        if (err) {
            console.error("Failed to subscribe to topic:", err);
        } else {
            console.log("Subscribed to topic: sensor/data");
        }
    });
});

mqttClient.on("message", async (topic, message) => {
    if (topic === "sensor/data") {
        const sensorData = JSON.parse(message.toString());
        console.log("Received from Arduino:", sensorData);

        // บันทึกข้อมูลลง MongoDB
        const newData = new DataModel(sensorData);
        await newData.save()
            .then(() => console.log("Sensor data saved to MongoDB"))
            .catch((err) => console.error("Failed to save data to MongoDB:", err));

        // ส่งข้อมูลไปยัง Frontend ผ่าน WebSockets
        io.emit("newData", sensorData);
    }
});

// จัดการข้อผิดพลาด MQTT
mqttClient.on("error", (err) => {
    console.error("MQTT Error:", err);
});

mqttClient.on("close", () => {
    console.warn("MQTT Disconnected. Attempting to reconnect...");
    setTimeout(() => {
        mqttClient.reconnect();
    }, 5000); // พยายามเชื่อมต่อใหม่หลังจาก 5 วินาที
});

// API สำหรับดึงข้อมูลย้อนหลังจาก MongoDB
app.get("/api/data", async (req, res) => {
    try {
        const data = await DataModel.find().sort({ timestamp: -1 }).limit(10);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error fetching data" });
    }
});

// API ดึงข้อมูลพยากรณ์จาก AI Model (Random Forest)
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

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// เปิดเซิร์ฟเวอร์
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
