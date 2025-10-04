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
- **EONET Natural Events API**: <https://eonet.gsfc.nasa.gov/api/v3/events>

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
mvn compile exec:java -Dexec.mainClass="org.spaceapps.meteormadness.Main"
```

### Option 3: Run with Demo Mode
```bash
# Run with demo flag for additional features
mvn compile exec:java -Dexec.mainClass="org.spaceapps.meteormadness.Main" -Dexec.args="--demo"
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
- `GET /api/natural-events` - EONET natural events data
- `GET /api/event-categories` - Natural event categories
- `GET /api/test` - API connectivity test
- `GET /api/reset-key` - Reset NASA API key

## Development

### Project Structure
```
├── src/main/java/org/spaceapps/meteormadness/
│   ├── WebServer.java          # HTTP server and API endpoints
│   ├── Main.java               # Console application entry point
│   ├── service/              # Data service layer
│   │   └── MeteorDataService.java
│   ├── clients/              # NASA API clients
│   │   ├── CadClient.java    # Close Approach Data API
│   │   ├── FireballClient.java # Fireball API
│   │   ├── NeoWsClient.java  # Near-Earth Object Web Service
│   │   └── EonetClient.java  # EONET Natural Events API
│   └── util/                 # Utility classes
│       ├── HttpUtil.java     # HTTP client with SSL fixes
│       ├── JsonUtil.java     # JSON processing utilities
│       ├── TablePrinter.java # Console table formatting
│       └── Config.java       # Configuration management
├── web/                      # Web dashboard files
│   ├── index.html           # Main dashboard page
│   ├── map-test.html        # Map testing page
│   ├── styles.css           # Modern CSS styling
│   └── app.js               # Interactive JavaScript
├── start-web-server.sh       # Quick start script
└── pom.xml                  # Maven project configuration
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
4. **SSL Certificate Errors**: Fixed in latest version - HttpUtil now handles SSL certificates properly
5. **Null Pointer Exceptions**: Fixed null value handling in fireball data processing

### Environment Variables
```bash
export NASA_API_KEY="your-nasa-api-key-here"
```

## Recent Fixes & Improvements

### SSL Certificate Handling
- **Issue**: SSL handshake exceptions when connecting to NASA APIs
- **Solution**: Implemented custom SSL context in `HttpUtil.java` with permissive certificate validation
- **Impact**: Eliminates connection failures to NASA endpoints

### Null Value Handling
- **Issue**: NullPointerException when processing fireball data with missing fields
- **Solution**: Added null checks and default empty string values in `Main.java`
- **Impact**: Robust handling of incomplete data records

### Enhanced Error Handling
- **Improvement**: Better error handling throughout the application
- **Benefit**: More reliable data fetching and processing

## Console Application Output

The console application now successfully displays:

1. **Close Approach Data**: Upcoming asteroid close approaches with distance, velocity, and magnitude
2. **Fireball Events**: Historical fireball data with location, energy, and velocity information
3. **Near-Earth Objects**: NEO feed data with hazard assessment and size estimates

## Contributing

This project is designed for the NASA Space Apps Challenge. Feel free to extend the functionality, improve the visualizations, or add new data sources.

## AI Usage

This project was developed with assistance from AI tools to accelerate development and solve technical challenges. The AI usage details (chat history) are documented in the `ai_usage/usage.txt` file.

All final code has been reviewed and extensively tested/enhanced by human developers to ensure quality and functionality.

## License

See LICENSE file for details.
