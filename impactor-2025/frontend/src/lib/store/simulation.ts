/**
 * Simulation state management using Zustand
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Asteroid {
  id: string;
  name: string;
  diameter: number;
  density: number;
  mass: number;
  isHazardous: boolean;
  orbitalData?: any;
  closeApproachData?: any;
}

export interface ImpactScenario {
  asteroid: Asteroid;
  impactLatitude: number;
  impactLongitude: number;
  impactVelocity: number;
  impactAngle: number;
  targetType: 'continental_crust' | 'oceanic_crust' | 'ocean';
  impactTime?: number;
  simulationResults?: any; // Add this field for simulation results
}

export interface DeflectionStrategy {
  type: 'kinetic_impactor' | 'gravity_tractor' | 'nuclear_detonation';
  deltaV: number;
  direction: [number, number, number];
  applicationTime: number;
  cost: number;
  leadTimeRequired: number;
}

export interface ImpactResults {
  energy: number;
  tntEquivalent: number;
  craterDiameter: number;
  craterDepth: number;
  seismicMagnitude: number;
  tsunamiHeight?: number;
  peakGroundAcceleration: number;
  mmiZones: Array<{
    mmi: number;
    distance: number;
    color: string;
    coordinates: Array<[number, number]>;
  }>;
  tsunamiZones: Array<{
    height: number;
    category: string;
    distance: number;
    color: string;
    coordinates: Array<[number, number]>;
  }>;
  exposedPopulation: number;
  affectedCities: Array<{
    name: string;
    distance: number;
    population: number;
    exposureLevel: string;
  }>;
  estimatedDamage: number;
  uncertaintyBounds: Record<string, [number, number]>;
}

export interface DeflectionResults {
  missDistance: number;
  deflectionAngle: number;
  impactProbability: number;
  newImpactLatitude?: number;
  newImpactLongitude?: number;
  energyReduction: number;
  populationExposureReduction: number;
  strategyEfficiency: number;
  requiredLeadTime: number;
}

export interface SimulationState {
  // Current scenario
  currentScenario: ImpactScenario | null;
  currentDeflection: DeflectionStrategy | null;
  
  // Results
  baselineResults: ImpactResults | null;
  deflectionResults: DeflectionResults | null;
  
  // UI state
  isSimulating: boolean;
  simulationError: string | null;
  
  // 3D visualization state
  showOrbit: boolean;
  showDeflection: boolean;
  showImpactZones: boolean;
  animationTime: number;
  isPlaying: boolean;
  
  // 2D map state
  mapCenter: [number, number];
  mapZoom: number;
  selectedLayer: string;
  
  // Actions
  setScenario: (scenario: ImpactScenario) => void;
  setDeflection: (deflection: DeflectionStrategy | null) => void;
  setBaselineResults: (results: ImpactResults | null) => void;
  setDeflectionResults: (results: DeflectionResults | null) => void;
  setSimulating: (simulating: boolean) => void;
  setSimulationError: (error: string | null) => void;
  setShowOrbit: (show: boolean) => void;
  setShowDeflection: (show: boolean) => void;
  setShowImpactZones: (show: boolean) => void;
  setAnimationTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setSelectedLayer: (layer: string) => void;
  resetSimulation: () => void;
}

export const useSimulationStore = create<SimulationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentScenario: null,
      currentDeflection: null,
      baselineResults: null,
      deflectionResults: null,
      isSimulating: false,
      simulationError: null,
      showOrbit: true,
      showDeflection: true,
      showImpactZones: true,
      animationTime: 0,
      isPlaying: false,
      mapCenter: [0, 0],
      mapZoom: 2,
      selectedLayer: 'satellite',

      // Actions
      setScenario: (scenario) => set({ currentScenario: scenario }),
      setDeflection: (deflection) => set({ currentDeflection: deflection }),
      setBaselineResults: (results) => set({ baselineResults: results }),
      setDeflectionResults: (results) => set({ deflectionResults: results }),
      setSimulating: (simulating) => set({ isSimulating: simulating }),
      setSimulationError: (error) => set({ simulationError: error }),
      setShowOrbit: (show) => set({ showOrbit: show }),
      setShowDeflection: (show) => set({ showDeflection: show }),
      setShowImpactZones: (show) => set({ showImpactZones: show }),
      setAnimationTime: (time) => set({ animationTime: time }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setMapCenter: (center) => set({ mapCenter: center }),
      setMapZoom: (zoom) => set({ mapZoom: zoom }),
      setSelectedLayer: (layer) => set({ selectedLayer: layer }),
      resetSimulation: () => set({
        currentScenario: null,
        currentDeflection: null,
        baselineResults: null,
        deflectionResults: null,
        isSimulating: false,
        simulationError: null,
        animationTime: 0,
        isPlaying: false,
      }),
    }),
    {
      name: 'simulation-store',
    }
  )
);
