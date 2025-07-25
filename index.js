const { exec } = require('child_process');

module.exports = function (app) {
  const plugin = {
    id: 'signalk-starlink-gps',
    name: 'Starlink GPS Plugin',
    start: function (options, restartPlugin) {
      const { exec } = require('child_process');
      setInterval(() => {
        exec('grpcurl -plaintext -d \'{"get_location": {}}\' 192.168.100.1:9200 SpaceX.API.Device.Device/Handle', (err, stdout) => {
          if (err) {
            app.error('gRPC error: ' + err);
            return;
          }
          try {
            const data = JSON.parse(stdout);
            const delta = {
              updates: [{
                values: [{
                  path: 'starlink.gps.position',
                  value: {
                    longitude: data.getLocation.lla.lon,
                    latitude: data.getLocation.lla.lat
                  }
                }]
              }]
            };
            app.handleMessage('signalk-starlink-gps', delta);
          } catch (e) {
            app.error('JSON parse error: ' + e);
          }
        });
      }, 1000); // Every 1 seconds
    },
    stop: function () {},
    schema: {}
  };
  return plugin;
};
