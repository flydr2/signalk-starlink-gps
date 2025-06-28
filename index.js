const puppeteer = require('puppeteer');

module.exports = function (app) {
  let plugin = {};
  let browser;

  plugin.id = 'signalk-starlink-gps';
  plugin.name = 'Starlink GPS';
  plugin.description = 'Fetches GPS data from Starlink terminal via HTTP';

  plugin.start = async function (options) {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

    setInterval(async () => {
      try {
        const page = await browser.newPage();
        await page.goto('http://192.168.100.1', { waitUntil: 'networkidle2', timeout: 10000 });
        const preText = await page.evaluate(() => document.querySelector('pre')?.innerText || '');

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
          if (await page.evaluate(() => document.body.innerText.includes('offline'))) {
            console.log('Obstruction detected, reposition dish');
          }
        }
        await page.close();
      } catch (err) {
        console.log(`Error: ${err.message}`);
      }
    }, 5000);
  };

  plugin.stop = async function () {
    if (browser) await browser.close();
  };

  plugin.schema = {
    type: 'object',
    properties: {}
  };

  return plugin;
};
