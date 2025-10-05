/**
 * Simulation WebWorker
 * 
 * Handles heavy computational tasks in a separate thread to avoid blocking
 * the main UI thread. Includes trajectory propagation and raster convolution.
 */

import { KeplerianElements, propagateOrbit, calculatePosition, calculateVelocity } from '../orbit/kepler';
import { ImpactPhysics, calculateImpactEnergy, calculateCraterDiameter } from '../physics/impact';

export interface WorkerMessage {
  type: string;
  id: string;
  data: any;
}

export interface WorkerResponse {
  type: string;
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface TrajectoryRequest {
  elements: KeplerianElements;
  startTime: number;
  endTime: number;
  timeStep: number;
  targetBody: 'Earth' | 'Moon' | 'Sun';
}

export interface TrajectoryResult {
  positions: Array<{ time: number; x: number; y: number; z: number }>;
  velocities: Array<{ time: number; vx: number; vy: number; vz: number }>;
  closestApproach: {
    time: number;
    distance: number;
    position: { x: number; y: number; z: number };
    velocity: { vx: number; vy: number; vz: number };
  };
  impactTime?: number;
  impactPosition?: { x: number; y: number; z: number };
  impactVelocity?: { vx: number; vy: number; vz: number };
}

export interface RasterConvolutionRequest {
  data: Float32Array;
  width: number;
  height: number;
  kernel: Float32Array;
  kernelWidth: number;
  kernelHeight: number;
  operation: 'blur' | 'sharpen' | 'edge' | 'gaussian';
}

export interface RasterConvolutionResult {
  data: Float32Array;
  width: number;
  height: number;
  processingTime: number;
}

export interface ImpactSimulationRequest {
  elements: KeplerianElements;
  impactTime: number;
  impactPosition: { x: number; y: number; z: number };
  impactVelocity: { vx: number; vy: number; vz: number };
  asteroidDiameter: number;
  asteroidDensity: number;
  targetDensity: number;
  impactAngle: number;
}

export interface ImpactSimulationResult {
  impactEnergy: number;
  craterDiameter: number;
  craterDepth: number;
  seismicMagnitude: number;
  tsunamiHeight: number;
  blastRadius: number;
  thermalRadius: number;
  affectedArea: number;
  processingTime: number;
}

/**
 * Physical constants
 */
const CONSTANTS = {
  G: 6.674e-11, // Gravitational constant
  M_EARTH: 5.972e24, // Earth mass
  R_EARTH: 6.371e6, // Earth radius
  M_MOON: 7.342e22, // Moon mass
  R_MOON: 1.737e6, // Moon radius
  M_SUN: 1.989e30, // Sun mass
  R_SUN: 6.96e8, // Sun radius
  AU: 1.496e11, // Astronomical unit
  DAY: 86400, // Seconds in a day
  YEAR: 31557600 // Seconds in a year
};

/**
 * Calculate trajectory for an asteroid
 * 
 * @param request - Trajectory calculation request
 * @returns Trajectory result
 */
function calculateTrajectory(request: TrajectoryRequest): TrajectoryResult {
  const { elements, startTime, endTime, timeStep, targetBody } = request;
  
  const positions: Array<{ time: number; x: number; y: number; z: number }> = [];
  const velocities: Array<{ time: number; vx: number; vy: number; vz: number }> = [];
  
  let closestApproach = {
    time: startTime,
    distance: Infinity,
    position: { x: 0, y: 0, z: 0 },
    velocity: { vx: 0, vy: 0, vz: 0 }
  };
  
  let impactTime: number | undefined;
  let impactPosition: { x: number; y: number; z: number } | undefined;
  let impactVelocity: { vx: number; vy: number; vz: number } | undefined;
  
  // Get target body parameters
  const targetMass = targetBody === 'Earth' ? CONSTANTS.M_EARTH : 
                    targetBody === 'Moon' ? CONSTANTS.M_MOON : CONSTANTS.M_SUN;
  const targetRadius = targetBody === 'Earth' ? CONSTANTS.R_EARTH : 
                      targetBody === 'Moon' ? CONSTANTS.R_MOON : CONSTANTS.R_SUN;
  
  // Propagate orbit
  for (let time = startTime; time <= endTime; time += timeStep) {
    const propagated = propagateOrbit(elements, time);
    const position = calculatePosition(propagated);
    const velocity = calculateVelocity(propagated);
    
    positions.push({
      time,
      x: position.x,
      y: position.y,
      z: position.z
    });
    
    velocities.push({
      time,
      vx: velocity.vx,
      vy: velocity.vy,
      vz: velocity.vz
    });
    
    // Calculate distance to target
    const distance = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
    
    // Update closest approach
    if (distance < closestApproach.distance) {
      closestApproach = {
        time,
        distance,
        position: { x: position.x, y: position.y, z: position.z },
        velocity: { vx: velocity.vx, vy: velocity.vy, vz: velocity.vz }
      };
    }
    
    // Check for impact
    if (distance <= targetRadius && !impactTime) {
      impactTime = time;
      impactPosition = { x: position.x, y: position.y, z: position.z };
      impactVelocity = { vx: velocity.vx, vy: velocity.vy, vz: velocity.vz };
    }
  }
  
  return {
    positions,
    velocities,
    closestApproach,
    impactTime,
    impactPosition,
    impactVelocity
  };
}

/**
 * Perform raster convolution
 * 
 * @param request - Convolution request
 * @returns Convolution result
 */
function performRasterConvolution(request: RasterConvolutionRequest): RasterConvolutionResult {
  const { data, width, height, kernel, kernelWidth, kernelHeight, operation } = request;
  
  const startTime = performance.now();
  const result = new Float32Array(width * height);
  
  // Apply convolution kernel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let weightSum = 0;
      
      for (let ky = 0; ky < kernelHeight; ky++) {
        for (let kx = 0; kx < kernelWidth; kx++) {
          const px = x + kx - Math.floor(kernelWidth / 2);
          const py = y + ky - Math.floor(kernelHeight / 2);
          
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const pixelIndex = py * width + px;
            const kernelIndex = ky * kernelWidth + kx;
            const weight = kernel[kernelIndex];
            
            sum += data[pixelIndex] * weight;
            weightSum += weight;
          }
        }
      }
      
