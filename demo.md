# Meteor Madness Web Dashboard Demo

## Quick Demo Instructions

### 1. Start the Web Server
```bash
# Make sure you're in the project directory
cd /Users/ijustin/Library/CloudStorage/Dropbox/Code/NASA_Challenge

# Run the startup script
./start-web-server.sh
```

### 2. Open the Dashboard
Once the server starts, open your web browser and navigate to:
**http://localhost:8080**

### 3. Explore the Features

#### 📊 Overview Tab
- View real-time statistics
- Interactive charts showing data trends
- Energy distribution analysis

#### 🛰️ Close Approaches Tab
- Set date ranges and filters
- Click "Fetch Data" to load close approach data
- View detailed information in the table

#### 🔥 Fireballs Tab
- Set the "Since Date" to load historical fireball data
- Click "Fetch Fireballs" to load data
- View energy, velocity, and location data

#### 🌍 Near Earth Objects Tab
- Set start and end dates for NEO data
- Click "Fetch NEOs" to load near-earth object data
- View potentially hazardous asteroids

#### 🗺️ Interactive Map Tab
- Click "Show Fireballs" to display fireball locations on the map
- Click "Show Approaches" to display approach trajectories
- Use "Clear Map" to reset the map view

## Features Demonstrated

### Real-time Data Visualization
- Live fetching from NASA APIs
- Interactive charts and graphs
- Responsive design for all devices

### Multiple Data Sources
- **Close Approach Data**: Objects approaching Earth
- **Fireball Events**: Meteor impacts and energy data
- **Near Earth Objects**: Asteroid tracking and hazard assessment

### Interactive Elements
- Customizable date ranges
- Filter controls for distance and limits
- Sortable data tables
- Interactive map with markers

## API Integration

The dashboard demonstrates integration with three NASA APIs:

1. **CNEOS Close Approach Data API**
   - Real-time close approach monitoring
   - Distance and velocity filtering
   - Temporal analysis

2. **CNEOS Fireball API**
   - Historical fireball event data
   - Energy and impact analysis
   - Geographic distribution

3. **NeoWs Feed API**
   - Near-earth object tracking
   - Hazard assessment
   - Size estimation data

## Technical Implementation

### Backend (Java)
- HTTP server with REST API endpoints
- NASA API client integration
- JSON data processing
- CORS support for web requests

### Frontend (HTML/CSS/JavaScript)
- Modern responsive design
- Chart.js for data visualization
- Leaflet for interactive mapping
- Real-time data fetching

### Data Flow
1. User interacts with dashboard controls
2. JavaScript sends API requests to Java backend
3. Java backend queries NASA APIs
4. Data is processed and returned as JSON
5. Frontend displays data in charts and tables

## Customization

### Adding New Data Sources
1. Create new client class in `src/main/java/org/spaceapps/meteormadness/clients/`
2. Add service method in `MeteorDataService.java`
3. Create API endpoint in `WebServer.java`
4. Add frontend interface in `web/app.js`

### Styling Changes
- Modify `web/styles.css` for visual updates
- Update color schemes and layouts
- Add new interactive elements

### Chart Customization
- Modify chart configurations in `web/app.js`
- Add new chart types using Chart.js
- Implement custom data processing

## Troubleshooting

### Common Issues
1. **Server won't start**: Check if port 8080 is available
2. **No data loading**: Verify NASA API key is set (optional)
3. **Charts not displaying**: Ensure JavaScript is enabled in browser
4. **Map not loading**: Check internet connection for Leaflet tiles

### Performance Tips
1. Set `NASA_API_KEY` environment variable for better rate limits
2. Use appropriate date ranges to avoid large datasets
3. Limit results using the "Limit" controls
4. Clear browser cache if experiencing issues

## Next Steps

### Potential Enhancements
1. **Real-time Updates**: WebSocket integration for live data
2. **Data Export**: CSV/JSON export functionality
3. **Advanced Filtering**: More sophisticated query options
4. **Mobile App**: React Native or Flutter mobile version
5. **Machine Learning**: Predictive analysis of meteor data
6. **Social Features**: Share findings and collaborate

### Integration Opportunities
1. **Database Storage**: Persist data for historical analysis
2. **Alert System**: Notifications for significant events
3. **API Documentation**: Swagger/OpenAPI documentation
4. **Testing**: Unit and integration test suite
5. **Deployment**: Docker containerization and cloud deployment
