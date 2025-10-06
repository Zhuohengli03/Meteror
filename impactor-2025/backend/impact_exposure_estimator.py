#!/usr/bin/env python3
"""
Asteroid Impact Exposure Estimator

Estimates population and building exposure in a given impact radius based on city coordinates.
Uses GeoNames API, OpenStreetMap, and optional WorldPop/SRTM data.

Author: Impactor-2025 Team
Date: 2025-10-05
"""

import requests
import json
import math
import time
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import numpy as np
from pathlib import Path

try:
    import folium
    from folium import plugins
    FOLIUM_AVAILABLE = True
except ImportError:
    FOLIUM_AVAILABLE = False
    print("Warning: folium not installed. Map visualization will be disabled.")

try:
    import matplotlib.pyplot as plt
    from matplotlib.patches import Circle
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False
    print("Warning: matplotlib not installed. Plot visualization will be disabled.")


@dataclass
class ImpactZone:
    """Impact zone configuration"""
    name: str
    radius_km: float
    damage_percent: float
    color: str


@dataclass
class CityInfo:
    """City information from GeoNames"""
    name: str
    latitude: float
    longitude: float
    population: int
    country: str
    admin1: str = ""


@dataclass
class ExposureResult:
    """Exposure estimation result"""
    city: CityInfo
    impact_radius_km: float
    estimated_population: int
    building_count: int
    building_density: float  # buildings per km²
    damage_zones: List[Dict]
    buildings_by_type: Dict[str, int]


