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
            close_approach_data TEXT,
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
    close_approach_data: List[dict] = []  # 保存完整的接近数据

class ImpactSimulation(BaseModel):
    asteroid_id: str
    impact_velocity: float
    impact_angle: float = 45.0  # degrees from horizontal
    impactor_mass: Optional[float] = None
    impactor_velocity: Optional[float] = None
    lead_time_days: Optional[int] = None
    # 撞击地点信息
    impact_latitude: Optional[float] = None
    impact_longitude: Optional[float] = None
    target_type: str = "continental_crust"  # continental_crust, oceanic_crust, ice_sheet

class SimulationResult(BaseModel):
    crater_diameter: float
    impact_energy: float
    impact_velocity: float  # 撞击速度 (m/s)
    seismic_magnitude: float
    tsunami_height: float
    affected_population: int
    deflection_success: bool
    new_trajectory: Optional[dict] = None
    # 新增损失预测
    population_loss: int
    building_loss: float  # 亿美元
    total_economic_loss: float  # 亿美元

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
        """Fetch asteroids using the browse endpoint - get multiple pages"""
        all_asteroids = []
        
        # 获取前5页的小行星数据 (5 * 20 = 100个小行星)
        for page in range(5):
            url = f"{self.base_url}/neo/browse"
            params = {
                "api_key": self.api_key,
                "page": page,
                "size": 20  # NASA API限制每页最多20个
            }
            
            try:
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if "near_earth_objects" in data:
                    for neo in data["near_earth_objects"]:
                        # Get diameter data safely
                        diameter_data = neo.get("estimated_diameter", {})
                        meters_data = diameter_data.get("meters", {})
                        
                        # 使用真实的close_approach_data
                        close_approach_data = neo.get("close_approach_data", [])
                        
                        # 优先使用最近的接近数据计算速度
                        avg_velocity = 20000  # 默认速度
                        if close_approach_data:
                            # 按日期排序，优先使用最近的接近数据
                            sorted_approaches = sorted(close_approach_data, 
                                                     key=lambda x: x.get("close_approach_date", ""), 
                                                     reverse=True)
                            
                            # 优先使用2020年后的数据，如果没有则使用最近的10条
                            recent_approaches = [cad for cad in sorted_approaches 
                                               if cad.get("close_approach_date", "") >= "2020-01-01"]
                            
                            if recent_approaches:
                                # 使用2020年后的数据
                                velocities = []
                                for cad in recent_approaches[:10]:  # 最多取10条
                                    try:
                                        vel_str = cad.get("relative_velocity", {}).get("kilometers_per_second", "0")
                                        vel = float(vel_str)
                                        if vel > 0:
                                            velocities.append(vel * 1000)  # 转换为m/s
                                    except (ValueError, TypeError):
                                        continue
                                
                                if velocities:
                                    avg_velocity = sum(velocities) / len(velocities)
                            else:
                                # 如果没有2020年后的数据，使用最近的10条
                                velocities = []
                                for cad in sorted_approaches[:10]:
                                    try:
                                        vel_str = cad.get("relative_velocity", {}).get("kilometers_per_second", "0")
                                        vel = float(vel_str)
                                        if vel > 0:
                                            velocities.append(vel * 1000)  # 转换为m/s
                                    except (ValueError, TypeError):
                                        continue
                                
                                if velocities:
                                    avg_velocity = sum(velocities) / len(velocities)
                        
                        # 获取最近的接近数据
                        latest_approach = close_approach_data[0] if close_approach_data else {}
                        latest_date = latest_approach.get("close_approach_date", "2024-01-01")
                        latest_miss_distance = 1000000
                        if latest_approach.get("miss_distance", {}).get("kilometers"):
                            latest_miss_distance = float(latest_approach["miss_distance"]["kilometers"]) * 1000
                        
                        asteroid = {
                            "id": neo["id"],
                            "name": neo["name"],
                            "diameter_min": meters_data.get("estimated_diameter_min", 0),
                            "diameter_max": meters_data.get("estimated_diameter_max", 0),
                            "velocity": avg_velocity,
                            "close_approach_date": latest_date,
                            "miss_distance": latest_miss_distance,
                            "orbital_data": neo.get("orbital_data", {}),
                            "close_approach_data": close_approach_data
                        }
                        all_asteroids.append(asteroid)
                
                print(f"获取第{page+1}页，共{len(all_asteroids)}个小行星")
                
            except Exception as e:
                print(f"Error fetching page {page}: {e}")
                break
        
        return all_asteroids

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
    def calculate_crater_diameter(energy: float, target_type: str = "continental_crust", density: float = 2600) -> float:
        """Calculate crater diameter using simplified scaling law and target type"""
        # Simplified scaling law: D = k * E^(1/3.4)
        k = 1.2e-3  # Empirical constant
        base_diameter = k * (energy**(1/3.4))
        
        # Adjust based on target type
        if target_type == "oceanic_crust":
            # Ocean impacts create larger craters due to water vaporization
            return base_diameter * 1.2
        elif target_type == "ice_sheet":
            # Ice impacts create smaller craters due to ice properties
            return base_diameter * 0.8
        else:  # continental_crust
            return base_diameter
    
    @staticmethod
    def calculate_seismic_magnitude(energy: float) -> float:
        """Calculate seismic magnitude from impact energy"""
        # Convert energy to TNT equivalent and use Gutenberg-Richter relation
        tnt_equivalent = energy / (4.184e9)  # Joules to tons TNT
        return 0.67 * np.log10(tnt_equivalent) + 4.0
    
    @staticmethod
    def calculate_tsunami_height(energy: float, water_depth: float = 1000, 
                                distance_to_ocean: float = 0) -> float:
        """Calculate tsunami height from impact energy
        
        Args:
            energy: Impact energy in Joules
            water_depth: Ocean depth in meters (default 1000m)
            distance_to_ocean: Distance to nearest ocean in km (0 if ocean impact)
        """
        # Convert energy to TNT equivalent
        tnt_equivalent = energy / (4.184e9)  # Joules to tons TNT
        
        # Base tsunami height calculation
        base_height = 0.1 * (tnt_equivalent**(1/3)) * (1000/water_depth)**(1/4)
        
        # Distance attenuation factor for land impacts
        if distance_to_ocean > 0:
            # Land impact: tsunami height decreases with distance to ocean
            # Seismic waves and atmospheric shock waves can still reach oceans
            attenuation_factor = 1.0 / (1.0 + distance_to_ocean / 100.0)  # Exponential decay
            base_height *= attenuation_factor
            
            # Add seismic-induced tsunami component
            seismic_component = 0.05 * (tnt_equivalent**(1/3)) * attenuation_factor
            base_height += seismic_component
        
        return max(base_height, 0)  # Ensure non-negative
    
    @staticmethod
    def calculate_deflection(impactor_mass: float, impactor_velocity: float, 
                           asteroid_mass: float, beta: float = 1.0) -> float:
        """Calculate velocity change from kinetic impactor"""
        return (impactor_mass * impactor_velocity * beta) / asteroid_mass
    
    @staticmethod
    def calculate_population_loss(impact_energy: float, affected_population: int, 
                                crater_diameter: float) -> int:
        """Calculate population loss based on impact energy and affected population"""
        # 基于冲击能量和影响人口计算人口损失
        tnt_equivalent = impact_energy / (4.184e9)  # 转换为TNT当量
        
        # 死亡率模型：基于冲击能量和距离
        if tnt_equivalent < 1e6:  # < 1百万吨TNT
            mortality_rate = 0.01  # 1%
        elif tnt_equivalent < 1e7:  # < 10百万吨TNT
            mortality_rate = 0.05  # 5%
        elif tnt_equivalent < 1e8:  # < 100百万吨TNT
            mortality_rate = 0.15  # 15%
        elif tnt_equivalent < 1e9:  # < 1000百万吨TNT
            mortality_rate = 0.35  # 35%
        else:  # > 1000百万吨TNT
            mortality_rate = 0.60  # 60%
        
        # 考虑陨石坑直径的影响（直接影响区域）
        crater_area = np.pi * (crater_diameter / 2) ** 2
        crater_population = min(affected_population * 0.1, crater_area * 100)  # 假设每平方公里100人
        
        # 总人口损失 = 陨石坑区域100%死亡 + 其他区域按死亡率计算
        total_loss = int(crater_population + (affected_population - crater_population) * mortality_rate)
        
        return min(total_loss, affected_population)  # 不超过总影响人口
    
    @staticmethod
    def calculate_building_loss(impact_energy: float, crater_diameter: float, 
                              affected_population: int) -> float:
        """Calculate building loss in billions USD"""
        tnt_equivalent = impact_energy / (4.184e9)
        
        # 建筑损失模型
        # 陨石坑区域：完全摧毁
        crater_area = np.pi * (crater_diameter / 2) ** 2
        crater_loss = crater_area * 0.5  # 每平方公里5000万美元
        
        # 冲击波区域：部分摧毁
        blast_radius = crater_diameter * 5  # 冲击波半径是陨石坑直径的5倍
        blast_area = np.pi * blast_radius ** 2 - crater_area
        blast_loss = blast_area * 0.1  # 每平方公里1000万美元
        
        # 地震区域：轻微损坏
        seismic_radius = crater_diameter * 20  # 地震影响半径
        seismic_area = np.pi * seismic_radius ** 2 - np.pi * blast_radius ** 2
        seismic_loss = seismic_area * 0.01  # 每平方公里100万美元
        
        # 基于人口密度的调整
        population_density = affected_population / (np.pi * seismic_radius ** 2) if seismic_radius > 0 else 0
        density_factor = min(1.0 + population_density / 1000, 3.0)  # 人口密度越高，损失越大
        
        total_building_loss = (crater_loss + blast_loss + seismic_loss) * density_factor
        
        return total_building_loss / 100  # 转换为亿美元
    
    @staticmethod
    def calculate_economic_loss(population_loss: int, building_loss: float, 
                              impact_energy: float) -> float:
        """Calculate total economic loss in billions USD"""
        tnt_equivalent = impact_energy / (4.184e9)
        
        # 直接经济损失
        direct_loss = building_loss
        
        # 间接经济损失（基于人口损失）
        # 每个人口的平均经济价值（包括生产力损失、医疗费用等）
        economic_value_per_person = 0.5  # 每人50万美元
        indirect_loss = population_loss * economic_value_per_person / 100  # 转换为亿美元
        
        # 基础设施损失
        infrastructure_loss = direct_loss * 0.3  # 基础设施损失是建筑损失的30%
        
        # 长期经济影响（GDP损失）
        gdp_loss_factor = min(tnt_equivalent / 1e6, 10.0)  # 基于TNT当量
        gdp_loss = (direct_loss + indirect_loss) * gdp_loss_factor * 0.1  # GDP损失系数
        
        # 总经济损失
        total_loss = direct_loss + indirect_loss + infrastructure_loss + gdp_loss
        
        return total_loss
    
    @staticmethod
    def calculate_distance_to_ocean(latitude: float, longitude: float) -> float:
        """Calculate approximate distance to nearest ocean in km"""
        # Simplified ocean distance calculation
        # This is a rough approximation based on continental vs oceanic regions
        
        # Major continental regions (roughly)
        continental_regions = [
            # North America
            (30, 70, -170, -50),
            # Europe
            (35, 70, -10, 40),
            # Asia
            (10, 70, 40, 180),
            # Africa
            (-35, 35, -20, 55),
            # South America
            (-55, 15, -85, -30),
            # Australia
            (-45, -10, 110, 155)
        ]
        
        # Check if point is in continental region
        for min_lat, max_lat, min_lon, max_lon in continental_regions:
            if min_lat <= latitude <= max_lat and min_lon <= longitude <= max_lon:
                # Estimate distance to coast based on position within continent
                # This is very simplified - in reality would use detailed coastline data
                lat_center = (min_lat + max_lat) / 2
                lon_center = (min_lon + max_lon) / 2
                
                # Distance from center (rough approximation)
                lat_dist = abs(latitude - lat_center)
                lon_dist = abs(longitude - lon_center)
                
                # Convert to km (rough approximation)
                distance_km = ((lat_dist * 111)**2 + (lon_dist * 111 * np.cos(np.radians(latitude)))**2)**0.5
                
                # Return distance to nearest coast (simplified)
                return min(distance_km, 1000)  # Cap at 1000km
        
        # If not in continental region, assume ocean impact
        return 0
    
    @staticmethod
    def estimate_affected_population(crater_diameter: float, latitude: Optional[float] = None, 
                                   longitude: Optional[float] = None) -> int:
        """Estimate affected population based on crater size and location"""
        # Base population density by region (people per km²)
        if latitude is None or longitude is None:
            # Default global average
            base_density = 50  # people per km²
        else:
            # Regional population density estimates
            if 30 <= latitude <= 70 and -170 <= longitude <= -50:  # North America
                base_density = 25
            elif 35 <= latitude <= 70 and -10 <= longitude <= 40:  # Europe
                base_density = 100
            elif 10 <= latitude <= 70 and 40 <= longitude <= 180:  # Asia
                base_density = 150
            elif -35 <= latitude <= 35 and -20 <= longitude <= 55:  # Africa
                base_density = 40
            elif -55 <= latitude <= 15 and -85 <= longitude <= -30:  # South America
                base_density = 25
            elif -45 <= latitude <= -10 and 110 <= longitude <= 155:  # Australia
                base_density = 3
            else:  # Ocean or other regions
                base_density = 1
        
        # Calculate affected area (crater radius * 20 for impact zone)
        impact_radius = crater_diameter * 10  # Impact zone radius in meters
        impact_area_km2 = np.pi * (impact_radius / 1000) ** 2
        
        # Estimate population
        affected_population = int(impact_area_km2 * base_density)
        
        return max(affected_population, 1000)  # Minimum 1000 people affected

