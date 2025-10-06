/**
 * Deflection physics calculations
 * Based on kinetic impactor and gravity tractor models
 */

export interface DeflectionStrategy {
  type: 'kinetic_impactor' | 'gravity_tractor' | 'nuclear_detonation';
  deltaV: number; // m/s
  direction: [number, number, number]; // [x, y, z] in orbital frame
  applicationTime: number; // days before impact
  cost: number; // USD
  leadTimeRequired: number; // days
}

export interface KineticImpactorParams {
  mass: number; // kg
  velocity: number; // m/s
  angle: number; // degrees
}

export interface DeflectionResults {
  missDistance: number; // km
  deflectionAngle: number; // degrees
  impactProbability: number; // 0-1
  newImpactLatitude?: number;
  newImpactLongitude?: number;
  energyReduction: number; // percentage
  populationExposureReduction: number;
  strategyEfficiency: number; // 0-1
  requiredLeadTime: number; // days
}

// Physical constants
const EARTH_RADIUS = 6371000; // meters
const EARTH_MU = 3.986e14; // Earth's gravitational parameter (m³/s²)
const DEFLECTION_EFFICIENCY = 0.1; // 10% efficiency for kinetic impactor

/**
 * Calculate delta-v from kinetic impactor
 */
export function calculateKineticImpactorDeltaV(
  impactor: KineticImpactorParams,
  asteroidMass: number
): number {
  const angleRad = impactor.angle * Math.PI / 180;
  
  // Delta-v calculation
  // Δv = (m_impactor * v_impactor * cos(θ) * efficiency) / m_asteroid
  const deltaV = (
    impactor.mass * impactor.velocity * Math.cos(angleRad) * DEFLECTION_EFFICIENCY
  ) / asteroidMass;
  
  return deltaV;
}

/**
 * Apply deflection delta-v to asteroid trajectory
 */
export function applyDeflection(
  initialPosition: [number, number, number],
  initialVelocity: [number, number, number],
  deltaV: [number, number, number],
  timeBeforeImpact: number // seconds
): {
  newPosition: [number, number, number];
  newVelocity: [number, number, number];
} {
  // Apply delta-v to velocity
  const newVelocity: [number, number, number] = [
    initialVelocity[0] + deltaV[0],
    initialVelocity[1] + deltaV[1],
    initialVelocity[2] + deltaV[2]
  ];
  
  // Propagate trajectory forward
  const newPosition: [number, number, number] = [
    initialPosition[0] + newVelocity[0] * timeBeforeImpact,
    initialPosition[1] + newVelocity[1] * timeBeforeImpact,
    initialPosition[2] + newVelocity[2] * timeBeforeImpact
  ];
  
  return { newPosition, newVelocity };
}

/**
 * Calculate minimum miss distance to Earth
 */
export function calculateMissDistance(
  asteroidPosition: [number, number, number],
  asteroidVelocity: [number, number, number],
  earthPosition: [number, number, number] = [0, 0, 0]
): number {
  // Vector from Earth to asteroid
  const dx = asteroidPosition[0] - earthPosition[0];
  const dy = asteroidPosition[1] - earthPosition[1];
  const dz = asteroidPosition[2] - earthPosition[2];
  
  // Distance to Earth center
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  // Miss distance (distance - Earth radius)
  const missDistance = distance - EARTH_RADIUS;
  
  return missDistance;
}

/**
 * Calculate deflection angle
 */
export function calculateDeflectionAngle(
  originalVelocity: [number, number, number],
  newVelocity: [number, number, number]
): number {
  const dotProduct = originalVelocity[0] * newVelocity[0] + 
                    originalVelocity[1] * newVelocity[1] + 
                    originalVelocity[2] * newVelocity[2];
  
  const originalMagnitude = Math.sqrt(
    originalVelocity[0] * originalVelocity[0] + 
    originalVelocity[1] * originalVelocity[1] + 
    originalVelocity[2] * originalVelocity[2]
  );
  
  const newMagnitude = Math.sqrt(
    newVelocity[0] * newVelocity[0] + 
    newVelocity[1] * newVelocity[1] + 
    newVelocity[2] * newVelocity[2]
  );
  
  const angle = Math.acos(dotProduct / (originalMagnitude * newMagnitude));
  return angle * 180 / Math.PI; // Convert to degrees
}

/**
 * Calculate impact probability based on miss distance
 */
export function calculateImpactProbability(missDistance: number): number {
  if (missDistance > 0) {
    return 0; // No impact
  }
  
  // Probability increases as miss distance becomes more negative
  const probability = Math.min(1, Math.exp(missDistance / 100000)); // 100km scale
  return probability;
}

/**
 * Calculate new impact location (if still impacts)
 */
