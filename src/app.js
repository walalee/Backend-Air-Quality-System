const express = require('express');
const cors = require('cors');
const dataRoutes = require('./routes/dataRoutes');
const predictRoutes = require('./routes/predictRoutes');
const airQualityRoutes = require('./routes/airQualityRoutes'); // เพิ่มบรรทัดนี้

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/data', dataRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/air-quality', airQualityRoutes); // เพิ่มบรรทัดนี้

module.exports = app;
