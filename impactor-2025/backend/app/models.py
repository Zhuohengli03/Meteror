"""Pydantic models for API requests and responses."""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Tuple
from enum import Enum
import numpy as np


class AsteroidDensityType(str, Enum):
    """Asteroid density types."""
    STONY = "stony"
    IRON = "iron"
    CARBONACEOUS = "carbonaceous"


class TargetType(str, Enum):
    """Impact target types."""
    CONTINENTAL_CRUST = "continental_crust"
    OCEANIC_CRUST = "oceanic_crust"
    OCEAN = "ocean"


class DeflectionType(str, Enum):
    """Deflection strategy types."""
    KINETIC_IMPACTOR = "kinetic_impactor"
    GRAVITY_TRACTOR = "gravity_tractor"
    NUCLEAR_DETONATION = "nuclear_detonation"


# Request Models
class KeplerElements(BaseModel):
    """Kepler orbital elements."""
    semi_major_axis: float = Field(..., description="Semi-major axis in AU", gt=0)
    eccentricity: float = Field(..., description="Eccentricity", ge=0, lt=1)
    inclination: float = Field(..., description="Inclination in degrees", ge=0, le=180)
    longitude_of_ascending_node: float = Field(..., description="Longitude of ascending node in degrees", ge=0, lt=360)
    argument_of_periapsis: float = Field(..., description="Argument of periapsis in degrees", ge=0, lt=360)
    mean_anomaly: float = Field(..., description="Mean anomaly at epoch in degrees", ge=0, lt=360)
    epoch: float = Field(..., description="Epoch in Julian days")


class AsteroidProperties(BaseModel):
    """Asteroid physical properties."""
    diameter: float = Field(..., description="Diameter in meters", gt=0)
    density_type: AsteroidDensityType = Field(default=AsteroidDensityType.STONY)
    density: Optional[float] = Field(None, description="Custom density in kg/m³", gt=0)
    
    @validator('density', always=True)
    def set_density(cls, v, values):
        if v is None:
            density_map = {
                AsteroidDensityType.STONY: 3000.0,
                AsteroidDensityType.IRON: 7800.0,
                AsteroidDensityType.CARBONACEOUS: 2000.0
            }
            return density_map[values['density_type']]
        return v


class ImpactScenario(BaseModel):
    """Impact scenario parameters."""
    asteroid: AsteroidProperties
    orbit: KeplerElements
    impact_angle: float = Field(..., description="Impact angle in degrees", ge=0, le=90)
    impact_velocity: float = Field(..., description="Impact velocity in m/s", gt=0)
    target_type: TargetType = Field(default=TargetType.CONTINENTAL_CRUST)
    impact_latitude: float = Field(..., description="Impact latitude in degrees", ge=-90, le=90)
    impact_longitude: float = Field(..., description="Impact longitude in degrees", ge=-180, le=180)
    impact_time: Optional[float] = Field(None, description="Impact time in Julian days")


class DeflectionStrategy(BaseModel):
    """Deflection strategy parameters."""
    strategy_type: DeflectionType
    delta_v: float = Field(..., description="Delta-v in m/s", gt=0)
    delta_v_direction: Tuple[float, float, float] = Field(
        ..., 
        description="Delta-v direction vector (x, y, z) in orbital frame"
    )
    application_time: float = Field(..., description="Time of application in days before impact", gt=0)
    
    # For kinetic impactor
    impactor_mass: Optional[float] = Field(None, description="Impactor mass in kg", gt=0)
    impactor_velocity: Optional[float] = Field(None, description="Impactor velocity in m/s", gt=0)
    impactor_angle: Optional[float] = Field(None, description="Impactor angle in degrees", ge=0, le=180)


class SimulationRequest(BaseModel):
    """Request for impact simulation."""
    scenario: ImpactScenario
    deflection: Optional[DeflectionStrategy] = None
    include_tsunami: bool = True
    include_seismic: bool = True
    include_population: bool = True
    resolution_km: float = Field(default=10.0, description="Spatial resolution in km", gt=0)


# Response Models
class ImpactResults(BaseModel):
    """Impact simulation results."""
    # Basic impact parameters
    impact_energy_joules: float = Field(..., description="Impact energy in joules")
    tnt_equivalent_megatons: float = Field(..., description="TNT equivalent in megatons")
    crater_diameter_m: float = Field(..., description="Crater diameter in meters")
    crater_depth_m: float = Field(..., description="Crater depth in meters")
    
    # Seismic effects
    seismic_magnitude: float = Field(..., description="Seismic magnitude")
    mmi_zones: List[Dict[str, Any]] = Field(..., description="MMI zones as GeoJSON")
    peak_ground_acceleration: float = Field(..., description="Peak ground acceleration in m/s²")
    
    # Tsunami effects (if applicable)
    tsunami_height_m: Optional[float] = Field(None, description="Maximum tsunami height in meters")
    tsunami_zones: Optional[List[Dict[str, Any]]] = Field(None, description="Tsunami zones as GeoJSON")
    affected_coastline_km: Optional[float] = Field(None, description="Affected coastline length in km")
    
    # Population exposure
    exposed_population: int = Field(..., description="Exposed population count")
    affected_cities: List[Dict[str, Any]] = Field(..., description="Affected cities list")
    
    # Economic impact (enhanced with city data)
    estimated_damage_usd: float = Field(..., description="Estimated damage in USD")
    total_economic_loss_usd: float = Field(..., description="Total economic loss in USD")
    total_population_affected: int = Field(..., description="Total population affected")
    gdp_impact_percentage: float = Field(..., description="GDP impact as percentage of world GDP")
    
    # Uncertainty bounds
    uncertainty_bounds: Dict[str, Tuple[float, float]] = Field(
        ..., 
        description="Uncertainty bounds for key parameters"
    )


