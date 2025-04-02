const axios = require('axios');

const getAirQuality = async (locationId) => {
    try {
        const response = await axios.get(`https://api.openaq.org/v3/locations/${locationId}`, {
            headers: {
                'X-API-Key': process.env.OPENAQ_API_KEY
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching air quality data:', error);
        throw error;
    }
};

module.exports = { getAirQuality };
