/**
 * Tsunami Physics Calculations
 * 
 * Simplified tsunami height propagation model based on:
 * - Impact energy injection
 * - Near-shore slope (from DEM)
 * - Distance-based energy dissipation
 * - Coastal geometry effects
 */

export interface TsunamiImpact {
  /** Initial wave height in deep water (m) */
  initialHeight: number;
  /** Maximum near-shore wave height (m) */
  maxNearshoreHeight: number;
  /** Tsunami propagation speed (m/s) */
  propagationSpeed: number;
  /** Time to reach coast (seconds) */
  timeToCoast: number;
  /** Affected coastal distance (km) */
  affectedCoastLength: number;
  /** Inundation depth (m) */
  inundationDepth: number;
  /** Severity level (1-5) */
  severity: number;
}

export interface TsunamiZone {
  /** Distance from impact (km) */
  distance: number;
  /** Wave height at this distance (m) */
  height: number;
  /** Inundation depth (m) */
  inundation: number;
  /** Severity level (1-5) */
  severity: number;
  /** Affected area (km²) */
  area: number;
}

export interface CoastalProfile {
  /** Distance to nearest coast (km) */
  distanceToCoast: number;
  /** Average water depth (m) */
  averageDepth: number;
  /** Near-shore slope (degrees) */
  nearShoreSlope: number;
  /** Coastal complexity factor (1-3) */
  complexity: number;
}

/**
 * Physical constants for tsunami calculations
 */
const TSUNAMI_CONSTANTS = {
  /** Water density (kg/m³) */
  WATER_DENSITY: 1000,
  /** Gravity (m/s²) */
  GRAVITY: 9.81,
  /** Energy efficiency for tsunami generation */
  ENERGY_EFFICIENCY: 0.1,
  /** Dissipation coefficient (km⁻¹) */
  DISSIPATION_COEFF: 0.001,
  /** Geometric spreading exponent */
  SPREADING_EXPONENT: 0.5,
  /** Reference distance for spreading (km) */
  REFERENCE_DISTANCE: 1.0,
  /** Minimum wave height to be significant (m) */
  MIN_SIGNIFICANT_HEIGHT: 0.1,
  /** Maximum wave height for safety (m) */
  MAX_SAFE_HEIGHT: 50.0
} as const;

/**
 * Calculate initial tsunami wave height in deep water
 * 
 * @param impactEnergy - Impact energy in joules
 * @param waterDepth - Water depth at impact site (m)
 * @returns Initial wave height (m)
 */
export function calculateInitialHeight(
  impactEnergy: number,
  waterDepth: number
): number {
  const { WATER_DENSITY, GRAVITY, ENERGY_EFFICIENCY } = TSUNAMI_CONSTANTS;
  
  // Simple energy-to-wave conversion
  const energyPerUnitArea = impactEnergy / (Math.PI * waterDepth * waterDepth);
  const initialHeight = ENERGY_EFFICIENCY * energyPerUnitArea / 
    (WATER_DENSITY * GRAVITY * waterDepth);
  
  return Math.max(0, initialHeight);
}

/**
 * Calculate wave height at a given distance from impact
 * 
 * @param initialHeight - Initial wave height (m)
 * @param distance - Distance from impact (km)
 * @param coastalProfile - Coastal profile information
 * @returns Wave height at distance (m)
 */
export function calculateWaveHeightAtDistance(
  initialHeight: number,
  distance: number,
  coastalProfile: CoastalProfile
): number {
  const { DISSIPATION_COEFF, SPREADING_EXPONENT, REFERENCE_DISTANCE } = TSUNAMI_CONSTANTS;
  
  // Energy dissipation due to distance
  const dissipationFactor = Math.exp(-DISSIPATION_COEFF * distance);
  
  // Geometric spreading
  const spreadingFactor = Math.pow(REFERENCE_DISTANCE / Math.max(distance, 0.1), SPREADING_EXPONENT);
  
  // Coastal complexity effect
  const complexityFactor = 1.0 / coastalProfile.complexity;
  
  // Calculate wave height
  const waveHeight = initialHeight * dissipationFactor * spreadingFactor * complexityFactor;
  
  return Math.max(0, waveHeight);
}