      const pixelIndex = y * width + x;
      result[pixelIndex] = weightSum > 0 ? sum / weightSum : data[pixelIndex];
    }
  }
  
  const processingTime = performance.now() - startTime;
  
  return {
    data: result,
    width,
    height,
    processingTime
  };
}

/**
 * Simulate impact effects
 * 
 * @param request - Impact simulation request
 * @returns Impact simulation result
 */
function simulateImpact(request: ImpactSimulationRequest): ImpactSimulationResult {
  const { impactVelocity, asteroidDiameter, asteroidDensity, targetDensity, impactAngle } = request;
  
  const startTime = performance.now();
  
  // Calculate impact velocity magnitude
  const velocityMagnitude = Math.sqrt(
    impactVelocity.vx * impactVelocity.vx +
    impactVelocity.vy * impactVelocity.vy +
    impactVelocity.vz * impactVelocity.vz
  );
  
  // Calculate asteroid mass
  const asteroidMass = (4/3) * Math.PI * Math.pow(asteroidDiameter / 2, 3) * asteroidDensity;
  
  // Calculate impact energy
  const impactEnergy = calculateImpactEnergy(asteroidMass, velocityMagnitude);
  
  // Calculate crater diameter
  const craterDiameter = calculateCraterDiameter(
    asteroidDiameter,
    velocityMagnitude,
    asteroidDensity,
    targetDensity,
    impactAngle
  );
  
  // Calculate crater depth (simplified)
  const craterDepth = craterDiameter / 3;
  
  // Calculate seismic magnitude
  const seismicMagnitude = 0.67 * Math.log10(impactEnergy) - 5.87;
  
  // Calculate tsunami height (if ocean impact)
  const tsunamiHeight = impactEnergy > 1e15 ? Math.pow(impactEnergy / 1e15, 0.25) * 10 : 0;
  
  // Calculate blast radius
  const blastRadius = Math.pow(impactEnergy / 1e15, 0.33) * 1000;
  
  // Calculate thermal radius
  const thermalRadius = Math.pow(impactEnergy / 1e15, 0.33) * 500;
  
  // Calculate affected area
  const affectedArea = Math.PI * Math.pow(blastRadius, 2);
  
  const processingTime = performance.now() - startTime;
  
  return {
    impactEnergy,
    craterDiameter,
    craterDepth,
    seismicMagnitude,
    tsunamiHeight,
    blastRadius,
    thermalRadius,
    affectedArea,
    processingTime
  };
}

