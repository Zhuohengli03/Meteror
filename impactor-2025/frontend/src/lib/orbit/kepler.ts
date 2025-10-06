/** 
 * Orbital mechanics calculations using Kepler's laws
 * Based on two-body problem with simplified perturbations
 */

export interface KeplerElements {
  semiMajorAxis: number; // AU
  eccentricity: number;
  inclination: number; // degrees
  longitudeOfAscendingNode: number; // degrees
  argumentOfPeriapsis: number; // degrees
  meanAnomaly: number; // degrees
  epoch: number; // Julian days
}

export interface CartesianState {
  position: [number, number, number]; // [x, y, z] in meters
  velocity: [number, number, number]; // [vx, vy, vz] in m/s
}

export interface OrbitalPosition {
  position: [number, number, number];
  velocity: [number, number, number];
  trueAnomaly: number;
  distance: number;
}

// Physical constants
const AU_TO_METERS = 1.496e11;
const EARTH_MU = 3.986e14; // Earth's gravitational parameter (m³/s²)
const SUN_MU = 1.327e20; // Sun's gravitational parameter (m³/s²)

/**
 * Convert Kepler elements to Cartesian position and velocity
 */
export function keplerToCartesian(
  elements: KeplerElements,
  time: number, // Julian days
  mu: number = SUN_MU
): CartesianState {
  const { semiMajorAxis, eccentricity, inclination, longitudeOfAscendingNode, argumentOfPeriapsis, meanAnomaly } = elements;
  
  // Convert to radians
  const i = toRadians(inclination);
  const omega = toRadians(longitudeOfAscendingNode);
  const w = toRadians(argumentOfPeriapsis);
  const M = toRadians(meanAnomaly);
  
  // Convert semi-major axis to meters
  const a = semiMajorAxis * AU_TO_METERS;
  
  // Solve Kepler's equation for eccentric anomaly
  const E = solveKeplersEquation(M, eccentricity);
  
  // Calculate true anomaly
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
    Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
  );
  
  // Calculate position and velocity in orbital plane
  const r = a * (1 - eccentricity * Math.cos(E));
  const x_orb = r * Math.cos(nu);
  const y_orb = r * Math.sin(nu);
  const z_orb = 0;
  
  // Velocity in orbital plane
  const n = Math.sqrt(mu / (a * a * a)); // Mean motion
  const vx_orb = -a * n * Math.sin(E) / (1 - eccentricity * Math.cos(E));
  const vy_orb = a * n * Math.sqrt(1 - eccentricity * eccentricity) * Math.cos(E) / (1 - eccentricity * Math.cos(E));
  const vz_orb = 0;
  
  // Transform to Cartesian coordinates
  const pos_orb: [number, number, number] = [x_orb, y_orb, z_orb];
  const vel_orb: [number, number, number] = [vx_orb, vy_orb, vz_orb];
  
  // Rotation matrices
  const R_omega = rotationMatrixZ(omega);
  const R_i = rotationMatrixX(i);
  const R_w = rotationMatrixZ(w);
  
  // Apply rotations
  const R = multiplyMatrices(R_omega, multiplyMatrices(R_i, R_w));
  const position = multiplyMatrixVector(R, pos_orb);
  const velocity = multiplyMatrixVector(R, vel_orb);
  
  return { position, velocity };
}

/**
 * Propagate orbit using simple two-body dynamics
 */
export function propagateOrbit(
  position: [number, number, number],
  velocity: [number, number, number],
  dt: number, // seconds
  mu: number = SUN_MU
): CartesianState {
  // Simple Euler integration (for real-time performance)
  const r = Math.sqrt(position[0] * position[0] + position[1] * position[1] + position[2] * position[2]);
  const acceleration: [number, number, number] = [
    -mu * position[0] / (r * r * r),
    -mu * position[1] / (r * r * r),
    -mu * position[2] / (r * r * r)
  ];
  
  const newVelocity: [number, number, number] = [
    velocity[0] + acceleration[0] * dt,
    velocity[1] + acceleration[1] * dt,
    velocity[2] + acceleration[2] * dt
  ];
  
  const newPosition: [number, number, number] = [
    position[0] + newVelocity[0] * dt,
    position[1] + newVelocity[1] * dt,
    position[2] + newVelocity[2] * dt
  ];
  
  return { position: newPosition, velocity: newVelocity };
}

/**
 * Calculate orbital position at specific time
 */
export function getOrbitalPosition(
  elements: KeplerElements,
  time: number
): OrbitalPosition {
  const state = keplerToCartesian(elements, time);
  const distance = Math.sqrt(
    state.position[0] * state.position[0] + 
    state.position[1] * state.position[1] + 
    state.position[2] * state.position[2]
  );
  
  // Calculate true anomaly
  const trueAnomaly = Math.atan2(state.position[1], state.position[0]);
  
  return {
    position: state.position,
    velocity: state.velocity,
    trueAnomaly,
    distance
  };
}

/**
 * Check if asteroid will impact Earth
 */
export function checkEarthImpact(
  position: [number, number, number],
  velocity: [number, number, number],
  earthPosition: [number, number, number] = [0, 0, 0],
  earthRadius: number = 6371000 // meters
): boolean {
  const dx = position[0] - earthPosition[0];
  const dy = position[1] - earthPosition[1];
  const dz = position[2] - earthPosition[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  return distance <= earthRadius + 100000; // 100km atmosphere
}

/**
 * Calculate impact parameters
 */
export function calculateImpactParameters(
  position: [number, number, number],
  velocity: [number, number, number],
  earthPosition: [number, number, number] = [0, 0, 0]
): {
  impactLatitude: number;
  impactLongitude: number;
  impactVelocity: number;
  impactAngle: number;
} {
  // Convert position to spherical coordinates
  const dx = position[0] - earthPosition[0];
  const dy = position[1] - earthPosition[1];
  const dz = position[2] - earthPosition[2];
  
  const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const latitude = Math.asin(dz / r) * 180 / Math.PI;
  const longitude = Math.atan2(dy, dx) * 180 / Math.PI;
  
  // Calculate impact velocity and angle
  const impactVelocity = Math.sqrt(
    velocity[0] * velocity[0] + 
    velocity[1] * velocity[1] + 
    velocity[2] * velocity[2]
  );
  
  // Impact angle (simplified)
  const impactAngle = Math.acos(Math.abs(dz) / r) * 180 / Math.PI;
  
  return {
    impactLatitude: latitude,
    impactLongitude: longitude,
    impactVelocity,
    impactAngle
  };
}

// Helper functions

function solveKeplersEquation(M: number, e: number, maxIterations: number = 100): number {
  let E = M; // Initial guess
  
  for (let i = 0; i < maxIterations; i++) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    
    if (Math.abs(f) < 1e-10) break;
    
    E = E - f / fPrime;
  }
  
  return E;
}

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

function rotationMatrixX(angle: number): number[][] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    [1, 0, 0],
    [0, c, -s],
    [0, s, c]
  ];
}

function rotationMatrixZ(angle: number): number[][] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1]
  ];
}

function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < b.length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function multiplyMatrixVector(matrix: number[][], vector: [number, number, number]): [number, number, number] {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2]
  ];
}
