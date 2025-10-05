# API Documentation

This document describes the REST API endpoints for the Defend Earth impact simulation system.

## Base URL

- Development: `http://localhost:8000`
- Production: `https://api.defendearth.org`

## Authentication

Currently, no authentication is required. In production, API keys may be required for certain endpoints.

## Response Format

All API responses are in JSON format with the following structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## Endpoints

### NASA NEO Data

#### GET /api/neo/search

Search for near-Earth objects by name or ID.

**Query Parameters:**
- `name` (string, optional): Asteroid name to search for
- `id` (string, optional): NASA JPL ID to search for
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Results per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "asteroids": [
      {
        "id": "2000433",
        "name": "Eros",
        "diameter_min": 16000,
        "diameter_max": 16000,
        "is_potentially_hazardous": false,
        "close_approach_data": [
          {
            "close_approach_date": "2025-01-01",
            "relative_velocity": {
              "kilometers_per_second": "5.2"
            },
            "miss_distance": {
              "kilometers": "20000000"
            },
            "orbiting_body": "Earth"
          }
        ],
        "orbital_data": {
          "semi_major_axis": "1.458",
          "eccentricity": "0.223",
          "inclination": "10.829",
          "orbital_period": "643.219",
          "orbit_class": "AMO"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

#### GET /api/neo/asteroid/{asteroid_id}

Get detailed information about a specific asteroid.

**Path Parameters:**
- `asteroid_id` (string): NASA JPL ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "2000433",
    "name": "Eros",
    "diameter_min": 16000,
    "diameter_max": 16000,
    "is_potentially_hazardous": false,
    "close_approach_data": [ ... ],
    "orbital_data": { ... }
  }
}
```

### Impact Simulation

#### POST /api/simulate/impact

Simulate asteroid impact effects.

**Request Body:**
```json
{
  "asteroid_id": "2000433",
  "impact_latitude": 40.7128,
  "impact_longitude": -74.0060,
  "impact_angle": 45,
  "impact_velocity": 11000,
  "target_density": 2500,
  "target_type": "land"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "asteroid": {
      "id": "2000433",
      "name": "Eros",
      "diameter": 16000,
      "mass": 6.69e15
    },
    "impact_energy": 4.05e20,
    "tnt_equivalent": 96.7,
    "crater_diameter": 15000,
    "crater_depth": 5000,
    "seismic_magnitude": 7.2,
    "tsunami_height": 0,
    "blast_effects": {
      "energy_megatons": 96.7,
      "overpressure_1psi_radius": 45.2,
      "overpressure_5psi_radius": 18.1,
      "overpressure_20psi_radius": 8.9,
      "thermal_10km": 1.2e6,
      "thermal_50km": 4.8e4,
      "thermal_100km": 1.2e4
    },
    "population_impact": {
      "exposed_population": 15000000,
      "population_loss": 2500000,
      "affected_cities": [
        {
          "name": "New York",
          "country": "USA",
          "distance": 0,
          "population": 8336817
        }
      ]
    },
    "economic_impact": {
      "building_loss": 450.2,
      "total_economic_loss": 1250.8
    },
    "geographic_effects": {
      "mmi_zones": {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": {
              "mmi": 8,
              "radius": 5000
            },
            "geometry": {
              "type": "Polygon",
              "coordinates": [ ... ]
            }
          }
        ]
      },
      "tsunami_zones": {
        "type": "FeatureCollection",
        "features": [ ... ]
      }
    }
  }
}
```

#### POST /api/simulate/deflection

Simulate asteroid deflection strategies.

**Request Body:**
```json
{
  "baseline_scenario": {
    "asteroid_id": "2000433",
    "impact_latitude": 40.7128,
    "impact_longitude": -74.0060,
    "impact_angle": 45,
    "impact_velocity": 11000
  },
  "deflection_strategy": {
    "type": "kinetic_impactor",
    "impactor_mass": 1000,
    "impactor_velocity": 10000,
    "impactor_angle": 90,
    "deflection_time": 365
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "baseline": { ... },
    "deflected": { ... },
    "comparison": {
      "miss_distance_change": 50000,
      "impact_probability_reduction": 0.85,
      "population_risk_reduction": 0.92
    }
  }
}
```

### Exposure and Population Grid Data

This module provides grid-based population exposure data to support higher fidelity loss estimation. It allows the simulation to overlay population/building exposure layers on top of the impact zones.

**Primary Data Sources:**

- **SEDAC (NASA Socioeconomic Data and Applications Center)**: Global population grids and socioeconomic layers (e.g., GPWv4 population density).
- **WorldPop**: High-resolution population distribution grids derived from census and remote sensing data.
- **OpenStreetMap (OSM)**: Crowd-sourced vector data including buildings and POIs; can be aggregated to estimate building counts/areas.

#### GET /api/exposure/grid

Retrieve grid-based population exposure for a given bounding box.

**Query Parameters:**

- `bbox` (string): Bounding box as `min_lon,min_lat,max_lon,max_lat`.
- `resolution` (integer, optional): Grid resolution in meters (default: `1000`).
- `dataset` (string, optional): Data source selector, e.g., `worldpop`, `sedac`, `osm`.

**Response:**

```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "grid_id": "cell_1024_2048",
          "population": 1285,
          "building_area_m2": 5420
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [ ... ]
        }
      }
    ]
  }
}
```

This endpoint can be used together with `POST /api/simulate/impact` to overlay a population exposure layer on simulation results for more granular loss assessment.

### USGS Data

#### GET /api/usgs/dem/{z}/{x}/{y}

Get Digital Elevation Model tile.

**Path Parameters:**
- `z` (integer): Zoom level
- `x` (integer): Tile X coordinate
- `y` (integer): Tile Y coordinate

**Response:** GeoTIFF binary data

#### GET /api/usgs/earthquakes

Get historical earthquake data.

**Query Parameters:**
- `start_date` (string): Start date (YYYY-MM-DD)
- `end_date` (string): End date (YYYY-MM-DD)
- `min_magnitude` (float): Minimum magnitude
- `max_magnitude` (float): Maximum magnitude
- `bbox` (string): Bounding box (min_lon,min_lat,max_lon,max_lat)

**Response:**
```json
{
  "success": true,
  "data": {
    "earthquakes": [
      {
        "id": "us7000abc1",
        "magnitude": 7.2,
        "latitude": 40.7128,
        "longitude": -74.0060,
        "depth": 10.5,
        "time": "2025-01-01T00:00:00Z",
        "place": "New York, NY"
      }
    ]
  }
}
```

#### GET /api/usgs/tsunami-zones

Get tsunami hazard zones.

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "zone_id": "TZ001",
          "hazard_level": "high",
          "max_wave_height": 15.0
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [ ... ]
        }
      }
    ]
  }
}
```

