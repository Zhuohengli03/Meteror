# 🌍 Meteor Madness - Asteroid Impact Simulation

A comprehensive web application for simulating asteroid impacts and analyzing their potential effects on Earth. Built for NASA Space Apps Challenge 2025.

## 🚀 Features

### 🌐 Interactive 3D Earth Globe
- **Real-time 3D visualization** using Three.js
- **NASA Blue Marble textures** for realistic Earth appearance
- **Dynamic cloud animation** with independent rotation
- **Full surface click detection** for impact point selection
- **Synchronized 2D/3D maps** with accurate coordinate conversion

### 📊 Impact Analysis
- **Physics-based calculations** using updated impactor-2025 formulas
- **Comprehensive impact effects**:
  - Crater diameter and depth
  - Seismic magnitude and ground acceleration
  - Tsunami height and radius
  - Blast radius and affected areas
- **Population exposure analysis** with multiple threat levels
- **Economic impact assessment** including GDP impact percentage
- **Affected cities database** with distance calculations

### 🛰️ NASA API Integration
- **Near Earth Objects (NEO) data** from NASA's NEO API
- **Fireball data** from NASA's Fireball API
- **CAD (Close Approach Data)** for orbital information
- **EONET (Earth Observatory Natural Event Tracker)** for natural events

### 🎯 Deflection Simulation
- **Kinetic impactor deflection** calculations
- **Delta-v requirements** for deflection missions
- **Miss distance analysis** and impact probability
- **Deflection angle optimization**

## 🏗️ Architecture

### Backend (Java)
- **Java 17** with Maven build system
- **HTTP Server** using `com.sun.net.httpserver.HttpServer`
- **RESTful API** endpoints for data fetching and simulation
- **NASA API clients** for real-time data integration
- **JSON processing** with Jackson library

### Frontend (Web)
- **Vanilla JavaScript** for maximum compatibility
- **Three.js** for 3D Earth visualization
- **Leaflet.js** for 2D interactive maps
- **Responsive CSS** with modern design
- **Real-time data visualization**

## 📁 Project Structure

```
NASA_Challenge/
├── src/main/java/org/spaceapps/meteormadness/
│   ├── WebServer.java              # Main HTTP server
│   ├── Main.java                   # Application entry point
│   ├── clients/                    # NASA API clients
│   │   ├── NeoWsClient.java        # Near Earth Objects API
│   │   ├── FireballClient.java     # Fireball data API
│   │   ├── CadClient.java          # Close Approach Data API
│   │   └── EonetClient.java        # Natural events API
│   ├── service/
│   │   └── MeteorDataService.java  # Data processing service
│   └── util/                       # Utility classes
│       ├── Config.java             # Configuration management
│       ├── HttpUtil.java           # HTTP utilities
│       ├── JsonUtil.java           # JSON processing
│       └── TablePrinter.java       # Data formatting
├── src/main/resources/
│   └── nasa-api.properties         # API configuration
├── web/                            # Frontend files
│   ├── index.html                  # Main web interface
│   ├── app.js                      # JavaScript application
│   └── styles.css                  # Styling and animations
├── ai_usage/                       # AI usage tracking
│   └── usage.txt                   # Usage statistics
├── pom.xml                         # Maven configuration
├── start-web-server.sh             # Server startup script
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites
- **Java 17** or higher
- **Maven 3.6+**
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Zhuohengli03/Hackthon-Meteror.git
   cd Hackthon-Meteror
   ```

2. **Set up Java environment** (macOS with Homebrew)
   ```bash
   brew install openjdk@17
   export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
   export PATH=$JAVA_HOME/bin:$PATH
   ```

3. **Start the server**
   ```bash
   ./start-web-server.sh
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

### Alternative: Manual Setup

1. **Compile the project**
   ```bash
   mvn clean compile
   ```

2. **Run the server**
   ```bash
   mvn exec:java -Dexec.mainClass="org.spaceapps.meteormadness.WebServer"
   ```

## 🔧 Configuration

### NASA API Keys
The application uses NASA's public APIs with rate-limited demo keys. For production use:

1. **Get API keys** from [NASA API Portal](https://api.nasa.gov/)
2. **Set environment variable**:
   ```bash
   export NASA_API_KEY=your_api_key_here
   ```

### Server Configuration
- **Default port**: 8080
- **CORS enabled**: All origins allowed
- **API rate limiting**: Built-in with fallback keys

## 📊 API Endpoints

### Data Endpoints
- `GET /api/asteroids` - Get near Earth objects
- `GET /api/fireballs` - Get fireball data
- `GET /api/cad` - Get close approach data
- `GET /api/eonet` - Get natural events

### Simulation Endpoints
- `POST /api/simulate-impact` - Run impact simulation
- `GET /api/health` - Health check

## 🧮 Physics Models

### Impact Calculations
- **Crater diameter**: Pi-scaling law with energy density
- **Seismic magnitude**: Based on seismic moment
- **Tsunami height**: Energy efficiency and attenuation
- **Blast radius**: TNT equivalent calculations
- **Ground acceleration**: Distance-based attenuation

### Deflection Physics
- **Kinetic impactor**: Delta-v calculations
- **Deflection angle**: Orbital mechanics
- **Miss distance**: Probability analysis

## 🎨 User Interface

### Main Dashboard
- **Overview tab**: Real-time meteor data
- **Prediction tab**: Impact simulation interface
- **Deflection tab**: Deflection mission planning

### Interactive Features
- **3D Earth globe**: Click to select impact points
- **2D world map**: Synchronized with 3D globe
- **Parameter controls**: Asteroid properties and impact conditions
- **Real-time results**: Dynamic analysis updates

## 🔬 Scientific Accuracy

The application uses peer-reviewed scientific models:
- **Impact cratering** based on Pi-scaling law
- **Seismic wave propagation** using standard attenuation relationships
- **Tsunami generation** with realistic energy transfer
- **Population exposure** using geographic databases

## 🛠️ Development

### Building from Source
```bash
# Clone repository
git clone https://github.com/Zhuohengli03/Hackthon-Meteror.git
cd Hackthon-Meteror

# Install dependencies
mvn clean install

# Run tests
mvn test

# Start development server
./start-web-server.sh
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NASA** for providing comprehensive APIs and data
- **Three.js** community for 3D visualization tools
- **Leaflet** for interactive mapping capabilities
- **NASA Space Apps Challenge** for inspiration and support

## 📞 Support

For questions, issues, or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/Zhuohengli03/Hackthon-Meteror/issues)
- **Documentation**: See `demo.md` for detailed usage examples
- **AI Usage**: Check `ai_usage/usage.txt` for development statistics

---

**Version**: 2.2.2  
**Last Updated**: October 5, 2025  
**Built for**: NASA Space Apps Challenge 2025