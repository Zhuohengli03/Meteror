/**
 * Impact physics calculations
 * Based on scientific models for asteroid impact effects
 */

export interface AsteroidProperties {
  diameter: number; // meters
  density: number; // kg/m³
  mass: number; // kg
}

export interface ImpactParameters {
  velocity: number; // m/s
  angle: number; // degrees
  targetType: 'continental_crust' | 'oceanic_crust' | 'ocean';
}

export interface ImpactResults {
  energy: number; // joules
  tntEquivalent: number; // megatons
  craterDiameter: number; // meters
  craterDepth: number; // meters
  seismicMagnitude: number;
  tsunamiHeight?: number; // meters
  peakGroundAcceleration: number; // m/s²
}

// Physical constants
const TNT_TO_JOULES = 4.184e15; // 1 megaton TNT in joules
const EARTH_GRAVITY = 9.81; // m/s²
const EARTH_RADIUS = 6371000; // meters
const WATER_DENSITY = 1000; // kg/m³
const ROCK_DENSITY = 2500; // kg/m³

// Asteroid density types
export const ASTEROID_DENSITIES = {
  stony: 3000, // kg/m³
  iron: 7800, // kg/m³
  carbonaceous: 2000 // kg/m³
} as const;

/**
 * Calculate asteroid mass from diameter and density
 */
export function calculateMass(diameter: number, density: number): number {
  const radius = diameter / 2;
  const volume = (4/3) * Math.PI * radius * radius * radius;
  return density * volume;
}

/**
 * Calculate kinetic energy
 */
export function calculateKineticEnergy(mass: number, velocity: number): number {
  return 0.5 * mass * velocity * velocity;
}

/**
 * Convert energy to TNT equivalent
 */
export function calculateTntEquivalent(energy: number): number {
  return energy / TNT_TO_JOULES;
}

/**
 * Calculate crater diameter using π-scaling
 */
export function calculateCraterDiameter(
  energy: number,
  angle: number,
  targetDensity: number = ROCK_DENSITY
): { diameter: number; depth: number } {
  const angleRad = angle * Math.PI / 180;
  
  // π-scaling formula
  // D = 1.25 * (E / (ρ * g))^(1/4) * sin(θ)^(1/3)
  const energyDensity = energy / (targetDensity * EARTH_GRAVITY);
  const diameter = 1.25 * Math.pow(energyDensity, 1/4) * Math.pow(Math.sin(angleRad), 1/3);
  
  // Depth is typically 1/4 of diameter
  const depth = diameter / 4;
  
  return { diameter, depth };
}

/**
 * Calculate seismic magnitude
 */
export function calculateSeismicMagnitude(energy: number): number {
  // Convert to seismic moment
  const seismicMoment = energy * 0.01; // 1% efficiency
  
  // Convert to moment magnitude
  // Mw = (2/3) * log10(M0) - 10.7
  const magnitude = (2/3) * Math.log10(seismicMoment) - 10.7;
  
  return magnitude;
}

/**
 * Calculate tsunami height (simplified)
 */
export function calculateTsunamiHeight(
  energy: number,
  waterDepth: number,
  distanceToShore: number
): number {
  // Energy efficiency for tsunami generation
  const tsunamiEnergy = energy * 0.1; // 10% efficiency
  
  // Initial wave height (simplified)
  const impactArea = Math.PI * 1000 * 1000; // 1km radius
  const energyDensity = tsunamiEnergy / impactArea;
  const initialHeight = 0.1 * Math.sqrt(energyDensity / (WATER_DENSITY * EARTH_GRAVITY));
  
  // Distance attenuation
  if (distanceToShore > 0) {
    const geometricFactor = 1 / Math.sqrt(distanceToShore / 1000); // km
    const dissipationFactor = Math.exp(-distanceToShore / (100 * 1000)); // 100km scale
    const shoreAmplification = 1 / Math.sqrt(0.01); // 1% slope
    
    return Math.max(0, initialHeight * geometricFactor * dissipationFactor * shoreAmplification);
  }
  
  return initialHeight;
}

/**
 * Calculate peak ground acceleration
 */
export function calculatePeakGroundAcceleration(magnitude: number, distance: number): number {
  // Simplified attenuation relationship
  const pga = Math.pow(10, magnitude - 1.5 * Math.log10(distance) - 0.01 * distance);
  return pga;
}

/**
 * Calculate MMI (Modified Mercalli Intensity) zones
 */
