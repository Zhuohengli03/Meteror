"""Physics calculations for impact simulation."""

import numpy as np
from typing import Dict, List, Tuple, Optional
from ..config import PhysicsConstants, UnitConversions
import math


class OrbitalMechanics:
    """Orbital mechanics calculations using Kepler's laws."""
    
    @staticmethod
    def kepler_to_cartesian(
        a: float, e: float, i: float, omega: float, w: float, M: float,
        mu: float = 1.327e20  # Standard gravitational parameter (m³/s²)
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Convert Kepler elements to Cartesian position and velocity.
        
        Args:
            a: Semi-major axis (m)
            e: Eccentricity
            i: Inclination (rad)
            omega: Longitude of ascending node (rad)
            w: Argument of periapsis (rad)
            M: Mean anomaly (rad)
            mu: Standard gravitational parameter (m³/s²)
            
        Returns:
            Tuple of (position, velocity) in Cartesian coordinates (m, m/s)
        """
        # Convert angles to radians
        i = np.radians(i)
        omega = np.radians(omega)
        w = np.radians(w)
        M = np.radians(M)
        
        # Solve Kepler's equation for eccentric anomaly
        E = OrbitalMechanics._solve_kepler_equation(M, e)
        
        # Calculate true anomaly
        nu = 2 * np.arctan2(
            np.sqrt(1 + e) * np.sin(E / 2),
            np.sqrt(1 - e) * np.cos(E / 2)
        )
        
        # Calculate position and velocity in orbital plane
        r = a * (1 - e * np.cos(E))
        x_orb = r * np.cos(nu)
        y_orb = r * np.sin(nu)
        z_orb = 0
        
        # Velocity in orbital plane
        n = np.sqrt(mu / a**3)  # Mean motion
        vx_orb = -a * n * np.sin(E) / (1 - e * np.cos(E))
        vy_orb = a * n * np.sqrt(1 - e**2) * np.cos(E) / (1 - e * np.cos(E))
        vz_orb = 0
        
        # Transform to Cartesian coordinates
        pos_orb = np.array([x_orb, y_orb, z_orb])
        vel_orb = np.array([vx_orb, vy_orb, vz_orb])
        
        # Rotation matrices
        R_omega = np.array([
            [np.cos(omega), -np.sin(omega), 0],
            [np.sin(omega), np.cos(omega), 0],
            [0, 0, 1]
        ])
        
        R_i = np.array([
            [1, 0, 0],
            [0, np.cos(i), -np.sin(i)],
            [0, np.sin(i), np.cos(i)]
        ])
        
        R_w = np.array([
            [np.cos(w), -np.sin(w), 0],
            [np.sin(w), np.cos(w), 0],
            [0, 0, 1]
        ])
        
        # Apply rotations
        R = R_omega @ R_i @ R_w
        pos = R @ pos_orb
        vel = R @ vel_orb
        
        return pos, vel
    
    @staticmethod
    def _solve_kepler_equation(M: float, e: float, max_iterations: int = 100) -> float:
        """Solve Kepler's equation using Newton-Raphson method."""
        E = M  # Initial guess
        
        for _ in range(max_iterations):
            f = E - e * np.sin(E) - M
            f_prime = 1 - e * np.cos(E)
            
            if abs(f) < 1e-10:
                break
                
            E = E - f / f_prime
        
        return E
    
    @staticmethod
    def propagate_orbit(
        pos: np.ndarray, vel: np.ndarray, dt: float,
        mu: float = 1.327e20
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Propagate orbit using simple two-body dynamics.
        
        Args:
            pos: Initial position (m)
            vel: Initial velocity (m/s)
            dt: Time step (s)
            mu: Standard gravitational parameter (m³/s²)
            
        Returns:
            Tuple of (new_position, new_velocity) (m, m/s)
        """
        # Simple Euler integration (for real-time performance)
        r = np.linalg.norm(pos)
        acceleration = -mu * pos / r**3
        
        new_vel = vel + acceleration * dt
        new_pos = pos + new_vel * dt
        
        return new_pos, new_vel


class ImpactPhysics:
    """Impact physics calculations."""
    
    @staticmethod
    def calculate_mass(diameter: float, density: float) -> float:
        """Calculate asteroid mass from diameter and density."""
        radius = diameter / 2
        volume = (4/3) * np.pi * radius**3
        return density * volume
    
    @staticmethod
    def calculate_kinetic_energy(mass: float, velocity: float) -> float:
        """Calculate kinetic energy."""
        return 0.5 * mass * velocity**2
    
    @staticmethod
    def calculate_tnt_equivalent(energy_joules: float) -> float:
        """Convert energy to TNT equivalent in megatons."""
        return energy_joules / PhysicsConstants.TNT_TO_JOULES
    
    @staticmethod
    def calculate_crater_diameter(
        energy_joules: float, 
        impact_angle_deg: float,
        target_density: float = 2500.0,  # kg/m³
        gravity: float = PhysicsConstants.EARTH_GRAVITY_MS2
    ) -> Tuple[float, float, float]:
        """
        Calculate crater diameter using π-scaling.
        
        Returns:
            Tuple of (diameter, depth, rim_height) in meters
        """
        # Convert angle to radians
        angle_rad = np.radians(impact_angle_deg)
        
        # π-scaling formula
        # D = 1.25 * (E / (ρ * g))^(1/4) * sin(θ)^(1/3)
        energy_density = energy_joules / (target_density * gravity)
        diameter = PhysicsConstants.CRATER_DIAMETER_SCALING * (
            energy_density**(1/4) * np.sin(angle_rad)**(1/3)
        )
        
        # Depth is typically 1/5 to 1/3 of diameter
        depth = diameter / 4
        
        # Rim height is typically 1/10 of diameter
        rim_height = diameter / 10
        
        return diameter, depth, rim_height
    
    @staticmethod
    def calculate_seismic_magnitude(energy_joules: float) -> float:
        """Calculate seismic magnitude from impact energy."""
        # Convert to seismic moment (N·m)
        seismic_moment = energy_joules * PhysicsConstants.SEISMIC_EFFICIENCY
        
        # Convert to moment magnitude using correct formula
        # Mw = (2/3) * (log10(M0) - 16.0) + 6.0
        # where M0 is in N·m (dyne-cm / 10^7)
        magnitude = (2/3) * (np.log10(seismic_moment) - 16.0) + 6.0
        
        return magnitude
    
    @staticmethod
    def calculate_mmi_zones(
        magnitude: float, 
        epicenter_lat: float, 
        epicenter_lon: float,
        max_distance_km: float = 1000.0
    ) -> List[Dict]:
        """
        Calculate Modified Mercalli Intensity zones.
        
        Returns:
            List of GeoJSON-like features for MMI zones
        """
        # Distance-attenuation relationship for MMI
        # MMI = a - b * log10(distance) - c * distance
        # Simplified model based on empirical relationships
        
        distances = np.linspace(1, max_distance_km, 20)  # km
        mmi_values = []
        
        for dist in distances:
            # Simplified attenuation model
            mmi = magnitude - 1.5 * np.log10(dist) - 0.01 * dist
            mmi = max(1, min(12, mmi))  # Clamp to valid MMI range
            mmi_values.append(mmi)
        
        # Create circular zones
        zones = []
        for i, (dist, mmi) in enumerate(zip(distances, mmi_values)):
            if i == 0:
                continue
                
            # Create circular polygon
            center_lat = epicenter_lat
            center_lon = epicenter_lon
            
            # Convert km to degrees (approximate)
            lat_offset = dist / 111.0  # 1 degree ≈ 111 km
            lon_offset = dist / (111.0 * np.cos(np.radians(center_lat)))
            
            # Create circle coordinates
            angles = np.linspace(0, 2*np.pi, 32)
            circle_lats = center_lat + lat_offset * np.cos(angles)
            circle_lons = center_lon + lon_offset * np.sin(angles)
            
            # Create GeoJSON-like feature
            zone = {
                "type": "Feature",
                "properties": {
                    "mmi": int(mmi),
                    "distance_km": dist,
                    "color": ImpactPhysics._get_mmi_color(int(mmi))
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lon, lat] for lon, lat in zip(circle_lons, circle_lats)
                    ]]
                }
            }
            zones.append(zone)
        
        return zones
    
    @staticmethod
    def _get_mmi_color(mmi: int) -> str:
        """Get color for MMI value."""
        from ..config import ColorPalettes
        return ColorPalettes.MMI_COLORS.get(mmi, "#000000")


class TsunamiPhysics:
    """Tsunami physics calculations."""
    
    @staticmethod
    def calculate_tsunami_height(
        impact_energy: float,
        water_depth: float,
        distance_to_shore: float,
        shore_slope: float = 0.01
    ) -> float:
        """
        Calculate maximum tsunami height at shore.
        
        Args:
            impact_energy: Impact energy in joules
            water_depth: Water depth at impact site (m)
            distance_to_shore: Distance to nearest shore (m)
            shore_slope: Shore slope (dimensionless)
            
        Returns:
            Maximum tsunami height at shore (m)
        """
        # Energy efficiency for tsunami generation
        tsunami_energy = impact_energy * PhysicsConstants.TSUNAMI_EFFICIENCY
        
        # Initial wave height (simplified)
        # Based on energy per unit area
        impact_area = np.pi * (1000)**2  # Assume 1km radius impact area
        energy_density = tsunami_energy / impact_area
        
        # Initial wave height (very simplified)
        initial_height = 0.1 * np.sqrt(energy_density / (1000 * 9.81))  # 1000 kg/m³ water density
        
        # Distance attenuation
        # Tsunami height decreases with distance due to geometric spreading
        # and energy dissipation
        if distance_to_shore > 0:
            # Geometric spreading factor
            geometric_factor = 1 / np.sqrt(distance_to_shore / 1000)  # km
            
            # Energy dissipation factor
            dissipation_factor = np.exp(-distance_to_shore / (100 * 1000))  # 100km scale
            
            # Shore amplification (shoaling effect)
            shore_amplification = 1 / np.sqrt(shore_slope)
            
            final_height = initial_height * geometric_factor * dissipation_factor * shore_amplification
        else:
            final_height = initial_height
        
        return max(0, final_height)
    
    @staticmethod
    def calculate_tsunami_zones(
        epicenter_lat: float,
        epicenter_lon: float,
        max_height: float,
        max_distance_km: float = 500.0
    ) -> List[Dict]:
        """
        Calculate tsunami inundation zones.
        
        Returns:
            List of GeoJSON-like features for tsunami zones
        """
        # Height categories
        height_categories = [
            (max_height * 0.8, "extreme"),
            (max_height * 0.6, "high"),
            (max_height * 0.4, "moderate"),
            (max_height * 0.2, "low")
        ]
        
        zones = []
        for height, category in height_categories:
            if height <= 0:
                continue
                
            # Distance based on height (simplified)
            # Higher waves travel further inland
            distance_km = height * 100  # Very simplified relationship
            distance_km = min(distance_km, max_distance_km)
            
            # Create circular zone
            lat_offset = distance_km / 111.0
            lon_offset = distance_km / (111.0 * np.cos(np.radians(epicenter_lat)))
            
            angles = np.linspace(0, 2*np.pi, 32)
            circle_lats = epicenter_lat + lat_offset * np.cos(angles)
            circle_lons = epicenter_lon + lon_offset * np.sin(angles)
            
            zone = {
                "type": "Feature",
                "properties": {
                    "height_m": height,
                    "category": category,
                    "distance_km": distance_km,
                    "color": TsunamiPhysics._get_tsunami_color(category)
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lon, lat] for lon, lat in zip(circle_lons, circle_lats)
                    ]]
                }
            }
            zones.append(zone)
        
        return zones
    
    @staticmethod
    def _get_tsunami_color(category: str) -> str:
        """Get color for tsunami category."""
        from ..config import ColorPalettes
        return ColorPalettes.TSUNAMI_COLORS.get(category, "#0066CC")


class DeflectionPhysics:
    """Deflection physics calculations."""
    
    @staticmethod
    def calculate_kinetic_impactor_delta_v(
        impactor_mass: float,
        impactor_velocity: float,
        asteroid_mass: float,
        impact_angle_deg: float
    ) -> float:
        """
        Calculate delta-v from kinetic impactor.
        
        Args:
            impactor_mass: Impactor mass (kg)
            impactor_velocity: Impactor velocity (m/s)
            asteroid_mass: Asteroid mass (kg)
            impact_angle_deg: Impact angle (degrees)
            
        Returns:
            Delta-v in m/s
        """
        # Convert angle to radians
        angle_rad = np.radians(impact_angle_deg)
        
        # Momentum transfer efficiency
        efficiency = PhysicsConstants.DEFLECTION_EFFICIENCY
        
        # Delta-v calculation
        # Δv = (m_impactor * v_impactor * cos(θ) * efficiency) / m_asteroid
        delta_v = (
            impactor_mass * impactor_velocity * np.cos(angle_rad) * efficiency
        ) / asteroid_mass
        
        return delta_v
    
    @staticmethod
    def apply_deflection(
        initial_pos: np.ndarray,
        initial_vel: np.ndarray,
        delta_v: np.ndarray,
        time_before_impact: float
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Apply deflection delta-v to asteroid trajectory.
        
        Args:
            initial_pos: Initial position (m)
            initial_vel: Initial velocity (m/s)
            delta_v: Delta-v vector (m/s)
            time_before_impact: Time before impact (s)
            
        Returns:
            Tuple of (new_position, new_velocity) (m, m/s)
        """
        # Apply delta-v to velocity
        new_vel = initial_vel + delta_v
        
        # Propagate trajectory forward
        new_pos = initial_pos + new_vel * time_before_impact
        
        return new_pos, new_vel
    
    @staticmethod
    def calculate_miss_distance(
        asteroid_pos: np.ndarray,
        asteroid_vel: np.ndarray,
        earth_pos: np.ndarray = np.array([0, 0, 0]),
        earth_radius: float = PhysicsConstants.EARTH_RADIUS_KM * 1000
    ) -> float:
        """
        Calculate minimum miss distance to Earth.
        
        Args:
            asteroid_pos: Asteroid position (m)
            asteroid_vel: Asteroid velocity (m/s)
            earth_pos: Earth position (m)
            earth_radius: Earth radius (m)
            
        Returns:
            Miss distance in meters
        """
        # Vector from Earth to asteroid
        r = asteroid_pos - earth_pos
        
        # Distance to Earth center
        distance = np.linalg.norm(r)
        
        # Miss distance (distance - Earth radius)
        miss_distance = distance - earth_radius
        
        return miss_distance


class PopulationExposure:
    """Population exposure calculations."""
    
    @staticmethod
    def calculate_exposed_population(
        impact_lat: float,
        impact_lon: float,
        mmi_zones: List[Dict],
        tsunami_zones: List[Dict],
        population_density: Optional[np.ndarray] = None
    ) -> Dict[str, int]:
        """
        Calculate population exposure to impact effects.
        
        Args:
            impact_lat: Impact latitude
            impact_lon: Impact longitude
            mmi_zones: MMI zones
            tsunami_zones: Tsunami zones
            population_density: Population density grid (optional)
            
        Returns:
            Dictionary with exposure statistics
        """
        # Simplified population exposure calculation
        # In a real implementation, this would use actual population density data
        
        total_exposed = 0
        mmi_exposed = 0
        tsunami_exposed = 0
        
        # Calculate exposure for each MMI zone
        for zone in mmi_zones:
            mmi = zone['properties']['mmi']
            distance = zone['properties']['distance_km']
            
            # Simplified population density model
            # Higher MMI = higher population density in affected area
            if mmi >= 6:  # Significant damage threshold
                # Assume population density decreases with distance
                density = 1000 * np.exp(-distance / 50)  # people/km²
                area = np.pi * distance**2  # km²
                exposed = int(density * area)
                mmi_exposed += exposed
        
        # Calculate exposure for tsunami zones
        for zone in tsunami_zones:
            height = zone['properties']['height_m']
            distance = zone['properties']['distance_km']
            
            if height > 1:  # Significant tsunami height
                # Coastal population density
                density = 2000 * np.exp(-distance / 20)  # people/km²
                area = np.pi * distance**2  # km²
                exposed = int(density * area)
                tsunami_exposed += exposed
        
        total_exposed = max(mmi_exposed, tsunami_exposed)  # Take maximum
        
        return {
            "total_exposed": total_exposed,
            "mmi_exposed": mmi_exposed,
            "tsunami_exposed": tsunami_exposed,
            "affected_cities": PopulationExposure._get_affected_cities(
                impact_lat, impact_lon, total_exposed
            )
        }
    
    @staticmethod
    def _get_affected_cities(
        impact_lat: float, 
        impact_lon: float, 
        exposed_population: int
    ) -> List[Dict]:
        """Get list of affected cities (simplified)."""
        # Major cities database (simplified)
        major_cities = [
            {"name": "New York", "lat": 40.7128, "lon": -74.0060, "population": 8336817},
            {"name": "London", "lat": 51.5074, "lon": -0.1278, "population": 8982000},
            {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503, "population": 13929286},
            {"name": "Beijing", "lat": 39.9042, "lon": 116.4074, "population": 21540000},
            {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777, "population": 12478447},
        ]
        
        affected = []
        for city in major_cities:
            # Calculate distance
            distance = np.sqrt(
                (impact_lat - city["lat"])**2 + (impact_lon - city["lon"])**2
            ) * 111  # Convert to km
            
            # If within 200km, consider affected
            if distance < 200:
                affected.append({
                    "name": city["name"],
                    "distance_km": distance,
                    "population": city["population"],
                    "exposure_level": "high" if distance < 50 else "moderate"
                })
        
        return affected
