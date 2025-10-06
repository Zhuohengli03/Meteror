/**
 * Asteroid Impact Prediction Module
 * Standalone module for asteroid impact analysis and visualization
 */

// Module variables
let predictionMap = null;
let predictionGlobe = null;
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
    console.log('Asteroid Impact Prediction Module initialized');
    setupEventListeners();
    loadAsteroids();
    initializeVisualizations();
});

function setupEventListeners() {
    // Asteroid selection
    document.getElementById('asteroid-select')?.addEventListener('change', handleAsteroidSelect);
    
    // Parameter controls
    document.getElementById('diameter')?.addEventListener('input', updateDiameter);
    document.getElementById('density-type')?.addEventListener('change', updateDensity);
    document.getElementById('velocity')?.addEventListener('input', updateVelocity);
    document.getElementById('angle')?.addEventListener('input', updateAngle);
    document.getElementById('impact-lat')?.addEventListener('input', updateImpactLocation);
    document.getElementById('impact-lon')?.addEventListener('input', updateImpactLocation);
    document.getElementById('target-type')?.addEventListener('change', updateTargetType);
    
    // Simulation button
    document.getElementById('run-simulation')?.addEventListener('click', runSimulation);
}

// Physics calculation functions
function calculateMass(diameter, density) {
    const radius = diameter / 2;
    const volume = (4/3) * Math.PI * radius * radius * radius;
    const mass = density * volume;
    console.log('Mass calculation:', {
        diameter, radius, volume, density, mass
    });
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

// Event handlers
function handleAsteroidSelect(event) {
    const asteroidId = event.target.value;
    if (asteroidId) {
        // Find asteroid in loaded data
        const asteroid = loadedAsteroids.find(a => a.id === asteroidId);
        if (asteroid) {
            selectedAsteroid = asteroid;
            updateAsteroidParameters(asteroid);
        }
    } else {
        selectedAsteroid = null;
        resetAsteroidParameters();
    }
}

function updateAsteroidParameters(asteroid) {
    console.log('Updating asteroid parameters:', asteroid);
    
    // Update diameter
    if (asteroid.estimated_diameter && asteroid.estimated_diameter.meters) {
        const avgDiameter = (asteroid.estimated_diameter.meters.estimated_diameter_min + 
                            asteroid.estimated_diameter.meters.estimated_diameter_max) / 2;
        const diameterInput = document.getElementById('diameter');
        diameterInput.value = Math.round(avgDiameter);
        diameterInput.min = Math.round(asteroid.estimated_diameter.meters.estimated_diameter_min);
        diameterInput.max = Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max);
        updateDiameter();
        console.log('Updated diameter to:', avgDiameter);
    }
    
    // Update velocity
    if (asteroid.close_approach_data && asteroid.close_approach_data.length > 0) {
        const approach = asteroid.close_approach_data[0];
        if (approach.relative_velocity && approach.relative_velocity.kilometers_per_second) {
            const velocityKmS = parseFloat(approach.relative_velocity.kilometers_per_second);
            const velocityMs = velocityKmS * 1000;
            document.getElementById('velocity').value = Math.round(velocityMs);
            updateVelocity();
            console.log('Updated velocity to:', velocityMs);
        }
    }
    
    // Update impact angle based on orbital inclination
    if (asteroid.orbital_data && asteroid.orbital_data.inclination) {
        const inclination = parseFloat(asteroid.orbital_data.inclination);
        // Convert orbital inclination to impact angle (simplified)
        const estimatedAngle = Math.min(90, Math.max(10, Math.abs(inclination) + 15));
        document.getElementById('angle').value = Math.round(estimatedAngle);
        updateAngle();
        console.log('Updated angle to:', estimatedAngle);
    }
    
    // Update density based on asteroid type (if available)
    if (asteroid.asteroid_type) {
        const densitySelect = document.getElementById('density-type');
        if (asteroid.asteroid_type.toLowerCase().includes('iron')) {
            densitySelect.value = 'iron';
        } else if (asteroid.asteroid_type.toLowerCase().includes('carbonaceous')) {
            densitySelect.value = 'carbonaceous';
        } else {
            densitySelect.value = 'stony';
        }
        updateDensity();
        console.log('Updated density type to:', densitySelect.value);
    }
    
    // Update mass display
    updateMass();
    
    // Show asteroid info
    showAsteroidInfo(asteroid);
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

function resetAsteroidParameters() {
    document.getElementById('diameter').value = 500;
    document.getElementById('velocity').value = 15000;
    document.getElementById('angle').value = 45;
    updateDiameter();
    updateVelocity();
    updateAngle();
    updateMass();
    
    // Hide asteroid info
    document.getElementById('selected-asteroid-info').style.display = 'none';
}

function updateDiameter() {
    const diameter = document.getElementById('diameter').value;
    document.getElementById('diameter-value').textContent = diameter + ' m';
    updateMass();
}

function updateDensity() {
    updateMass();
}

function updateMass() {
    const diameter = parseFloat(document.getElementById('diameter').value);
    const densityType = document.getElementById('density-type').value;
    const density = ASTEROID_DENSITIES[densityType];
    const mass = calculateMass(diameter, density);
    
    document.getElementById('mass-display').innerHTML = 
        `<strong>${(mass / 1e9).toFixed(1)} billion kg</strong><br>
         <small>Raw: ${mass.toExponential(2)} kg</small>`;
}

function updateVelocity() {
    const velocity = document.getElementById('velocity').value;
    document.getElementById('velocity-value').textContent = (velocity / 1000).toFixed(1) + ' km/s';
}

function updateAngle() {
    const angle = document.getElementById('angle').value;
    document.getElementById('angle-value').textContent = angle + '°';
}

function updateImpactLocation() {
    // Could add map interaction here
}

function updateTargetType() {
    // Target type changed
}

// Load asteroids for prediction tab
async function loadAsteroids() {
    if (loadedAsteroids.length > 0) return; // Already loaded
    
    const loadingDiv = document.getElementById('asteroid-loading');
    loadingDiv.style.display = 'block';
    
    try {
        // Try to load from NASA API (using relative path to main server)
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
    
    select.innerHTML = '<option value="">Choose an asteroid...</option>';
    
    asteroids.forEach(asteroid => {
        const option = document.createElement('option');
        option.value = asteroid.id;
        option.textContent = `${asteroid.name} - ${asteroid.is_potentially_hazardous_asteroid ? '⚠️' : '✅'}`;
        select.appendChild(option);
    });
}

// Run simulation
async function runSimulation() {
    if (isSimulating) return;
    
    isSimulating = true;
    document.getElementById('simulation-progress').style.display = 'block';
    document.getElementById('run-simulation').disabled = true;
    
    try {
        // Get parameters with validation
        const diameter = parseFloat(document.getElementById('diameter').value);
        const densityType = document.getElementById('density-type').value;
        const density = ASTEROID_DENSITIES[densityType];
        const velocity = parseFloat(document.getElementById('velocity').value);
        const angle = parseFloat(document.getElementById('angle').value);
        const targetType = document.getElementById('target-type').value;
        const impactLat = parseFloat(document.getElementById('impact-lat').value);
        const impactLon = parseFloat(document.getElementById('impact-lon').value);
        
        // Validate parameters
        if (isNaN(diameter) || diameter <= 0) {
            throw new Error('Invalid diameter value');
        }
        if (isNaN(velocity) || velocity <= 0) {
            throw new Error('Invalid velocity value');
        }
        if (isNaN(angle) || angle < 0 || angle > 90) {
            throw new Error('Invalid impact angle (must be 0-90 degrees)');
        }
        if (isNaN(impactLat) || impactLat < -90 || impactLat > 90) {
            throw new Error('Invalid latitude (must be -90 to 90 degrees)');
        }
        if (isNaN(impactLon) || impactLon < -180 || impactLon > 180) {
            throw new Error('Invalid longitude (must be -180 to 180 degrees)');
        }
        if (!density || density <= 0) {
            throw new Error('Invalid density type selected');
        }
        
        console.log('Simulation parameters:', {
            diameter, density, velocity, angle, targetType, impactLat, impactLon
        });
        
        // Calculate mass first
        const mass = calculateMass(diameter, density);
        console.log('Calculated mass:', mass, 'kg');
        
        // Calculate impact effects using improved physics
        const energy = calculateKineticEnergy(mass, velocity);
        const tntEquivalent = calculateTntEquivalent(energy);
        const crater = calculateCraterDiameter(energy, angle);
        const seismicMagnitude = calculateSeismicMagnitude(energy);
        
        let tsunamiHeight = null;
        if (targetType === 'ocean' || targetType === 'oceanic_crust') {
            tsunamiHeight = calculateTsunamiHeight(energy);
        }
        
        const peakGroundAcceleration = calculatePeakGroundAcceleration(seismicMagnitude, 10);
        
        // Create results object with calculated values
        const results = {
            impact_energy_joules: energy,
            tnt_equivalent_megatons: tntEquivalent,
            crater_diameter_m: crater.diameter,
            crater_depth_m: crater.depth,
            seismic_magnitude: seismicMagnitude,
            tsunami_height_m: tsunamiHeight,
            peak_ground_acceleration: peakGroundAcceleration,
            exposed_population: Math.round(energy / 1e15), // Simplified population estimate
            affected_cities: [], // Simplified
            estimated_damage_usd: Math.round(energy / 1e12), // Simplified damage estimate
            uncertainty_bounds: {
                crater_diameter: [crater.diameter * 0.8, crater.diameter * 1.2],
                seismic_magnitude: [seismicMagnitude - 0.5, seismicMagnitude + 0.5],
                tsunami_height: tsunamiHeight ? [tsunamiHeight * 0.5, tsunamiHeight * 2.0] : [0, 0]
            }
        };
        
        console.log('Simulation results:', results);
        
        // Display results
        displayOutcomeCards(results);
        
        // Update visualizations
        updatePredictionVisualizations(impactLat, impactLon, results);
        
    } catch (error) {
        console.error('Simulation failed:', error);
        alert('Simulation failed: ' + error.message);
    } finally {
        isSimulating = false;
        document.getElementById('simulation-progress').style.display = 'none';
        document.getElementById('run-simulation').disabled = false;
    }
}

function displayOutcomeCards(results) {
    const container = document.getElementById('outcome-cards');
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
        <div class="cards-grid">
            <div class="outcome-card energy">
                <div class="card-icon">💥</div>
                <div class="card-content">
                    <h3>Impact Energy</h3>
                    <div class="card-value">${formatEnergy(results.impact_energy_joules)}</div>
                    <div class="card-subtitle">${formatNumber(results.tnt_equivalent_megatons)} MT TNT</div>
                </div>
            </div>
            
            <div class="outcome-card crater">
                <div class="card-icon">🕳️</div>
                <div class="card-content">
                    <h3>Crater Diameter</h3>
                    <div class="card-value">${formatDistance(results.crater_diameter_m)}</div>
                    <div class="card-subtitle">Depth: ${formatDistance(results.crater_depth_m)}</div>
                </div>
            </div>
            
            <div class="outcome-card seismic">
                <div class="card-icon">🌍</div>
                <div class="card-content">
                    <h3>Seismic Magnitude</h3>
                    <div class="card-value">${results.seismic_magnitude.toFixed(1)}</div>
                    <div class="card-subtitle">PGA: ${results.peak_ground_acceleration.toFixed(2)} m/s²</div>
                </div>
            </div>
            
            ${results.tsunami_height_m ? `
            <div class="outcome-card tsunami">
                <div class="card-icon">🌊</div>
                <div class="card-content">
                    <h3>Tsunami Height</h3>
                    <div class="card-value">${results.tsunami_height_m.toFixed(1)} m</div>
                    <div class="card-subtitle">Maximum wave height</div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// Visualization functions
function initializeVisualizations() {
    initializePredictionMap();
    initializePredictionGlobe();
}

function initializePredictionMap() {
    const mapContainer = document.getElementById('impact-map');
    if (!mapContainer || predictionMap) return;
    
    try {
        predictionMap = L.map('impact-map', {
            center: [40.7128, -74.0060],
            zoom: 6,
            zoomControl: true,
            attributionControl: true
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(predictionMap);
        
        // Add impact marker
        const impactMarker = L.marker([40.7128, -74.0060], {
            icon: L.divIcon({
                className: 'impact-marker',
                html: '<div style="background-color: #ff0000; border-radius: 50%; width: 20px; height: 20px; border: 3px solid white; animation: pulse 2s infinite;"></div>',
                iconSize: [20, 20]
            })
        }).addTo(predictionMap);
        
        impactMarker.bindPopup('<b>Impact Location</b><br>Lat: 40.7128°<br>Lon: -74.0060°');
        
        // Add impact circle
        const impactCircle = L.circle([40.7128, -74.0060], {
            color: '#ff0000',
            fillColor: '#ff0000',
            fillOpacity: 0.1,
            radius: 50000 // 50km radius
        }).addTo(predictionMap);
        
        console.log('Prediction map initialized');
    } catch (error) {
        console.error('Failed to initialize prediction map:', error);
    }
}

function initializePredictionGlobe() {
    const globeContainer = document.getElementById('globe-3d');
    if (!globeContainer || predictionGlobe) return;
    
    try {
        // Clear container
        globeContainer.innerHTML = '';
        
        // Create Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        // Set up renderer
        renderer.setSize(300, 300);
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        globeContainer.appendChild(renderer.domElement);
        
        // Create Earth geometry
        const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
        
        // Create Earth material with realistic ocean color
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x1e3a8a, // Deep blue ocean
            shininess: 100,
            transparent: false
        });
        
        // Create Earth mesh
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.castShadow = true;
        earth.receiveShadow = true;
        scene.add(earth);
        
        // Add atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(1.1, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x4facfe,
            transparent: true,
            opacity: 0.1
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        scene.add(atmosphere);
        
        // Add clouds
        const cloudGeometry = new THREE.SphereGeometry(1.05, 32, 32);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2
        });
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        scene.add(clouds);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 3, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        
        // Position camera
        camera.position.z = 3;
        
        // Add impact point
        const impactGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const impactMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        const impactPoint = new THREE.Mesh(impactGeometry, impactMaterial);
        impactPoint.position.set(0.7, 0.2, 0.7); // Position on Earth surface
        scene.add(impactPoint);
        
        // Add interactive controls
        let isMouseDown = false;
        let mouseX = 0, mouseY = 0;
        let targetRotationX = 0, targetRotationY = 0;
        let rotationX = 0, rotationY = 0;
        
        // Mouse event handlers
        renderer.domElement.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        });
        
        renderer.domElement.addEventListener('mousemove', (event) => {
            if (!isMouseDown) return;
            
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        });
        
        renderer.domElement.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        renderer.domElement.addEventListener('wheel', (event) => {
            event.preventDefault();
            camera.position.z += event.deltaY * 0.01;
            camera.position.z = Math.max(2, Math.min(5, camera.position.z));
        });
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Smooth rotation interpolation
            rotationX += (targetRotationX - rotationX) * 0.1;
            rotationY += (targetRotationY - rotationY) * 0.1;
            
            // Apply rotations
            earth.rotation.x = rotationX;
            earth.rotation.y = rotationY;
            clouds.rotation.x = rotationX;
            clouds.rotation.y = rotationY + 0.1; // Slight offset for clouds
            atmosphere.rotation.x = rotationX;
            atmosphere.rotation.y = rotationY;
            
            // Rotate impact point with Earth
            impactPoint.rotation.x = rotationX;
            impactPoint.rotation.y = rotationY;
            
            renderer.render(scene, camera);
        }
        
        // Start animation
        animate();
        
        // Store references
        predictionGlobe = {
            scene: scene,
            camera: camera,
            renderer: renderer,
            earth: earth,
            impactPoint: impactPoint,
            animate: animate
        };
        
        console.log('Three.js prediction globe initialized');
    } catch (error) {
        console.error('Failed to initialize Three.js globe:', error);
        // Fallback to simple CSS globe
        globeContainer.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                <div style="text-align: center;">
                    <div style="width: 100px; height: 100px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #4facfe, #1a1a2e); margin: 0 auto 10px; animation: spin 10s linear infinite;"></div>
                    <div>3D Earth Globe</div>
                    <div style="font-size: 12px; opacity: 0.7;">Loading...</div>
                </div>
            </div>
        `;
        
        // Add fallback CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                from { transform: rotateY(0deg); }
                to { transform: rotateY(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function updatePredictionVisualizations(lat, lon, results) {
    // Update map center and markers
    if (predictionMap) {
        predictionMap.setView([lat, lon], 8);
        
        // Clear existing markers
        predictionMap.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Circle) {
                predictionMap.removeLayer(layer);
            }
        });
        
        // Update impact marker
        const impactMarker = L.marker([lat, lon], {
            icon: L.divIcon({
                className: 'impact-marker',
                html: '<div style="background-color: #ff0000; border-radius: 50%; width: 20px; height: 20px; border: 3px solid white; animation: pulse 2s infinite;"></div>',
                iconSize: [20, 20]
            })
        }).addTo(predictionMap);
        
        impactMarker.bindPopup(`<b>Impact Location</b><br>Lat: ${lat.toFixed(4)}°<br>Lon: ${lon.toFixed(4)}°`);
        
        // Add impact circle based on crater diameter
        if (results && results.crater_diameter_m) {
            const radius = results.crater_diameter_m / 2; // Convert diameter to radius
            L.circle([lat, lon], {
                color: '#ff0000',
                fillColor: '#ff0000',
                fillOpacity: 0.1,
                radius: radius
            }).addTo(predictionMap);
        }
    }
}