export function calculateMmiZones(
  magnitude: number,
  epicenterLat: number,
  epicenterLon: number,
  maxDistance: number = 1000 // km
): Array<{
  mmi: number;
  distance: number;
  color: string;
  coordinates: Array<[number, number]>;
}> {
  const distances = Array.from({ length: 20 }, (_, i) => (i + 1) * maxDistance / 20);
  const zones: Array<{
    mmi: number;
    distance: number;
    color: string;
    coordinates: Array<[number, number]>;
  }> = [];
  
  for (let i = 0; i < distances.length; i++) {
    const distance = distances[i];
    const mmi = Math.max(1, Math.min(12, magnitude - 1.5 * Math.log10(distance) - 0.01 * distance));
    
    // Create circular zone
    const latOffset = distance / 111.0; // 1 degree ≈ 111 km
    const lonOffset = distance / (111.0 * Math.cos(epicenterLat * Math.PI / 180));
    
    const coordinates: Array<[number, number]> = [];
    for (let j = 0; j < 32; j++) {
      const angle = (j * 2 * Math.PI) / 32;
      const lat = epicenterLat + latOffset * Math.cos(angle);
      const lon = epicenterLon + lonOffset * Math.sin(angle);
      coordinates.push([lon, lat]);
    }
    
    zones.push({
      mmi: Math.round(mmi),
      distance,
      color: getMmiColor(Math.round(mmi)),
      coordinates
    });
  }
  
  return zones;
}

/**
 * Calculate tsunami zones
 */
export function calculateTsunamiZones(
  epicenterLat: number,
  epicenterLon: number,
  maxHeight: number,
  maxDistance: number = 500 // km
): Array<{
  height: number;
  category: string;
  distance: number;
  color: string;
  coordinates: Array<[number, number]>;
}> {
  const heightCategories = [
    { height: maxHeight * 0.8, category: 'extreme' },
    { height: maxHeight * 0.6, category: 'high' },
    { height: maxHeight * 0.4, category: 'moderate' },
    { height: maxHeight * 0.2, category: 'low' }
  ];
  
  const zones: Array<{
    height: number;
    category: string;
    distance: number;
    color: string;
    coordinates: Array<[number, number]>;
  }> = [];
  
  for (const { height, category } of heightCategories) {
    if (height <= 0) continue;
    
    const distance = Math.min(height * 100, maxDistance); // Very simplified relationship
    
    const latOffset = distance / 111.0;
    const lonOffset = distance / (111.0 * Math.cos(epicenterLat * Math.PI / 180));
    
    const coordinates: Array<[number, number]> = [];
    for (let j = 0; j < 32; j++) {
      const angle = (j * 2 * Math.PI) / 32;
      const lat = epicenterLat + latOffset * Math.cos(angle);
      const lon = epicenterLon + lonOffset * Math.sin(angle);
      coordinates.push([lon, lat]);
    }
    
    zones.push({
      height,
      category,
      distance,
      color: getTsunamiColor(category),
      coordinates
    });
  }
  
  return zones;
}

/**
 * Get MMI color
 */
function getMmiColor(mmi: number): string {
  const colors: Record<number, string> = {
    1: '#FFFFFF',
    2: '#FFFF00',
    3: '#FFA500',
    4: '#FF4500',
    5: '#FF0000',
    6: '#8B0000',
    7: '#800080',
    8: '#000080',
    9: '#000000',
    10: '#000000',
    11: '#000000',
    12: '#000000'
  };
  return colors[mmi] || '#000000';
}

/**
 * Get tsunami color
 */
function getTsunamiColor(category: string): string {
  const colors: Record<string, string> = {
    low: '#0066CC',
    moderate: '#00CC66',
    high: '#FFCC00',
    extreme: '#FF6600',
    catastrophic: '#CC0000'
  };
  return colors[category] || '#0066CC';
}

/**
 * Calculate complete impact results
 */
export function calculateImpactResults(
  asteroid: AsteroidProperties,
  impact: ImpactParameters
): ImpactResults {
  const energy = calculateKineticEnergy(asteroid.mass, impact.velocity);
  const tntEquivalent = calculateTntEquivalent(energy);
  const crater = calculateCraterDiameter(energy, impact.angle);
  const seismicMagnitude = calculateSeismicMagnitude(energy);
  
  let tsunamiHeight: number | undefined;
  if (impact.targetType === 'ocean') {
    tsunamiHeight = calculateTsunamiHeight(energy, 4000, 100000); // 4km depth, 100km to shore
  }
  
  const peakGroundAcceleration = calculatePeakGroundAcceleration(seismicMagnitude, 10); // 10km distance
  
  return {
    energy,
    tntEquivalent,
    craterDiameter: crater.diameter,
    craterDepth: crater.depth,
    seismicMagnitude,
    tsunamiHeight,
    peakGroundAcceleration
  };
}
