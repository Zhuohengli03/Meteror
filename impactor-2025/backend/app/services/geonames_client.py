"""GeoNames API client for fetching city data dynamically."""

import httpx
import logging
from typing import List, Dict, Any, Optional
from functools import lru_cache
import asyncio

logger = logging.getLogger(__name__)


class GeoNamesClient:
    """Client for GeoNames API to fetch nearby cities."""
    
    BASE_URL = "http://api.geonames.org"
    
    def __init__(self, username: str = "demo"):
        """
        Initialize GeoNames client.
        
        Args:
            username: GeoNames username (register for free at geonames.org)
        """
        self.username = username
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def get_nearby_cities(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 1000.0,
        max_rows: int = 500,
        min_population: int = 10000
    ) -> List[Dict[str, Any]]:
        """
        Get cities near a given location.
        
        Args:
            latitude: Impact latitude
            longitude: Impact longitude
            radius_km: Search radius in kilometers
            max_rows: Maximum number of cities to return
            min_population: Minimum city population to include
            
        Returns:
            List of city dictionaries with name, coordinates, population, etc.
        """
        try:
            # GeoNames findNearbyPlaceName API
            params = {
                "lat": latitude,
                "lng": longitude,
                "radius": radius_km,
                "maxRows": max_rows,
                "cities": "cities15000",  # Cities with population > 15,000
                "username": self.username,
                "style": "FULL"
            }
            
            response = await self.client.get(
                f"{self.BASE_URL}/findNearbyPlaceNameJSON",
                params=params
            )
            
            if response.status_code != 200:
                logger.error(f"GeoNames API error: {response.status_code} - {response.text}")
                return []
            
            data = response.json()
            
            if "geonames" not in data:
                logger.warning(f"No geonames data in response: {data}")
                return []
            
            cities = []
            for place in data["geonames"]:
                population = int(place.get("population", 0))
                
                # Filter by minimum population
                if population < min_population:
                    continue
                
                city = {
                    "name": place.get("name", "Unknown"),
                    "country": place.get("countryName", "Unknown"),
                    "country_code": place.get("countryCode", ""),
                    "latitude": float(place.get("lat", 0)),
                    "longitude": float(place.get("lng", 0)),
                    "population": population,
                    "admin1": place.get("adminName1", ""),  # State/Province
                    "admin2": place.get("adminName2", ""),  # County/District
                    "geoname_id": place.get("geonameId", 0)
                }
                
                cities.append(city)
            
            logger.info(f"Found {len(cities)} cities within {radius_km}km of ({latitude}, {longitude})")
            return cities
            
        except Exception as e:
            logger.error(f"Error fetching cities from GeoNames: {e}")
            return []
    
    async def get_city_details(self, geoname_id: int) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific city.
        
        Args:
            geoname_id: GeoNames ID of the city
            
        Returns:
            City details dictionary
        """
        try:
            params = {
                "geonameId": geoname_id,
                "username": self.username
            }
            
            response = await self.client.get(
                f"{self.BASE_URL}/getJSON",
                params=params
            )
            
            if response.status_code != 200:
                return None
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Error fetching city details: {e}")
            return None


# Fallback city database (used when GeoNames API is unavailable)
FALLBACK_CITIES = [
    # North America
    {"name": "New York", "country": "USA", "latitude": 40.7128, "longitude": -74.0060, 
     "population": 8336817, "gdp_per_capita": 65000},
    {"name": "Los Angeles", "country": "USA", "latitude": 34.0522, "longitude": -118.2437, 
     "population": 3971883, "gdp_per_capita": 65000},
    {"name": "Chicago", "country": "USA", "latitude": 41.8781, "longitude": -87.6298, 
     "population": 2693976, "gdp_per_capita": 65000},
    {"name": "Houston", "country": "USA", "latitude": 29.7604, "longitude": -95.3698, 
     "population": 2320268, "gdp_per_capita": 65000},
    {"name": "Phoenix", "country": "USA", "latitude": 33.4484, "longitude": -112.0740, 
     "population": 1680992, "gdp_per_capita": 65000},
    {"name": "Philadelphia", "country": "USA", "latitude": 39.9526, "longitude": -75.1652, 
     "population": 1584064, "gdp_per_capita": 65000},
    {"name": "San Antonio", "country": "USA", "latitude": 29.4241, "longitude": -98.4936, 
     "population": 1547253, "gdp_per_capita": 65000},
    {"name": "San Diego", "country": "USA", "latitude": 32.7157, "longitude": -117.1611, 
     "population": 1423851, "gdp_per_capita": 65000},
    {"name": "Dallas", "country": "USA", "latitude": 32.7767, "longitude": -96.7970, 
     "population": 1343573, "gdp_per_capita": 65000},
    {"name": "San Jose", "country": "USA", "latitude": 37.3382, "longitude": -121.8863, 
     "population": 1021795, "gdp_per_capita": 65000},
    {"name": "Toronto", "country": "Canada", "latitude": 43.6532, "longitude": -79.3832, 
     "population": 2930000, "gdp_per_capita": 45000},
    {"name": "Montreal", "country": "Canada", "latitude": 45.5017, "longitude": -73.5673, 
     "population": 1780000, "gdp_per_capita": 45000},
    {"name": "Vancouver", "country": "Canada", "latitude": 49.2827, "longitude": -123.1207, 
     "population": 675218, "gdp_per_capita": 45000},
    {"name": "Mexico City", "country": "Mexico", "latitude": 19.4326, "longitude": -99.1332, 
     "population": 9209944, "gdp_per_capita": 20000},
    {"name": "Guadalajara", "country": "Mexico", "latitude": 20.6597, "longitude": -103.3496, 
     "population": 1495189, "gdp_per_capita": 20000},
    
    # Europe
    {"name": "London", "country": "UK", "latitude": 51.5074, "longitude": -0.1278, 
     "population": 8982000, "gdp_per_capita": 42000},
    {"name": "Paris", "country": "France", "latitude": 48.8566, "longitude": 2.3522, 
     "population": 2161000, "gdp_per_capita": 40000},
    {"name": "Berlin", "country": "Germany", "latitude": 52.5200, "longitude": 13.4050, 
     "population": 3769000, "gdp_per_capita": 45000},
    {"name": "Madrid", "country": "Spain", "latitude": 40.4168, "longitude": -3.7038, 
     "population": 3223000, "gdp_per_capita": 30000},
    {"name": "Rome", "country": "Italy", "latitude": 41.9028, "longitude": 12.4964, 
     "population": 2873000, "gdp_per_capita": 35000},
    {"name": "Moscow", "country": "Russia", "latitude": 55.7558, "longitude": 37.6176, 
     "population": 12615000, "gdp_per_capita": 12000},
    {"name": "Barcelona", "country": "Spain", "latitude": 41.3851, "longitude": 2.1734, 
     "population": 1620000, "gdp_per_capita": 30000},
    {"name": "Munich", "country": "Germany", "latitude": 48.1351, "longitude": 11.5820, 
     "population": 1472000, "gdp_per_capita": 45000},
    {"name": "Milan", "country": "Italy", "latitude": 45.4642, "longitude": 9.1900, 
     "population": 1372000, "gdp_per_capita": 35000},
    
    # Asia
    {"name": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, 
     "population": 13929286, "gdp_per_capita": 40000},
    {"name": "Shanghai", "country": "China", "latitude": 31.2304, "longitude": 121.4737, 
     "population": 24870895, "gdp_per_capita": 15000},
    {"name": "Beijing", "country": "China", "latitude": 39.9042, "longitude": 116.4074, 
     "population": 21540000, "gdp_per_capita": 15000},
    {"name": "Mumbai", "country": "India", "latitude": 19.0760, "longitude": 72.8777, 
     "population": 12478447, "gdp_per_capita": 2000},
    {"name": "Delhi", "country": "India", "latitude": 28.7041, "longitude": 77.1025, 
     "population": 32941000, "gdp_per_capita": 2000},
    {"name": "Seoul", "country": "South Korea", "latitude": 37.5665, "longitude": 126.9780, 
     "population": 9720846, "gdp_per_capita": 30000},
    {"name": "Bangkok", "country": "Thailand", "latitude": 13.7563, "longitude": 100.5018, 
     "population": 10539000, "gdp_per_capita": 7000},
    {"name": "Singapore", "country": "Singapore", "latitude": 1.3521, "longitude": 103.8198, 
     "population": 5685807, "gdp_per_capita": 65000},
    {"name": "Hong Kong", "country": "China", "latitude": 22.3193, "longitude": 114.1694, 
     "population": 7496981, "gdp_per_capita": 50000},
    {"name": "Guangzhou", "country": "China", "latitude": 23.1291, "longitude": 113.2644, 
     "population": 14043500, "gdp_per_capita": 15000},
    {"name": "Shenzhen", "country": "China", "latitude": 22.5431, "longitude": 114.0579, 
     "population": 12356820, "gdp_per_capita": 15000},
    
    # Africa
    {"name": "Cairo", "country": "Egypt", "latitude": 30.0444, "longitude": 31.2357, 
     "population": 20484965, "gdp_per_capita": 3000},
    {"name": "Lagos", "country": "Nigeria", "latitude": 6.5244, "longitude": 3.3792, 
     "population": 15388000, "gdp_per_capita": 2000},
    {"name": "Johannesburg", "country": "South Africa", "latitude": -26.2041, "longitude": 28.0473, 
     "population": 5634800, "gdp_per_capita": 6000},
    {"name": "Nairobi", "country": "Kenya", "latitude": -1.2921, "longitude": 36.8219, 
     "population": 4397073, "gdp_per_capita": 2000},
    {"name": "Kinshasa", "country": "DR Congo", "latitude": -4.4419, "longitude": 15.2663, 
     "population": 14342000, "gdp_per_capita": 500},
    
    # South America
    {"name": "São Paulo", "country": "Brazil", "latitude": -23.5505, "longitude": -46.6333, 
     "population": 12325232, "gdp_per_capita": 15000},
    {"name": "Buenos Aires", "country": "Argentina", "latitude": -34.6118, "longitude": -58.3960, 
     "population": 3075646, "gdp_per_capita": 12000},
    {"name": "Lima", "country": "Peru", "latitude": -12.0464, "longitude": -77.0428, 
     "population": 10750000, "gdp_per_capita": 6000},
    {"name": "Bogotá", "country": "Colombia", "latitude": 4.7110, "longitude": -74.0721, 
     "population": 10700000, "gdp_per_capita": 6000},
    {"name": "Rio de Janeiro", "country": "Brazil", "latitude": -22.9068, "longitude": -43.1729, 
     "population": 6748000, "gdp_per_capita": 15000},
    
    # Oceania
    {"name": "Sydney", "country": "Australia", "latitude": -33.8688, "longitude": 151.2093, 
     "population": 5312163, "gdp_per_capita": 55000},
    {"name": "Melbourne", "country": "Australia", "latitude": -37.8136, "longitude": 144.9631, 
     "population": 5078193, "gdp_per_capita": 55000},
    {"name": "Brisbane", "country": "Australia", "latitude": -27.4698, "longitude": 153.0251, 
     "population": 2514184, "gdp_per_capita": 55000},
    {"name": "Perth", "country": "Australia", "latitude": -31.9505, "longitude": 115.8605, 
     "population": 2085973, "gdp_per_capita": 55000},
    {"name": "Auckland", "country": "New Zealand", "latitude": -36.8485, "longitude": 174.7633, 
     "population": 1657200, "gdp_per_capita": 40000},
]


def estimate_gdp_per_capita(country_code: str) -> float:
    """
    Estimate GDP per capita based on country code.
    
    Args:
        country_code: ISO 2-letter country code
        
    Returns:
        Estimated GDP per capita in USD
    """
    # GDP per capita estimates by country (2023 data)
    gdp_map = {
        # High income (> $40,000)
        "US": 65000, "CA": 45000, "GB": 42000, "DE": 45000, "FR": 40000,
        "JP": 40000, "AU": 55000, "NZ": 40000, "SG": 65000, "CH": 80000,
        "NO": 75000, "SE": 55000, "DK": 60000, "NL": 50000, "AT": 48000,
        "BE": 45000, "FI": 48000, "IE": 70000, "LU": 110000, "IS": 60000,
        
        # Upper-middle income ($13,000 - $40,000)
        "CN": 15000, "KR": 30000, "ES": 30000, "IT": 35000, "PT": 25000,
        "GR": 20000, "PL": 18000, "CZ": 25000, "HU": 18000, "RO": 15000,
        "RU": 12000, "TR": 10000, "MX": 20000, "BR": 15000, "AR": 12000,
        "CL": 16000, "MY": 12000, "TH": 7000, "ZA": 6000,
        
        # Lower-middle income ($4,000 - $13,000)
        "IN": 2000, "ID": 4000, "PH": 3500, "VN": 3500, "EG": 3000,
        "NG": 2000, "KE": 2000, "PK": 1500, "BD": 2000, "UA": 4000,
        "PE": 6000, "CO": 6000, "EC": 6000, "MA": 3500,
        
        # Low income (< $4,000)
        "ET": 900, "CD": 500, "TZ": 1100, "UG": 900, "NP": 1200,
    }
    
    return gdp_map.get(country_code, 5000)  # Default to $5,000 if unknown