/**
 * Generate convolution kernel
 * 
 * @param operation - Kernel operation type
 * @param size - Kernel size
 * @returns Convolution kernel
 */
function generateKernel(operation: string, size: number): Float32Array {
  const kernel = new Float32Array(size * size);
  const center = Math.floor(size / 2);
  
  switch (operation) {
    case 'blur':
      // Gaussian blur kernel
      const sigma = size / 6;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x - center;
          const dy = y - center;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const weight = Math.exp(-(distance * distance) / (2 * sigma * sigma));
          kernel[y * size + x] = weight;
        }
      }
      break;
      
    case 'sharpen':
      // Sharpening kernel
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (x === center && y === center) {
            kernel[y * size + x] = size * size;
          } else {
            kernel[y * size + x] = -1;
          }
        }
      }
      break;
      
    case 'edge':
      // Edge detection kernel
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (x === center && y === center) {
            kernel[y * size + x] = (size * size - 1) * -1;
          } else {
            kernel[y * size + x] = 1;
          }
        }
      }
      break;
      
    case 'gaussian':
      // Gaussian kernel
      const sigma_g = size / 6;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x - center;
          const dy = y - center;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const weight = Math.exp(-(distance * distance) / (2 * sigma_g * sigma_g));
          kernel[y * size + x] = weight;
        }
      }
      break;
      
    default:
      // Identity kernel
      for (let i = 0; i < size * size; i++) {
        kernel[i] = i === center * size + center ? 1 : 0;
      }
  }
  
  // Normalize kernel
  const sum = kernel.reduce((a, b) => a + b, 0);
  if (sum !== 0) {
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }
  }
  
  return kernel;
}

/**
 * Handle worker messages
 */
self.onmessage = function(event: MessageEvent<WorkerMessage>) {
  const { type, id, data } = event.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'calculateTrajectory':
        result = calculateTrajectory(data);
        break;
        
      case 'rasterConvolution':
        result = performRasterConvolution(data);
        break;
        
      case 'simulateImpact':
        result = simulateImpact(data);
        break;
        
      case 'generateKernel':
        result = generateKernel(data.operation, data.size);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    const response: WorkerResponse = {
      type,
      id,
      success: true,
      data: result
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type,
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    self.postMessage(response);
  }
};

/**
 * Handle worker errors
 */
self.onerror = function(error: ErrorEvent) {
  console.error('Worker error:', error);
  
  const response: WorkerResponse = {
    type: 'error',
    id: 'unknown',
    success: false,
    error: error.message
  };
  
  self.postMessage(response);
};

/**
 * Handle unhandled promise rejections
 */
self.onunhandledrejection = function(event: PromiseRejectionEvent) {
  console.error('Worker unhandled rejection:', event.reason);
  
  const response: WorkerResponse = {
    type: 'error',
    id: 'unknown',
    success: false,
    error: event.reason instanceof Error ? event.reason.message : 'Unhandled rejection'
  };
  
  self.postMessage(response);
};

// Export types for use in main thread
export type { WorkerMessage, WorkerResponse, TrajectoryRequest, TrajectoryResult, RasterConvolutionRequest, RasterConvolutionResult, ImpactSimulationRequest, ImpactSimulationResult };
