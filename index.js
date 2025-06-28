const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

module.exports = function (app) {
  let plugin = {};
  let client;

  plugin.id = 'signalk-starlink-gps';
  plugin.name = 'Starlink GPS';
  plugin.description = 'Fetches GPS data from Starlink terminal via gRPC';

  plugin.start = function (options) {
    // Load proto file
    const protoDefinition = protoLoader.loadSync(__dirname + '/dish.proto', {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });
    const proto = grpc.loadPackageDefinition(protoDefinition).SpaceX.API.Device;

    // Initialize gRPC client
    client = new proto.Device('192.168.100.1:9200', grpc.credentials.createInsecure());

    // Poll every 5 seconds
    setInterval(() => {
      client.GetStatus({}, (err, response) => {
        if (err) {
          console.log(`Error: ${err.message}`);
          return;
        }
        const location = response.dish_get_status?.location || {};
        const enabled = location.enabled !== undefined ? location.enabled : 'N/A';
        const latitude = location.latitude !== undefined ? location.latitude : 'N/A';
        const longitude = location.longitude !== undefined ? location.longitude : 'N/A';
        const altitude = location.altitude_meters !== undefined ? location.altitude_meters : 'N/A';
        const uncertainty = location.uncertainty_meters !== undefined ? location.uncertainty_meters : 'N/A';
        const gps_time = location.gps_time_s !== undefined ? location.gps_time_s : 'N/A';
        const uncertainty_valid = location.uncertainty_meters_valid !== undefined ? location.uncertainty_meters_valid : 'N/A';

        console.log(`Enabled: ${enabled}, Latitude: ${latitude}, Longitude: ${longitude}, Altitude: ${altitude}, Uncertainty: ${uncertainty}, GpsTime: ${gps_time}, UncertaintyValid: ${uncertainty_valid}`);
      });
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