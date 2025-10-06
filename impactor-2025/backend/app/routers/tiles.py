"""Tile server router."""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from typing import Optional
import os
from pathlib import Path

from ..config import settings

router = APIRouter()


@router.get("/dem/{z}/{x}/{y}.png")
async def get_dem_tile(z: int, x: int, y: int):
    """Get DEM tile as PNG."""
    try:
        # Check if tile exists in local storage
        tile_path = Path(settings.rasters_dir) / "dem" / f"{z}" / f"{x}" / f"{y}.png"
        
        if tile_path.exists():
            with open(tile_path, "rb") as f:
                return Response(content=f.read(), media_type="image/png")
        else:
            # Return empty tile or generate placeholder
            return Response(
                content=b"",  # Empty response
                media_type="image/png",
                headers={"Cache-Control": "public, max-age=3600"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get DEM tile: {str(e)}")


@router.get("/population/{z}/{x}/{y}.png")
async def get_population_tile(z: int, x: int, y: int):
    """Get population density tile as PNG."""
    try:
        tile_path = Path(settings.rasters_dir) / "population" / f"{z}" / f"{x}" / f"{y}.png"
        
        if tile_path.exists():
            with open(tile_path, "rb") as f:
                return Response(content=f.read(), media_type="image/png")
        else:
            return Response(
                content=b"",
                media_type="image/png",
                headers={"Cache-Control": "public, max-age=3600"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get population tile: {str(e)}")


@router.get("/tsunami/{z}/{x}/{y}.png")
async def get_tsunami_tile(z: int, x: int, y: int):
    """Get tsunami hazard tile as PNG."""
    try:
        tile_path = Path(settings.rasters_dir) / "tsunami" / f"{z}" / f"{x}" / f"{y}.png"
        
        if tile_path.exists():
            with open(tile_path, "rb") as f:
                return Response(content=f.read(), media_type="image/png")
        else:
            return Response(
                content=b"",
                media_type="image/png",
                headers={"Cache-Control": "public, max-age=3600"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tsunami tile: {str(e)}")


@router.get("/impact/{z}/{x}/{y}.png")
async def get_impact_tile(z: int, x: int, y: int):
    """Get impact effect tile as PNG."""
    try:
        tile_path = Path(settings.rasters_dir) / "impact" / f"{z}" / f"{x}" / f"{y}.png"
        
        if tile_path.exists():
            with open(tile_path, "rb") as f:
                return Response(content=f.read(), media_type="image/png")
        else:
            return Response(
                content=b"",
                media_type="image/png",
                headers={"Cache-Control": "public, max-age=3600"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get impact tile: {str(e)}")


@router.get("/layers")
async def get_available_layers():
    """Get list of available tile layers."""
    try:
        layers = []
        rasters_dir = Path(settings.rasters_dir)
        
        if rasters_dir.exists():
            for layer_dir in rasters_dir.iterdir():
                if layer_dir.is_dir():
                    layers.append({
                        "name": layer_dir.name,
                        "type": "raster",
                        "format": "png",
                        "tile_url": f"/api/tiles/{layer_dir.name}/{{z}}/{{x}}/{{y}}.png"
                    })
        
        return {
            "layers": layers,
            "tile_size": 256,
            "min_zoom": 0,
            "max_zoom": 18
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get layers: {str(e)}")
