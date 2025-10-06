/**
 * Asteroid Impact & Deflection Simulation Module
 * Advanced physics-based impact analysis with Monte Carlo simulation
 */

// Module variables
let simulationMap = null;
let loadedAsteroids = [];
let selectedAsteroid = null;
let isSimulating = false;

// Physics constants
const ASTEROID_DENSITIES = {
    stony: 3000,
    iron: 7800,
    carbonaceous: 2000
};

const TNT_TO_JOULES = 4.184e15; // 1 megaton TNT in joules
const EARTH_GRAVITY = 9.81; // m/s²
const EARTH_RADIUS = 6371000; // meters
const WATER_DENSITY = 1000; // kg/m³
const ROCK_DENSITY = 2500; // kg/m³

// Initialize module when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Asteroid Impact & Deflection Simulation Module initialized');
    setupSimulationEventListeners();
    loadAsteroids();
    initializeSimulationMap();
});

function setupSimulationEventListeners() {
    // Asteroid selection
    document.getElementById('asteroid-select')?.addEventListener('change', handleAsteroidSelect);
    
    // Parameter controls
    document.getElementById('sim-diameter')?.addEventListener('input', updateSimDiameter);
    document.getElementById('sim-density-type')?.addEventListener('change', updateSimDensity);
    document.getElementById('sim-velocity')?.addEventListener('input', updateSimVelocity);
    document.getElementById('sim-angle')?.addEventListener('input', updateSimAngle);
    document.getElementById('sim-impact-lat')?.addEventListener('input', updateSimImpactLocation);
    document.getElementById('sim-impact-lon')?.addEventListener('input', updateSimImpactLocation);
    document.getElementById('sim-target-type')?.addEventListener('change', updateSimTargetType);
    
    // Deflection controls
    document.getElementById('sim-deflection-strategy')?.addEventListener('change', updateSimDeflectionStrategy);
    document.getElementById('sim-delta-v')?.addEventListener('input', updateSimDeltaV);
    document.getElementById('sim-lead-time')?.addEventListener('input', updateSimLeadTime);
    document.getElementById('sim-runs')?.addEventListener('input', updateSimRuns);
    
    // Simulation button
    document.getElementById('run-simulation-analysis')?.addEventListener('click', runSimulationAnalysis);
}

// Physics calculation functions
function calculateMass(diameter, density) {
    const radius = diameter / 2;
    const volume = (4/3) * Math.PI * radius * radius * radius;
    const mass = density * volume;
    return mass;
}

function calculateKineticEnergy(mass, velocity) {
    return 0.5 * mass * velocity * velocity;
}

function calculateTntEquivalent(energy) {
    return energy / TNT_TO_JOULES;
}

function calculateCraterDiameter(energy, angle, targetDensity = ROCK_DENSITY) {
    const angleRad = angle * Math.PI / 180;
    // Pi-scaling law for crater diameter
    const energyDensity = energy / (targetDensity * EARTH_GRAVITY);
    const diameter = 1.25 * Math.pow(energyDensity, 1/4) * Math.pow(Math.sin(angleRad), 1/3);
    const depth = diameter / 4;
    return { 
        diameter: Math.max(10, diameter), // Minimum 10m diameter
        depth: Math.max(2, depth) // Minimum 2m depth
    };
}

function calculateSeismicMagnitude(energy) {
    // Convert energy to seismic moment (Nm)
    const seismicMoment = energy * 0.01; // 1% efficiency
    // Calculate moment magnitude
    const magnitude = (2/3) * Math.log10(seismicMoment) - 10.7;
    return Math.max(0, Math.min(10, magnitude)); // Clamp between 0-10
}

function calculateTsunamiHeight(energy, waterDepth = 4000, distanceToShore = 100000) {
    const tsunamiEnergy = energy * 0.1; // 10% efficiency
    const impactArea = Math.PI * 1000 * 1000; // 1km radius
    const energyDensity = tsunamiEnergy / impactArea;
    const initialHeight = 0.1 * Math.sqrt(energyDensity / (WATER_DENSITY * EARTH_GRAVITY));
    
    if (distanceToShore > 0) {
        const geometricFactor = 1 / Math.sqrt(distanceToShore / 1000);
        const dissipationFactor = Math.exp(-distanceToShore / (100 * 1000));
        const shoreAmplification = 1 / Math.sqrt(0.01);
        return Math.max(0, initialHeight * geometricFactor * dissipationFactor * shoreAmplification);
    }
    
    return Math.max(0, initialHeight);
}

