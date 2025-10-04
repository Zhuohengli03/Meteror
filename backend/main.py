from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
import sqlite3
import json
import numpy as np
from datetime import datetime, timedelta
import os

app = FastAPI(title="Asteroid Impact Simulation API", version="1.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = "asteroid_data.db"

def init_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables for caching asteroid data
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS asteroids (
            id TEXT PRIMARY KEY,
            name TEXT,
            diameter_min REAL,
            diameter_max REAL,
            velocity REAL,
            close_approach_date TEXT,
            miss_distance REAL,
            orbital_data TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS simulations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asteroid_id TEXT,
            impact_velocity REAL,
            impact_angle REAL,
            crater_diameter REAL,
            impact_energy REAL,
            seismic_magnitude REAL,
            tsunami_height REAL,
            affected_population INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (asteroid_id) REFERENCES asteroids (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Pydantic models
class AsteroidData(BaseModel):
    id: str
    name: str
    diameter_min: float
    diameter_max: float
    velocity: float
    close_approach_date: str
    miss_distance: float
    orbital_data: dict

class ImpactSimulation(BaseModel):
    asteroid_id: str
    impact_velocity: float
    impact_angle: float = 45.0  # degrees from horizontal
    impactor_mass: Optional[float] = None
    impactor_velocity: Optional[float] = None
    lead_time_days: Optional[int] = None

class SimulationResult(BaseModel):
    crater_diameter: float
    impact_energy: float
    seismic_magnitude: float
    tsunami_height: float
    affected_population: int
    deflection_success: bool
    new_trajectory: Optional[dict] = None

# NASA NEO API integration
class NASAAPI:
    def __init__(self):
        # Import API key from API.py file
        try:
            import sys
            import os
            sys.path.append(os.path.dirname(__file__))
            from API import sparams
            self.api_key = sparams["api_key"]
        except ImportError:
            # Fallback to hardcoded key if API.py not found
            self.api_key = "CLePa8TOYYjIoOJZ1VyN42dQ6rvp9ZscdJJCBp5k"
        
        self.base_url = "https://api.nasa.gov/neo/rest/v1"
    
    def get_asteroids(self, start_date: str, end_date: str) -> List[dict]:
        """Fetch asteroids from NASA NEO API - use browse endpoint directly"""
        # Use browse endpoint directly to avoid rate limits
        return self.get_asteroids_browse()
    
    def get_asteroids_browse(self) -> List[dict]:
        """Fetch asteroids using the browse endpoint as fallback"""
        url = f"{self.base_url}/neo/browse"
        params = {
            "api_key": self.api_key,
            "size": 20  # Limit to 20 asteroids for demo
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            asteroids = []
            if "near_earth_objects" in data:
                for neo in data["near_earth_objects"]:
                    # Get diameter data safely
                    diameter_data = neo.get("estimated_diameter", {})
                    meters_data = diameter_data.get("meters", {})
                    
                    # Create mock close approach data for browse results
                    asteroid = {
                        "id": neo["id"],
                        "name": neo["name"],
                        "diameter_min": meters_data.get("estimated_diameter_min", 0),
                        "diameter_max": meters_data.get("estimated_diameter_max", 0),
                        "velocity": 20000,  # Default velocity in m/s
                        "close_approach_date": "2024-01-01",  # Default date
                        "miss_distance": 1000000,  # Default miss distance in meters
                        "orbital_data": neo.get("orbital_data", {})
                    }
                    asteroids.append(asteroid)
            
            return asteroids
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch asteroid data from browse: {str(e)}")

# Physics calculations
class PhysicsEngine:
    @staticmethod
    def calculate_impact_energy(mass: float, velocity: float) -> float:
        """Calculate kinetic energy of impact"""
        return 0.5 * mass * velocity**2
    
    @staticmethod
    def estimate_mass(diameter: float, density: float = 2600) -> float:
        """Estimate asteroid mass from diameter (assuming spherical)"""
        radius = diameter / 2
        volume = (4/3) * np.pi * radius**3
        return volume * density
    
    @staticmethod
    def calculate_crater_diameter(energy: float, density: float = 2600) -> float:
        """Calculate crater diameter using simplified scaling law"""
        # Simplified scaling law: D = k * E^(1/3.4)
        k = 1.2e-3  # Empirical constant
        return k * (energy**(1/3.4))
    
    @staticmethod
    def calculate_seismic_magnitude(energy: float) -> float:
        """Calculate seismic magnitude from impact energy"""
        # Convert energy to TNT equivalent and use Gutenberg-Richter relation
        tnt_equivalent = energy / (4.184e9)  # Joules to tons TNT
        return 0.67 * np.log10(tnt_equivalent) + 4.0
    
    @staticmethod
    def calculate_tsunami_height(energy: float, water_depth: float = 1000) -> float:
        """Calculate tsunami height from impact energy"""
        # Simplified tsunami height calculation
        tnt_equivalent = energy / (4.184e9)
        return 0.1 * (tnt_equivalent**(1/3)) * (1000/water_depth)**(1/4)
    
    @staticmethod
    def calculate_deflection(impactor_mass: float, impactor_velocity: float, 
                           asteroid_mass: float, beta: float = 1.0) -> float:
        """Calculate velocity change from kinetic impactor"""
        return (impactor_mass * impactor_velocity * beta) / asteroid_mass

# Database operations
def cache_asteroid_data(asteroid: AsteroidData):
    """Cache asteroid data in SQLite"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO asteroids 
        (id, name, diameter_min, diameter_max, velocity, close_approach_date, miss_distance, orbital_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        asteroid.id, asteroid.name, asteroid.diameter_min, asteroid.diameter_max,
        asteroid.velocity, asteroid.close_approach_date, asteroid.miss_distance,
        json.dumps(asteroid.orbital_data)
    ))
    
    conn.commit()
    conn.close()

def get_cached_asteroids() -> List[AsteroidData]:
    """Retrieve cached asteroid data"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM asteroids ORDER BY close_approach_date')
    rows = cursor.fetchall()
    
    asteroids = []
    for row in rows:
        asteroid = AsteroidData(
            id=row[0],
            name=row[1],
            diameter_min=row[2],
            diameter_max=row[3],
            velocity=row[4],
            close_approach_date=row[5],
            miss_distance=row[6],
            orbital_data=json.loads(row[7])
        )
        asteroids.append(asteroid)
    
    conn.close()
    return asteroids

# API endpoints
@app.on_event("startup")
async def startup_event():
    init_database()

@app.get("/")
async def root():
    return {"message": "Asteroid Impact Simulation API"}

@app.get("/asteroids")
async def get_asteroids():
    """Get cached asteroid data"""
    return get_cached_asteroids()

@app.post("/asteroids/fetch")
async def fetch_asteroids():
    """Fetch fresh asteroid data from NASA API"""
    nasa_api = NASAAPI()
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    asteroids_data = nasa_api.get_asteroids(start_date, end_date)
    
    # Cache the data
    for asteroid_data in asteroids_data:
        asteroid = AsteroidData(**asteroid_data)
        cache_asteroid_data(asteroid)
    
    return {"message": f"Fetched and cached {len(asteroids_data)} asteroids"}

@app.post("/simulate", response_model=SimulationResult)
async def simulate_impact(simulation: ImpactSimulation):
    """Simulate asteroid impact and deflection"""
    # Get asteroid data
    asteroids = get_cached_asteroids()
    asteroid = next((a for a in asteroids if a.id == simulation.asteroid_id), None)
    
    if not asteroid:
        raise HTTPException(status_code=404, detail="Asteroid not found")
    
    # Calculate average diameter and mass
    avg_diameter = (asteroid.diameter_min + asteroid.diameter_max) / 2
    mass = PhysicsEngine.estimate_mass(avg_diameter)
    
    # Calculate impact energy
    impact_velocity = simulation.impact_velocity
    energy = PhysicsEngine.calculate_impact_energy(mass, impact_velocity)
    
    # Calculate impact effects
    crater_diameter = PhysicsEngine.calculate_crater_diameter(energy)
    seismic_magnitude = PhysicsEngine.calculate_seismic_magnitude(energy)
    tsunami_height = PhysicsEngine.calculate_tsunami_height(energy)
    
    # Estimate affected population (simplified)
    affected_population = int(crater_diameter * 1000)  # Rough estimate
    
    # Calculate deflection if impactor is provided
    deflection_success = False
    new_trajectory = None
    
    if simulation.impactor_mass and simulation.impactor_velocity:
        delta_v = PhysicsEngine.calculate_deflection(
            simulation.impactor_mass,
            simulation.impactor_velocity,
            mass
        )
        
        # Simple deflection success criteria
        if delta_v > 0.1:  # 0.1 m/s minimum deflection
            deflection_success = True
            new_trajectory = {
                "delta_v": delta_v,
                "deflection_angle": np.arctan(delta_v / impact_velocity) * 180 / np.pi
            }
    
    return SimulationResult(
        crater_diameter=crater_diameter,
        impact_energy=energy,
        seismic_magnitude=seismic_magnitude,
        tsunami_height=tsunami_height,
        affected_population=affected_population,
        deflection_success=deflection_success,
        new_trajectory=new_trajectory
    )

@app.get("/asteroids/{asteroid_id}")
async def get_asteroid(asteroid_id: str):
    """Get specific asteroid data"""
    asteroids = get_cached_asteroids()
    asteroid = next((a for a in asteroids if a.id == asteroid_id), None)
    
    if not asteroid:
        raise HTTPException(status_code=404, detail="Asteroid not found")
    
    return asteroid

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
