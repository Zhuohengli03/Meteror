"""NASA NEO API router."""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
import httpx
import asyncio
from datetime import datetime, timedelta

from ..config import settings
from ..services.nasa_client import NASAClient
from ..models import NEOAsteroid, NEOSearchResponse

router = APIRouter()

# Initialize NASA client
nasa_client = NASAClient(api_key=settings.nasa_api_key)


@router.get("/search", response_model=NEOSearchResponse)
async def search_asteroids(
    name: Optional[str] = Query(None, description="Asteroid name to search for"),
    hazardous_only: bool = Query(False, description="Return only potentially hazardous asteroids"),
    min_diameter: Optional[float] = Query(None, description="Minimum diameter in meters"),
    max_diameter: Optional[float] = Query(None, description="Maximum diameter in meters"),
    limit: int = Query(100, description="Maximum number of results", le=1000)
):
    """Search for near-Earth asteroids."""
    try:
        # Search by name if provided
        if name:
            results = await nasa_client.search_by_name(name)
        else:
            # Search by date range (next 7 days)
            end_date = datetime.now() + timedelta(days=7)
            start_date = datetime.now()
            results = await nasa_client.get_asteroids_by_date(
                start_date.strftime("%Y-%m-%d"),
                end_date.strftime("%Y-%m-%d")
            )
        
        # Filter results
        filtered_asteroids = []
        for asteroid in results:
            # Filter by hazardous status
            if hazardous_only and not asteroid.is_potentially_hazardous_asteroid:
                continue
            
            # Filter by diameter
            if min_diameter or max_diameter:
                diameter_min = asteroid.estimated_diameter.get("meters", {}).get("estimated_diameter_min", 0)
                diameter_max = asteroid.estimated_diameter.get("meters", {}).get("estimated_diameter_max", 0)
                avg_diameter = (diameter_min + diameter_max) / 2
                
                if min_diameter and avg_diameter < min_diameter:
                    continue
                if max_diameter and avg_diameter > max_diameter:
                    continue
            
            filtered_asteroids.append(asteroid)
            
            # Limit results
            if len(filtered_asteroids) >= limit:
                break
        
        return NEOSearchResponse(
            links={"self": f"/api/neo/search?limit={limit}"},
            element_count=len(filtered_asteroids),
            near_earth_objects={datetime.now().strftime("%Y-%m-%d"): filtered_asteroids}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search asteroids: {str(e)}")


@router.get("/asteroid/{asteroid_id}", response_model=NEOAsteroid)
async def get_asteroid(asteroid_id: str):
    """Get specific asteroid by ID."""
    try:
        asteroid = await nasa_client.get_asteroid_by_id(asteroid_id)
        if not asteroid:
            raise HTTPException(status_code=404, detail="Asteroid not found")
        return asteroid
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get asteroid: {str(e)}")


@router.get("/feed")
async def get_asteroid_feed(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    detailed: bool = Query(False, description="Include detailed orbital data")
):
    """Get asteroid feed for date range."""
    try:
        results = await nasa_client.get_asteroids_by_date(start_date, end_date, detailed)
        return {
            "start_date": start_date,
            "end_date": end_date,
            "asteroids": results,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get asteroid feed: {str(e)}")


@router.get("/browse")
async def browse_asteroids(
    page: int = Query(0, description="Page number", ge=0),
    size: int = Query(20, description="Page size", le=100)
):
    """Browse all asteroids with pagination."""
    try:
        results = await nasa_client.browse_asteroids(page=page, size=size)
        return {
            "page": page,
            "size": size,
            "asteroids": results,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to browse asteroids: {str(e)}")


@router.get("/stats")
async def get_asteroid_stats():
    """Get asteroid statistics."""
    try:
        stats = await nasa_client.get_asteroid_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get asteroid stats: {str(e)}")


@router.get("/close-approaches")
async def get_close_approaches(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    min_distance: Optional[float] = Query(None, description="Minimum miss distance in km"),
    max_distance: Optional[float] = Query(None, description="Maximum miss distance in km")
):
    """Get close approach data for date range."""
    try:
        approaches = await nasa_client.get_close_approaches(
            start_date, end_date, min_distance, max_distance
        )
        return {
            "start_date": start_date,
            "end_date": end_date,
            "approaches": approaches,
            "count": len(approaches)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get close approaches: {str(e)}")
