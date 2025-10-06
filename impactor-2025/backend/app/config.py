"""Application configuration and settings."""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    nasa_api_key: str = "DEMO_KEY"
    mapbox_token: Optional[str] = None
    geonames_username: Optional[str] = None  # Register at geonames.org for free
    
    # API URLs
    nasa_base_url: str = "https://api.nasa.gov/neo/rest/v1"
    usgs_base_url: str = "https://earthquake.usgs.gov/fdsnws/event/1"
    usgs_dem_base_url: str = "https://elevation.nationalmap.gov/arcgis/rest/services"
    
    # Server Configuration
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_workers: int = 4
    
    # Cache Configuration
    cache_ttl_seconds: int = 3600
    cache_max_size: int = 1000
    redis_url: Optional[str] = None
    
    # Database
    database_url: str = "sqlite:///./data/impactor.db"
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080"
    ]
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    
    # Development
    debug: bool = True
    log_level: str = "INFO"
    
    # Performance
    max_workers: int = 4
    worker_timeout: int = 30
    
    # Tile Server
    tiles_base_url: str = "http://backend:8000/api/tiles"
    tiles_cache_ttl: int = 3600
    
    # Data Paths
    data_dir: str = "/app/data"
    samples_dir: str = "/app/data/samples"
    rasters_dir: str = "/app/data/rasters"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


# Physical Constants
class PhysicsConstants:
    """Physical constants used in calculations."""
    
    # Earth
    EARTH_RADIUS_KM = 6371.0
    EARTH_MASS_KG = 5.972e24
    EARTH_GRAVITY_MS2 = 9.81
    
    # Atmosphere
    ATMOSPHERE_HEIGHT_KM = 100.0
    
    # Energy conversion
    TNT_TO_JOULES = 4.184e15  # 1 megaton TNT in joules
    
    # Asteroid densities (kg/m³)
    ASTEROID_DENSITY_STONY = 3000.0
    ASTEROID_DENSITY_IRON = 7800.0
    ASTEROID_DENSITY_CARBONACEOUS = 2000.0
    
    # Impact scaling
    CRATER_DIAMETER_SCALING = 1.25  # π-scaling factor
    SEISMIC_EFFICIENCY = 0.01  # Fraction of energy converted to seismic waves
    
    # Tsunami
    TSUNAMI_EFFICIENCY = 0.1  # Fraction of energy converted to tsunami
    TSUNAMI_DECAY_FACTOR = 0.5  # Distance decay factor
    
    # Deflection
    DEFLECTION_EFFICIENCY = 0.1  # Kinetic impactor efficiency


# Color palettes for visualization
class ColorPalettes:
    """Color palettes for different visualization needs."""
    
    # MMI (Modified Mercalli Intensity) colors
    MMI_COLORS = {
        1: "#FFFFFF",  # White
        2: "#FFFF00",  # Yellow
        3: "#FFA500",  # Orange
        4: "#FF4500",  # Red-Orange
        5: "#FF0000",  # Red
        6: "#8B0000",  # Dark Red
        7: "#800080",  # Purple
        8: "#000080",  # Navy
        9: "#000000",  # Black
        10: "#000000", # Black
        11: "#000000", # Black
        12: "#000000"  # Black
    }
    
    # Tsunami height colors
    TSUNAMI_COLORS = {
        "low": "#0066CC",      # Blue
        "moderate": "#00CC66", # Green
        "high": "#FFCC00",     # Yellow
        "extreme": "#FF6600",  # Orange
        "catastrophic": "#CC0000"  # Red
    }
    
    # Impact energy colors
    ENERGY_COLORS = {
        "low": "#00CC66",      # Green
        "moderate": "#FFCC00", # Yellow
        "high": "#FF6600",     # Orange
        "extreme": "#CC0000",  # Red
        "catastrophic": "#6600CC"  # Purple
    }
    
    # Colorblind-safe palette
    COLORBLIND_SAFE = [
        "#1f77b4",  # Blue
        "#ff7f0e",  # Orange
        "#2ca02c",  # Green
        "#d62728",  # Red
        "#9467bd",  # Purple
        "#8c564b",  # Brown
        "#e377c2",  # Pink
        "#7f7f7f",  # Gray
        "#bcbd22",  # Olive
        "#17becf"   # Cyan
    ]


# Unit conversion factors
class UnitConversions:
    """Unit conversion factors."""
    
    # Length
    KM_TO_M = 1000.0
    M_TO_KM = 0.001
    M_TO_CM = 100.0
    CM_TO_M = 0.01
    
    # Mass
    KG_TO_TONNES = 0.001
    TONNES_TO_KG = 1000.0
    
    # Energy
    JOULES_TO_MEGATONS_TNT = 1.0 / PhysicsConstants.TNT_TO_JOULES
    MEGATONS_TNT_TO_JOULES = PhysicsConstants.TNT_TO_JOULES
    
    # Velocity
    MS_TO_KMS = 0.001
    KMS_TO_MS = 1000.0
    
    # Area
    M2_TO_KM2 = 1e-6
    KM2_TO_M2 = 1e6