function calculatePeakGroundAcceleration(magnitude, distance) {
    const pga = Math.pow(10, magnitude - 1.5 * Math.log10(distance) - 0.01 * distance);
    return pga;
}

// Deflection physics calculations
function calculateDeflectionEffect(deltaV, leadTime, asteroidMass) {
    // Simplified deflection calculation
    const deflectionDistance = deltaV * leadTime * 365.25 * 24 * 3600; // Convert years to seconds
    return deflectionDistance;
}

function calculateMissDistance(deflectionEffect, impactVelocity) {
    // Calculate how much the asteroid will miss Earth
    const timeToImpact = EARTH_RADIUS / impactVelocity;
    const missDistance = deflectionEffect * timeToImpact;
    return missDistance;
}

// Event handlers
function handleAsteroidSelect(event) {
    const asteroidId = event.target.value;
    if (asteroidId) {
        const asteroid = loadedAsteroids.find(a => a.id === asteroidId);
        if (asteroid) {
            selectedAsteroid = asteroid;
            updateAsteroidParameters(asteroid);
            showAsteroidInfo(asteroid);
        }
    } else {
        selectedAsteroid = null;
        hideAsteroidInfo();
    }
}

function updateAsteroidParameters(asteroid) {
    console.log('Updating asteroid parameters:', asteroid);
    
    // Update diameter
    if (asteroid.estimated_diameter && asteroid.estimated_diameter.meters) {
        const avgDiameter = (asteroid.estimated_diameter.meters.estimated_diameter_min + 
                            asteroid.estimated_diameter.meters.estimated_diameter_max) / 2;
        const diameterInput = document.getElementById('sim-diameter');
        diameterInput.value = Math.round(avgDiameter);
        updateSimDiameter();
    }
    
    // Update velocity
    if (asteroid.close_approach_data && asteroid.close_approach_data.length > 0) {
        const approach = asteroid.close_approach_data[0];
        if (approach.relative_velocity && approach.relative_velocity.kilometers_per_second) {
            const velocityKmS = parseFloat(approach.relative_velocity.kilometers_per_second);
            const velocityMs = velocityKmS * 1000;
            document.getElementById('sim-velocity').value = Math.round(velocityMs);
            updateSimVelocity();
        }
    }
    
    // Update impact angle based on orbital inclination
    if (asteroid.orbital_data && asteroid.orbital_data.inclination) {
        const inclination = parseFloat(asteroid.orbital_data.inclination);
        const estimatedAngle = Math.min(90, Math.max(10, Math.abs(inclination) + 15));
        document.getElementById('sim-angle').value = Math.round(estimatedAngle);
        updateSimAngle();
    }
    
    // Update density based on asteroid type
    if (asteroid.asteroid_type) {
        const densitySelect = document.getElementById('sim-density-type');
        if (asteroid.asteroid_type.toLowerCase().includes('iron')) {
            densitySelect.value = 'iron';
        } else if (asteroid.asteroid_type.toLowerCase().includes('carbonaceous')) {
            densitySelect.value = 'carbonaceous';
        } else {
            densitySelect.value = 'stony';
        }
        updateSimDensity();
    }
}

function showAsteroidInfo(asteroid) {
    const infoDiv = document.getElementById('selected-asteroid-info');
    const detailsDiv = document.getElementById('asteroid-details');
    
    let details = `<strong>${asteroid.name}</strong>`;
    
    if (asteroid.estimated_diameter && asteroid.estimated_diameter.meters) {
        const avgDiameter = (asteroid.estimated_diameter.meters.estimated_diameter_min + 
                            asteroid.estimated_diameter.meters.estimated_diameter_max) / 2;
        details += `<p>Diameter: ${Math.round(avgDiameter)} m</p>`;
    }
    
    if (asteroid.close_approach_data && asteroid.close_approach_data.length > 0) {
        const approach = asteroid.close_approach_data[0];
        if (approach.relative_velocity && approach.relative_velocity.kilometers_per_second) {
            const velocityKmS = parseFloat(approach.relative_velocity.kilometers_per_second);
            details += `<p>Velocity: ${velocityKmS.toFixed(1)} km/s</p>`;
        }
    }
    
    if (asteroid.orbital_data && asteroid.orbital_data.inclination) {
        const inclination = parseFloat(asteroid.orbital_data.inclination);
        details += `<p>Orbital Inclination: ${inclination.toFixed(1)}°</p>`;
    }
    
    details += `<p>Hazardous: ${asteroid.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}</p>`;
    
    detailsDiv.innerHTML = details;
    infoDiv.style.display = 'block';
}

