# 🌍 Asteroid Impact Exposure Estimator

A Python tool for estimating population and building exposure in asteroid impact scenarios.

## 🎯 Features

- ✅ **GeoNames API Integration**: Get accurate city coordinates and population data
- ✅ **OpenStreetMap Buildings**: Query real building data via Overpass API
- ✅ **Impact Physics**: Calculate crater radius from asteroid parameters
- ✅ **Multi-Ring Damage Zones**: Model 5 levels of destruction (100%, 75%, 50%, 25%, 10%)
- ✅ **Interactive Maps**: Generate HTML maps with folium
- ✅ **Static Plots**: Create publication-ready plots with matplotlib
- ✅ **Modular Design**: Easy to extend with WorldPop/SRTM data

## 📦 Installation

### 1. Install Dependencies

```bash
pip install -r exposure_requirements.txt
```

### 2. Register for GeoNames (Optional but Recommended)

1. Visit https://www.geonames.org/login
2. Create a free account
3. Enable "Free Web Services" in your account settings
4. Use your username with `--username` flag

## 🚀 Quick Start

### Basic Usage

```bash
# Analyze Toronto with default 160m asteroid
python impact_exposure_estimator.py Toronto

# Analyze New York with custom asteroid
python impact_exposure_estimator.py "New York" --diameter 500 --velocity 20

# Use custom impact radius
python impact_exposure_estimator.py Beijing --radius 10

# Specify GeoNames username for better data
python impact_exposure_estimator.py London --username your_username
```

### Command-Line Options

```
positional arguments:
  city                  City name to analyze

optional arguments:
  --diameter FLOAT      Asteroid diameter in meters (default: 160)
  --velocity FLOAT      Impact velocity in km/s (default: 15)
  --angle FLOAT         Impact angle in degrees (default: 45)
  --radius FLOAT        Custom impact radius in km (overrides calculation)
  --username STRING     GeoNames API username (default: demo)
  --no-map              Skip map generation
  --no-plot             Skip plot generation
  --output-dir PATH     Output directory for visualizations
```

## 📊 Output

### Console Output

```
==================================================================
🌍 ASTEROID IMPACT EXPOSURE ESTIMATOR
==================================================================
🔍 Searching for city: Toronto
✅ Found: Toronto, Canada
   Coordinates: (43.7001, -79.4163)
   Population: 2,600,000

💥 Impact Parameters:
   Asteroid diameter: 160m
   Impact velocity: 15 km/s
   Impact angle: 45°
   Impact energy: 7.23 megatons TNT
   Crater radius: 1.20 km

🏢 Querying buildings within 1.20 km...
✅ Found 2,847 buildings
   Building density: 628.5 buildings/km²
   Top building types:
      yes: 1,234
      residential: 892
      commercial: 421
      apartments: 187
      house: 113

👥 Population Estimate:
   Exposed population: 45,678
   (Based on uniform density assumption)

==================================================================
📋 SUMMARY
==================================================================
City: Toronto, Canada
Impact Radius: 1.20 km
Exposed Population: 45,678
Affected Buildings: 2,847
Building Density: 628.5 buildings/km²

🗺️  Creating interactive map...
✅ Map saved to: impact_map_Toronto.html

📊 Creating static plot...
✅ Plot saved to: impact_plot_Toronto.png

✅ Analysis complete!
```

### Generated Files

1. **`impact_map_<city>.html`**: Interactive map with:
   - Impact point marker
   - Multi-ring damage zones
   - Hover tooltips
   - Statistics legend

2. **`impact_plot_<city>.png`**: Static visualization with:
   - Damage zone circles
   - Detailed statistics panel
   - Building type breakdown

## 🧩 Code Structure

### Main Classes

#### `ImpactExposureEstimator`
Main class that orchestrates the analysis.

**Key Methods**:
- `get_city_coordinates()`: Fetch city data from GeoNames
- `calculate_impact_radius()`: Compute crater size from asteroid parameters
- `query_osm_buildings()`: Get building data from OpenStreetMap
- `estimate_population_simple()`: Estimate exposed population
- `calculate_damage_zones()`: Generate multi-ring zones
- `run_analysis()`: Execute complete analysis pipeline
- `visualize_folium()`: Create interactive map
- `visualize_matplotlib()`: Create static plot

#### Data Classes

```python
@dataclass
class CityInfo:
    name: str
    latitude: float
    longitude: float
    population: int
    country: str
    admin1: str = ""

@dataclass
class ExposureResult:
    city: CityInfo
    impact_radius_km: float
    estimated_population: int
    building_count: int
    building_density: float
    damage_zones: List[Dict]
    buildings_by_type: Dict[str, int]
```

## 🔬 Technical Details

### Impact Physics

The crater radius is calculated using the **π-scaling law**:

```python
# Energy calculation
E = 0.5 * m * v²

# Crater diameter
D = 1.161 * (E^0.29) * (sin(θ))^0.33
```

Where:
- `m` = asteroid mass (kg)
- `v` = impact velocity (m/s)
- `θ` = impact angle (radians)
- `E` = kinetic energy (joules)

### Damage Zones

