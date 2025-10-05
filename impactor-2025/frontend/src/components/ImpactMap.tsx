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
        
        {/* Impact zones */}
        <ImpactZones />
        
        {/* Affected cities */}
        <AffectedCities />
        
        {/* Deflection comparison */}
        <DeflectionComparison />
      </MapContainer>
    </div>
  );
}
