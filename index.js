const { exec } = require('child_process');

module.exports = function (app) {
  const plugin = {
    id: 'signalk-starlink-gps',
    name: 'Starlink GPS Plugin',
    description: 'Fetches GPS data from Starlink terminal via gRPC',
    start: function (options, restartPlugin) {
      setInterval(() => {
        exec('grpcurl -plaintext -d \'{"get_location": {}}\' 192.168.100.1:9200 SpaceX.API.Device.Device/Handle', (err, stdout, stderr) => {
          if (err) {
            app.error('gRPC error: ' + err.message);
            if (err.message.includes('UNAVAILABLE') || stderr.includes('offline')) {
              app.error('Obstruction detected, reposition dish');
            }
            return;
          }
          app.error('Raw gRPC response: ' + stdout); // Debug output
          try {
            const data = JSON.parse(stdout);
            const location = data.get_location || {};
            const enabled = location.enabled !== undefined ? location.enabled : 'N/A';
            const latitude = location.latitude !== undefined ? location.latitude : 'N/A';
            const longitude = location.longitude !== undefined ? location.longitude : 'N/A';
            const altitude = location.altitude_meters !== undefined ? location.altitude_meters : 'N/A';
            const uncertainty = location.uncertainty_meters !== undefined ? location.uncertainty_meters : 'N/A';
            const gps_time = location.gps_time_s !== undefined ? location.gps_time_s : 'N/A';
            const uncertainty_valid = location.uncertainty_meters_valid !== undefined ? location.uncertainty_meters_valid : 'N/A';

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
