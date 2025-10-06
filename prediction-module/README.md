# Asteroid Impact Prediction Module

A standalone module for asteroid impact analysis and visualization, extracted from the NASA Challenge Meteor Madness project.

## Overview

This module provides advanced physics-based asteroid impact analysis with interactive visualizations including 2D maps and 3D Earth globe. It calculates impact effects such as crater diameter, seismic magnitude, tsunami height, and peak ground acceleration.

## Features

### 🎯 Asteroid Selection
- Load asteroids from NASA API or use sample data
- Automatic parameter extraction from asteroid data
- Support for different asteroid types (stony, iron, carbonaceous)

### ⚙️ Physics Calculations
- Mass calculation based on diameter and density
- Kinetic energy and TNT equivalent calculations
- Crater diameter and depth estimation using Pi-scaling law
- Seismic magnitude calculation
- Tsunami height estimation for ocean impacts
- Peak ground acceleration calculations

### 🎮 Interactive Controls
- Real-time parameter adjustment with sliders
- Impact location selection via latitude/longitude
- Target type selection (continental crust, oceanic crust, ocean)
- Live mass calculation updates

### 📊 Visualization
- **2D Map**: Interactive Leaflet map showing impact location and crater radius
- **3D Globe**: Three.js-powered Earth globe with impact point visualization
- **Results Cards**: Real-time display of calculated impact effects

## File Structure

```
prediction-module/
├── index.html          # Main HTML file
├── css/
│   └── prediction.css  # Module-specific styles
├── js/
│   └── prediction.js   # Module functionality
├── assets/             # Additional assets (if needed)
└── README.md           # This file
```

## Dependencies

### External Libraries
- **Leaflet.js** (1.7.1): For interactive 2D maps
- **Three.js** (r128): For 3D Earth globe visualization
- **Font Awesome** (6.0.0): For icons

### API Dependencies
- NASA NEO API for asteroid data (optional, falls back to sample data)

## Usage

### Standalone Usage
1. Open `index.html` in a web browser
2. Select an asteroid from the dropdown (or use default parameters)
3. Adjust impact parameters using the controls
4. Click "Run Simulation" to calculate and visualize results

### Integration with Main Project
The module is designed to work alongside the main NASA Challenge dashboard:
- Access via: `prediction-module/index.html`
- Back button returns to main dashboard
- Uses relative API paths to access main server

## Physics Models

### Mass Calculation
```
mass = density × (4/3) × π × (diameter/2)³
```

### Kinetic Energy
```
KE = 0.5 × mass × velocity²
```

### Crater Diameter (Pi-scaling Law)
```
diameter = 1.25 × (energy/(density × gravity))^(1/4) × sin(angle)^(1/3)
```

### Seismic Magnitude
```
magnitude = (2/3) × log₁₀(seismic_moment) - 10.7
```

### Tsunami Height
```
height = 0.1 × √(energy_density/(water_density × gravity)) × geometric_factors
```

## Configuration

### Asteroid Densities
- **Stony**: 3000 kg/m³
- **Iron**: 7800 kg/m³  
- **Carbonaceous**: 2000 kg/m³

### Physical Constants
- TNT Energy: 4.184 × 10¹⁵ J per megaton
- Earth Gravity: 9.81 m/s²
- Earth Radius: 6,371,000 m
- Water Density: 1000 kg/m³
- Rock Density: 2500 kg/m³

## Browser Compatibility

- Modern browsers with ES6+ support
- WebGL support for 3D visualization
- Canvas API support for map rendering

## Development

### Adding New Features
1. Modify `prediction.js` for new functionality
2. Update `prediction.css` for styling
3. Add new controls to `index.html` if needed

### API Integration
The module attempts to load asteroid data from the main server's API endpoint:
```
../api/neo-feed?startDate=2024-01-01&endDate=2024-01-07
```

If the API is unavailable, it falls back to sample asteroid data.

## License

This module is part of the NASA Challenge Meteor Madness project and follows the same licensing terms.

## Contributing

When modifying this module:
1. Maintain compatibility with the main dashboard
2. Test both standalone and integrated usage
3. Update documentation for new features
4. Ensure responsive design for mobile devices

## Troubleshooting

### Common Issues

**Map not loading**: Check if Leaflet.js is properly loaded
**3D Globe not rendering**: Verify Three.js is loaded and WebGL is supported
**API errors**: Module will fall back to sample data automatically
**Simulation errors**: Check browser console for validation messages

### Performance Notes

- Large Monte Carlo simulations may impact performance
- 3D globe rendering requires WebGL support
- Map tiles require internet connection for OpenStreetMap

## Future Enhancements

- Monte Carlo uncertainty analysis
- Deflection strategy simulation
- Population impact assessment
- Real-time asteroid tracking integration
- Advanced visualization options