class ImpactExposureEstimator:
    """Main class for impact exposure estimation"""
    
    def __init__(self, geonames_username: str = "demo"):
        """
        Initialize the estimator.
        
        Args:
            geonames_username: GeoNames API username (register at geonames.org)
        """
        self.geonames_username = geonames_username
        self.overpass_url = "https://overpass-api.de/api/interpreter"
        
    def get_city_coordinates(self, city_name: str) -> Optional[CityInfo]:
        """
        Get city coordinates from GeoNames API.
        
        Args:
            city_name: Name of the city
            
        Returns:
            CityInfo object or None if not found
        """
        print(f"🔍 Searching for city: {city_name}")
        
        url = "http://api.geonames.org/searchJSON"
        params = {
            "q": city_name,
            "maxRows": 1,
            "username": self.geonames_username,
            "featureClass": "P",  # Populated places
            "style": "FULL"
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if "geonames" in data and len(data["geonames"]) > 0:
                city = data["geonames"][0]
                city_info = CityInfo(
                    name=city.get("name", city_name),
                    latitude=float(city.get("lat", 0)),
                    longitude=float(city.get("lng", 0)),
                    population=int(city.get("population", 0)),
                    country=city.get("countryName", ""),
                    admin1=city.get("adminName1", "")
                )
                print(f"✅ Found: {city_info.name}, {city_info.country}")
                print(f"   Coordinates: ({city_info.latitude:.4f}, {city_info.longitude:.4f})")
                print(f"   Population: {city_info.population:,}")
                return city_info
            else:
                print(f"❌ City not found: {city_name}")
                return None
                
        except Exception as e:
            print(f"❌ Error fetching city data: {e}")
            return None
    
    def calculate_impact_radius(self, 
                                diameter_m: float, 
                                velocity_km_s: float,
                                angle_deg: float = 45) -> float:
        """
        Calculate impact crater radius based on asteroid parameters.
        
        Uses simplified π-scaling law.
        
        Args:
            diameter_m: Asteroid diameter in meters
            velocity_km_s: Impact velocity in km/s
            angle_deg: Impact angle in degrees
            
        Returns:
            Crater radius in kilometers
        """
        # Asteroid properties
        density = 3000  # kg/m³ (stony asteroid)
        radius_m = diameter_m / 2
        volume = (4/3) * math.pi * (radius_m ** 3)
        mass_kg = volume * density
        
        # Impact energy (joules)
        velocity_m_s = velocity_km_s * 1000
        energy_j = 0.5 * mass_kg * (velocity_m_s ** 2)
        
        # Crater diameter using π-scaling
        # D = 1.161 * (E^0.29) * (sin(θ))^0.33
        angle_rad = math.radians(angle_deg)
        crater_diameter_m = 1.161 * (energy_j ** 0.29) * (math.sin(angle_rad) ** 0.33)
        
        crater_radius_km = crater_diameter_m / 2000
        
        print(f"\n💥 Impact Parameters:")
        print(f"   Asteroid diameter: {diameter_m}m")
        print(f"   Impact velocity: {velocity_km_s} km/s")
        print(f"   Impact angle: {angle_deg}°")
        print(f"   Impact energy: {energy_j/4.184e15:.2f} megatons TNT")
        print(f"   Crater radius: {crater_radius_km:.2f} km")
        
        return crater_radius_km
    
    def query_osm_buildings(self, 
                           latitude: float, 
                           longitude: float, 
                           radius_km: float) -> Dict:
        """
        Query OpenStreetMap buildings using Overpass API.
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_km: Search radius in kilometers
            
        Returns:
            Dictionary with building data
        """
        print(f"\n🏢 Querying buildings within {radius_km:.2f} km...")
        
        radius_m = radius_km * 1000
        
        # Overpass QL query
        query = f"""
        [out:json][timeout:60];
        (
          way["building"](around:{radius_m},{latitude},{longitude});
          relation["building"](around:{radius_m},{latitude},{longitude});
        );
        out center;
        """
        
        try:
            response = requests.post(
                self.overpass_url,
                data={"data": query},
                timeout=90
            )
            response.raise_for_status()
            data = response.json()
            
            buildings = data.get("elements", [])
            
            # Count buildings by type
            building_types = {}
            for building in buildings:
                tags = building.get("tags", {})
                building_type = tags.get("building", "yes")
                building_types[building_type] = building_types.get(building_type, 0) + 1
            
            # Calculate building density
            area_km2 = math.pi * (radius_km ** 2)
            density = len(buildings) / area_km2 if area_km2 > 0 else 0
            
            print(f"✅ Found {len(buildings):,} buildings")
            print(f"   Building density: {density:.1f} buildings/km²")
            print(f"   Top building types:")
            for btype, count in sorted(building_types.items(), 
                                      key=lambda x: x[1], 
                                      reverse=True)[:5]:
                print(f"      {btype}: {count:,}")
            
            return {
                "count": len(buildings),
                "density": density,
                "by_type": building_types,
                "buildings": buildings
            }
            
        except requests.exceptions.Timeout:
            print("⚠️  Overpass API timeout. Try a smaller radius.")
            return {"count": 0, "density": 0, "by_type": {}, "buildings": []}
        except Exception as e:
            print(f"❌ Error querying buildings: {e}")
            return {"count": 0, "density": 0, "by_type": {}, "buildings": []}
    
    def estimate_population_simple(self,
                                   city_population: int,
                                   city_area_km2: float,
                                   impact_radius_km: float) -> int:
        """
        Simple population estimation based on uniform density.
        
        Args:
            city_population: Total city population
            city_area_km2: City area in km²
            impact_radius_km: Impact radius in km
            
        Returns:
            Estimated population in impact zone
        """
        # Assume uniform population density
        density = city_population / city_area_km2 if city_area_km2 > 0 else 0
        impact_area_km2 = math.pi * (impact_radius_km ** 2)
        estimated_pop = int(density * impact_area_km2)
        
        # Cap at city population
        estimated_pop = min(estimated_pop, city_population)
        
        return estimated_pop
    
    def calculate_damage_zones(self, 
                               crater_radius_km: float) -> List[ImpactZone]:
        """
        Calculate multi-ring damage zones.
        
        Args:
            crater_radius_km: Crater radius in km
            
        Returns:
            List of ImpactZone objects
        """
        zones = [
            ImpactZone("Total Destruction", crater_radius_km, 100, "#8B0000"),
            ImpactZone("Severe Damage", crater_radius_km * 3, 75, "#FF0000"),
            ImpactZone("Moderate Damage", crater_radius_km * 6, 50, "#FF8C00"),
            ImpactZone("Light Damage", crater_radius_km * 10, 25, "#FFD700"),
            ImpactZone("Minimal Damage", crater_radius_km * 15, 10, "#FFFFE0"),
        ]
        return zones
    
    def run_analysis(self,
                    city_name: str,
                    asteroid_diameter_m: float = 160,
                    impact_velocity_km_s: float = 15,
                    impact_angle_deg: float = 45,
                    custom_radius_km: Optional[float] = None) -> Optional[ExposureResult]:
        """
        Run complete exposure analysis.
        
        Args:
            city_name: Name of the city
            asteroid_diameter_m: Asteroid diameter in meters
            impact_velocity_km_s: Impact velocity in km/s
            impact_angle_deg: Impact angle in degrees
            custom_radius_km: Custom impact radius (overrides calculation)
            
        Returns:
            ExposureResult object or None if analysis fails
        """
        print("=" * 70)
        print("🌍 ASTEROID IMPACT EXPOSURE ESTIMATOR")
        print("=" * 70)
        
        # Step 1: Get city coordinates
        city_info = self.get_city_coordinates(city_name)
        if not city_info:
            return None
        
        # Step 2: Calculate impact radius
        if custom_radius_km:
            impact_radius_km = custom_radius_km
            print(f"\n💥 Using custom impact radius: {impact_radius_km:.2f} km")
        else:
            impact_radius_km = self.calculate_impact_radius(
                asteroid_diameter_m,
                impact_velocity_km_s,
                impact_angle_deg
            )
        
        # Step 3: Calculate damage zones
        damage_zones = self.calculate_damage_zones(impact_radius_km)
        
        # Step 4: Query buildings
        building_data = self.query_osm_buildings(
            city_info.latitude,
            city_info.longitude,
            impact_radius_km
        )
        
        # Step 5: Estimate population (simplified)
        # Assume city area is roughly proportional to population
        estimated_city_area_km2 = math.sqrt(city_info.population / 1000) * 10
        estimated_population = self.estimate_population_simple(
            city_info.population,
            estimated_city_area_km2,
            impact_radius_km
        )
        
        print(f"\n👥 Population Estimate:")
        print(f"   Exposed population: {estimated_population:,}")
        print(f"   (Based on uniform density assumption)")
        
        # Create result
        result = ExposureResult(
            city=city_info,
            impact_radius_km=impact_radius_km,
            estimated_population=estimated_population,
            building_count=building_data["count"],
            building_density=building_data["density"],
            damage_zones=[
                {
                    "name": zone.name,
                    "radius_km": zone.radius_km,
                    "damage_percent": zone.damage_percent,
                    "color": zone.color
                }
                for zone in damage_zones
            ],
            buildings_by_type=building_data["by_type"]
        )
        
        return result
    
    def visualize_folium(self, result: ExposureResult, output_file: str = "impact_map.html"):
        """
        Create interactive map visualization using folium.
        
        Args:
            result: ExposureResult object
            output_file: Output HTML file path
        """
        if not FOLIUM_AVAILABLE:
            print("⚠️  Folium not available. Skipping map visualization.")
            return
        
        print(f"\n🗺️  Creating interactive map...")
        
        # Create map centered on city
        m = folium.Map(
            location=[result.city.latitude, result.city.longitude],
            zoom_start=11,
            tiles="OpenStreetMap"
        )
        
        # Add impact point marker
        folium.Marker(
            [result.city.latitude, result.city.longitude],
            popup=f"<b>Impact Point</b><br>{result.city.name}",
            tooltip="Impact Point",
            icon=folium.Icon(color="red", icon="warning-sign")
        ).add_to(m)
        
        # Add damage zones
        for zone in result.damage_zones:
            folium.Circle(
                location=[result.city.latitude, result.city.longitude],
                radius=zone["radius_km"] * 1000,  # Convert to meters
                popup=f"<b>{zone['name']}</b><br>"
                      f"Radius: {zone['radius_km']:.2f} km<br>"
                      f"Damage: {zone['damage_percent']}%",
                tooltip=zone["name"],
                color=zone["color"],
                fill=True,
                fillColor=zone["color"],
                fillOpacity=0.2,
                weight=2
            ).add_to(m)
        
        # Add legend
        legend_html = f"""
        <div style="position: fixed; 
                    bottom: 50px; right: 50px; width: 250px; height: auto;
                    background-color: white; z-index:9999; font-size:14px;
                    border:2px solid grey; border-radius: 5px; padding: 10px">
        <h4 style="margin-top:0">{result.city.name} Impact Analysis</h4>
        <p><b>Exposed Population:</b> {result.estimated_population:,}</p>
        <p><b>Buildings:</b> {result.building_count:,}</p>
        <p><b>Building Density:</b> {result.building_density:.1f}/km²</p>
        <hr>
        <p style="font-size:12px"><b>Damage Zones:</b></p>
        """
        
        for zone in result.damage_zones:
            legend_html += f"""
            <p style="margin:5px 0; font-size:11px">
                <span style="background-color:{zone['color']}; 
                             padding:2px 8px; border-radius:3px; color:white">
                    {zone['damage_percent']}%
                </span>
                {zone['name']} ({zone['radius_km']:.1f} km)
            </p>
            """
        
        legend_html += "</div>"
        m.get_root().html.add_child(folium.Element(legend_html))
        
        # Save map
        m.save(output_file)
        print(f"✅ Map saved to: {output_file}")
    
    def visualize_matplotlib(self, result: ExposureResult, output_file: str = "impact_plot.png"):
        """
        Create static plot visualization using matplotlib.
        
        Args:
            result: ExposureResult object
            output_file: Output PNG file path
        """
        if not MATPLOTLIB_AVAILABLE:
            print("⚠️  Matplotlib not available. Skipping plot visualization.")
            return
        
        print(f"\n📊 Creating static plot...")
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
        
        # Left plot: Damage zones
        ax1.set_aspect('equal')
        ax1.set_title(f"Impact Zones - {result.city.name}", fontsize=16, fontweight='bold')
        ax1.set_xlabel("Distance (km)", fontsize=12)
        ax1.set_ylabel("Distance (km)", fontsize=12)
        
        # Plot damage zones
        for zone in reversed(result.damage_zones):
            circle = Circle(
                (0, 0),
                zone["radius_km"],
                color=zone["color"],
                alpha=0.4,
                label=f"{zone['name']} ({zone['damage_percent']}%)"
            )
            ax1.add_patch(circle)
        
        # Impact point
        ax1.plot(0, 0, 'r*', markersize=20, label='Impact Point')
        
        max_radius = result.damage_zones[-1]["radius_km"]
        ax1.set_xlim(-max_radius * 1.1, max_radius * 1.1)
        ax1.set_ylim(-max_radius * 1.1, max_radius * 1.1)
        ax1.grid(True, alpha=0.3)
        ax1.legend(loc='upper right', fontsize=10)
        
        # Right plot: Statistics
        ax2.axis('off')
        
        stats_text = f"""
        IMPACT EXPOSURE ANALYSIS
        {'=' * 40}
        
        Location: {result.city.name}, {result.city.country}
        Coordinates: ({result.city.latitude:.4f}, {result.city.longitude:.4f})
        City Population: {result.city.population:,}
        
        IMPACT PARAMETERS
        {'=' * 40}
        Impact Radius: {result.impact_radius_km:.2f} km
        Impact Area: {math.pi * result.impact_radius_km**2:.2f} km²
        
        EXPOSURE ESTIMATES
        {'=' * 40}
        Exposed Population: {result.estimated_population:,}
        Affected Buildings: {result.building_count:,}
        Building Density: {result.building_density:.1f} buildings/km²
        
        DAMAGE ZONES
        {'=' * 40}
        """
        
        for zone in result.damage_zones:
            stats_text += f"\n{zone['name']}:\n"
            stats_text += f"  Radius: {zone['radius_km']:.2f} km\n"
            stats_text += f"  Damage: {zone['damage_percent']}%\n"
        
        if result.buildings_by_type:
            stats_text += f"\nTOP BUILDING TYPES\n{'=' * 40}\n"
            for btype, count in sorted(result.buildings_by_type.items(), 
                                      key=lambda x: x[1], 
                                      reverse=True)[:5]:
                stats_text += f"{btype}: {count:,}\n"
        
        ax2.text(0.1, 0.95, stats_text, 
                transform=ax2.transAxes,
                fontsize=10,
                verticalalignment='top',
                fontfamily='monospace',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3))
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=150, bbox_inches='tight')
        print(f"✅ Plot saved to: {output_file}")
        plt.close()