| Zone | Radius | Damage | Description |
|------|--------|--------|-------------|
| 1 | R | 100% | Total destruction (crater) |
| 2 | 3R | 75% | Severe damage (blast wave) |
| 3 | 6R | 50% | Moderate damage (pressure) |
| 4 | 10R | 25% | Light damage (windows) |
| 5 | 15R | 10% | Minimal damage (shaking) |

### Data Sources

1. **GeoNames**: City coordinates and population
   - API: http://api.geonames.org/
   - Coverage: 11+ million geographic names
   - Update frequency: Regular

2. **OpenStreetMap**: Building footprints
   - API: Overpass API
   - Coverage: Global
   - Update frequency: Real-time

3. **Population Estimation**: Simplified uniform density
   - Method: Total population / estimated city area
   - Limitation: Doesn't account for density variations

## 🚧 Limitations & Future Improvements

### Current Limitations

1. **Population Estimation**: Uses uniform density (not realistic)
2. **Building Query**: Limited by Overpass API timeout (60s)
3. **No Terrain Effects**: Doesn't account for elevation/slope
4. **No WorldPop Integration**: Raster data not yet implemented

### Planned Improvements

#### 1. WorldPop Integration

```python
def get_worldpop_data(latitude, longitude, radius_km):
    """Download and process WorldPop raster data"""
    # Download 100m resolution population raster
    # Clip to impact circle
    # Sum population within zone
    pass
```

#### 2. SRTM Elevation Data

```python
def adjust_for_terrain(impact_point, blast_radius, elevation_data):
    """Adjust blast radius based on terrain slope"""
    # Download SRTM data
    # Calculate slope in all directions
    # Modify blast propagation
    pass
```

#### 3. Advanced Population Model

```python
def estimate_population_advanced(city, radius, time_of_day):
    """Account for population density variations"""
    # Use WorldPop raster
    # Apply time-of-day factors (work vs. residential)
    # Consider building occupancy rates
    pass
```

#### 4. Building Vulnerability

```python
def calculate_building_damage(buildings, damage_zone):
    """Estimate building-specific damage"""
    # Consider building type (residential, commercial, etc.)
    # Apply material-specific vulnerability curves
    # Estimate casualties per building
    pass
```

## 📝 Example Use Cases

### 1. Urban Planning

```bash
# Assess multiple cities
for city in "New York" "Los Angeles" "Chicago"; do
    python impact_exposure_estimator.py "$city" --diameter 200 --output-dir results/
done
```

### 2. Research Analysis

```python
from impact_exposure_estimator import ImpactExposureEstimator

estimator = ImpactExposureEstimator(geonames_username="your_username")

# Analyze multiple scenarios
diameters = [100, 200, 500, 1000]
cities = ["Tokyo", "Delhi", "Shanghai"]

for city in cities:
    for diameter in diameters:
        result = estimator.run_analysis(
            city_name=city,
            asteroid_diameter_m=diameter
        )
        # Save results to database
```

### 3. Educational Demo

```bash
# Small asteroid (Chelyabinsk-size)
python impact_exposure_estimator.py Moscow --diameter 20 --velocity 19

# Medium asteroid (Tunguska-size)
python impact_exposure_estimator.py "Tunguska" --diameter 50 --velocity 15

# Large asteroid (Chicxulub-size)
python impact_exposure_estimator.py "Yucatan" --diameter 10000 --velocity 20
```

## 🐛 Troubleshooting

### Issue: "City not found"

**Solution**: Try variations of the city name:
```bash
# Try different formats
python impact_exposure_estimator.py "New York City"
python impact_exposure_estimator.py "NYC"
python impact_exposure_estimator.py "New York, NY"
```

### Issue: "Overpass API timeout"

**Solution**: Reduce the impact radius or try again later:
```bash
python impact_exposure_estimator.py Toronto --radius 5
```

### Issue: "GeoNames API limit exceeded"

**Solution**: 
1. Register for a free account at geonames.org
2. Use your username: `--username your_username`
3. Free accounts have 20,000 requests/day limit

### Issue: "Module not found"

**Solution**: Install missing dependencies:
```bash
pip install folium matplotlib requests numpy
```

## 📚 References

### Scientific Papers

1. Collins et al. (2005). "Earth Impact Effects Program"
2. Melosh (1989). "Impact Cratering: A Geologic Process"
3. Toon et al. (1997). "Environmental perturbations caused by asteroid impacts"

### Data Sources

- GeoNames: https://www.geonames.org/
- OpenStreetMap: https://www.openstreetmap.org/
- WorldPop: https://www.worldpop.org/
- NASA SRTM: https://www2.jpl.nasa.gov/srtm/

### APIs

- GeoNames API: http://www.geonames.org/export/web-services.html
- Overpass API: https://overpass-api.de/
- Overpass Turbo (testing): https://overpass-turbo.eu/

## 📄 License

This tool is part of the Impactor-2025 project.

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- WorldPop raster integration
- SRTM elevation data
- Advanced population models
- Building vulnerability curves
- Time-of-day population variations

## 📧 Contact

For questions or issues, please open an issue on GitHub.

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-05  
**Author**: Impactor-2025 Team
