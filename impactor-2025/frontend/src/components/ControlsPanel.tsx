/**
 * Controls panel for simulation parameters
 */

import { useState, useEffect } from 'react';
import { useSimulationStore } from '../lib/store/simulation';
import { calculateMass, ASTEROID_DENSITIES } from '../lib/physics/impact';
import { getAvailableStrategies } from '../lib/physics/deflection';
import { calculateEnhancedImpactParameters, analyzeOrbitalCharacteristics } from '../lib/physics/orbit';
import { apiClient } from '../lib/api/client';

interface ControlsPanelProps {
  className?: string;
}

export default function ControlsPanel({ className }: ControlsPanelProps) {
  const {
    currentScenario,
    currentDeflection,
    setScenario,
    setDeflection,
    setBaselineResults,
    isSimulating,
    setSimulating,
    setSimulationError
  } = useSimulationStore();

  // Asteroid parameters
  const [diameter, setDiameter] = useState(500);
  const [densityType, setDensityType] = useState<keyof typeof ASTEROID_DENSITIES>('stony');
  const [density, setDensity] = useState<number>(ASTEROID_DENSITIES.stony);
  const [mass, setMass] = useState(calculateMass(diameter, density));

  // Impact parameters
  const [impactLatitude, setImpactLatitude] = useState(40.7128);
  const [impactLongitude, setImpactLongitude] = useState(-74.0060);
  const [impactVelocity, setImpactVelocity] = useState(15000);
  const [impactAngle, setImpactAngle] = useState(45);
  const [showCustomSettings, setShowCustomSettings] = useState(false);

  // Notify parent component when custom settings state changes
  useEffect(() => {
    const event = new CustomEvent('customSettingsChanged', {
      detail: { expanded: showCustomSettings }
    });
    window.dispatchEvent(event);
  }, [showCustomSettings]);
  const [targetType, setTargetType] = useState<'continental_crust' | 'oceanic_crust' | 'ocean'>('continental_crust');

  // Deflection parameters
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [availableStrategies] = useState(getAvailableStrategies());

  // Asteroid selection
  const [asteroids, setAsteroids] = useState<any[]>([]);
  const [selectedAsteroid, setSelectedAsteroid] = useState<any>(null);
  const [loadingAsteroids, setLoadingAsteroids] = useState(false);
  
  // Track manual modifications
  const [manualVelocitySet, setManualVelocitySet] = useState(false);
  const [manualAngleSet, setManualAngleSet] = useState(false);

  // Initialize scenario if not exists
  useEffect(() => {
    if (!currentScenario) {
      const initialScenario = {
        asteroid: {
          name: 'Custom Asteroid',
          diameter: diameter,
          mass: mass,
          density: density,
          velocity: impactVelocity,
          isHazardous: false
        },
        impactLatitude: impactLatitude,
        impactLongitude: impactLongitude,
        impactVelocity: impactVelocity,
        impactAngle: impactAngle,
        targetType: targetType
      };
      setScenario(initialScenario);
    }
  }, [currentScenario, setScenario, diameter, mass, density, impactVelocity, impactLatitude, impactLongitude, impactAngle, targetType]);

  // Mass is calculated in onChange handlers, no need for separate useEffect

  // Density is updated in onChange handler, no need for separate useEffect

  // Reset data to zero when no asteroid is selected
  useEffect(() => {
    if (!selectedAsteroid) {
      setDiameter(0);
      setMass(0);
      setImpactVelocity(0);
      setImpactAngle(0);
      setManualVelocitySet(false);
      setManualAngleSet(false);
    }
  }, [selectedAsteroid]);

  // Update local state when currentScenario changes (e.g., from map click)
  useEffect(() => {
    if (currentScenario) {
      setImpactLatitude(currentScenario.impactLatitude);
      setImpactLongitude(currentScenario.impactLongitude);
    }
  }, [currentScenario]);

  // Load asteroids on component mount
  useEffect(() => {
    loadAsteroids();
  }, []);

  const loadAsteroids = async () => {
    setLoadingAsteroids(true);
    try {
      console.log('Loading asteroids from API...');
      const response = await apiClient.searchAsteroids({ limit: 50 });
      console.log('API response:', response);
      
            if (response.data && (response.data as any).near_earth_objects) {
              // Flatten the nested structure
              const allAsteroids = Object.values((response.data as any).near_earth_objects).flat();
              setAsteroids(allAsteroids);
              console.log('Successfully loaded asteroids:', allAsteroids.length);
              console.log('First asteroid:', allAsteroids[0]);
            } else {
              console.error('No asteroids data in response:', response);
            }
    } catch (error) {
      console.error('Failed to load asteroids:', error);
      // Set some dummy data for testing
      setAsteroids([
        {
          id: 'test1',
          name: 'Test Asteroid 1',
          is_potentially_hazardous_asteroid: false,
          close_approach_data: [{ close_approach_date: '2025-01-01' }]
        }
      ]);
    } finally {
      setLoadingAsteroids(false);
    }
  };

  const handleAsteroidSelect = (asteroid: any) => {
    setSelectedAsteroid(asteroid);
    
    // When selecting a new asteroid, always prioritize API data over manual settings
    console.log('Selecting new asteroid - prioritizing API data over manual settings');
    
    // Reset manual modification flags
    setManualVelocitySet(false);
    setManualAngleSet(false);
    
    // Update parameters based on selected asteroid
    if (asteroid.estimated_diameter) {
      const avgDiameter = (asteroid.estimated_diameter.meters.estimated_diameter_min + 
                          asteroid.estimated_diameter.meters.estimated_diameter_max) / 2;
      const newDiameter = Math.round(avgDiameter);
      setDiameter(newDiameter);
      
      // Recalculate mass with new diameter and current density
      const newMass = calculateMass(newDiameter, density);
      setMass(newMass);
      console.log('Asteroid selected - New diameter:', newDiameter, 'Density:', density, 'New mass:', newMass);
    }
    
    // Use velocity from close approach data if available
    if (asteroid.close_approach_data && asteroid.close_approach_data.length > 0) {
      const approach = asteroid.close_approach_data[0];
      if (approach.relative_velocity && approach.relative_velocity.kilometers_per_second) {
        const velocityKmS = parseFloat(approach.relative_velocity.kilometers_per_second);
        const apiVelocity = Math.round(velocityKmS * 1000); // Convert to m/s
        setImpactVelocity(apiVelocity);
        console.log('Using velocity from API:', velocityKmS, 'km/s');
      }
    }
    
    
    // Use orbital data if available
    if (asteroid.orbital_data) {
      console.log('Orbital data available:', asteroid.orbital_data);
      
      // Extract orbital elements for more accurate simulation
      const orbitalData = asteroid.orbital_data;
      if (orbitalData.inclination) {
        const inclination = parseFloat(orbitalData.inclination);
        // Convert orbital inclination to impact angle (simplified)
        // Real impact angle would need more complex calculation
        const estimatedImpactAngle = Math.min(90, Math.abs(inclination) + 15);
        setImpactAngle(Math.round(estimatedImpactAngle));
        console.log('Using orbital inclination for impact angle:', inclination, '->', estimatedImpactAngle);
      }
    }
    
    console.log('Selected asteroid:', {
      name: asteroid.name,
      diameter: asteroid.estimated_diameter?.meters,
      velocity: asteroid.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second,
      hazardous: asteroid.is_potentially_hazardous_asteroid
    });
  };

  const handleRunSimulation = async () => {
    console.log('Starting simulation...');
    
    // Prevent multiple simultaneous simulations
    if (isSimulating) {
      console.log('Simulation already in progress, ignoring request');
      return;
    }
    
    // Check if asteroid is selected
    if (!selectedAsteroid) {
      console.log('No asteroid selected, simulation cancelled');
      setSimulationError('Please select an asteroid from the API first');
      return;
    }
    
    try {
      setSimulating(true);
      setSimulationError(null);

      // Use selected asteroid data if available, otherwise use local state
      let simulationDiameter = diameter;
      let simulationDensityType = densityType;
      let simulationDensity = density;
      let simulationMass = mass;
      let simulationVelocity = impactVelocity;
      let simulationAngle = impactAngle;
      let orbitalElements = null;

      if (selectedAsteroid) {
        // Use data from selected asteroid
        if (selectedAsteroid.estimated_diameter) {
          const avgDiameter = (selectedAsteroid.estimated_diameter.meters.estimated_diameter_min + 
                              selectedAsteroid.estimated_diameter.meters.estimated_diameter_max) / 2;
          simulationDiameter = Math.round(avgDiameter);
        }
        
        // Use velocity from close approach data if available
        if (selectedAsteroid.close_approach_data && selectedAsteroid.close_approach_data.length > 0) {
          const approach = selectedAsteroid.close_approach_data[0];
          if (approach.relative_velocity && approach.relative_velocity.kilometers_per_second) {
            const velocityKmS = parseFloat(approach.relative_velocity.kilometers_per_second);
            simulationVelocity = Math.round(velocityKmS * 1000); // Convert to m/s
          }
        }
        
        // Use orbital data for more accurate simulation
        if (selectedAsteroid.orbital_data) {
          const orbitalData = selectedAsteroid.orbital_data;
          
          // Extract orbital elements
          orbitalElements = {
            semi_major_axis: orbitalData.semi_major_axis ? parseFloat(orbitalData.semi_major_axis) : 1.2,
            eccentricity: orbitalData.eccentricity ? parseFloat(orbitalData.eccentricity) : 0.3,
            inclination: orbitalData.inclination ? parseFloat(orbitalData.inclination) : 15,
            longitude_of_ascending_node: orbitalData.longitude_of_ascending_node ? parseFloat(orbitalData.longitude_of_ascending_node) : 45,
            argument_of_periapsis: orbitalData.argument_of_periapsis ? parseFloat(orbitalData.argument_of_periapsis) : 30,
            mean_anomaly: orbitalData.mean_anomaly ? parseFloat(orbitalData.mean_anomaly) : 180,
            epoch: orbitalData.epoch_osculation ? parseFloat(orbitalData.epoch_osculation) : 2460000
          };
          
          // Use advanced orbital analysis for impact parameters
          const enhancedParams = calculateEnhancedImpactParameters(orbitalElements, simulationVelocity);
          simulationAngle = enhancedParams.impact_angle;
          
          // Analyze orbital characteristics
          const orbitalAnalysis = analyzeOrbitalCharacteristics(orbitalElements);
          console.log('Orbital analysis:', orbitalAnalysis);
        }
        
        // Recalculate mass with API diameter and current density
        simulationMass = calculateMass(simulationDiameter, simulationDensity);
        
        console.log('Using selected asteroid data:', {
          name: selectedAsteroid.name,
          diameter: simulationDiameter,
          density: simulationDensity,
          mass: simulationMass,
          velocity: simulationVelocity,
          angle: simulationAngle,
          orbitalElements: orbitalElements,
          hazardous: selectedAsteroid.is_potentially_hazardous_asteroid
        });
      } else {
        console.log('No asteroid selected, using default parameters:', {
          diameter: simulationDiameter,
          density: simulationDensity,
          mass: simulationMass,
          velocity: simulationVelocity,
          angle: simulationAngle
        });
      }

      // Create simulation request according to backend API
      const simulationRequest = {
        scenario: {
          asteroid: {
            diameter: simulationDiameter,
            density_type: simulationDensityType,
            density: simulationDensity
          },
          orbit: orbitalElements || {
            semi_major_axis: 1.2, // AU
            eccentricity: 0.3,
            inclination: 15,
            longitude_of_ascending_node: 45,
            argument_of_periapsis: 30,
            mean_anomaly: 180,
            epoch: 2460000
          },
          impact_angle: simulationAngle,
          impact_velocity: simulationVelocity,
          target_type: targetType,
          impact_latitude: impactLatitude,
          impact_longitude: impactLongitude
        },
        include_tsunami: true,
        include_seismic: true,
        include_population: true,
        resolution_km: 10.0
      };

      console.log('Simulation request:', simulationRequest);
      
      // Call the simulation API with extended timeout (60 seconds for GeoNames API calls)
      const response = await Promise.race([
        apiClient.simulateImpact(simulationRequest),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Simulation timeout after 60 seconds')), 60000)
        )
      ]) as any;
      
      if (response.error) {
        throw new Error(response.error);
      }

      console.log('Simulation result:', response.data);
      
      // Update the simulation store with results
      // Backend returns {baseline: {...}, deflection: {...}, simulation_metadata: {...}}
      if (response.data && response.data.baseline) {
        console.log('Updating simulation results:', response.data.baseline);
        setBaselineResults(response.data.baseline);
        console.log('Simulation results updated successfully');
      } else {
        console.warn('No baseline data in response:', response);
      }
      
    } catch (error) {
      console.error('Simulation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Simulation failed';
      setSimulationError(errorMessage);
      alert(`模拟失败: ${errorMessage}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleUpdateScenario = () => {
    const scenario = {
      asteroid: {
        id: selectedAsteroid?.id || 'custom',
        name: selectedAsteroid?.name || 'Custom Asteroid',
        diameter,
        density,
        mass,
        isHazardous: selectedAsteroid?.is_potentially_hazardous_asteroid || false,
      },
      impactLatitude,
      impactLongitude,
      impactVelocity,
      impactAngle,
      targetType,
    };

    setScenario(scenario);
  };

  const handleSelectStrategy = (strategyId: string) => {
    if (strategyId === '') {
      // Clear deflection strategy
      setDeflection(null);
      setSelectedStrategy('');
    } else {
      const strategy = availableStrategies.find(s => s.type === strategyId);
      if (strategy) {
        setDeflection(strategy);
        setSelectedStrategy(strategyId);
      }
    }
  };

  return (
    <div className={`controls-panel ${className || ''}`}>
      <div className="panel-section">
        <h3>Select Asteroid</h3>
        <div className="control-group">
          <label>Choose from NASA API:</label>
          {loadingAsteroids ? (
            <div>Loading asteroids...</div>
          ) : (
            <select 
              value={selectedAsteroid?.id || ''} 
              onChange={(e) => {
                const asteroid = asteroids.find(a => a.id === e.target.value);
                if (asteroid) handleAsteroidSelect(asteroid);
              }}
            >
              <option value="">Select an asteroid...</option>
              {asteroids.map((asteroid) => (
                <option key={asteroid.id} value={asteroid.id}>
                  {asteroid.name} - {asteroid.is_potentially_hazardous_asteroid ? '⚠️' : '✅'} 
                  {asteroid.close_approach_data?.[0]?.close_approach_date}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="panel-section">
        <h3>Asteroid Properties</h3>
        
        {selectedAsteroid ? (
          <div className="control-group">
            <label>Selected Asteroid</label>
            <div className="asteroid-info">
              <strong>{selectedAsteroid.name}</strong>
              <p>Diameter: {selectedAsteroid.estimated_diameter?.meters ? 
                `${Math.round((selectedAsteroid.estimated_diameter.meters.estimated_diameter_min + 
                selectedAsteroid.estimated_diameter.meters.estimated_diameter_max) / 2)} m` : 
                'Unknown'}</p>
              {selectedAsteroid.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second && (
                <p>Velocity: {parseFloat(selectedAsteroid.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(1)} km/s</p>
              )}
              {selectedAsteroid.orbital_data?.inclination && (
                <p>Orbital Inclination: {parseFloat(selectedAsteroid.orbital_data.inclination).toFixed(1)}°</p>
              )}
              {selectedAsteroid.orbital_data?.eccentricity && (
                <p>Eccentricity: {parseFloat(selectedAsteroid.orbital_data.eccentricity).toFixed(3)}</p>
              )}
              <p>Hazardous: {selectedAsteroid.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>
                <em>💡 Selecting a new asteroid will use API data and override manual settings</em>
              </p>
            </div>
          </div>
        ) : (
          <div className="control-group">
            <label>Custom Asteroid</label>
            <p className="info-text">No asteroid selected from API</p>
          </div>
        )}
        
        {/* Custom Settings Toggle */}
        <div className="control-group">
          <button
            type="button"
            onClick={() => setShowCustomSettings(!showCustomSettings)}
            className="btn btn-secondary"
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {showCustomSettings ? 'Hide Custom Settings' : 'Show Custom Settings'}
          </button>
        </div>

        {/* Custom Settings - Collapsible */}
        {showCustomSettings && (
          <div className="custom-settings">
            <div className="control-group">
              <label>Diameter (m)</label>
              <input
                type="range"
                min="10"
                max="2000"
                value={diameter}
                onChange={(e) => {
                  const newDiameter = Number(e.target.value);
                  setDiameter(newDiameter);
                  // Recalculate mass when diameter changes
                  const newMass = calculateMass(newDiameter, density);
                  setMass(newMass);
                  console.log('Diameter changed - New diameter:', newDiameter, 'Density:', density, 'New mass:', newMass);
                }}
              />
              <span>{diameter} m</span>
            </div>

            <div className="control-group">
              <label>Density Type</label>
              <select
                value={densityType}
                onChange={(e) => {
                  const newDensityType = e.target.value as keyof typeof ASTEROID_DENSITIES;
                  const newDensity = ASTEROID_DENSITIES[newDensityType];
                  setDensityType(newDensityType);
                  setDensity(newDensity);
                  // Recalculate mass when density changes
                  const newMass = calculateMass(diameter, newDensity);
                  setMass(newMass);
                  console.log('Density changed - Diameter:', diameter, 'New density:', newDensity, 'New mass:', newMass);
                }}
              >
                <option value="stony">Stony (3000 kg/m³)</option>
                <option value="iron">Iron (7800 kg/m³)</option>
                <option value="carbonaceous">Carbonaceous (2000 kg/m³)</option>
              </select>
            </div>

            <div className="control-group">
              <label>Mass</label>
              <div>
                <span>{(mass / 1e9).toFixed(1)} billion kg</span>
                <br />
                <small style={{ opacity: 0.7 }}>
                  Raw: {mass.toExponential(2)} kg
                </small>
              </div>
            </div>

            <div className="control-group">
              <label>Latitude</label>
              <input
                type="number"
                min="-90"
                max="90"
                step="0.1"
                value={impactLatitude}
                onChange={(e) => setImpactLatitude(Number(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label>Longitude</label>
              <input
                type="number"
                min="-180"
                max="180"
                step="0.1"
                value={impactLongitude}
                onChange={(e) => setImpactLongitude(Number(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label>Velocity (m/s)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="range"
                  min="5000"
                  max="50000"
                  step="1000"
                  value={impactVelocity}
                  onChange={(e) => {
                    const newVelocity = Number(e.target.value);
                    setImpactVelocity(newVelocity);
                    setManualVelocitySet(true);
                    console.log('Velocity manually changed to:', newVelocity, 'm/s');
                  }}
                  style={{ flex: 1 }}
                />
                <span>{(impactVelocity / 1000).toFixed(1)} km/s</span>
                {selectedAsteroid && manualVelocitySet && selectedAsteroid.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second && (
                  <button
                    type="button"
                    onClick={() => {
                      const velocityKmS = parseFloat(selectedAsteroid.close_approach_data[0].relative_velocity.kilometers_per_second);
                      setImpactVelocity(Math.round(velocityKmS * 1000));
                      setManualVelocitySet(false);
                      console.log('Reset velocity to API value:', velocityKmS, 'km/s');
                    }}
                    style={{ fontSize: '12px', padding: '2px 6px' }}
                  >
                    Reset to API
                  </button>
                )}
              </div>
            </div>

              <div className="control-group">
                <label>Impact Angle (degrees)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={selectedAsteroid ? "0" : "10"}
                    max="90"
                    step="5"
                    value={impactAngle}
                    onChange={(e) => {
                      const newAngle = Number(e.target.value);
                      setImpactAngle(newAngle);
                      setManualAngleSet(true);
                      console.log('Impact angle manually changed to:', newAngle, 'degrees');
                    }}
                    style={{ flex: 1 }}
                  />
                  <span>{impactAngle}°</span>
                  {selectedAsteroid && manualAngleSet && selectedAsteroid.orbital_data?.inclination && (
                    <button
                      type="button"
                      onClick={() => {
                        const inclination = parseFloat(selectedAsteroid.orbital_data.inclination);
                        const estimatedAngle = Math.min(90, Math.abs(inclination) + 15);
                        setImpactAngle(Math.round(estimatedAngle));
                        setManualAngleSet(false);
                        console.log('Reset angle to orbital calculation:', estimatedAngle, 'degrees');
                      }}
                      style={{ fontSize: '12px', padding: '2px 6px' }}
                    >
                      Reset to API
                    </button>
                  )}
                </div>
              </div>

              <div className="control-group">
                <label>Target Type</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                >
                  <option value="continental_crust">Continental Crust</option>
                  <option value="oceanic_crust">Oceanic Crust</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>

              <div className="control-group">
                <label>Deflection Strategy</label>
                <select
                  value={selectedStrategy}
                  onChange={(e) => handleSelectStrategy(e.target.value)}
                >
                  <option value="">No Deflection</option>
                  {availableStrategies.map((strategy, index) => (
                    <option key={index} value={strategy.type}>
                      {strategy.type.replace('_', ' ').toUpperCase()} - 
                      Δv: {strategy.deltaV} m/s - 
                      Cost: ${(strategy.cost / 1e9).toFixed(1)}B
                    </option>
                  ))}
                </select>
              </div>

              {currentDeflection && (
                <div className="strategy-info">
                  <h4>Selected Strategy</h4>
                  <p>Type: {currentDeflection.type.replace('_', ' ').toUpperCase()}</p>
                  <p>Delta-V: {currentDeflection.deltaV} m/s</p>
                  <p>Cost: ${(currentDeflection.cost / 1e9).toFixed(1)} billion</p>
                  <p>Lead Time: {currentDeflection.leadTimeRequired} days</p>
                </div>
              )}
            </div>
          )}
        </div>

      <div className="panel-section">
        <h3>Simulation Controls</h3>
        
        <button
          onClick={handleUpdateScenario}
          className="btn btn-secondary"
        >
          Update Scenario
        </button>

        <button
          onClick={handleRunSimulation}
          disabled={isSimulating || !currentScenario || !selectedAsteroid}
          className="btn btn-primary"
        >
          {isSimulating ? 'Running...' : selectedAsteroid ? 'Run Simulation' : 'Select Asteroid First'}
        </button>

        {isSimulating && (
          <div className="simulation-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <p>Calculating impact effects...</p>
          </div>
        )}

        {useSimulationStore.getState().simulationError && (
          <div className="error-message">
            <p>Error: {useSimulationStore.getState().simulationError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