### Map Tiles

#### GET /api/tiles/dem/{z}/{x}/{y}

Get DEM tile as map tile.

**Path Parameters:**
- `z` (integer): Zoom level
- `x` (integer): Tile X coordinate
- `y` (integer): Tile Y coordinate

**Response:** PNG image data

#### GET /api/tiles/population/{z}/{x}/{y}

Get population density tile.

**Path Parameters:**
- `z` (integer): Zoom level
- `x` (integer): Tile X coordinate
- `y` (integer): Tile Y coordinate

**Response:** PNG image data

### Demo Data

#### GET /api/demo/impactor-2025

Get the built-in Impactor-2025 demo scenario.

**Response:**
```json
{
  "success": true,
  "data": {
    "scenario_id": "impactor-2025",
    "name": "Impactor-2025 Demo",
    "description": "Demonstration scenario for asteroid impact simulation",
    "asteroid": { ... },
    "impact_location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "simulation_parameters": { ... }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request body is invalid or missing required fields |
| `ASTEROID_NOT_FOUND` | Asteroid with specified ID not found |
| `SIMULATION_FAILED` | Impact simulation failed due to invalid parameters |
| `RATE_LIMIT_EXCEEDED` | Too many requests, rate limit exceeded |
| `INTERNAL_ERROR` | Internal server error |
| `VALIDATION_ERROR` | Input validation failed |

## Rate Limiting

- **General API**: 100 requests per minute per IP
- **Simulation endpoints**: 10 requests per minute per IP
- **Tile endpoints**: 1000 requests per minute per IP

## CORS

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Data Units

All API responses use SI units unless otherwise specified:

- **Distance**: meters (m)
- **Mass**: kilograms (kg)
- **Time**: seconds (s)
- **Energy**: joules (J)
- **Velocity**: meters per second (m/s)
- **Acceleration**: meters per second squared (m/s²)
- **Pressure**: pascals (Pa)
- **Temperature**: kelvin (K)

## Examples

### cURL Examples

**Search for asteroids:**
```bash
curl "http://localhost:8000/api/neo/search?name=Eros&limit=5"
```

**Simulate impact:**
```bash
curl -X POST "http://localhost:8000/api/simulate/impact" \
  -H "Content-Type: application/json" \
  -d '{
    "asteroid_id": "2000433",
    "impact_latitude": 40.7128,
    "impact_longitude": -74.0060,
    "impact_angle": 45,
    "impact_velocity": 11000
  }'
```

**Get DEM tile:**
```bash
curl "http://localhost:8000/api/tiles/dem/10/512/384.png"
```

### JavaScript Examples

**Fetch asteroid data:**
```javascript
const response = await fetch('/api/neo/search?name=Eros');
const data = await response.json();
console.log(data.data.asteroids);
```

**Simulate impact:**
```javascript
const response = await fetch('/api/simulate/impact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    asteroid_id: '2000433',
    impact_latitude: 40.7128,
    impact_longitude: -74.0060,
    impact_angle: 45,
    impact_velocity: 11000
  })
});
const result = await response.json();
console.log(result.data);
```