function hideAsteroidInfo() {
    document.getElementById('selected-asteroid-info').style.display = 'none';
}

function updateSimDiameter() {
    const diameter = document.getElementById('sim-diameter').value;
    document.getElementById('sim-diameter-value').textContent = diameter + ' m';
    updateSimMass();
}

function updateSimDensity() {
    updateSimMass();
}

function updateSimMass() {
    const diameter = parseFloat(document.getElementById('sim-diameter').value);
    const densityType = document.getElementById('sim-density-type').value;
    const density = ASTEROID_DENSITIES[densityType];
    const mass = calculateMass(diameter, density);
    
    document.getElementById('sim-mass-display').innerHTML = 
        `<strong>${(mass / 1e9).toFixed(1)} billion kg</strong><br>
         <small>Raw: ${mass.toExponential(2)} kg</small>`;
}

function updateSimVelocity() {
    const velocity = document.getElementById('sim-velocity').value;
    document.getElementById('sim-velocity-value').textContent = (velocity / 1000).toFixed(1) + ' km/s';
}

function updateSimAngle() {
    const angle = document.getElementById('sim-angle').value;
    document.getElementById('sim-angle-value').textContent = angle + '°';
}

function updateSimImpactLocation() {
    // Could add map interaction here
}

function updateSimTargetType() {
    // Target type changed
}

function updateSimDeflectionStrategy() {
    const strategy = document.getElementById('sim-deflection-strategy').value;
    const deltaVGroup = document.getElementById('sim-delta-v').parentElement;
    const leadTimeGroup = document.getElementById('sim-lead-time').parentElement;
    
    if (strategy) {
        deltaVGroup.classList.add('deflection-active');
        leadTimeGroup.classList.add('deflection-active');
    } else {
        deltaVGroup.classList.remove('deflection-active');
        leadTimeGroup.classList.remove('deflection-active');
    }
}

function updateSimDeltaV() {
    const deltaV = document.getElementById('sim-delta-v').value;
    document.getElementById('sim-delta-v-value').textContent = deltaV + ' m/s';
}

function updateSimLeadTime() {
    const leadTime = document.getElementById('sim-lead-time').value;
    document.getElementById('sim-lead-time-value').textContent = leadTime + ' years';
}

function updateSimRuns() {
    // Monte Carlo runs changed
}