/**
 * Calculate tsunami propagation speed
 * 
 * @param waterDepth - Water depth (m)
 * @returns Propagation speed (m/s)
 */
export function calculatePropagationSpeed(waterDepth: number): number {
  const { GRAVITY } = TSUNAMI_CONSTANTS;
  return Math.sqrt(GRAVITY * waterDepth);
}

/**
 * Calculate time for tsunami to reach coast
 * 
 * @param distanceToCoast - Distance to coast (km)
 * @param averageDepth - Average water depth (m)
 * @returns Time to coast (seconds)
 */
export function calculateTimeToCoast(
  distanceToCoast: number,
  averageDepth: number
): number {
  const speed = calculatePropagationSpeed(averageDepth);
  return (distanceToCoast * 1000) / speed; // Convert km to m
}

/**
 * Calculate near-shore wave height amplification
 * 
 * @param deepWaterHeight - Deep water wave height (m)
 * @param nearShoreSlope - Near-shore slope (degrees)
 * @param waterDepth - Water depth (m)
 * @returns Amplified wave height (m)
 */
export function calculateNearShoreAmplification(
  deepWaterHeight: number,
  nearShoreSlope: number,
  waterDepth: number
): number {
  // Shoaling effect - wave height increases as depth decreases
  const shoalingFactor = Math.sqrt(waterDepth / Math.max(waterDepth, 1.0));
  
  // Slope effect - steeper slopes can cause higher waves
  const slopeFactor = 1.0 + (nearShoreSlope / 45.0) * 0.5;
  
  // Refraction effect - wave focusing
  const refractionFactor = 1.0 + Math.sin(nearShoreSlope * Math.PI / 180) * 0.3;
  
  return deepWaterHeight * shoalingFactor * slopeFactor * refractionFactor;
}

/**
 * Calculate inundation depth based on wave height and topography
 * 
 * @param waveHeight - Wave height (m)
 * @param elevation - Ground elevation (m)
 * @param coastalProfile - Coastal profile information
 * @returns Inundation depth (m)
 */
export function calculateInundationDepth(
  waveHeight: number,
  elevation: number,
  coastalProfile: CoastalProfile
): number {
  // Base inundation from wave height
  const baseInundation = waveHeight - elevation;
  
  // Coastal complexity affects inundation
  const complexityFactor = 1.0 / coastalProfile.complexity;
  
  // Slope affects run-up
  const slopeFactor = 1.0 + (coastalProfile.nearShoreSlope / 30.0) * 0.5;
  
  const inundation = baseInundation * complexityFactor * slopeFactor;
  
  return Math.max(0, inundation);
}

/**
 * Determine tsunami severity level
 * 
 * @param waveHeight - Wave height (m)
 * @param inundationDepth - Inundation depth (m)
 * @returns Severity level (1-5)
 */
export function determineSeverityLevel(
  waveHeight: number,
  inundationDepth: number
): number {
  if (waveHeight < 0.5) return 1; // Minor
  if (waveHeight < 1.0) return 2; // Low
  if (waveHeight < 3.0) return 3; // Moderate
  if (waveHeight < 6.0) return 4; // High
  return 5; // Extreme
}

/**
 * Calculate affected coastal length
 * 
 * @param impactEnergy - Impact energy (joules)
 * @param coastalProfile - Coastal profile information
 * @returns Affected coastal length (km)
 */
export function calculateAffectedCoastLength(
  impactEnergy: number,
  coastalProfile: CoastalProfile
): number {
  // Base length from impact energy
  const baseLength = Math.sqrt(impactEnergy / 1e15) * 100; // km
  
  // Coastal complexity affects spread
  const complexityFactor = coastalProfile.complexity;
  
  // Distance to coast affects spread
  const distanceFactor = 1.0 + (coastalProfile.distanceToCoast / 100.0);
  
  return baseLength * complexityFactor * distanceFactor;
}

