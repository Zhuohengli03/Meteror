# Data Sources

This document describes the data sources used in the Defend Earth impact simulation system.

## NASA Data

### Near-Earth Object (NEO) API

**Source**: NASA Jet Propulsion Laboratory (JPL)
**URL**: https://api.nasa.gov/neo/rest/v1/
**Documentation**: https://api.nasa.gov/api.html#neows

**Data Provided:**
- Asteroid orbital elements
- Close approach data
- Physical properties (diameter, magnitude)
- Hazard classification
- Discovery information

**Update Frequency**: Daily
**Rate Limits**: 1000 requests per hour
**API Key**: Required (free registration)

**Sample Endpoint:**
```
GET https://api.nasa.gov/neo/rest/v1/browse?api_key=DEMO_KEY
```

### Close Approach Data (CAD) API

**Source**: NASA Jet Propulsion Laboratory (JPL)
**URL**: https://api.nasa.gov/neo/rest/v1/feed
**Documentation**: https://api.nasa.gov/api.html#neows

**Data Provided:**
- Upcoming close approaches
- Miss distances
- Relative velocities
- Orbiting body information

**Update Frequency**: Daily
**Rate Limits**: 1000 requests per hour
**API Key**: Required (free registration)

**Sample Endpoint:**
```
GET https://api.nasa.gov/neo/rest/v1/feed?start_date=2025-01-01&end_date=2025-01-07&api_key=DEMO_KEY
```

## USGS Data

### National Elevation Dataset (NED)

**Source**: U.S. Geological Survey
**URL**: https://www.usgs.gov/3d-elevation-program
**Documentation**: https://www.usgs.gov/3d-elevation-program/about-3dep-products-services

**Data Provided:**
- Digital Elevation Model (DEM)
- 1/3 arc-second resolution (~10m)
- Global coverage
- Multiple formats (GeoTIFF, IMG)

**Update Frequency**: Varies by region
**Access**: Public domain
**Format**: GeoTIFF

**Sample Data:**
- San Francisco Bay Area: 37.5°N to 38.5°N, 122°W to 121°W
- New York City Area: 40.5°N to 41.5°N, 74.5°W to 73.5°W
- Tokyo Metropolitan Area: 35.5°N to 36.5°N, 139°E to 140°E

### Earthquake Data

**Source**: U.S. Geological Survey
**URL**: https://earthquake.usgs.gov/earthquakes/feed/
**Documentation**: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php

**Data Provided:**
- Historical earthquake catalog
- Magnitude, location, depth
- Time of occurrence
- Felt reports

**Update Frequency**: Real-time
**Access**: Public domain
**Format**: GeoJSON, CSV

**Sample Endpoint:**
```
GET https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson
```

### Tsunami Data

**Source**: U.S. Geological Survey
**URL**: https://www.usgs.gov/natural-hazards/tsunamis
**Documentation**: https://www.usgs.gov/natural-hazards/tsunamis

**Data Provided:**
- Tsunami hazard zones
- Historical tsunami events
- Wave height data
- Coastal vulnerability

**Update Frequency**: Annual
**Access**: Public domain
**Format**: Shapefile, GeoJSON

## Population Data

### Gridded Population of the World (GPW)

**Source**: Center for International Earth Science Information Network (CIESIN)
**URL**: https://sedac.ciesin.columbia.edu/data/collection/gpw-v4
**Documentation**: https://sedac.ciesin.columbia.edu/data/collection/gpw-v4

**Data Provided:**
- Global population density
- 30 arc-second resolution (~1km)
- Multiple time periods (2000, 2005, 2010, 2015, 2020)
- Age and sex structure

**Update Frequency**: Every 5 years
**Access**: Free registration required
**Format**: GeoTIFF

**Sample Data:**
- Population count: `gpw_v4_population_count_rev11_2020_30_sec.tif`
- Population density: `gpw_v4_population_density_rev11_2020_30_sec.tif`

### WorldPop

**Source**: WorldPop Project
**URL**: https://www.worldpop.org/
**Documentation**: https://www.worldpop.org/doi/10.5258/SOTON/WP00645

**Data Provided:**
- High-resolution population data
- 100m resolution
- Annual updates
- Age and sex structure

**Update Frequency**: Annual
**Access**: Open access
**Format**: GeoTIFF

**Sample Data:**
- Global population: `ppp_2020_1km_Aggregated.tif`
- Urban population: `ppp_2020_1km_Aggregated_urban.tif`

## Geographic Data

### Natural Earth

**Source**: Natural Earth
**URL**: https://www.naturalearthdata.com/
**Documentation**: https://www.naturalearthdata.com/about/

**Data Provided:**
- Coastlines
- Country boundaries
- Cities and populated places
- Physical features