def main():
    """Main function with example usage"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Asteroid Impact Exposure Estimator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Analyze Toronto with default asteroid
  python impact_exposure_estimator.py Toronto
  
  # Analyze New York with custom asteroid
  python impact_exposure_estimator.py "New York" --diameter 500 --velocity 20
  
  # Use custom impact radius
  python impact_exposure_estimator.py Beijing --radius 10
  
  # Specify GeoNames username
  python impact_exposure_estimator.py London --username your_username
        """
    )
    
    parser.add_argument("city", help="City name to analyze")
    parser.add_argument("--diameter", type=float, default=160,
                       help="Asteroid diameter in meters (default: 160)")
    parser.add_argument("--velocity", type=float, default=15,
                       help="Impact velocity in km/s (default: 15)")
    parser.add_argument("--angle", type=float, default=45,
                       help="Impact angle in degrees (default: 45)")
    parser.add_argument("--radius", type=float, default=None,
                       help="Custom impact radius in km (overrides calculation)")
    parser.add_argument("--username", type=str, default="demo",
                       help="GeoNames API username (default: demo)")
    parser.add_argument("--no-map", action="store_true",
                       help="Skip map generation")
    parser.add_argument("--no-plot", action="store_true",
                       help="Skip plot generation")
    parser.add_argument("--output-dir", type=str, default=".",
                       help="Output directory for visualizations")
    
    args = parser.parse_args()
    
    # Create estimator
    estimator = ImpactExposureEstimator(geonames_username=args.username)
    
    # Run analysis
    result = estimator.run_analysis(
        city_name=args.city,
        asteroid_diameter_m=args.diameter,
        impact_velocity_km_s=args.velocity,
        impact_angle_deg=args.angle,
        custom_radius_km=args.radius
    )
    
    if result:
        # Print summary
        print("\n" + "=" * 70)
        print("📋 SUMMARY")
        print("=" * 70)
        print(f"City: {result.city.name}, {result.city.country}")
        print(f"Impact Radius: {result.impact_radius_km:.2f} km")
        print(f"Exposed Population: {result.estimated_population:,}")
        print(f"Affected Buildings: {result.building_count:,}")
        print(f"Building Density: {result.building_density:.1f} buildings/km²")
        
        # Create output directory
        output_dir = Path(args.output_dir)
        output_dir.mkdir(exist_ok=True)
        
        # Generate visualizations
        if not args.no_map:
            map_file = output_dir / f"impact_map_{result.city.name.replace(' ', '_')}.html"
            estimator.visualize_folium(result, str(map_file))
        
        if not args.no_plot:
            plot_file = output_dir / f"impact_plot_{result.city.name.replace(' ', '_')}.png"
            estimator.visualize_matplotlib(result, str(plot_file))
        
        print("\n✅ Analysis complete!")
    else:
        print("\n❌ Analysis failed!")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
