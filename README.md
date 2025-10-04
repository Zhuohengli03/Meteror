# Meteor Madness — Interactive Web Dashboard

This repository hosts a comprehensive solution for the NASA Space Apps **Meteor Madness** challenge. It includes both a Java console application and a modern web-based dashboard for visualizing meteor and asteroid data from NASA APIs.

## Features

### 🌐 Web Dashboard
- **Interactive Dashboard**: Modern, responsive web interface with real-time data visualization
- **Multiple Data Views**: Close approaches, fireballs, and near-earth objects
- **Interactive Charts**: Line charts, doughnut charts, and statistical visualizations
- **Interactive Map**: Leaflet-based map showing fireball locations and approach trajectories
- **Real-time Updates**: Live data fetching with customizable date ranges and filters

### 📊 Data Sources
- **CNEOS Close Approach Data (CAD)**: <https://ssd-api.jpl.nasa.gov/cad.api>
- **CNEOS Fireball API**: <https://ssd-api.jpl.nasa.gov/fireball.api>
- **NeoWs (Near-Earth Object Web Service) Feed**: <https://api.nasa.gov/neo/rest/v1/feed>

## Requirements
- JDK 17 or later
- Maven 3.9+
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Set an environment variable `NASA_API_KEY` for the NeoWs feed.
    - If not set, the app falls back to the limited `DEMO_KEY`.

## Quick Start

### Option 1: Web Dashboard (Recommended)
```bash
# Start the web server
./start-web-server.sh
```

Then open your browser and navigate to: **http://localhost:8080**

### Option 2: Console Application
```bash
# Build and run console version
mvn -q -DskipTests package
java -jar target/meteor-madness-0.1.0.jar --demo
```

## Web Dashboard Features

### 📈 Overview Tab
- Real-time statistics dashboard
- Interactive charts showing data trends
- Energy distribution analysis for fireballs
- Close approach timeline visualization

### 🛰️ Close Approaches Tab
- Customizable date range filtering
- Distance and velocity filtering
- Sortable data table with detailed information
- Real-time data fetching

### 🔥 Fireballs Tab
- Historical fireball event data
- Energy and velocity analysis
- Geographic location data
- Customizable time range queries

### 🌍 Near Earth Objects Tab
- Potentially hazardous asteroid tracking
- Size estimation data
- Temporal analysis of NEOs
- Hazard assessment information

### 🗺️ Interactive Map Tab
- Visual representation of fireball locations
- Approach trajectory mapping
- Interactive markers with detailed information
- Geographic data visualization

## API Endpoints

The web server exposes the following REST API endpoints:

- `GET /api/close-approaches` - Close approach data
- `GET /api/fireballs` - Fireball event data  
- `GET /api/neo-feed` - Near-earth object feed

## Development

### Project Structure
```
├── src/main/java/org/spaceapps/meteormadness/
│   ├── WebServer.java          # HTTP server and API endpoints
│   ├── Main.java               # Console application entry point
│   ├── service/              # Data service layer
│   ├── clients/              # NASA API clients
│   └── util/                 # Utility classes
├── web/                      # Web dashboard files
│   ├── index.html           # Main dashboard page
│   ├── styles.css           # Modern CSS styling
│   └── app.js               # Interactive JavaScript
└── start-web-server.sh       # Quick start script
```

### Customization
- Modify `web/app.js` to customize dashboard behavior
- Update `web/styles.css` for styling changes
- Extend `WebServer.java` for additional API endpoints
- Modify data service classes for different data processing

## Troubleshooting

### Common Issues
1. **Port 8080 already in use**: Change the port in `WebServer.java` and restart
2. **NASA API rate limits**: Set `NASA_API_KEY` environment variable for higher limits
3. **Browser compatibility**: Ensure you're using a modern browser with JavaScript enabled

### Environment Variables
```bash
export NASA_API_KEY="your-nasa-api-key-here"
```

## Contributing

This project is designed for the NASA Space Apps Challenge. Feel free to extend the functionality, improve the visualizations, or add new data sources.

## License

See LICENSE file for details.
