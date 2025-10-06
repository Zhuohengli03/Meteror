"""NASA NEO API client."""

import httpx
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

from ..config import settings
from ..models import NEOAsteroid, NEOSearchResponse
from .cache import CacheService


class NASAClient:
    """NASA NEO API client with caching."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = settings.nasa_base_url
        self.cache = CacheService()
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Make HTTP request with caching."""
        if params is None:
            params = {}
        
        params["api_key"] = self.api_key
        
        # Check cache first
        cache_key = f"nasa:{endpoint}:{hash(str(params))}"
        cached_result = await self.cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Make request
        url = f"{self.base_url}/{endpoint}"
        try:
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Cache result
            await self.cache.set(cache_key, data, ttl=settings.cache_ttl_seconds)
            
            return data
        except httpx.HTTPError as e:
            raise Exception(f"NASA API request failed: {str(e)}")
    
    async def search_by_name(self, name: str) -> List[NEOAsteroid]:
        """Search for asteroids by name."""
        try:
            data = await self._make_request("search", {"name": name})
            asteroids = []
            
            for date, neo_list in data.get("near_earth_objects", {}).items():
                for neo_data in neo_list:
                    asteroid = self._parse_asteroid(neo_data)
                    asteroids.append(asteroid)
            
            return asteroids
        except Exception as e:
            print(f"Error searching by name: {e}")
            return []
    
    async def get_asteroid_by_id(self, asteroid_id: str) -> Optional[NEOAsteroid]:
        """Get asteroid by ID."""
        try:
            data = await self._make_request(f"neo/{asteroid_id}")
            return self._parse_asteroid(data)
        except Exception as e:
            print(f"Error getting asteroid by ID: {e}")
            return None
    
    async def get_asteroids_by_date(
        self, 
        start_date: str, 
        end_date: str, 
        detailed: bool = False
    ) -> List[NEOAsteroid]:
        """Get asteroids by date range."""
        try:
            params = {
                "start_date": start_date,
                "end_date": end_date,
                "detailed": str(detailed).lower()
            }
            
            data = await self._make_request("feed", params)
            asteroids = []
            
            for date, neo_list in data.get("near_earth_objects", {}).items():
                for neo_data in neo_list:
                    asteroid = self._parse_asteroid(neo_data)
                    asteroids.append(asteroid)
            
            return asteroids
        except Exception as e:
            print(f"Error getting asteroids by date: {e}")
            return []
    
    async def browse_asteroids(self, page: int = 0, size: int = 20) -> List[NEOAsteroid]:
        """Browse all asteroids with pagination."""
        try:
            params = {
                "page": page,
                "size": size
            }
            
            data = await self._make_request("browse", params)
            asteroids = []
            
            for neo_data in data.get("near_earth_objects", []):
                asteroid = self._parse_asteroid(neo_data)
                asteroids.append(asteroid)
            
            return asteroids
        except Exception as e:
            print(f"Error browsing asteroids: {e}")
            return []
    
    async def get_asteroid_stats(self) -> Dict[str, Any]:
        """Get asteroid statistics."""
        try:
            data = await self._make_request("stats")
            return data
        except Exception as e:
            print(f"Error getting asteroid stats: {e}")
            return {}
    
    async def get_close_approaches(
        self,
        start_date: str,
        end_date: str,
        min_distance: Optional[float] = None,
        max_distance: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """Get close approach data."""
        try:
            params = {
                "start_date": start_date,
                "end_date": end_date
            }
            
            data = await self._make_request("feed", params)
            approaches = []
            
            for date, neo_list in data.get("near_earth_objects", {}).items():
                for neo_data in neo_list:
                    for approach_data in neo_data.get("close_approach_data", []):
                        # Parse miss distance
                        miss_distance_km = float(approach_data.get("miss_distance", {}).get("kilometers", "0"))
                        
                        # Filter by distance
                        if min_distance and miss_distance_km < min_distance:
                            continue
                        if max_distance and miss_distance_km > max_distance:
                            continue
                        
                        approach = {
                            "asteroid_id": neo_data.get("id"),
                            "asteroid_name": neo_data.get("name"),
                            "close_approach_date": approach_data.get("close_approach_date"),
                            "miss_distance_km": miss_distance_km,
                            "relative_velocity_km_s": float(
                                approach_data.get("relative_velocity", {}).get("kilometers_per_second", "0")
                            ),
                            "orbiting_body": approach_data.get("orbiting_body")
                        }
                        approaches.append(approach)
            
            return approaches
        except Exception as e:
            print(f"Error getting close approaches: {e}")
            return []
    
    def _parse_asteroid(self, neo_data: Dict[str, Any]) -> NEOAsteroid:
        """Parse NASA NEO data into NEOAsteroid model."""
        try:
            # Parse close approach data
            close_approach_data = []
            for approach in neo_data.get("close_approach_data", []):
                close_approach_data.append({
                    "close_approach_date": approach.get("close_approach_date", ""),
                    "close_approach_date_full": approach.get("close_approach_date_full", ""),
                    "epoch_date_close_approach": approach.get("epoch_date_close_approach", 0),
                    "relative_velocity": approach.get("relative_velocity", {}),
                    "miss_distance": approach.get("miss_distance", {}),
                    "orbiting_body": approach.get("orbiting_body", "Earth")
                })
            
            # Parse orbital data
            orbital_data = neo_data.get("orbital_data", {})
            orbital_data_parsed = {
                "orbit_id": orbital_data.get("orbit_id", ""),
                "orbit_determination_date": orbital_data.get("orbit_determination_date", ""),
                "first_observation_date": orbital_data.get("first_observation_date", ""),
                "last_observation_date": orbital_data.get("last_observation_date", ""),
                "data_arc_in_days": orbital_data.get("data_arc_in_days", 0),
                "observations_used": orbital_data.get("observations_used", 0),
                "orbit_uncertainty": orbital_data.get("orbit_uncertainty", ""),
                "minimum_orbit_intersection": orbital_data.get("minimum_orbit_intersection", ""),
                "jupiter_tisserand_invariant": orbital_data.get("jupiter_tisserand_invariant", ""),
                "epoch_osculation": orbital_data.get("epoch_osculation", ""),
                "eccentricity": orbital_data.get("eccentricity", ""),
                "semi_major_axis": orbital_data.get("semi_major_axis", ""),
                "inclination": orbital_data.get("inclination", ""),
                "longitude_of_ascending_node": orbital_data.get("longitude_of_ascending_node", ""),
                "argument_of_periapsis": orbital_data.get("argument_of_periapsis", ""),
                "mean_anomaly": orbital_data.get("mean_anomaly", ""),
                "mean_motion": orbital_data.get("mean_motion", ""),
                "equinox": orbital_data.get("equinox", ""),
                "orbit_class": orbital_data.get("orbit_class", {})
            }
            
            return NEOAsteroid(
                links=neo_data.get("links", {}),
                id=neo_data.get("id", ""),
                neo_reference_id=neo_data.get("neo_reference_id", ""),
                name=neo_data.get("name", ""),
                nasa_jpl_url=neo_data.get("nasa_jpl_url", ""),
                absolute_magnitude_h=neo_data.get("absolute_magnitude_h", 0.0),
                estimated_diameter=neo_data.get("estimated_diameter", {}),
                is_potentially_hazardous_asteroid=neo_data.get("is_potentially_hazardous_asteroid", False),
                close_approach_data=close_approach_data,
                orbital_data=orbital_data_parsed,
                is_sentry_object=neo_data.get("is_sentry_object", False)
            )
        except Exception as e:
            print(f"Error parsing asteroid data: {e}")
            # Return minimal asteroid data
            return NEOAsteroid(
                links={},
                id=neo_data.get("id", ""),
                neo_reference_id="",
                name=neo_data.get("name", "Unknown"),
                nasa_jpl_url="",
                absolute_magnitude_h=0.0,
                estimated_diameter={},
                is_potentially_hazardous_asteroid=False,
                close_approach_data=[],
                orbital_data={},
                is_sentry_object=False
            )
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