**Update Frequency**: Annual
**Access**: Public domain
**Format**: Shapefile, GeoJSON

**Sample Files:**
- Coastlines: `ne_10m_coastline.shp`
- Countries: `ne_10m_admin_0_countries.shp`
- Cities: `ne_10m_populated_places.shp`

### OpenStreetMap

**Source**: OpenStreetMap contributors
**URL**: https://www.openstreetmap.org/
**Documentation**: https://wiki.openstreetmap.org/wiki/Main_Page

**Data Provided:**
- Street networks
- Points of interest
- Building footprints
- Land use data

**Update Frequency**: Continuous
**Access**: Open source
**Format**: OSM XML, Shapefile

## Climate Data

### ERA5 Reanalysis

**Source**: European Centre for Medium-Range Weather Forecasts (ECMWF)
**URL**: https://www.ecmwf.int/en/forecasts/datasets/reanalysis-datasets/era5
**Documentation**: https://confluence.ecmwf.int/display/CKB/ERA5%3A+data+documentation

**Data Provided:**
- Atmospheric parameters
- Ocean parameters
- Land surface parameters
- 31km resolution

**Update Frequency**: Monthly
**Access**: Free registration required
**Format**: NetCDF

## Satellite Data

### MODIS

**Source**: NASA
**URL**: https://modis.gsfc.nasa.gov/
**Documentation**: https://modis.gsfc.nasa.gov/data/

**Data Provided:**
- Land cover
- Vegetation indices
- Surface temperature
- Aerosol optical depth

**Update Frequency**: Daily
**Access**: Public domain
**Format**: HDF, GeoTIFF

### Landsat

**Source**: U.S. Geological Survey
**URL**: https://www.usgs.gov/land-resources/nli/landsat
**Documentation**: https://www.usgs.gov/land-resources/nli/landsat

**Data Provided:**
- Multispectral imagery
- 30m resolution
- Land cover classification
- Change detection

**Update Frequency**: 16 days
**Access**: Public domain
**Format**: GeoTIFF

## Data Processing

### Tile Generation

**Tool**: GDAL
**Command**: `gdal2tiles.py`
**Output**: Web Mercator tiles (PNG, WebP)

**Sample Command:**
```bash
gdal2tiles.py -z 0-10 -p geodetic input.tif output_dir/
```

### Data Conversion

**Tool**: GDAL
**Command**: `gdal_translate`
**Output**: Various formats

**Sample Command:**
```bash
gdal_translate -of GTiff -co COMPRESS=LZW input.hdf output.tif
```

### Coordinate System

**Input**: WGS84 (EPSG:4326)
**Output**: Web Mercator (EPSG:3857)
**Transformation**: Spherical Mercator projection

## Data Quality

### Validation

- **Spatial**: Bounding box validation
- **Temporal**: Date range validation
- **Numerical**: Range and type validation
- **Categorical**: Enumeration validation

### Accuracy

- **Position**: ±10m (DEM), ±100m (population)
- **Time**: ±1 second (earthquakes), ±1 day (population)
- **Magnitude**: ±0.1 (earthquakes), ±10% (population)

### Completeness

- **Coverage**: Global for most datasets
- **Temporal**: 2000-2020 for population, 1900-present for earthquakes
- **Spatial**: 30m-1km resolution depending on dataset

## Data Storage

### Local Storage

- **Format**: GeoTIFF, GeoJSON, CSV
- **Compression**: LZW, DEFLATE
- **Organization**: Hierarchical by dataset and resolution

### Cloud Storage

- **Provider**: AWS S3, Google Cloud Storage
- **Format**: Cloud-optimized GeoTIFF (COG)
- **Access**: HTTP/HTTPS, S3 API

### Caching

- **Strategy**: LRU (Least Recently Used)
- **TTL**: 1 hour for dynamic data, 24 hours for static data
- **Size**: 1GB in-memory cache

## Data Updates

### Automatic Updates

- **NASA NEO**: Daily via cron job
- **USGS Earthquakes**: Real-time via webhook
- **Population**: Annual via scheduled job

### Manual Updates

- **DEM**: As needed for new regions
- **Tsunami Zones**: Annual review
- **City Data**: Quarterly updates

## Data Licensing

### Public Domain

- NASA data
- USGS data
- Natural Earth data

### Open Source

- OpenStreetMap data
- WorldPop data

### Commercial

- Some high-resolution datasets
- Real-time data feeds

## Data Backup

### Local Backup

- **Frequency**: Daily
- **Retention**: 30 days
- **Location**: Local disk array

### Cloud Backup

- **Frequency**: Weekly
- **Retention**: 1 year
- **Location**: AWS S3, Google Cloud Storage

### Disaster Recovery

- **RTO**: 4 hours
- **RPO**: 24 hours
- **Strategy**: Multi-region replication
