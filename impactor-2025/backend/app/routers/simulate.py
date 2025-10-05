"""Simulation API router."""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
import asyncio
import numpy as np

from ..models import (
    SimulationRequest, SimulationResponse, ImpactResults, DeflectionResults,
    KeplerElements, AsteroidProperties, ImpactScenario, DeflectionStrategy
)
from ..services.physics import (
    OrbitalMechanics, ImpactPhysics, TsunamiPhysics, 
    DeflectionPhysics, PopulationExposure
)
from ..services.economic_analysis import calculate_economic_impact

router = APIRouter()


@router.post("/impact", response_model=SimulationResponse)
async def simulate_impact(request: SimulationRequest):
    """Simulate asteroid impact scenario."""
    try:
        # Extract scenario parameters
        scenario = request.scenario
        asteroid = scenario.asteroid
        orbit = scenario.orbit
        
        # Calculate asteroid mass
        mass = ImpactPhysics.calculate_mass(asteroid.diameter, asteroid.density)
        
        # Calculate impact energy
        impact_energy = ImpactPhysics.calculate_kinetic_energy(mass, scenario.impact_velocity)
        tnt_equivalent = ImpactPhysics.calculate_tnt_equivalent(impact_energy)
        
        # Calculate crater properties
        crater_diameter, crater_depth, rim_height = ImpactPhysics.calculate_crater_diameter(
            impact_energy, scenario.impact_angle
        )
        
        # Calculate seismic effects
        seismic_magnitude = ImpactPhysics.calculate_seismic_magnitude(impact_energy)
        mmi_zones = []
        if request.include_seismic:
            mmi_zones = ImpactPhysics.calculate_mmi_zones(
                seismic_magnitude, 
                scenario.impact_latitude, 
                scenario.impact_longitude
            )
        
        # Calculate blast radius (km) - simplified scaling law
        blast_radius = (impact_energy / 4.184e15) ** 0.33 * 10.0  # Scaling from TNT equivalent
        
        # Calculate tsunami effects
        tsunami_height = None
        tsunami_zones = []
        affected_coastline = None
        tsunami_radius = 0.0  # Default tsunami radius
        if request.include_tsunami and scenario.target_type.value in ["ocean", "oceanic_crust"]:
            # Simplified water depth estimation
            water_depth = 4000.0  # Average ocean depth
            distance_to_shore = 100000.0  # 100km to shore
            
            tsunami_height = TsunamiPhysics.calculate_tsunami_height(
                impact_energy, water_depth, distance_to_shore
            )
            
            tsunami_zones = TsunamiPhysics.calculate_tsunami_zones(
                scenario.impact_latitude,
                scenario.impact_longitude,
                tsunami_height
            )
            
            # Calculate affected coastline (simplified)
            affected_coastline = len(tsunami_zones) * 50.0  # 50km per zone
            
            # Calculate tsunami radius (km) - maximum distance of tsunami zones
            if tsunami_zones:
                tsunami_radius = max(zone.get("distance", 0) for zone in tsunami_zones)
        
        # Calculate population exposure
        # Note: We use economic_impact calculation which has real city data
        # PopulationExposure uses simplified density model, so we'll get exposed_population from economic_impact
        exposed_population = 0
        affected_cities = []
        
        # Calculate economic damage (simplified)
        # Based on exposed population and impact energy
        damage_per_person = 100000  # $100k per person
        energy_damage_factor = min(impact_energy / 1e18, 10.0)  # Cap at 10x
        estimated_damage = exposed_population * damage_per_person * energy_damage_factor
        
        # Calculate uncertainty bounds (simplified)
        uncertainty_bounds = {
            "crater_diameter": (crater_diameter * 0.8, crater_diameter * 1.2),
            "seismic_magnitude": (seismic_magnitude - 0.5, seismic_magnitude + 0.5),
            "tsunami_height": (
                (tsunami_height * 0.5 if tsunami_height else 0),
                (tsunami_height * 2.0 if tsunami_height else 0)
            ),
            "exposed_population": (exposed_population * 0.5, exposed_population * 2.0)
        }
        
        # Calculate economic impact using city data
        # Get maximum seismic distance from MMI zones
        max_seismic_distance_km = 1000.0  # Default
        if mmi_zones:
            max_seismic_distance_km = max([zone.get("properties", {}).get("distance_km", 0) for zone in mmi_zones])
        
        # Import settings to get GeoNames username
        from ..config import settings
        
        economic_impact = await calculate_economic_impact(
            impact_latitude=scenario.impact_latitude,
            impact_longitude=scenario.impact_longitude,
            crater_diameter_km=crater_diameter / 1000,  # Convert to km
            blast_radius_km=blast_radius,
            tsunami_radius_km=tsunami_radius,
            max_seismic_distance_km=max_seismic_distance_km,
            geonames_username=settings.geonames_username
        )
        
        # Use economic_impact data for both exposed_population and affected_cities
        exposed_population = economic_impact["population_affected"]
        affected_cities = economic_impact["cities_affected"]
        
        # Create impact results
        impact_results = ImpactResults(
            impact_energy_joules=impact_energy,
            tnt_equivalent_megatons=tnt_equivalent,
            crater_diameter_m=crater_diameter,
            crater_depth_m=crater_depth,
            seismic_magnitude=seismic_magnitude,
            mmi_zones=mmi_zones,
            peak_ground_acceleration=seismic_magnitude * 0.1,  # Simplified
            tsunami_height_m=tsunami_height,
            tsunami_zones=tsunami_zones,
            affected_coastline_km=affected_coastline,
            exposed_population=exposed_population,
            affected_cities=affected_cities,
            estimated_damage_usd=estimated_damage,
            total_economic_loss_usd=economic_impact["total_economic_loss"],
            total_population_affected=economic_impact["population_affected"],
            gdp_impact_percentage=economic_impact["gdp_impact_percentage"],
            uncertainty_bounds=uncertainty_bounds
        )
        
        # Calculate deflection results if provided
        deflection_results = None
        if request.deflection:
            deflection_results = await _calculate_deflection_results(
                request.scenario, request.deflection, impact_results
            )
        
        # Create simulation metadata
        simulation_metadata = {
            "simulation_time": "2024-01-01T00:00:00Z",
            "resolution_km": request.resolution_km,
            "physics_models": {
                "crater_scaling": "pi_scaling",
                "seismic": "simplified_attenuation",
                "tsunami": "energy_based",
                "population": "distance_based"
            },
            "uncertainty_level": "medium"
        }
        
        return SimulationResponse(
            baseline=impact_results,
            deflection=deflection_results,
            simulation_metadata=simulation_metadata
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


async def _calculate_deflection_results(
    scenario: ImpactScenario,
    deflection: DeflectionStrategy,
    baseline_results: ImpactResults
) -> DeflectionResults:
    """Calculate deflection results."""
    try:
        # Convert orbital elements to position and velocity
        # This is simplified - in reality would need proper orbital mechanics
        pos, vel = OrbitalMechanics.kepler_to_cartesian(
            scenario.orbit.semi_major_axis * 1.496e11,  # AU to meters
            scenario.orbit.eccentricity,
            scenario.orbit.inclination,
            scenario.orbit.longitude_of_ascending_node,
            scenario.orbit.argument_of_periapsis,
            scenario.orbit.mean_anomaly
        )
        
        # Apply deflection
        delta_v_vector = np.array(deflection.delta_v_direction) * deflection.delta_v
        time_before_impact = deflection.application_time * 24 * 3600  # days to seconds
        
        new_pos, new_vel = DeflectionPhysics.apply_deflection(
            pos, vel, delta_v_vector, time_before_impact
        )
        
        # Calculate new miss distance
        miss_distance = DeflectionPhysics.calculate_miss_distance(new_pos, new_vel)
        
        # Calculate deflection angle
        original_velocity_magnitude = np.linalg.norm(vel)
        new_velocity_magnitude = np.linalg.norm(new_vel)
        deflection_angle = np.arccos(
            np.dot(vel, new_vel) / (original_velocity_magnitude * new_velocity_magnitude)
        )
        deflection_angle_deg = np.degrees(deflection_angle)
        
        # Calculate impact probability (simplified)
        if miss_distance > 0:
            impact_probability = 0.0
        else:
            # Still impacts, but with different energy
            new_energy = 0.5 * ImpactPhysics.calculate_mass(
                scenario.asteroid.diameter, scenario.asteroid.density
            ) * new_velocity_magnitude**2
            energy_reduction = (baseline_results.impact_energy_joules - new_energy) / baseline_results.impact_energy_joules
            impact_probability = 1.0 - energy_reduction
        
        # Calculate new impact location (if still impacts)
        new_impact_lat = None
        new_impact_lon = None
        if impact_probability > 0:
            # Simplified: assume impact location shifts based on deflection
            lat_shift = delta_v_vector[1] * 0.01  # degrees per m/s
            lon_shift = delta_v_vector[0] * 0.01
            new_impact_lat = scenario.impact_latitude + lat_shift
            new_impact_lon = scenario.impact_longitude + lon_shift
        
        # Calculate effectiveness metrics
        energy_reduction_percent = max(0, (1 - impact_probability) * 100)
        population_exposure_reduction = int(
            baseline_results.exposed_population * (1 - impact_probability)
        )
        
        # Strategy efficiency (simplified)
        strategy_efficiency = min(1.0, deflection.delta_v / 1.0)  # 1 m/s = 100% efficiency
        
        # Required lead time
        required_lead_time = deflection.application_time
        
        return DeflectionResults(
            miss_distance_km=miss_distance / 1000,  # Convert to km
            deflection_angle_deg=deflection_angle_deg,
            impact_probability=impact_probability,
            new_impact_latitude=new_impact_lat,
            new_impact_longitude=new_impact_lon,
            energy_reduction_percent=energy_reduction_percent,
            population_exposure_reduction=population_exposure_reduction,
            strategy_efficiency=strategy_efficiency,
            required_lead_time_days=required_lead_time
        )
        
    except Exception as e:
        print(f"Error calculating deflection results: {e}")
        # Return minimal deflection results
        return DeflectionResults(
            miss_distance_km=0,
            deflection_angle_deg=0,
            impact_probability=1.0,
            new_impact_latitude=None,
            new_impact_longitude=None,
            energy_reduction_percent=0,
            population_exposure_reduction=0,
            strategy_efficiency=0,
            required_lead_time_days=0
        )


@router.post("/deflection", response_model=DeflectionResults)
async def simulate_deflection(
    scenario: ImpactScenario,
    deflection: DeflectionStrategy
):
    """Simulate deflection strategy only."""
    try:
        # Create a minimal impact scenario for deflection calculation
        from ..models import SimulationRequest
        request = SimulationRequest(
            scenario=scenario,
            deflection=deflection,
            include_tsunami=False,
            include_seismic=False,
            include_population=False
        )
        
        # Run full simulation
        response = await simulate_impact(request)
        
        if response.deflection:
            return response.deflection
        else:
            raise HTTPException(status_code=400, detail="No deflection results generated")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deflection simulation failed: {str(e)}")


@router.get("/physics/constants")
async def get_physics_constants():
    """Get physics constants used in simulations."""
    from ..config import PhysicsConstants, UnitConversions
    
    return {
        "earth_radius_km": PhysicsConstants.EARTH_RADIUS_KM,
        "earth_mass_kg": PhysicsConstants.EARTH_MASS_KG,
        "earth_gravity_ms2": PhysicsConstants.EARTH_GRAVITY_MS2,
        "tnt_to_joules": PhysicsConstants.TNT_TO_JOULES,
        "asteroid_densities": {
            "stony": PhysicsConstants.ASTEROID_DENSITY_STONY,
            "iron": PhysicsConstants.ASTEROID_DENSITY_IRON,
            "carbonaceous": PhysicsConstants.ASTEROID_DENSITY_CARBONACEOUS
        },
        "unit_conversions": {
            "km_to_m": UnitConversions.KM_TO_M,
            "m_to_km": UnitConversions.M_TO_KM,
            "joules_to_megatons_tnt": UnitConversions.JOULES_TO_MEGATONS_TNT
        }
    }


@router.get("/scenarios/presets")
async def get_preset_scenarios():
    """Get preset impact scenarios."""
    return {
        "scenarios": [
            {
                "name": "Small Asteroid",
                "description": "Small asteroid impact (100m diameter)",
                "asteroid": {
                    "diameter": 100.0,
                    "density_type": "stony",
                    "density": 3000.0
                },
                "impact_velocity": 15000.0,
                "impact_angle": 45.0,
                "target_type": "continental_crust"
            },
            {
                "name": "Medium Asteroid",
                "description": "Medium asteroid impact (500m diameter)",
                "asteroid": {
                    "diameter": 500.0,
                    "density_type": "stony",
                    "density": 3000.0
                },
                "impact_velocity": 20000.0,
                "impact_angle": 30.0,
                "target_type": "ocean"
            },
            {
                "name": "Large Asteroid",
                "description": "Large asteroid impact (1km diameter)",
                "asteroid": {
                    "diameter": 1000.0,
                    "density_type": "iron",
                    "density": 7800.0
                },
                "impact_velocity": 25000.0,
                "impact_angle": 60.0,
                "target_type": "continental_crust"
            }
        ]
    }
