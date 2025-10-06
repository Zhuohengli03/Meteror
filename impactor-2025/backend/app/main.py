"""Main FastAPI application."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from pathlib import Path

from .config import settings
from .routers import neo, usgs, simulate, tiles
from .services.cache import CacheService

# Create FastAPI app
app = FastAPI(
    title="Defend Earth API",
    description="Asteroid impact simulation and deflection analysis API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize cache service
cache_service = CacheService()

# Include routers
app.include_router(neo.router, prefix="/api/neo", tags=["NEO"])
app.include_router(usgs.router, prefix="/api/usgs", tags=["USGS"])
app.include_router(simulate.router, prefix="/api/simulate", tags=["Simulation"])
app.include_router(tiles.router, prefix="/api/tiles", tags=["Tiles"])

# Mount static files
data_dir = Path(settings.data_dir)
if data_dir.exists():
    app.mount("/data", StaticFiles(directory=str(data_dir)), name="data")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "cache_status": "connected" if cache_service.is_connected() else "disconnected"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Defend Earth API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "neo": "/api/neo",
            "usgs": "/api/usgs", 
            "simulate": "/api/simulate",
            "tiles": "/api/tiles"
        }
    }

# Demo scenario endpoint
@app.get("/api/demo/impactor-2025")
async def get_demo_scenario():
    """Get the Impactor-2025 demo scenario."""
    demo_file = Path(settings.samples_dir) / "impactor_2025.json"
    
    if not demo_file.exists():
        # Return a default demo scenario
        return {
            "name": "Impactor-2025",
            "description": "A hypothetical asteroid impact scenario for demonstration",
            "scenario": {
                "asteroid": {
                    "diameter": 500.0,
                    "density_type": "stony",
                    "density": 3000.0
                },
                "orbit": {
                    "semi_major_axis": 1.2,
                    "eccentricity": 0.3,
                    "inclination": 15.0,
                    "longitude_of_ascending_node": 45.0,
                    "argument_of_periapsis": 30.0,
                    "mean_anomaly": 180.0,
                    "epoch": 2460000.0
                },
                "impact_angle": 45.0,
                "impact_velocity": 15000.0,
                "target_type": "continental_crust",
                "impact_latitude": 40.7128,
                "impact_longitude": -74.0060,
                "impact_time": 2460000.0
            },
            "deflection": {
                "strategy_type": "kinetic_impactor",
                "delta_v": 0.1,
                "delta_v_direction": [1.0, 0.0, 0.0],
                "application_time": 90.0,
                "impactor_mass": 1000.0,
                "impactor_velocity": 10000.0,
                "impactor_angle": 0.0
            },
            "timeline": [
                {"time": -90, "event": "Asteroid discovered", "description": "Near-Earth asteroid detected by ground-based telescopes"},
                {"time": -30, "event": "Deflection mission launched", "description": "Kinetic impactor spacecraft launched to intercept asteroid"},
                {"time": -7, "event": "Final approach", "description": "Asteroid approaches Earth, deflection mission in final phase"},
                {"time": 0, "event": "Impact/Deflection", "description": "Either impact occurs or asteroid is successfully deflected"},
                {"time": 1, "event": "Assessment", "description": "Post-impact assessment or confirmation of successful deflection"}
            ],
            "educational_notes": [
                "This scenario demonstrates the importance of early detection and deflection capabilities",
                "The kinetic impactor method is one of the most feasible deflection strategies",
                "Success depends on lead time, impactor mass, and precise targeting",
                "Real deflection missions would require years of planning and preparation"
            ]
        }
    
    # Load from file
    import json
    with open(demo_file, 'r') as f:
        return json.load(f)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    await cache_service.initialize()
    print("Defend Earth API started successfully!")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    await cache_service.close()
    print("Defend Earth API shutdown complete!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.debug
    )
