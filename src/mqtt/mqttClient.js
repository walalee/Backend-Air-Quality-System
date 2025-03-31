const mqtt = require("mqtt");
const DataModel = require("../models/DataModel");

const mqttClient = mqtt.connect("mqtt:// broker.emqx.io:1883");

mqttClient.on("connect", () => {
    console.log("Connected to MQTT Broker");
    mqttClient.subscribe("sensor/data");
});

mqttClient.on("message", async (topic, message) => {
    if (topic === "sensor/data") {
        const sensorData = JSON.parse(message.toString());
        console.log("Received from Arduino:", sensorData);

        // บันทึกข้อมูลลง MongoDB
        const newData = new DataModel(sensorData);
        await newData.save();
    }
});

module.exports = mqttClient;
