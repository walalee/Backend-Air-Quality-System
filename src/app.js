const express = require("express");
const cors = require("cors");
const dataRoutes = require("./routes/dataRoutes");
const predictRoutes = require("./routes/predictRoutes");

const app = express();
app.use(cors());
app.use(express.json()); // ให้รองรับ JSON request

// กำหนด Routes
app.use("/api/data", dataRoutes);
app.use("/api/predict", predictRoutes);

module.exports = app;

