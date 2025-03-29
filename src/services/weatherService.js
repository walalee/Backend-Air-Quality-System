const axios = require("axios");

const getWeather = async () => {
    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=YOUR_CITY&appid=${process.env.OPENWEATHER_API_KEY}`
        );
        return response.data;
    } catch (err) {
        console.error("Error fetching weather:", err);
        return null;
    }
};

module.exports = { getWeather };
