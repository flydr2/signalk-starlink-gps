const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

module.exports = function (app) {
  let plugin = {};
  let client;

  plugin.id = 'signalk-starlink-gps';
  plugin.name = 'Starlink GPS Plugin';
  plugin.description = 'Fetches GPS data from Starlink terminal via gRPC';

  plugin.start = function (options) {
    const protoDefinition = protoLoader.loadSync(__dirname + '/dish.proto', {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });
    const proto = grpc.loadPackageDefinition(protoDefinition).SpaceX.API.Device;

    client = new proto.Device('192.168.100.1:9200', grpc.credentials.createInsecure());

    setInterval(() => {
      client.DishGetLocation({}, (err, response) => {
        if (err) {
          app.error(`gRPC error: ${err.message}`);
          return;
        }
        const location = response.location || {};
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
      });
    }, 5000); // Changed to 5 seconds for stability
  };

  plugin.stop = function () {};

  plugin.schema = {
    type: 'object',
    properties: {}
  };

  return plugin;
};
