/**
 * Orbital mechanics calculations for asteroid impact analysis
 * Based on Keplerian orbital elements and impact geometry
 */

export interface OrbitalElements {
  semi_major_axis: number; // AU
  eccentricity: number;
  inclination: number; // degrees
  longitude_of_ascending_node: number; // degrees
  argument_of_periapsis: number; // degrees
  mean_anomaly: number; // degrees
  epoch: number; // Julian days
}

export interface ImpactGeometry {
  impact_angle: number; // degrees from vertical
  impact_velocity: number; // m/s
  approach_direction: 'prograde' | 'retrograde' | 'polar';
  relative_velocity_vector: {
    x: number;
    y: number;
    z: number;
  };
}

/**
 * Calculate impact angle from orbital elements
 * This is a simplified calculation - real impact angle depends on many factors
 */
export function calculateImpactAngleFromOrbit(orbitalElements: OrbitalElements): number {
  const { inclination, eccentricity } = orbitalElements;
  
  // Base impact angle from orbital inclination
  let baseAngle = Math.abs(inclination);
  
  // Adjust for eccentricity (higher eccentricity = more grazing impact)
  const eccentricityFactor = Math.min(0.3, eccentricity * 0.5);
  baseAngle += eccentricityFactor * 10;
  
  // Note: Removed randomness for deterministic results
  // Impact angle is now purely based on orbital parameters
  
  // Clamp between 5 and 90 degrees
  return Math.max(5, Math.min(90, baseAngle));
}

/**
 * Determine approach direction from orbital elements
 */
export function determineApproachDirection(orbitalElements: OrbitalElements): 'prograde' | 'retrograde' | 'polar' {
  const { inclination } = orbitalElements;
  
  if (inclination < 30) {
    return 'prograde';
  } else if (inclination > 150) {
    return 'retrograde';
  } else {
    return 'polar';
  }
}

/**
 * Calculate relative velocity vector components
 * Simplified 3D velocity calculation
 */
export function calculateVelocityVector(
  orbitalElements: OrbitalElements,
  velocity: number
): { x: number; y: number; z: number } {
  const { inclination, longitude_of_ascending_node, argument_of_periapsis } = orbitalElements;
  
  // Convert to radians
  const i = (inclination * Math.PI) / 180;
  const Ω = (longitude_of_ascending_node * Math.PI) / 180;
  const ω = (argument_of_periapsis * Math.PI) / 180;
  
  // Calculate velocity vector components
  const vx = velocity * Math.cos(i) * Math.cos(Ω);
  const vy = velocity * Math.cos(i) * Math.sin(Ω);
  const vz = velocity * Math.sin(i);
  
  return { x: vx, y: vy, z: vz };
}

/**
 * Analyze orbital characteristics for impact prediction
 */
export function analyzeOrbitalCharacteristics(orbitalElements: OrbitalElements) {
  const { semi_major_axis, eccentricity, inclination } = orbitalElements;
  
  return {
    orbit_type: getOrbitType(semi_major_axis, eccentricity),
    impact_probability: calculateImpactProbability(orbitalElements),
    approach_direction: determineApproachDirection(orbitalElements),
    orbital_period: calculateOrbitalPeriod(semi_major_axis), // years
    perihelion_distance: semi_major_axis * (1 - eccentricity), // AU
    aphelion_distance: semi_major_axis * (1 + eccentricity), // AU
    is_earth_crossing: isEarthCrossing(orbitalElements)
  };
}

function getOrbitType(semi_major_axis: number, eccentricity: number): string {
  if (semi_major_axis < 1.3) {
    return eccentricity > 0.3 ? 'Apollo' : 'Aten';
  } else if (semi_major_axis < 2.0) {
    return 'Amor';
  } else {
    return 'Main Belt';
  }
}

function calculateImpactProbability(orbitalElements: OrbitalElements): number {
  const { semi_major_axis, eccentricity, inclination } = orbitalElements;
  
  // Simplified impact probability calculation
  let probability = 0.001; // Base probability
  
  // Higher probability for Earth-crossing orbits
  if (semi_major_axis < 1.3) {
    probability *= 10;
  }
  
  // Higher probability for higher eccentricity
  probability *= (1 + eccentricity * 2);
  
  // Higher probability for lower inclination (more likely to cross Earth's orbit)
  probability *= (1 + (90 - Math.abs(inclination)) / 90);
  
  return Math.min(0.1, probability); // Cap at 10%
}

function calculateOrbitalPeriod(semi_major_axis: number): number {
  // Kepler's third law: T^2 = a^3 (in years and AU)
  return Math.sqrt(Math.pow(semi_major_axis, 3));
}

function isEarthCrossing(orbitalElements: OrbitalElements): boolean {
  const { semi_major_axis, eccentricity } = orbitalElements;
  const perihelion = semi_major_axis * (1 - eccentricity);
  const aphelion = semi_major_axis * (1 + eccentricity);
  
  // Earth's orbit is approximately 1 AU
  return perihelion < 1.0 && aphelion > 1.0;
}

/**
 * Calculate enhanced impact parameters using orbital data
 */
export function calculateEnhancedImpactParameters(
  orbitalElements: OrbitalElements,
  velocity: number
): ImpactGeometry {
  const impact_angle = calculateImpactAngleFromOrbit(orbitalElements);
  const approach_direction = determineApproachDirection(orbitalElements);
  const relative_velocity_vector = calculateVelocityVector(orbitalElements, velocity);
  
  return {
    impact_angle,
    impact_velocity: velocity,
    approach_direction,
    relative_velocity_vector
  };
}
