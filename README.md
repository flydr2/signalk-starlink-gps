# SignalK Starlink GPS Plugin

![Signal K](https://img.shields.io/badge/Signal%20K-Plugin-blue)
![License](https://img.shields.io/badge/License-Apache%202.0-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

## Overview
The **SignalK Starlink GPS Plugin** integrates GPS data from a Starlink terminal into a Signal K server, designed for marine navigation systems running on OpenPlotter (Raspberry Pi). It fetches `latitude`, `longitude`, and `altitude` from the Starlink terminal at `192.168.100.1:9200` using `grpcurl` and publishes the data to the Signal K path `starlink.gps.position`.

## Features
- **Real-Time GPS Data**: Retrieves `latitude`, `longitude`, and `altitude` every 1 second.
- **Signal K Integration**: Publishes data to `starlink.gps.position` for use in marine navigation apps.
- **Lightweight**: Uses `grpcurl` for efficient communication with the Starlink terminal.
- **Open Source**: Licensed under Apache-2.0, hosted on GitHub.

## Discrepancies
Compared to the diagnostic data from `http://192.168.100.1` (accessible via a web browser or Selenium script), the plugin has the following limitations:
- **Missing Fields**: Does not retrieve `enabled`, `uncertainty_meters`, `gps_time_s`, or `uncertainty_meters_valid`, which are available in the Starlink web interface’s `<pre>` tag JSON (example: `gpsTimeS: 1435123067.8203866`, `uncertaintyMeters: 5`, `uncertaintyMetersValid: true`).
- **Console Output**: Does not print to the console in the format `Enabled: ..., Latitude: ..., Longitude: ..., Altitude: ..., Uncertainty: ..., GpsTime: ..., UncertaintyValid: ...`, only publishing to Signal K.
- **Obstruction Issues**: The Starlink terminal may report `obstructed: true`, causing intermittent gRPC errors or missing data. Repositioning the dish may be required.
- **Firmware Dependency**: Tested with firmware `2025.06.14.cr57739.1`. Future updates may affect compatibility.

## Prerequisites
- **Raspberry Pi**: Running OpenPlotter with Signal K server installed.
- **Network**: Connected to the Starlink Wi-Fi network (IP: `192.168.100.1`).
- **Starlink App**: “Allow access on local network” enabled (Advanced > Debug Data).
- **Dependencies**:
  - `grpcurl`: For gRPC communication.
  - Node.js and npm: For Signal K and plugin installation.

## Installation
Follow these steps to install and configure the plugin on your Raspberry Pi:

1. **Install Dependencies**:
   ```bash
   sudo apt update
   sudo apt install -y grpcurl

   sudo npm install -g signalk-server
   cd ~/.signalk
   rm -rf node_modules/signalk-starlink-gps
   npm cache clean --force
   npm install git+https://github.com/flydr2/signalk-starlink-gps.git
   npm audit fix

restart signalk

Enable Plugin:

    Open http://<pi-ip>:3000 > Server > Plugin Config, enable signalk-starlink-gps, save.

Option if you want to use the GPS as your main source you can edit the index.js and replace:

    path: 'starlink.gps.position'
    
to:

    path: 'navigation.position',
   
![FB_IMG_1751666589130](https://github.com/user-attachments/assets/a3badc97-a479-434d-bc9c-e7f8d4075bff)
