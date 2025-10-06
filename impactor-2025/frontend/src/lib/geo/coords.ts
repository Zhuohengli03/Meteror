import * as THREE from 'three';

// Normalize longitude into [-180, 180]
export function normalizeLongitude(lon: number): number {
  let x = ((lon + 180) % 360 + 360) % 360 - 180;
  return x === -180 ? 180 : x;
}

// Clamp latitude into [-90, 90]
export function clampLatitude(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

// Lat/Lon (deg) to unit sphere Cartesian (Three.js Y-up)
export function latLonToCartesian(latDeg: number, lonDeg: number): THREE.Vector3 {
  const lat = (clampLatitude(latDeg) * Math.PI) / 180;
  const lon = (normalizeLongitude(lonDeg) * Math.PI) / 180;
  const x = Math.cos(lat) * Math.sin(lon);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.cos(lon);
  return new THREE.Vector3(x, y, z);
}

// Cartesian -> Lat/Lon (deg). Optionally supply earthRotationY (radians) for inverse-compensation
export function cartesianToLatLon(vec: THREE.Vector3, earthRotationY: number = 0): { lat: number; lon: number } {
  const x = vec.x;
  const y = vec.y;
  const z = vec.z;
  // undo rotation around Y if provided
  const cos = Math.cos(-earthRotationY);
  const sin = Math.sin(-earthRotationY);
  const rx = x * cos - z * sin;
  const rz = x * sin + z * cos;
  const lat = Math.asin(y) * (180 / Math.PI);
  const lon = Math.atan2(rx, rz) * (180 / Math.PI);
  return { lat: clampLatitude(lat), lon: normalizeLongitude(lon) };
}