class DeflectionResults(BaseModel):
    """Deflection simulation results."""
    # Deflection effectiveness
    miss_distance_km: float = Field(..., description="Final miss distance in km")
    deflection_angle_deg: float = Field(..., description="Deflection angle in degrees")
    impact_probability: float = Field(..., description="Remaining impact probability", ge=0, le=1)
    
    # New impact location (if still impacts)
    new_impact_latitude: Optional[float] = Field(None, description="New impact latitude")
    new_impact_longitude: Optional[float] = Field(None, description="New impact longitude")
    
    # Comparison with baseline
    energy_reduction_percent: float = Field(..., description="Energy reduction percentage")
    population_exposure_reduction: int = Field(..., description="Population exposure reduction")
    
    # Strategy effectiveness
    strategy_efficiency: float = Field(..., description="Strategy efficiency", ge=0, le=1)
    required_lead_time_days: float = Field(..., description="Required lead time in days")


class SimulationResponse(BaseModel):
    """Complete simulation response."""
    baseline: ImpactResults
    deflection: Optional[DeflectionResults] = None
    simulation_metadata: Dict[str, Any] = Field(..., description="Simulation metadata")


# NASA NEO API Models
class NEOCloseApproachData(BaseModel):
    """NASA NEO close approach data."""
    close_approach_date: str
    close_approach_date_full: str
    epoch_date_close_approach: int
    relative_velocity: Dict[str, str]
    miss_distance: Dict[str, str]
    orbiting_body: str


class NEOOrbitalData(BaseModel):
    """NASA NEO orbital data."""
    orbit_id: str
    orbit_determination_date: str
    first_observation_date: str
    last_observation_date: str
    data_arc_in_days: int
    observations_used: int
    orbit_uncertainty: str
    minimum_orbit_intersection: str
    jupiter_tisserand_invariant: str
    epoch_osculation: str
    eccentricity: str
    semi_major_axis: str
    inclination: str
    longitude_of_ascending_node: str
    argument_of_periapsis: str
    mean_anomaly: str
    mean_motion: str
    equinox: str
    orbit_class: Dict[str, str]


class NEOAsteroid(BaseModel):
    """NASA NEO asteroid data."""
    links: Dict[str, str]
    id: str
    neo_reference_id: str
    name: str
    nasa_jpl_url: str
    absolute_magnitude_h: float
    estimated_diameter: Dict[str, Dict[str, float]]
    is_potentially_hazardous_asteroid: bool
    close_approach_data: List[NEOCloseApproachData]
    orbital_data: NEOOrbitalData
    is_sentry_object: bool


class NEOSearchResponse(BaseModel):
    """NASA NEO search response."""
    links: Dict[str, str]
    element_count: int
    near_earth_objects: Dict[str, List[NEOAsteroid]]


# USGS Models
class USGSEarthquake(BaseModel):
    """USGS earthquake data."""
    id: str
    magnitude: float
    place: str
    time: int
    updated: int
    tz: int
    url: str
    detail: str
    felt: Optional[int] = None
    cdi: Optional[float] = None
    mmi: Optional[float] = None
    alert: Optional[str] = None
    status: str
    tsunami: int
    sig: int
    net: str
    code: str
    ids: str
    sources: str
    types: str
    nst: Optional[int] = None
    dmin: Optional[float] = None
    rms: float
    gap: Optional[float] = None
    magType: str
    type: str
    title: str
    geometry: Dict[str, Any]


class USGSEarthquakeResponse(BaseModel):
    """USGS earthquake response."""
    type: str
    metadata: Dict[str, Any]
    features: List[USGSEarthquake]
    bbox: List[float]


# Tile Server Models
class TileRequest(BaseModel):
    """Tile request parameters."""
    z: int = Field(..., description="Zoom level", ge=0, le=18)
    x: int = Field(..., description="Tile X coordinate", ge=0)
    y: int = Field(..., description="Tile Y coordinate", ge=0)
    layer: str = Field(..., description="Layer name")
    format: str = Field(default="png", description="Tile format")


# Demo Scenario Models
class DemoScenario(BaseModel):
    """Demo scenario configuration."""
    name: str
    description: str
    scenario: ImpactScenario
    deflection: Optional[DeflectionStrategy] = None
    timeline: List[Dict[str, Any]] = Field(..., description="Animation timeline")
    educational_notes: List[str] = Field(..., description="Educational notes")


# Game Mode Models
class GameSession(BaseModel):
    """Defend Earth game session."""
    session_id: str
    player_name: str
    difficulty: str
    budget: float
    time_remaining: float
    scenarios_completed: int
    score: float
    high_scores: List[Dict[str, Any]]


class GameAction(BaseModel):
    """Game action (deflection strategy)."""
    action_type: str
    parameters: Dict[str, Any]
    cost: float
    effectiveness: float
    lead_time_required: float
