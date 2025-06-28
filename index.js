const { exec } = require('child_process');

module.exports = function (app) {
  const plugin = {
    id: 'signalk-starlink-gps',
    name: 'Starlink GPS Plugin',
    description: 'Fetches GPS data from Starlink terminal via gRPC',
    start: function (options, restartPlugin) {
      setInterval(() => {
        // First gRPC call for get_location
        exec('grpcurl -plaintext -d \'{"get_location": {}}\' 192.168.100.1:9200 SpaceX.API.Device.Device/Handle', (err, stdout, stderr) => {
          if (err) {
            app.error('gRPC error (get_location): ' + err.message);
            if (err.message.includes('UNAVAILABLE') || stderr.includes('offline')) {
              app.error('Obstruction detected, reposition dish');
            }
            return;
          }
          app.error('Raw gRPC response (get_location): ' + stdout);

          let enabled = 'N/A', latitude = 'N/A', longitude = 'N/A', altitude = 'N/A';
          let uncertainty = 'N/A', gps_time = 'N/A', uncertainty_valid = 'N/A';

          try {
            const data = JSON.parse(stdout);
            const location = data.getLocation || {};
            enabled = location.lla ? true : 'N/A';
            latitude = location.lla?.lat !== undefined ? location.lla.lat : 'N/A';
            longitude = location.lla?.lon !== undefined ? location.lla.lon : 'N/A';
            altitude = location.lla?.alt !== undefined ? location.lla.alt : 'N/A';
          } catch (e) {
            app.error('JSON parse error (get_location): ' + e.message);
          }

          // Second gRPC call for get_status
          exec('grpcurl -plaintext -d \'{"get_status": {}}\' 192.168.100.1:9200 SpaceX.API.Device.Device/Handle', (err2, stdout2, stderr2) => {
            if (err2) {
              app.error('gRPC error (get_status): ' + err2.message);
              if (err2.message.includes('UNAVAILABLE') || stderr2.includes('offline')) {
                app.error('Obstruction detected, reposition dish');
              }
            } else {
              app.error('Raw gRPC response (get_status): ' + stdout2);
              try {
                const data2 = JSON.parse(stdout2);
                const status = data2.get_status?.device_state || {};
                uncertainty = status.uncertainty_meters !== undefined ? status.uncertainty_meters : 'N/A';
                gps_time = status.gps_time_s !== undefined ? status.gps_time_s : 'N/A';
                uncertainty_valid = status.uncertainty_meters_valid !== undefined ? status.uncertainty_meters_valid : 'N/A';
                if (status.enabled !== undefined) enabled = status.enabled;
              } catch (e) {
                app.error('JSON parse error (get_status): ' + e.message);
              }
            }

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
          });
        });
      }, 5000);
    },
    stop: function () {},
    schema: {}
  };
  return plugin;
};
