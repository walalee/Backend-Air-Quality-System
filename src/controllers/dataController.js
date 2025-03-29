const DataModel = require("../models/DataModel");

const getData = async (req, res) => {
    try {
        const data = await DataModel.find().sort({ timestamp: -1 }).limit(10);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
};

module.exports = { getData };
