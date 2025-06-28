const { exec } = require('child_process');

module.exports = function (app) {
  const plugin = {
    id: 'signalk-starlink-gps',
    name: 'Starlink GPS Plugin',
    description: 'Fetches GPS data from Starlink terminal via gRPC',
    start: function (options, restartPlugin) {
      setInterval(() => {
        exec('grpcurl -plaintext -d \'{"get_location": {"full_details": true}}\' 192.168.100.1:9200 SpaceX.API.Device.Device/Handle', (err, stdout, stderr) => {
          if (err) {
            app.error('gRPC error: ' + err.message);
            if (err.message.includes('UNAVAILABLE') || stderr.includes('offline')) {
              app.error('Obstruction detected, reposition dish');
            }
            return;
          }
          app.error('Raw gRPC response: ' + stdout);

          let enabled = 'N/A', latitude = 'N/A', longitude = 'N/A', altitude = 'N/A';
          let uncertainty = 'N/A', gps_time = 'N/A', uncertainty_valid = 'N/A';

          try {
            const data = JSON.parse(stdout);
            const location = data.get_location || {};
            enabled = location.enabled !== undefined ? location.enabled : (location.lla ? true : 'N/A');
            latitude = location.latitude !== undefined ? location.latitude : (location.lla?.lat || 'N/A');
            longitude = location.longitude !== undefined ? location.longitude : (location.lla?.lon || 'N/A');
            altitude = location.altitude_meters !== undefined ? location.altitude_meters : (location.lla?.alt || 'N/A');
            uncertainty = location.uncertainty_meters !== undefined ? location.uncertainty_meters : 5;
            gps_time = location.gps_time_s !== undefined ? location.gps_time_s : Date.now() / 1000;
            uncertainty_valid = location.uncertainty_meters_valid !== undefined ? location.uncertainty_meters_valid : true;

            console.log(`Enabled: ${enabled}, Latitude: ${latitude}, Longitude: ${longitude}, Altitude: ${altitude}, Uncertainty: ${uncertainty}, GpsTime: ${gps_time}, UncertaintyValid: ${uncertainty_valid}`);

            const delta = {
              updates: [{
                values: [{
                  path: 'starlink.position',
                  value: {
                    latitude: latitude !== 'N/A' ? parseFloat(latitude) : null,
                    longitude: longitude !== 'N/A' ? parseFloat(longitude) : null,
                    altitude: altitude !== 'N/A' ? parseFloat(altitude) : null
                  }
                }, {
                  path: 'starlink.gnss',
                  value: {
                    enabled: enabled !== 'N/A' ? enabled : null,
                    uncertainty: uncertainty !== 'N/A' ? parseFloat(uncertainty) : null,
                    gps_time: gps_time !== 'N/A' ? parseFloat(gps_time) : null,
                    uncertainty_valid: uncertainty_valid !== 'N/A' ? uncertainty_valid : null
                  }
                }]
              }]
            };
            app.handleMessage('signalk-starlink-gps', delta);
          } catch (e) {
            app.error('JSON parse error: ' + e.message);
          }
        });
      }, 5000);
    },
    stop: function () {},
    schema: {}
  };
  return plugin;
};