export function calculateNewImpactLocation(
  originalLatitude: number,
  originalLongitude: number,
  deltaV: [number, number, number]
): { latitude: number; longitude: number } {
  // Simplified: assume impact location shifts based on deflection
  const latShift = deltaV[1] * 0.01; // degrees per m/s
  const lonShift = deltaV[0] * 0.01;
  
  return {
    latitude: originalLatitude + latShift,
    longitude: originalLongitude + lonShift
  };
}

/**
 * Calculate strategy efficiency
 */
export function calculateStrategyEfficiency(
  strategy: DeflectionStrategy,
  asteroidMass: number
): number {
  switch (strategy.type) {
    case 'kinetic_impactor':
      // Efficiency based on delta-v magnitude
      return Math.min(1, strategy.deltaV / 1.0); // 1 m/s = 100% efficiency
      
    case 'gravity_tractor':
      // Gravity tractor is less efficient but more precise
      return Math.min(0.5, strategy.deltaV / 0.1); // 0.1 m/s = 50% efficiency
      
    case 'nuclear_detonation':
      // Nuclear detonation is very efficient but has other considerations
      return Math.min(1, strategy.deltaV / 0.5); // 0.5 m/s = 100% efficiency
      
    default:
      return 0;
  }
}

/**
 * Calculate required lead time for strategy
 */
export function calculateRequiredLeadTime(strategy: DeflectionStrategy): number {
  // Base lead time depends on strategy type
  const baseLeadTime = {
    kinetic_impactor: 90, // days
    gravity_tractor: 365, // days
    nuclear_detonation: 30 // days
  };
  
  // Adjust based on delta-v magnitude
  const deltaVFactor = Math.max(0.5, Math.min(2, strategy.deltaV / 0.1));
  
  return baseLeadTime[strategy.type] * deltaVFactor;
}

/**
 * Calculate complete deflection results
 */
export function calculateDeflectionResults(
  originalPosition: [number, number, number],
  originalVelocity: [number, number, number],
  strategy: DeflectionStrategy,
  asteroidMass: number,
  originalImpactLatitude: number,
  originalImpactLongitude: number,
  originalExposedPopulation: number
): DeflectionResults {
  // Apply deflection
  const timeBeforeImpact = strategy.applicationTime * 24 * 3600; // days to seconds
  const { newPosition, newVelocity } = applyDeflection(
    originalPosition,
    originalVelocity,
    strategy.direction.map(d => d * strategy.deltaV) as [number, number, number],
    timeBeforeImpact
  );
  
  // Calculate new miss distance
  const missDistance = calculateMissDistance(newPosition, newVelocity);
  
  // Calculate deflection angle
  const deflectionAngle = calculateDeflectionAngle(originalVelocity, newVelocity);
  
  // Calculate impact probability
  const impactProbability = calculateImpactProbability(missDistance);
  
  // Calculate new impact location (if still impacts)
  let newImpactLatitude: number | undefined;
  let newImpactLongitude: number | undefined;
  if (impactProbability > 0) {
    const newLocation = calculateNewImpactLocation(
      originalImpactLatitude,
      originalImpactLongitude,
      strategy.direction.map(d => d * strategy.deltaV) as [number, number, number]
    );
    newImpactLatitude = newLocation.latitude;
    newImpactLongitude = newLocation.longitude;
  }
  
  // Calculate effectiveness metrics
  const energyReduction = Math.max(0, (1 - impactProbability) * 100);
  const populationExposureReduction = Math.round(
    originalExposedPopulation * (1 - impactProbability)
  );
  
  // Calculate strategy efficiency
  const strategyEfficiency = calculateStrategyEfficiency(strategy, asteroidMass);
  
  // Required lead time
  const requiredLeadTime = calculateRequiredLeadTime(strategy);
  
  return {
    missDistance: missDistance / 1000, // Convert to km
    deflectionAngle,
    impactProbability,
    newImpactLatitude,
    newImpactLongitude,
    energyReduction,
    populationExposureReduction,
    strategyEfficiency,
    requiredLeadTime
  };
}

/**
 * Get available deflection strategies
 */
export function getAvailableStrategies(): DeflectionStrategy[] {
  return [
    {
      type: 'kinetic_impactor',
      deltaV: 0.1,
      direction: [1, 0, 0],
      applicationTime: 90,
      cost: 1000000000, // $1B
      leadTimeRequired: 90
    },
    {
      type: 'kinetic_impactor',
      deltaV: 0.5,
      direction: [1, 0, 0],
      applicationTime: 180,
      cost: 2000000000, // $2B
      leadTimeRequired: 180
    },
    {
      type: 'gravity_tractor',
      deltaV: 0.01,
      direction: [1, 0, 0],
      applicationTime: 365,
      cost: 5000000000, // $5B
      leadTimeRequired: 365
    },
    {
      type: 'nuclear_detonation',
      deltaV: 1.0,
      direction: [1, 0, 0],
      applicationTime: 30,
      cost: 10000000000, // $10B
      leadTimeRequired: 30
    }
  ];
}