# Database operations
def cache_asteroid_data(asteroid: AsteroidData):
    """Cache asteroid data in SQLite"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO asteroids 
        (id, name, diameter_min, diameter_max, velocity, close_approach_date, miss_distance, orbital_data, close_approach_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        asteroid.id, asteroid.name, asteroid.diameter_min, asteroid.diameter_max,
        asteroid.velocity, asteroid.close_approach_date, asteroid.miss_distance,
        json.dumps(asteroid.orbital_data), json.dumps(asteroid.close_approach_data)
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
            orbital_data=json.loads(row[7]),
            close_approach_data=json.loads(row[8]) if len(row) > 8 and row[8] else []
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
    
    # Calculate impact effects based on target type
    print(f"Target type: {simulation.target_type}")
    crater_diameter = PhysicsEngine.calculate_crater_diameter(energy, simulation.target_type)
    print(f"Crater diameter: {crater_diameter}")
    seismic_magnitude = PhysicsEngine.calculate_seismic_magnitude(energy)
    
    # Calculate distance to nearest ocean based on impact location
    distance_to_ocean = 0  # Default to ocean impact
    if simulation.impact_latitude is not None and simulation.impact_longitude is not None:
        distance_to_ocean = PhysicsEngine.calculate_distance_to_ocean(
            simulation.impact_latitude, simulation.impact_longitude
        )
    
    tsunami_height = PhysicsEngine.calculate_tsunami_height(energy, distance_to_ocean=distance_to_ocean)
    
    # Estimate affected population based on location and crater size
    affected_population = PhysicsEngine.estimate_affected_population(
        crater_diameter, simulation.impact_latitude, simulation.impact_longitude
    )
    
    # Calculate loss predictions
    population_loss = PhysicsEngine.calculate_population_loss(energy, affected_population, crater_diameter)
    building_loss = PhysicsEngine.calculate_building_loss(energy, crater_diameter, affected_population)
    total_economic_loss = PhysicsEngine.calculate_economic_loss(population_loss, building_loss, energy)
    
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
        impact_velocity=impact_velocity,
        seismic_magnitude=seismic_magnitude,
        tsunami_height=tsunami_height,
        affected_population=affected_population,
        deflection_success=deflection_success,
        new_trajectory=new_trajectory,
        population_loss=population_loss,
        building_loss=building_loss,
        total_economic_loss=total_economic_loss
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
