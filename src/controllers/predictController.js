const axios = require("axios");

const getPrediction = async (req, res) => {
    try {
        const response = await axios.get("http://localhost:5000/predict");
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: "AI Model Error" });
    }
};

module.exports = { getPrediction };
