const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
  let plugin = {};

  plugin.id = 'signalk-starlink-gps';
  plugin.name = 'Starlink GPS';
  plugin.description = 'Fetches GPS data from Starlink terminal via HTTP';

  plugin.start = function (options) {
    setInterval(async () => {
      try {
        const response = await axios.get('http://192.168.100.1');
        const $ = cheerio.load(response.data);
        const preText = $('pre').text(); // Assumes JSON is in <pre> tag

        if (preText.includes('"location"')) {
          const data = JSON.parse(preText);
          const location = data.location || {};
          const enabled = location.enabled !== undefined ? location.enabled : 'N/A';
          const latitude = location.latitude !== undefined ? location.latitude : 'N/A';
          const longitude = location.longitude !== undefined ? location.longitude : 'N/A';
          const altitude = location.altitude_meters !== undefined ? location.altitude_meters : 'N/A';
          const uncertainty = location.uncertainty_meters !== undefined ? location.uncertainty_meters : 'N/A';
          const gps_time = location.gps_time_s !== undefined ? location.gps_time_s : 'N/A';
          const uncertainty_valid = location.uncertainty_meters_valid !== undefined ? location.uncertainty_meters_valid : 'N/A';

          console.log(`Enabled: ${enabled}, Latitude: ${latitude}, Longitude: ${longitude}, Altitude: ${altitude}, Uncertainty: ${uncertainty}, GpsTime: ${gps_time}, UncertaintyValid: ${uncertainty_valid}`);
        } else {
          console.log('No location data found');
        }
      } catch (err) {
        console.log(`Error: ${err.message}`);
        if (err.response?.data?.includes('offline')) {
          console.log('Obstruction detected, reposition dish');
        }
      }
    }, 5000);
  };

  plugin.stop = function () {
    // Cleanup if needed
  };

  plugin.schema = {
    type: 'object',
    properties: {}
  };

  return plugin;
};
