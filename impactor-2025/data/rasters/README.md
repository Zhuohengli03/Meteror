# Raster Data Directory

This directory contains sample raster data for DEM (Digital Elevation Model) and population density.

## Data Sources

- **DEM**: USGS National Elevation Dataset (NED)
- **Population**: GPW (Gridded Population of the World) v4 / WorldPop

## File Structure

```
rasters/
├── dem/           # Digital Elevation Model tiles
│   ├── 0/         # Zoom level 0
│   ├── 1/         # Zoom level 1
│   └── ...
├── population/    # Population density tiles
│   ├── 0/         # Zoom level 0
│   ├── 1/         # Zoom level 1
│   └── ...
└── coastline/     # Coastline vector data
    └── coastlines.geojson
```

## Data Format

- **DEM**: GeoTIFF format, WGS84 projection
- **Population**: GeoTIFF format, WGS84 projection
- **Coastline**: GeoJSON format

## Usage

The backend `/api/tiles/` endpoints serve these raster tiles as map tiles for the frontend visualization.

## Sample Data

For development and testing, small sample areas are provided:
- San Francisco Bay Area (DEM + Population)
- Tokyo Metropolitan Area (DEM + Population)
- New York City Area (DEM + Population)

## Production Data

In production, these would be replaced with full global datasets or served from external tile services.
