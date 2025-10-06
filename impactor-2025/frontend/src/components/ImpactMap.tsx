/**
 * 2D Impact map component using Leaflet
 */

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSimulationStore } from '../lib/store/simulation';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ImpactMapProps {
  width?: number;
  height?: number;
  className?: string;
}

function MapUpdater() {
  const map = useMap();
  const { mapCenter, mapZoom } = useSimulationStore();

  useEffect(() => {
    map.setView(mapCenter, mapZoom);
  }, [map, mapCenter, mapZoom]);

  return null;
}

function MapClickHandler() {
  const { setScenario, currentScenario } = useSimulationStore();
  const map = useMap();

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      console.log('=== 2D MAP CLICK DEBUG ===');
      console.log('2D Map clicked at:', lat, lng);
      console.log('2D Map - Leaflet coordinates:', e.latlng);
      console.log('============================');
      
      if (currentScenario) {
        // Update the current scenario with new impact coordinates
        setScenario({
          ...currentScenario,
          impactLatitude: lat,
          impactLongitude: lng
        });
      }
    };

    // Add click event listener to the map
    map.on('click', handleMapClick);
    
    // Cleanup
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, setScenario, currentScenario]);

  return null;
}

function ImpactMarker() {
  const { currentScenario } = useSimulationStore();

  if (!currentScenario) return null;

  const { impactLatitude, impactLongitude } = currentScenario;

  // Create a custom impact marker icon
  const impactIcon = L.divIcon({
    className: 'impact-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #FF0000;
        border: 3px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">💥</div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  return (
    <Marker
      position={[impactLatitude, impactLongitude]}
      icon={impactIcon}
    >
      <Popup>
        <div>
          <h3>撞击落点</h3>
          <p>纬度: {impactLatitude.toFixed(4)}°</p>
          <p>经度: {impactLongitude.toFixed(4)}°</p>
          <p><em>点击地图其他位置可更改落点</em></p>
        </div>
      </Popup>
    </Marker>
  );
}

function ImpactZones() {
  const { baselineResults, currentScenario, showImpactZones } = useSimulationStore();

  if (!showImpactZones || !baselineResults || !currentScenario) return null;

  const { impactLatitude, impactLongitude } = currentScenario;
  // Normalize backend field names and provide safe fallbacks
  const craterDiameterM = (baselineResults as any).crater_diameter_m ?? (baselineResults as any).craterDiameter ?? 0;
  const craterDepthM = (baselineResults as any).crater_depth_m ?? (baselineResults as any).craterDepth ?? 0;
  const mmiZones = (baselineResults as any).mmi_zones ?? (baselineResults as any).mmiZones ?? [];
  const tsunamiZones = (baselineResults as any).tsunami_zones ?? (baselineResults as any).tsunamiZones ?? [];

  return (
    <>
      {/* Crater zone */}
      <Circle
        center={[impactLatitude, impactLongitude]}
        radius={Math.max(1, craterDiameterM / 2)} // Leaflet expects meters; use radius = diameter/2, min 1m
        pathOptions={{
          color: '#FF0000',
          fillColor: '#FF0000',
          fillOpacity: 0.3,
          weight: 2
        }}
      >
        <Popup>
          <div>
            <h3>Impact Crater</h3>
            <p>Diameter: {(craterDiameterM / 1000).toFixed(1)} km</p>
            <p>Depth: {(craterDepthM / 1000).toFixed(1)} km</p>
          </div>
        </Popup>
      </Circle>

      {/* MMI zones */}
      {Array.isArray(mmiZones) && mmiZones.map((zone: any, index: number) => (
        <Circle
          key={`mmi-${index}`}
          center={[impactLatitude, impactLongitude]}
          radius={Math.max(1, (zone.distance ?? 0) * 1000)} // if backend provides km, convert to meters
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.2,
            weight: 1
          }}
        >
          <Popup>
            <div>
              <h3>MMI Zone {zone.mmi}</h3>
              <p>Distance: {(zone.distance ?? 0).toFixed?.(1) || Number(zone.distance || 0).toFixed(1)} km</p>
              <p>Intensity: {zone.mmi}</p>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Tsunami zones */}
      {Array.isArray(tsunamiZones) && tsunamiZones.map((zone: any, index: number) => (
        <Circle
          key={`tsunami-${index}`}
          center={[impactLatitude, impactLongitude]}
          radius={Math.max(1, (zone.distance ?? 0) * 1000)}
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.15,
            weight: 1
          }}
        >
          <Popup>
            <div>
              <h3>Tsunami Zone - {zone.category}</h3>
              <p>Height: {(zone.height ?? 0).toFixed?.(1) || Number(zone.height || 0).toFixed(1)} m</p>
              <p>Distance: {(zone.distance ?? 0).toFixed?.(1) || Number(zone.distance || 0).toFixed(1)} km</p>
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  );
}

// All 50 cities in the fallback database
const ALL_CITIES = [
  // North America
  { name: "New York", country: "USA", latitude: 40.7128, longitude: -74.0060, population: 8336817 },
  { name: "Los Angeles", country: "USA", latitude: 34.0522, longitude: -118.2437, population: 3971883 },
  { name: "Chicago", country: "USA", latitude: 41.8781, longitude: -87.6298, population: 2693976 },
  { name: "Houston", country: "USA", latitude: 29.7604, longitude: -95.3698, population: 2320268 },
  { name: "Phoenix", country: "USA", latitude: 33.4484, longitude: -112.0740, population: 1680992 },
  { name: "Philadelphia", country: "USA", latitude: 39.9526, longitude: -75.1652, population: 1584064 },
  { name: "San Antonio", country: "USA", latitude: 29.4241, longitude: -98.4936, population: 1547253 },
  { name: "San Diego", country: "USA", latitude: 32.7157, longitude: -117.1611, population: 1423851 },
  { name: "Dallas", country: "USA", latitude: 32.7767, longitude: -96.7970, population: 1343573 },
  { name: "San Jose", country: "USA", latitude: 37.3382, longitude: -121.8863, population: 1021795 },
  { name: "Toronto", country: "Canada", latitude: 43.6532, longitude: -79.3832, population: 2930000 },
  { name: "Montreal", country: "Canada", latitude: 45.5017, longitude: -73.5673, population: 1780000 },
  { name: "Vancouver", country: "Canada", latitude: 49.2827, longitude: -123.1207, population: 675218 },
  { name: "Mexico City", country: "Mexico", latitude: 19.4326, longitude: -99.1332, population: 9209944 },
  { name: "Guadalajara", country: "Mexico", latitude: 20.6597, longitude: -103.3496, population: 1495189 },
  
  // Europe
  { name: "London", country: "UK", latitude: 51.5074, longitude: -0.1278, population: 8982000 },
  { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522, population: 2161000 },
  { name: "Berlin", country: "Germany", latitude: 52.5200, longitude: 13.4050, population: 3769000 },
  { name: "Madrid", country: "Spain", latitude: 40.4168, longitude: -3.7038, population: 3223000 },
  { name: "Rome", country: "Italy", latitude: 41.9028, longitude: 12.4964, population: 2873000 },
  { name: "Moscow", country: "Russia", latitude: 55.7558, longitude: 37.6176, population: 12615000 },
  { name: "Barcelona", country: "Spain", latitude: 41.3851, longitude: 2.1734, population: 1620000 },
  { name: "Munich", country: "Germany", latitude: 48.1351, longitude: 11.5820, population: 1472000 },
  { name: "Milan", country: "Italy", latitude: 45.4642, longitude: 9.1900, population: 1372000 },
  
  // Asia
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, population: 13929286 },
  { name: "Shanghai", country: "China", latitude: 31.2304, longitude: 121.4737, population: 24870895 },
  { name: "Beijing", country: "China", latitude: 39.9042, longitude: 116.4074, population: 21540000 },
  { name: "Mumbai", country: "India", latitude: 19.0760, longitude: 72.8777, population: 12478447 },
  { name: "Delhi", country: "India", latitude: 28.7041, longitude: 77.1025, population: 32941000 },
  { name: "Seoul", country: "South Korea", latitude: 37.5665, longitude: 126.9780, population: 9720846 },
  { name: "Bangkok", country: "Thailand", latitude: 13.7563, longitude: 100.5018, population: 10539000 },
  { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, population: 5685807 },
  { name: "Hong Kong", country: "China", latitude: 22.3193, longitude: 114.1694, population: 7496981 },
  { name: "Guangzhou", country: "China", latitude: 23.1291, longitude: 113.2644, population: 14043500 },
  { name: "Shenzhen", country: "China", latitude: 22.5431, longitude: 114.0579, population: 12356820 },
  
  // Africa
  { name: "Cairo", country: "Egypt", latitude: 30.0444, longitude: 31.2357, population: 20484965 },
  { name: "Lagos", country: "Nigeria", latitude: 6.5244, longitude: 3.3792, population: 15388000 },
  { name: "Johannesburg", country: "South Africa", latitude: -26.2041, longitude: 28.0473, population: 5634800 },
  { name: "Nairobi", country: "Kenya", latitude: -1.2921, longitude: 36.8219, population: 4397073 },
  { name: "Kinshasa", country: "DR Congo", latitude: -4.4419, longitude: 15.2663, population: 14342000 },
  
  // South America
  { name: "São Paulo", country: "Brazil", latitude: -23.5505, longitude: -46.6333, population: 12325232 },
  { name: "Buenos Aires", country: "Argentina", latitude: -34.6118, longitude: -58.3960, population: 3075646 },
  { name: "Lima", country: "Peru", latitude: -12.0464, longitude: -77.0428, population: 10750000 },
  { name: "Bogotá", country: "Colombia", latitude: 4.7110, longitude: -74.0721, population: 10700000 },
  { name: "Rio de Janeiro", country: "Brazil", latitude: -22.9068, longitude: -43.1729, population: 6748000 },
  
  // Oceania
  { name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093, population: 5312163 },
  { name: "Melbourne", country: "Australia", latitude: -37.8136, longitude: 144.9631, population: 5078193 },
  { name: "Brisbane", country: "Australia", latitude: -27.4698, longitude: 153.0251, population: 2514184 },
  { name: "Perth", country: "Australia", latitude: -31.9505, longitude: 115.8605, population: 2085973 },
  { name: "Auckland", country: "New Zealand", latitude: -36.8485, longitude: 174.7633, population: 1657200 },
];

function AllCitiesMarkers() {
  const { baselineResults } = useSimulationStore();

  // Only show all cities when there's no simulation result
  if (baselineResults) return null;

  return (
    <>
      {ALL_CITIES.map((city, index) => (
        <Circle
          key={`city-all-${index}`}
          center={[city.latitude, city.longitude]}
          radius={15000} // 15 km marker circle
          pathOptions={{
            color: '#4A90E2',
            fillColor: '#4A90E2',
            fillOpacity: 0.3,
            weight: 1
          }}
        >
          <Popup>
            <div>
              <h3>{city.name}</h3>
              <p>Country: {city.country}</p>
              <p>Population: {city.population.toLocaleString()}</p>
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  );
}

function AffectedCities() {
  const { baselineResults } = useSimulationStore();

  if (!baselineResults) return null;

  const affectedCities = (baselineResults as any).affected_cities ?? (baselineResults as any).affectedCities ?? [];
  if (!Array.isArray(affectedCities) || affectedCities.length === 0) return null;

  return (
    <>
      {affectedCities
        .filter((city: any) => typeof city.latitude === 'number' && typeof city.longitude === 'number')
        .map((city: any, index: number) => (
          <Circle
            key={`city-${index}`}
            center={[city.latitude, city.longitude]}
            radius={20000} // 20 km marker circle
            pathOptions={{
              color: '#FF6B6B',
              fillColor: '#FF6B6B',
              fillOpacity: 0.5,
              weight: 2
            }}
          >
            <Popup>
              <div>
                <h3>{city.name}</h3>
                {typeof (city.distance_from_impact || city.distance) === 'number' && (
                  <p>Distance: {(city.distance_from_impact || city.distance).toFixed(1)} km</p>
                )}
                {typeof city.population === 'number' && (
                  <p>Population: {city.population.toLocaleString()}</p>
                )}
                {(city.exposure_level || city.exposureLevel) && (
                  <p>Exposure: {city.exposure_level || city.exposureLevel}</p>
                )}
              </div>
            </Popup>
          </Circle>
        ))}
    </>
  );
}

function DeflectionComparison() {
  const { deflectionResults, currentScenario } = useSimulationStore();

  if (!deflectionResults || !currentScenario) return null;

  const { newImpactLatitude, newImpactLongitude } = deflectionResults;

  if (!newImpactLatitude || !newImpactLongitude) return null;

  return (
    <>
      {/* Original impact location */}
      <Circle
        center={[currentScenario.impactLatitude, currentScenario.impactLongitude]}
        radius={10}
        pathOptions={{
          color: '#FF0000',
          fillColor: '#FF0000',
          fillOpacity: 0.8,
          weight: 3
        }}
      >
        <Popup>
          <div>
            <h3>Original Impact</h3>
            <p>Lat: {currentScenario.impactLatitude.toFixed(4)}°</p>
            <p>Lon: {currentScenario.impactLongitude.toFixed(4)}°</p>
          </div>
        </Popup>
      </Circle>

      {/* New impact location */}
      <Circle
        center={[newImpactLatitude, newImpactLongitude]}
        radius={10}
        pathOptions={{
          color: '#00FF00',
          fillColor: '#00FF00',
          fillOpacity: 0.8,
          weight: 3
        }}
      >
        <Popup>
          <div>
            <h3>Deflected Impact</h3>
            <p>Lat: {newImpactLatitude.toFixed(4)}°</p>
            <p>Lon: {newImpactLongitude.toFixed(4)}°</p>
            <p>Miss Distance: {deflectionResults.missDistance.toFixed(1)} km</p>
          </div>
        </Popup>
      </Circle>

      {/* Deflection arrow */}
      <Circle
        center={[
          (currentScenario.impactLatitude + newImpactLatitude) / 2,
          (currentScenario.impactLongitude + newImpactLongitude) / 2
        ]}
        radius={5}
        pathOptions={{
          color: '#0000FF',
          fillColor: '#0000FF',
          fillOpacity: 0.6,
          weight: 2
        }}
      >
        <Popup>
          <div>
            <h3>Deflection Vector</h3>
            <p>Angle: {deflectionResults.deflectionAngle.toFixed(2)}°</p>
            <p>Efficiency: {(deflectionResults.strategyEfficiency * 100).toFixed(1)}%</p>
          </div>
        </Popup>
      </Circle>
    </>
  );
}

export default function ImpactMap({ width = 600, height = 400, className }: ImpactMapProps) {
  const { currentScenario, mapCenter, mapZoom } = useSimulationStore() as any;
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div 
        className={`impact-map ${className || ''}`} 
        style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div>Loading map...</div>
      </div>
    );
  }

  const center: [number, number] = currentScenario 
    ? [currentScenario.impactLatitude, currentScenario.impactLongitude]
    : mapCenter;

  return (
    <div className={`impact-map ${className || ''}`} style={{ width, height, position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        minZoom={1}
        maxZoom={8}
      >
        <MapUpdater />
        <MapClickHandler />
        {/* Base layer: Satellite imagery only */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution=''
          maxZoom={18}
          noWrap={true}
          bounds={[[-85, -180], [85, 180]]}
        />
        
        {/* Impact marker - always visible */}
        <ImpactMarker />
        
        {/* All 50 cities markers (only shown when no simulation) */}
        <AllCitiesMarkers />
        
        {/* Impact zones */}
        <ImpactZones />
        
        {/* Affected cities (replaces city markers when simulation runs) */}
        <AffectedCities />
        
        {/* Deflection comparison */}
        <DeflectionComparison />
      </MapContainer>
    </div>
  );
}