// Load asteroids for simulation
async function loadAsteroids() {
    const loadingDiv = document.getElementById('asteroid-loading');
    const select = document.getElementById('asteroid-select');
    
    loadingDiv.style.display = 'block';
    
    try {
        // Try to load from NASA API
        const response = await fetch('../api/neo-feed?startDate=2024-01-01&endDate=2024-01-07');
        if (response.ok) {
            const data = await response.json();
            loadedAsteroids = data;
            populateAsteroidSelect(data);
        } else {
            // Fallback to sample data
            loadedAsteroids = getSampleAsteroids();
            populateAsteroidSelect(loadedAsteroids);
        }
    } catch (error) {
        console.error('Failed to load asteroids:', error);
        loadedAsteroids = getSampleAsteroids();
        populateAsteroidSelect(loadedAsteroids);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function getSampleAsteroids() {
    return [
        {
            id: '2000433',
            name: '2000433 (2006 QQ23)',
            is_potentially_hazardous_asteroid: true,
            asteroid_type: 'stony',
            estimated_diameter: {
                meters: {
                    estimated_diameter_min: 250,
                    estimated_diameter_max: 560
                }
            },
            close_approach_data: [{
                close_approach_date: '2024-11-15',
                relative_velocity: {
                    kilometers_per_second: '15.2'
                }
            }],
            orbital_data: {
                semi_major_axis: '1.2',
                eccentricity: '0.3',
                inclination: '15.5'
            }
        },
        {
            id: '2001620',
            name: '2001620 (2007 DB)',
            is_potentially_hazardous_asteroid: false,
            asteroid_type: 'carbonaceous',
            estimated_diameter: {
                meters: {
                    estimated_diameter_min: 100,
                    estimated_diameter_max: 220
                }
            },
            close_approach_data: [{
                close_approach_date: '2024-12-01',
                relative_velocity: {
                    kilometers_per_second: '12.8'
                }
            }],
            orbital_data: {
                semi_major_axis: '1.5',
                eccentricity: '0.25',
                inclination: '8.2'
            }
        },
        {
            id: '2000001',
            name: '2000001 (Iron Asteroid)',
            is_potentially_hazardous_asteroid: true,
            asteroid_type: 'iron',
            estimated_diameter: {
                meters: {
                    estimated_diameter_min: 50,
                    estimated_diameter_max: 120
                }
            },
            close_approach_data: [{
                close_approach_date: '2024-10-20',
                relative_velocity: {
                    kilometers_per_second: '20.5'
                }
            }],
            orbital_data: {
                semi_major_axis: '1.1',
                eccentricity: '0.4',
                inclination: '25.0'
            }
        }
    ];
}

function populateAsteroidSelect(asteroids) {
    const select = document.getElementById('asteroid-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select an asteroid...</option>';
    
    asteroids.forEach(asteroid => {
        const option = document.createElement('option');
        option.value = asteroid.id;
        option.textContent = `${asteroid.name} - ${asteroid.is_potentially_hazardous_asteroid ? '⚠️' : '✅'}`;
        select.appendChild(option);
    });
}

// Run simulation analysis
async function runSimulationAnalysis() {
    if (isSimulating) return;
    
    isSimulating = true;
    document.getElementById('simulation-progress').style.display = 'block';
    document.getElementById('run-simulation-analysis').disabled = true;
    
    try {
        // Get parameters
        const diameter = parseInt(document.getElementById('sim-diameter').value);
        const densityType = document.getElementById('sim-density-type').value;
        const density = ASTEROID_DENSITIES[densityType];
        const velocity = parseInt(document.getElementById('sim-velocity').value);
        const angle = parseInt(document.getElementById('sim-angle').value);
        const impactLat = parseFloat(document.getElementById('sim-impact-lat').value);
        const impactLon = parseFloat(document.getElementById('sim-impact-lon').value);
        const targetType = document.getElementById('sim-target-type').value;
        const deflectionStrategy = document.getElementById('sim-deflection-strategy').value;
        const deltaV = parseFloat(document.getElementById('sim-delta-v').value);
        const leadTime = parseInt(document.getElementById('sim-lead-time').value);
        const runs = parseInt(document.getElementById('sim-runs').value);
        
        // Calculate impact effects
        const mass = calculateMass(diameter, density);
        const energy = calculateKineticEnergy(mass, velocity);
        const tntEquivalent = calculateTntEquivalent(energy);
        const crater = calculateCraterDiameter(energy, angle);
        const seismicMagnitude = calculateSeismicMagnitude(energy);
        
        // Calculate tsunami height if ocean impact
        let tsunamiHeight = 0;
        if (targetType === 'ocean' || targetType === 'oceanic_crust') {
            tsunamiHeight = calculateTsunamiHeight(energy);
        }
        
        // Calculate peak ground acceleration
        const pga100km = calculatePeakGroundAcceleration(seismicMagnitude, 100000);
        
        // Calculate deflection effects if strategy is selected
        let deflectionEffect = 0;
        let missDistance = 0;
        if (deflectionStrategy) {
            deflectionEffect = calculateDeflectionEffect(deltaV, leadTime, mass);
            missDistance = calculateMissDistance(deflectionEffect, velocity);
        }
        
        // Run Monte Carlo simulation
        const monteCarloResults = await runMonteCarloSimulation({
            diameter, density, velocity, angle, impactLat, impactLon,
            deflectionStrategy, deltaV, leadTime, runs
        });
        
        // Display results
        displaySimulationResults({
            mass, energy, tntEquivalent, crater, seismicMagnitude, 
            tsunamiHeight, pga100km, impactLat, impactLon,
            deflectionEffect, missDistance
        });
        
        // Display Monte Carlo results
        displayMonteCarloResults(monteCarloResults);
        
        // Update map
        updateSimulationMap(impactLat, impactLon, crater.diameter);
        
    } catch (error) {
        console.error('Simulation failed:', error);
        alert('Simulation failed: ' + error.message);
    } finally {
        isSimulating = false;
        document.getElementById('simulation-progress').style.display = 'none';
        document.getElementById('run-simulation-analysis').disabled = false;
    }
}

function runMonteCarloSimulation(params) {
    return new Promise((resolve) => {
        const { diameter, density, velocity, angle, impactLat, impactLon, deflectionStrategy, deltaV, leadTime, runs } = params;
        
        const results = [];
        const batchSize = 100;
        let completed = 0;
        
        const processBatch = () => {
            const batchResults = [];
            for (let i = 0; i < batchSize && completed < runs; i++) {
                // Add random variations
                const randomDiameter = diameter * (0.8 + Math.random() * 0.4); // ±20%
                const randomVelocity = velocity * (0.9 + Math.random() * 0.2); // ±10%
                const randomAngle = angle * (0.8 + Math.random() * 0.4); // ±20%
                
                // Calculate impact point with noise
                const noiseX = (Math.random() - 0.5) * 6; // ±3km noise
                const noiseY = (Math.random() - 0.5) * 4; // ±2km noise
                
                const impactX = impactLat + noiseX;
                const impactY = impactLon + noiseY;
                
                // Calculate deflection effects if strategy is selected
                let deflectionEffect = 0;
                if (deflectionStrategy) {
                    deflectionEffect = deltaV * leadTime * 1000; // Simplified deflection calculation
                }
                
                batchResults.push({
                    impactX,
                    impactY,
                    deflectionEffect,
                    diameter: randomDiameter,
                    velocity: randomVelocity,
                    angle: randomAngle
                });
                
                completed++;
            }
            
            results.push(...batchResults);
            
            if (completed < runs) {
                setTimeout(processBatch, 10); // Small delay for UI responsiveness
            } else {
                resolve(calculateStatisticalSummary(results));
            }
        };
        
        processBatch();
    });
}

function calculateStatisticalSummary(results) {
    const impactPoints = results.map(r => ({ x: r.impactX, y: r.impactY }));
    const deflectionEffects = results.map(r => r.deflectionEffect);
    
    // Calculate statistics
    const meanX = impactPoints.reduce((sum, p) => sum + p.x, 0) / impactPoints.length;
    const meanY = impactPoints.reduce((sum, p) => sum + p.y, 0) / impactPoints.length;
    
    const varianceX = impactPoints.reduce((sum, p) => sum + Math.pow(p.x - meanX, 2), 0) / impactPoints.length;
    const varianceY = impactPoints.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0) / impactPoints.length;
    
    const covarianceXY = impactPoints.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0) / impactPoints.length;
    
    const meanDeflection = deflectionEffects.reduce((sum, d) => sum + d, 0) / deflectionEffects.length;
    
    return {
        impactPoints,
        meanX,
        meanY,
        varianceX,
        varianceY,
        covarianceXY,
        meanDeflection,
        totalRuns: results.length
    };
}

function displaySimulationResults(results) {
    const { mass, energy, tntEquivalent, crater, seismicMagnitude, tsunamiHeight, pga100km, impactLat, impactLon, deflectionEffect, missDistance } = results;
    
    const container = document.getElementById('simulation-outcome-cards');
    if (!container) return;
    
    const formatNumber = (num, decimals = 1) => {
        if (num === undefined || num === null || isNaN(num)) return 'N/A';
        if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`;
        if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
        return num.toFixed(decimals);
    };
    
    const formatDistance = (meters) => {
        if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
        return `${meters.toFixed(0)} m`;
    };
    
    const formatEnergy = (joules) => {
        if (joules >= 1e21) return `${(joules / 1e21).toFixed(1)} ZJ`;
        if (joules >= 1e18) return `${(joules / 1e18).toFixed(1)} EJ`;
        if (joules >= 1e15) return `${(joules / 1e15).toFixed(1)} PJ`;
        return `${(joules / 1e12).toFixed(1)} TJ`;
    };
    
    container.innerHTML = `
        <div class="outcome-card energy">
            <div class="card-icon">💥</div>
            <div class="card-content">
                <h3>Impact Energy</h3>
                <div class="card-value">${formatEnergy(energy)}</div>
                <div class="card-subtitle">${formatNumber(tntEquivalent)} MT TNT</div>
            </div>
        </div>
        
        <div class="outcome-card crater">
            <div class="card-icon">🕳️</div>
            <div class="card-content">
                <h3>Crater Diameter</h3>
                <div class="card-value">${formatDistance(crater.diameter)}</div>
                <div class="card-subtitle">Depth: ${formatDistance(crater.depth)}</div>
            </div>
        </div>
        
        <div class="outcome-card seismic">
            <div class="card-icon">🌍</div>
            <div class="card-content">
                <h3>Seismic Magnitude</h3>
                <div class="card-value">${seismicMagnitude.toFixed(1)}</div>
                <div class="card-subtitle">PGA: ${pga100km.toFixed(2)} m/s²</div>
            </div>
        </div>
        
        ${tsunamiHeight > 0 ? `
        <div class="outcome-card tsunami">
            <div class="card-icon">🌊</div>
            <div class="card-content">
                <h3>Tsunami Height</h3>
                <div class="card-value">${tsunamiHeight.toFixed(1)} m</div>
                <div class="card-subtitle">Maximum wave height</div>
            </div>
        </div>
        ` : ''}
        
        ${deflectionEffect > 0 ? `
        <div class="outcome-card deflection">
            <div class="card-icon">🚀</div>
            <div class="card-content">
                <h3>Deflection Effect</h3>
                <div class="card-value">${formatDistance(deflectionEffect)}</div>
                <div class="card-subtitle">Miss Distance: ${formatDistance(missDistance)}</div>
            </div>
        </div>
        ` : ''}
        
        <div class="outcome-card location">
            <div class="card-icon">📍</div>
            <div class="card-content">
                <h3>Impact Location</h3>
                <div class="card-value">${impactLat.toFixed(2)}°, ${impactLon.toFixed(2)}°</div>
                <div class="card-subtitle">Latitude, Longitude</div>
            </div>
        </div>
    `;
}

function displayMonteCarloResults(results) {
    const container = document.getElementById('monte-carlo-results');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = `
        <h4>Monte Carlo Analysis Results</h4>
        <div class="statistical-summary">
            <div class="stat-item">
                <h4>Total Runs</h4>
                <p>${results.totalRuns}</p>
            </div>
            <div class="stat-item">
                <h4>Mean Impact Point</h4>
                <p>(${results.meanX.toFixed(2)}, ${results.meanY.toFixed(2)})</p>
            </div>
            <div class="stat-item">
                <h4>Variance</h4>
                <p>X: ${results.varianceX.toFixed(2)}<br>Y: ${results.varianceY.toFixed(2)}</p>
            </div>
            <div class="stat-item">
                <h4>Covariance</h4>
                <p>${results.covarianceXY.toFixed(2)}</p>
            </div>
            <div class="stat-item">
                <h4>Mean Deflection</h4>
                <p>${results.meanDeflection.toFixed(4)}</p>
            </div>
        </div>
    `;
}

// Initialize simulation map
function initializeSimulationMap() {
    const mapContainer = document.getElementById('simulation-map');
    if (!mapContainer || simulationMap) return;
    
    try {
        simulationMap = L.map('simulation-map', {
            center: [40.7128, -74.0060],
            zoom: 6,
            zoomControl: true,
            attributionControl: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(simulationMap);
        
        console.log('Simulation map initialized');
    } catch (error) {
        console.error('Failed to initialize simulation map:', error);
    }
}

function updateSimulationMap(lat, lon, craterDiameter) {
    if (!simulationMap) return;
    
    simulationMap.setView([lat, lon], 8);
    
    // Clear existing markers
    simulationMap.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
            simulationMap.removeLayer(layer);
        }
    });
    
    // Add impact marker
    const impactMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            className: 'impact-marker',
            html: '<div style="background-color: #ff0000; border-radius: 50%; width: 20px; height: 20px; border: 3px solid white; animation: pulse 2s infinite;"></div>',
            iconSize: [20, 20]
        })
    }).addTo(simulationMap);
    
    impactMarker.bindPopup(`<b>Impact Location</b><br>Lat: ${lat.toFixed(4)}°<br>Lon: ${lon.toFixed(4)}°`);
    
    // Add impact circle based on crater diameter
    const radius = craterDiameter / 2; // Convert diameter to radius
    L.circle([lat, lon], {
        color: '#ff0000',
        fillColor: '#ff0000',
        fillOpacity: 0.1,
        radius: radius
    }).addTo(simulationMap);
}
