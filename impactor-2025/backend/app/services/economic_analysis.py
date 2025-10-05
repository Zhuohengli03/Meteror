"""Economic impact analysis based on population and city data."""

import math
import logging
from typing import List, Dict, Any, Tuple, TypedDict, Optional
from .geonames_client import GeoNamesClient, FALLBACK_CITIES, estimate_gdp_per_capita

logger = logging.getLogger(__name__)


class EconomicImpact(TypedDict):
    """Economic impact result."""
    total_economic_loss: float
    population_affected: int
    cities_affected: List[Dict[str, Any]]
    gdp_impact_percentage: float


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points on Earth's surface in kilometers."""
    R = 6371  # Earth's radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat/2) * math.sin(d_lat/2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon/2) * math.sin(d_lon/2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


async def fetch_nearby_cities(
    latitude: float,
    longitude: float,
    radius_km: float,
    geonames_username: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Fetch cities near the impact location using GeoNames API.
    Falls back to static database if API is unavailable.
    
    Args:
        latitude: Impact latitude
        longitude: Impact longitude
        radius_km: Search radius in kilometers
        geonames_username: GeoNames API username
        
    Returns:
        List of cities with population and GDP data
    """
    cities = []
    
    # Try GeoNames API first
    if geonames_username and geonames_username != "demo":
        try:
            client = GeoNamesClient(username=geonames_username)
            geonames_cities = await client.get_nearby_cities(
                latitude=latitude,
                longitude=longitude,
                radius_km=radius_km,
                max_rows=500,
                min_population=10000
            )
            await client.close()
            
            # Enrich with GDP data
            for city in geonames_cities:
                city["gdp_per_capita"] = estimate_gdp_per_capita(city.get("country_code", ""))
                cities.append(city)
            
            if cities:
                logger.info(f"Fetched {len(cities)} cities from GeoNames API")
                return cities
            
        except Exception as e:
            logger.warning(f"GeoNames API failed, falling back to static database: {e}")
    
    # Fallback to static database
    logger.info("Using fallback city database")
    for city in FALLBACK_CITIES:
        distance = calculate_distance(
            latitude, longitude,
            city["latitude"], city["longitude"]
        )
        if distance <= radius_km:
            cities.append(city)
    
    return cities


async def calculate_economic_impact(
    impact_latitude: float,
    impact_longitude: float,
    crater_diameter_km: float,
    blast_radius_km: float,
    tsunami_radius_km: float,
    max_seismic_distance_km: float = 1000.0,
    geonames_username: Optional[str] = None
) -> EconomicImpact:
    """
    Calculate economic impact based on impact parameters and affected cities.
    
    Uses GeoNames API to dynamically fetch cities near the impact location,
    providing more accurate results based on actual population distribution.
    
    Args:
        impact_latitude: Impact latitude
        impact_longitude: Impact longitude
        crater_diameter_km: Crater diameter in km
        blast_radius_km: Blast radius in km
        tsunami_radius_km: Tsunami radius in km
        max_seismic_distance_km: Maximum seismic distance in km
        geonames_username: GeoNames API username (optional)
        
    Returns:
        Economic impact dictionary with affected cities and losses
    """
    # Calculate total impact radius
    total_impact_radius = max(
        blast_radius_km, 
        tsunami_radius_km, 
        crater_diameter_km * 2, 
        max_seismic_distance_km
    )
    
    # Fetch cities near the impact location
    major_cities = await fetch_nearby_cities(
        latitude=impact_latitude,
        longitude=impact_longitude,
        radius_km=total_impact_radius,
        geonames_username=geonames_username
    )
    
    affected_cities = []
    total_population_affected = 0
    total_economic_loss = 0
    
    # Calculate affected cities based on impact radius
    # Use seismic distance as the primary impact radius since seismic effects
    # extend much further than blast or crater effects
    total_impact_radius = max(blast_radius_km, tsunami_radius_km, crater_diameter_km * 2, max_seismic_distance_km)
    
    for city in major_cities:
        distance = calculate_distance(
            impact_latitude, impact_longitude, 
            city["latitude"], city["longitude"]
        )
        
        if distance <= total_impact_radius:
            # Determine exposure level based on distance
            if distance <= crater_diameter_km:
                exposure_level = "extreme"
                loss_multiplier = 0.95  # 95% loss - total destruction
            elif distance <= blast_radius_km:
                exposure_level = "high"
                loss_multiplier = 0.5   # 50% loss - severe damage
            elif distance <= blast_radius_km * 3:
                exposure_level = "medium"
                loss_multiplier = 0.2   # 20% loss - moderate damage
            elif distance <= blast_radius_km * 10:
                exposure_level = "low"
                loss_multiplier = 0.05  # 5% loss - minor damage
            else:
                exposure_level = "minimal"
                loss_multiplier = 0.01  # 1% loss - minimal disruption
            
            affected_city = {
                "name": city["name"],
                "country": city["country"],
                "latitude": city["latitude"],
                "longitude": city["longitude"],
                "population": city["population"],
                "gdp_per_capita": city["gdp_per_capita"],
                "distance_from_impact": distance,
                "exposure_level": exposure_level
            }
            
            affected_cities.append(affected_city)
            total_population_affected += city["population"]
            
            # Calculate economic loss based on exposure level and GDP
            city_gdp = city["population"] * city["gdp_per_capita"]
            total_economic_loss += city_gdp * loss_multiplier
    
    # Calculate total world GDP for percentage calculation
    total_world_gdp = sum(city["population"] * city["gdp_per_capita"] for city in major_cities)
    gdp_impact_percentage = (total_economic_loss / total_world_gdp) * 100 if total_world_gdp > 0 else 0
    
    return {
        "total_economic_loss": total_economic_loss,
        "population_affected": total_population_affected,
        "cities_affected": affected_cities,
        "gdp_impact_percentage": gdp_impact_percentage
    }


"""
Data sources and methodology:
1. Population data: NASA SEDAC Gridded Population of the World (GPW) v4
   - Source: https://sedac.ciesin.columbia.edu/data/collection/gpw-v4
2. GDP per capita data: World Bank Open Data
   - Source: https://data.worldbank.org/indicator/NY.GDP.PCAP.CD
3. City coordinates: OpenStreetMap and GeoNames
4. Impact modeling: Based on nuclear blast scaling laws and tsunami propagation models
5. Economic impact: Multiplied by exposure level based on distance from impact
"""
