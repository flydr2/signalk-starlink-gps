SignalK Starlink GPS Plugin
Overview
This Signal K plugin fetches GPS data (latitude, longitude, altitude) from a Starlink terminal at 192.168.100.1:9200 using grpcurl and publishes it to the starlink.gps.position path in Signal K. It is designed to run on a Raspberry Pi with Signal K on OpenPlotter, connected to the Starlink Wi-Fi network.
Features

Fetches latitude, longitude, and altitude from the Starlink terminal via gRPC.
Publishes data to the Signal K path starlink.gps.position.
Polls every 1 second for real-time updates.

Discrepancies
Compared to the diagnostic data from http://192.168.100.1 (scraped by a Selenium script), the plugin has the following limitations:

Missing Fields: The plugin does not retrieve enabled, uncertainty_meters, gps_time_s, or uncertainty_meters_valid, which are present in the Starlink web interface’s <pre> tag JSON (e.g., gpsTimeS: 1435123067.8203866, uncertaintyMeters: 5, uncertaintyMetersValid: true).
Console Output: The plugin does not print to the console in the format Enabled: ..., Latitude: ..., Longitude: ..., Altitude: ..., Uncertainty: ..., GpsTime: ..., UncertaintyValid: ..., only publishing to Signal K.
Obstruction: The Starlink terminal may report obstructed: true (diagnostic data: Jun 28, 2025, 05:17:29Z), which can cause gRPC errors or missing data. Repositioning the dish may be required.
Firmware Dependency: The plugin relies on the Handle method with get_location for firmware 2025.06.14.cr57739.1. Future firmware updates may break compatibility.

Installation
Prerequisites

Raspberry Pi: Running OpenPlotter with Signal K server installed.
Network: Connected to the Starlink Wi-Fi network (IP: 192.168.100.1).
Starlink App: Ensure “Allow access on local network” is enabled (Advanced > Debug Data).
Dependencies:
grpcurl: For gRPC communication.
Node.js and npm: For Signal K plugin installation.



Setup Steps

Install Dependencies:
sudo apt update
sudo apt install -y grpcurl

Verify: grpcurl --version.

Install Signal K (if not already installed):
sudo npm install -g signalk-server

Verify: signalk-server --version.

Clone and Install the Plugin:
cd ~/.signalk
rm -rf node_modules/signalk-starlink-gps
npm cache clean --force
npm install git+https://github.com/flydr2/signalk-starlink-gps.git


Enable the Plugin:

Open Signal K admin interface: http://<pi-ip>:3000.
Go to Server > Plugin Config, enable signalk-starlink-gps, and save.
Or edit ~/.signalk/settings.json:{
  "enabledPlugins": ["signalk-starlink-gps"]
}




Start Signal K:
signalk-server


Verify Output:

Monitor logs:tail -f ~/.signalk/signalk-server.log


Expected log (example):Raw gRPC response: { "status": {}, "apiVersion": "37", "getLocation": { "lla": { "lat": -22.285317333333346, "lon": 166.4420422492083, "alt": 64.41999999954726 }, "source": "GPS" } }


Data is published to starlink.gps.position in Signal K.



Troubleshooting

gRPC Error: If logs show “gRPC error: UNAVAILABLE” or “offline”:
Check obstructed: true in the Starlink app and reposition dish.
Test connectivity:grpcurl -plaintext -d '{"get_location": {}}' 192.168.100.1:9200 SpaceX.API.Device.Device/Handle

Share the response.


JSON Parse Error: If logs show “JSON parse error,” share the full log output.
Plugin Not Loading: Verify files in ~/.signalk/node_modules/signalk-starlink-gps/:ls -l ~/.signalk/node_modules/signalk-starlink-gps/

Ensure package.json and index.js are present.
Obstruction: If data is inconsistent, check Starlink app for obstructed: true and reposition dish.

Notes

Terms of Service: Accessing Starlink’s gRPC endpoint may violate Starlink’s terms of service.
Firmware: Tested with firmware 2025.06.14.cr57739.1. Updates may affect compatibility.
Future Improvements: To match Selenium script output, consider adding console logging and support for enabled, uncertainty_meters, gps_time_s, and uncertainty_meters_valid.

Contributing
Contributions are welcome! Submit issues or pull requests to https://github.com/flydr2/signalk-starlink-gps.
License
Apache-2.0
