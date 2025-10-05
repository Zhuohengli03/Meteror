from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import numpy as np
import math
import os
import csv
import pandas as pd

# 导入新的计算模块
from physics_calculations import ImpactPhysics, PopulationImpact, EconomicImpact, TsunamiImpact
from config import *

app = FastAPI(title="Asteroid Impact Simulation API", version="2.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Asteroid(BaseModel):
    id: str
    name: str
    diameter_min: float
    diameter_max: float
    is_potentially_hazardous: bool
    close_approach_data: List[dict]
    orbital_data: dict

class ImpactSimulation(BaseModel):
    asteroid_id: str
    impact_latitude: Optional[float] = None
    impact_longitude: Optional[float] = None
    impact_velocity: float
    impact_angle: float = 45.0
    target_type: str = "continental_crust"
    impactor_mass: Optional[float] = None
    impactor_velocity: Optional[float] = None

class SimulationResult(BaseModel):
    crater_diameter: float
    impact_energy: float
    impact_velocity: float
    seismic_magnitude: float
    tsunami_height: float
    affected_population: int
    population_loss: int
    building_loss: float
    total_economic_loss: float
    deflection_success: bool
    new_trajectory: Optional[dict] = None
    impact_trajectory: dict
    impact_coordinates: dict
    tsunami_impact_range: dict
    blast_effects: Optional[dict] = None
    asteroid_diameter: Optional[float] = None
    asteroid_mass: Optional[float] = None

def get_asteroids_from_csv() -> List[Asteroid]:
    """Get asteroid data from CSV file"""
    csv_path = "asteroids.csv"
    asteroids = []

    try:
        df = pd.read_csv(csv_path)

        for _, row in df.iterrows():
            # 创建简化的轨道数据
            orbital_data = {
                "semi_major_axis": 1.5,  # 默认值
                "eccentricity": 0.1,
                "inclination": 0,
                "orbital_period": 365,
                "orbit_class": "AMO"  # 近地小行星
            }

            # 创建简化的接近数据
            close_approach_data = [{
                "close_approach_date": row.get('close_approach_date', '2025-01-01'),
                "relative_velocity": {
                    "kilometers_per_second": str(row.get('relative_velocity_km_per_sec', 10.0))
                },
                "miss_distance": {
                    "kilometers": str(row.get('miss_distance_kilometers', 1000000))
                },
                "orbiting_body": row.get('orbiting_body', 'Earth')
            }]

            asteroid = Asteroid(
                id=str(row['id']),
                name=row['name'],
                diameter_min=row.get('diameter_min_meters', 0),
                diameter_max=row.get('diameter_max_meters', 0),
                is_potentially_hazardous=row.get('is_potentially_hazardous_asteroid', False),
                close_approach_data=close_approach_data,
                orbital_data=orbital_data
            )
            asteroids.append(asteroid)

    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return []

    return asteroids

# Physics calculations using modular classes
class PhysicsEngine:
    """Physics calculations for asteroid impact simulation - 使用模块化计算"""
    
    @staticmethod
    def calculate_impact_energy(mass: float, velocity: float) -> float:
        """Calculate kinetic energy of impact"""
        return ImpactPhysics.impact_energy_joules(mass, velocity)
    
    @staticmethod
    def estimate_mass(diameter: float, density: float = 2600) -> float:
        """Estimate asteroid mass from diameter"""
        return ImpactPhysics.mass_from_diameter(diameter, density)
    
    @staticmethod
    def calculate_crater_diameter(energy: float, target_type: str, 
                                velocity: float = None, diameter: float = None) -> float:
        """Calculate crater diameter using improved scaling laws"""
        if target_type == "ocean":
            # Ocean impacts create larger craters due to water depth
            return ImpactPhysics.final_crater_diameter(diameter or 100, velocity or 20000, 
                                                     density_i=3000, density_t=1000, theta_deg=45)
        else:
            # Continental crust impacts
            return ImpactPhysics.final_crater_diameter(diameter or 100, velocity or 20000, 
                                                     density_i=3000, density_t=2500, theta_deg=45)
    
    @staticmethod
    def calculate_seismic_magnitude(energy: float) -> float:
        """Calculate seismic magnitude from impact energy"""
        # Convert energy to seismic magnitude using empirical relationship
        # Mw = (log10(E) - 4.8) / 1.5 (E in joules)
        return (math.log10(energy) - 4.8) / 1.5
    
    @staticmethod
    def calculate_tsunami_impact_range(energy: float, latitude: float = None, 
                                     longitude: float = None) -> dict:
        """Calculate tsunami impact range and effects"""
        return TsunamiImpact.calculate_tsunami_impact_range(energy, latitude, longitude)
    
    @staticmethod
    def calculate_population_loss(energy: float, affected_population: int, 
                                crater_diameter: float, latitude: float = None, 
                                longitude: float = None) -> int:
        """Calculate population loss from impact"""
        return int(PopulationImpact.calculate_population_loss(
            energy, affected_population, crater_diameter, latitude, longitude
        ))
    
    @staticmethod
    def calculate_building_loss(energy: float, crater_diameter: float, 
                              affected_population: int, latitude: float = None, 
                              longitude: float = None) -> float:
        """Calculate building loss from impact"""
        return EconomicImpact.calculate_building_loss(
            energy, crater_diameter, affected_population, latitude, longitude
        )
    
    @staticmethod
    def calculate_economic_loss(population_loss: int, building_loss: float, 
                              energy: float, crater_diameter: float, 
                              latitude: float = None, longitude: float = None) -> float:
        """Calculate total economic loss from impact"""
        return EconomicImpact.calculate_economic_loss(
            population_loss, building_loss, energy, crater_diameter, latitude, longitude
        )
    
    @staticmethod
    def calculate_blast_effects(energy: float) -> dict:
        """Calculate blast effects"""
        return ImpactPhysics.calculate_blast_effects(energy)
    
    @staticmethod
    def estimate_affected_population(crater_diameter: float, latitude: float = None, 
                                   longitude: float = None) -> int:
        """Estimate affected population based on crater size and location"""
        if latitude is None or longitude is None:
            return 0  # No population if no location specified
        
        # Major cities with their coordinates and population density
        major_cities = [
            (39.9042, 116.4074, 1000, "北京"),  # 北京
            (31.2304, 121.4737, 1000, "上海"),  # 上海
            (35.6762, 139.6503, 1000, "东京"),  # 东京
            (40.7128, -74.0060, 1000, "纽约"),  # 纽约
            (51.5074, -0.1278, 1000, "伦敦"),   # 伦敦
            (48.8566, 2.3522, 800, "巴黎"),     # 巴黎
            (55.7558, 37.6176, 800, "莫斯科"),  # 莫斯科
            (28.6139, 77.2090, 800, "新德里"),  # 新德里
            (-23.5505, -46.6333, 800, "圣保罗"), # 圣保罗
            (-33.8688, 151.2093, 600, "悉尼"),   # 悉尼
        ]
        
        # Check if impact is near a major city
        for city_lat, city_lon, density, city_name in major_cities:
            distance = math.sqrt((latitude - city_lat)**2 + (longitude - city_lon)**2)
            if distance < 0.5:  # Within 0.5 degrees (~50km)
                return int(crater_diameter * density)
        
        # If not near any major city, check for smaller cities or rural areas
        # Only return population if there are actually people in the area
        return 0  # No population in remote areas
    
    @staticmethod
    def calculate_deflection(mass_impactor: float, velocity_impactor: float, 
                           mass_asteroid: float) -> float:
        """Calculate velocity change from kinetic impactor"""
        momentum_impactor = mass_impactor * velocity_impactor
        delta_v = momentum_impactor / mass_asteroid
        return delta_v

# API endpoints
@app.get("/")
async def root():
    return {"message": "Asteroid Impact Simulation API", "version": "2.0.0"}

@app.get("/asteroids")
async def get_asteroids():
    """Get asteroid data from CSV file"""
    print("API: /asteroids endpoint called")
    try:
        asteroids = get_asteroids_from_csv()
        print(f"API: Returning {len(asteroids)} asteroids from CSV")
        if asteroids:
            print(f"API: First asteroid: {asteroids[0].name} (ID: {asteroids[0].id})")
        return asteroids
    except Exception as e:
        print(f"API Error: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.get("/asteroids/{asteroid_id}")
async def get_asteroid(asteroid_id: str):
    """Get specific asteroid data"""
    asteroids = get_asteroids_from_csv()
    asteroid = next((a for a in asteroids if a.id == asteroid_id), None)
    
    if not asteroid:
        raise HTTPException(status_code=404, detail="Asteroid not found")
    
    return asteroid

@app.post("/simulate", response_model=SimulationResult)
async def simulate_impact(simulation: ImpactSimulation):
    """Simulate asteroid impact and deflection"""
    try:
        # Get asteroid data
        asteroids = get_asteroids_from_csv()
        asteroid = next((a for a in asteroids if a.id == simulation.asteroid_id), None)
        
        if not asteroid:
            raise HTTPException(status_code=404, detail="Asteroid not found")
        
        # Calculate average diameter and mass
        avg_diameter = (asteroid.diameter_min + asteroid.diameter_max) / 2
        mass = PhysicsEngine.estimate_mass(avg_diameter)
        
        # Calculate impact energy
        impact_velocity = simulation.impact_velocity
        energy = PhysicsEngine.calculate_impact_energy(mass, impact_velocity)
        
        # Calculate impact effects using improved methods
        print(f"Target type: {simulation.target_type}")
        crater_diameter = PhysicsEngine.calculate_crater_diameter(
            energy, simulation.target_type, 
            velocity=impact_velocity, diameter=avg_diameter
        )
        print(f"Crater diameter: {crater_diameter}")
        seismic_magnitude = PhysicsEngine.calculate_seismic_magnitude(energy)
        
        # Calculate blast effects
        blast_effects = PhysicsEngine.calculate_blast_effects(energy)
        
        # Calculate distance to nearest ocean based on impact location
        distance_to_ocean = 0  # Default to ocean impact
        if simulation.impact_latitude is not None and simulation.impact_longitude is not None:
            # Simplified distance calculation
            distance_to_ocean = 100  # Assume 100km to ocean for land impacts
        
        # Calculate tsunami impact range
        tsunami_data = PhysicsEngine.calculate_tsunami_impact_range(
            energy, simulation.impact_latitude, simulation.impact_longitude
        )
        tsunami_height = tsunami_data['tsunami_height']
        
        # Estimate affected population based on location and crater size
        affected_population = PhysicsEngine.estimate_affected_population(
            crater_diameter, simulation.impact_latitude, simulation.impact_longitude
        )
        
        # Calculate loss predictions
        population_loss = PhysicsEngine.calculate_population_loss(
            energy, affected_population, crater_diameter, 
            simulation.impact_latitude, simulation.impact_longitude
        )
        print(f"DEBUG: population_loss = {population_loss}, type = {type(population_loss)}")
        population_loss = int(population_loss)  # Ensure it's an integer
        print(f"DEBUG: After int() conversion: population_loss = {population_loss}, type = {type(population_loss)}")
        building_loss = PhysicsEngine.calculate_building_loss(
            energy, crater_diameter, affected_population,
            simulation.impact_latitude, simulation.impact_longitude
        )
        total_economic_loss = PhysicsEngine.calculate_economic_loss(
            population_loss, building_loss, energy, crater_diameter,
            simulation.impact_latitude, simulation.impact_longitude
        )
        
        # Calculate impact trajectory
        trajectory = {
            "angle": simulation.impact_angle,
            "velocity": impact_velocity,
            "direction": "vertical"  # Simplified
        }
        
        # Calculate deflection if impactor is provided
        deflection_success = False
        new_trajectory = None
        
        if simulation.impactor_mass and simulation.impactor_velocity:
            delta_v = PhysicsEngine.calculate_deflection(
                simulation.impactor_mass,
                simulation.impactor_velocity,
                mass
            )
            deflection_success = True
            new_trajectory = {
                "delta_v": delta_v,
                "deflection_angle": np.arctan(delta_v / impact_velocity) * 180 / np.pi
            }
        
        return SimulationResult(
            crater_diameter=crater_diameter,
            impact_energy=energy,
            impact_velocity=impact_velocity,
            seismic_magnitude=seismic_magnitude,
            tsunami_height=tsunami_height,
            affected_population=affected_population,
            population_loss=population_loss,
            building_loss=building_loss,
            total_economic_loss=total_economic_loss,
            deflection_success=deflection_success,
            new_trajectory=new_trajectory,
            impact_trajectory=trajectory,
            impact_coordinates={
                "latitude": simulation.impact_latitude,
                "longitude": simulation.impact_longitude,
                "formatted": f"{simulation.impact_latitude:.4f}°N, {simulation.impact_longitude:.4f}°E"
            },
            tsunami_impact_range=tsunami_data,
            blast_effects=blast_effects,
            asteroid_diameter=avg_diameter,
            asteroid_mass=mass
        )
        
    except Exception as e:
        print(f"Simulation error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
