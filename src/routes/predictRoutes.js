const express = require("express");
const { getPrediction } = require("../controllers/predictController");

const router = express.Router();
router.get("/", getPrediction);

module.exports = router;