/**
 * Generate tsunami impact zones
 * 
 * @param impactEnergy - Impact energy (joules)
 * @param coastalProfile - Coastal profile information
 * @param maxDistance - Maximum distance to calculate (km)
 * @returns Array of tsunami zones
 */
export function generateTsunamiZones(
  impactEnergy: number,
  coastalProfile: CoastalProfile,
  maxDistance: number = 1000
): TsunamiZone[] {
  const zones: TsunamiZone[] = [];
  const initialHeight = calculateInitialHeight(impactEnergy, coastalProfile.averageDepth);
  
  // Calculate zones at different distances
  const distances = [0, 10, 25, 50, 100, 200, 500, maxDistance];
  
  for (const distance of distances) {
    if (distance > maxDistance) break;
    
    const waveHeight = calculateWaveHeightAtDistance(
      initialHeight,
      distance,
      coastalProfile
    );
    
    // Skip if wave height is too small
    if (waveHeight < TSUNAMI_CONSTANTS.MIN_SIGNIFICANT_HEIGHT) continue;
    
    // Calculate near-shore amplification if close to coast
    const amplifiedHeight = distance <= coastalProfile.distanceToCoast + 50
      ? calculateNearShoreAmplification(
          waveHeight,
          coastalProfile.nearShoreSlope,
          coastalProfile.averageDepth
        )
      : waveHeight;
    
    const inundationDepth = calculateInundationDepth(
      amplifiedHeight,
      0, // Assume sea level for simplicity
      coastalProfile
    );
    
    const severity = determineSeverityLevel(amplifiedHeight, inundationDepth);
    
    // Calculate affected area (simplified)
    const area = Math.PI * distance * distance * 0.1; // 10% of circular area
    
    zones.push({
      distance,
      height: amplifiedHeight,
      inundation: inundationDepth,
      severity,
      area
    });
  }
  
  return zones;
}

/**
 * Calculate comprehensive tsunami impact
 * 
 * @param impactEnergy - Impact energy (joules)
 * @param coastalProfile - Coastal profile information
 * @returns Complete tsunami impact analysis
 */
export function calculateTsunamiImpact(
  impactEnergy: number,
  coastalProfile: CoastalProfile
): TsunamiImpact {
  const initialHeight = calculateInitialHeight(impactEnergy, coastalProfile.averageDepth);
  
  const maxNearshoreHeight = calculateNearShoreAmplification(
    initialHeight,
    coastalProfile.nearShoreSlope,
    coastalProfile.averageDepth
  );
  
  const propagationSpeed = calculatePropagationSpeed(coastalProfile.averageDepth);
  
  const timeToCoast = calculateTimeToCoast(
    coastalProfile.distanceToCoast,
    coastalProfile.averageDepth
  );
  
  const affectedCoastLength = calculateAffectedCoastLength(
    impactEnergy,
    coastalProfile
  );
  
  const inundationDepth = calculateInundationDepth(
    maxNearshoreHeight,
    0, // Assume sea level
    coastalProfile
  );
  
  const severity = determineSeverityLevel(maxNearshoreHeight, inundationDepth);
  
  return {
    initialHeight,
    maxNearshoreHeight,
    propagationSpeed,
    timeToCoast,
    affectedCoastLength,
    inundationDepth,
    severity
  };
}

/**
 * Get tsunami severity description
 * 
 * @param severity - Severity level (1-5)
 * @returns Human-readable description
 */
export function getSeverityDescription(severity: number): string {
  const descriptions = [
    'Minor',
    'Low',
    'Moderate',
    'High',
    'Extreme'
  ];
  
  return descriptions[Math.max(0, Math.min(severity - 1, 4))] || 'Unknown';
}

/**
 * Get tsunami severity color
 * 
 * @param severity - Severity level (1-5)
 * @returns Color hex code
 */
export function getSeverityColor(severity: number): string {
  const colors = [
    '#4CAF50', // Green - Minor
    '#8BC34A', // Light Green - Low
    '#FFC107', // Amber - Moderate
    '#FF9800', // Orange - High
    '#F44336'  // Red - Extreme
  ];
  
  return colors[Math.max(0, Math.min(severity - 1, 4))] || '#9E9E9E';
}
