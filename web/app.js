// Global variables
let approachesChart = null;
let energyChart = null;
let map = null;
let fireballMarkers = [];
let approachMarkers = [];
let naturalEventMarkers = [];
let isLoadingOverview = false;

// Prediction tab variables
let selectedAsteroid = null;
let isSimulating = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setDefaultDates();
    loadEventCategories();
    testAPI();
    loadOverviewData();
});

function initializeApp() {
    // Initialize Leaflet map
    if (document.getElementById('map-container')) {
        map = L.map('map-container', {
            center: [20, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: true,
            preferCanvas: false,
            renderer: L.canvas()
        });
        
        // Create multiple tile layers with better error handling
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c'],
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            crossOrigin: true
        });
        
        const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c', 'd'],
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            crossOrigin: true
        });
        
        const esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            crossOrigin: true
        });
        
        // Try to add the first layer, with fallbacks
        let layerAdded = false;
        
        // Try OpenStreetMap first
        osmLayer.on('tileerror', function() {
            if (!layerAdded) {
                console.log('OSM tiles failed, trying CartoDB...');
                map.removeLayer(osmLayer);
                cartoLayer.addTo(map);
                layerAdded = true;
            }
        });
        
        osmLayer.on('load', function() {
            layerAdded = true;
        });
        
        // Add default layer
        osmLayer.addTo(map);
        
        // Add layer control with multiple options
        const baseMaps = {
            "OpenStreetMap": osmLayer,
            "CartoDB Light": cartoLayer,
            "Esri Satellite": esriLayer
        };
        
        L.control.layers(baseMaps).addTo(map);
        
        // Force a refresh after a short delay
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                map.setView([20, 0], 2);
                
                // If tiles still don't load, try a different approach
                setTimeout(() => {
                    if (map && !map.hasLayer(osmLayer) && !map.hasLayer(cartoLayer)) {
                        console.log('Trying alternative tile source...');
                        // Try a different tile source
                        const altLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors',
                            maxZoom: 19
                        });
                        altLayer.addTo(map);
                    }
                }, 3000);
            }
        }, 1000);
    }
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Data fetching buttons
    document.getElementById('fetch-approaches')?.addEventListener('click', fetchCloseApproaches);
    document.getElementById('fetch-fireballs')?.addEventListener('click', fetchFireballs);
    document.getElementById('fetch-neos')?.addEventListener('click', fetchNearEarthObjects);
    document.getElementById('fetch-natural-events')?.addEventListener('click', fetchNaturalEvents);

    // Map controls
    document.getElementById('show-natural-events-map')?.addEventListener('click', showNaturalEventsOnMap);
    document.getElementById('show-fireballs-map')?.addEventListener('click', showFireballsOnMap);
    document.getElementById('show-approaches-map')?.addEventListener('click', showApproachesOnMap);
    document.getElementById('clear-map')?.addEventListener('click', clearMap);
    
    // Add debug button for map troubleshooting
    const debugButton = document.createElement('button');
    debugButton.className = 'btn-secondary';
    debugButton.innerHTML = '<i class="fas fa-bug"></i> Debug Map';
    debugButton.style.marginLeft = '10px';
    debugButton.addEventListener('click', debugMap);
    
    const mapControls = document.querySelector('.map-controls');
    if (mapControls) {
        mapControls.appendChild(debugButton);
        
        // Add loading debug button
        const loadingDebugButton = document.createElement('button');
        loadingDebugButton.className = 'btn-secondary';
        loadingDebugButton.innerHTML = '<i class="fas fa-stop"></i> Hide Loading';
        loadingDebugButton.style.marginLeft = '10px';
        loadingDebugButton.addEventListener('click', () => {
            console.log('Manually hiding loading indicator');
            hideLoading();
            isLoadingOverview = false;
        });
        mapControls.appendChild(loadingDebugButton);
    }
    
    // API key reset button
    document.getElementById('reset-api-key')?.addEventListener('click', resetApiKey);
    
    // Prediction tab event listeners
    setupPredictionEventListeners();
}

function setDefaultDates() {
    const today = new Date();
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const twoDaysFromNow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Set default dates for inputs
    const dateMinInput = document.getElementById('date-min');
    const dateMaxInput = document.getElementById('date-max');
    const fireballSinceInput = document.getElementById('fireball-since');
    const neoStartInput = document.getElementById('neo-start');
    const neoEndInput = document.getElementById('neo-end');

    if (dateMinInput) dateMinInput.value = formatDate(oneMonthAgo);
    if (dateMaxInput) dateMaxInput.value = formatDate(oneMonthFromNow);
    if (fireballSinceInput) fireballSinceInput.value = formatDate(oneYearAgo);
    if (neoStartInput) neoStartInput.value = formatDate(twoDaysAgo);
    if (neoEndInput) neoEndInput.value = formatDate(twoDaysFromNow);
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

async function loadEventCategories() {
    try {
        const response = await fetch('/api/event-categories');
        if (response.ok) {
            const categories = await response.json();
            const select = document.getElementById('event-category');
            if (select) {
                // Clear existing options except the first one
                select.innerHTML = '<option value="">All Categories</option>';
                
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.title;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.warn('Failed to load event categories:', error);
    }
}

async function testAPI() {
    try {
        const response = await fetch('/api/test');
        if (response.ok) {
            const data = await response.json();
            console.log('API Test successful:', data);
            
            // If API is working, use the demo data from the test endpoint
            if (data.demo_approaches && data.demo_fireballs && data.demo_neos) {
                console.log('Using test endpoint demo data');
                updateOverviewStats(data.demo_approaches, data.demo_fireballs, data.demo_neos);
                updateDataSummary(data.demo_approaches, data.demo_fireballs, data.demo_neos);
                
                // Display API key status if available
                if (data.api_key_status) {
                    console.log('API Key Status:', data.api_key_status);
                    updateApiKeyStatus(data.api_key_status);
                }
            }
        } else {
            console.warn('API Test failed:', response.status);
        }
    } catch (error) {
        console.warn('API Test error:', error);
    }
}

function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(tabName).classList.add('active');

    // Add active class to selected nav tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load data for specific tabs
    if (tabName === 'overview') {
        // Only load if not already loading
        if (!isLoadingOverview) {
            loadOverviewData();
        }
    } else if (tabName === 'map') {
        // Refresh map when switching to map tab
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                map.setView([20, 0], 2);
            }
        }, 100);
    }
}

function showLoading() {
    console.log('Showing loading indicator');
    document.getElementById('loading').classList.add('show');
}

function hideLoading() {
    console.log('Hiding loading indicator');
    document.getElementById('loading').classList.remove('show');
}

// API calls to Java backend
async function fetchCloseApproaches() {
    showLoading();
    try {
        const dateMin = document.getElementById('date-min').value;
        const dateMax = document.getElementById('date-max').value;
        const distMax = document.getElementById('distance-max').value;
        const limit = document.getElementById('limit').value;

        const response = await fetch(`/api/close-approaches?dateMin=${dateMin}&dateMax=${dateMax}&distMax=${distMax}&limit=${limit}`);
        const data = await response.json();
        
        displayApproachesTable(data);
        updateApproachesCount(data.length);
    } catch (error) {
        console.error('Error fetching close approaches:', error);
        alert('Error fetching close approaches data');
    } finally {
        hideLoading();
    }
}

async function fetchFireballs() {
    showLoading();
    try {
        const sinceDate = document.getElementById('fireball-since').value;
        const limit = document.getElementById('fireball-limit').value;

        const response = await fetch(`/api/fireballs?sinceDate=${sinceDate}&limit=${limit}`);
        const data = await response.json();
        
        displayFireballsTable(data);
        updateFireballsCount(data.length);
    } catch (error) {
        console.error('Error fetching fireballs:', error);
        alert('Error fetching fireballs data');
    } finally {
        hideLoading();
    }
}

async function fetchNearEarthObjects() {
    showLoading();
    try {
        const startDate = document.getElementById('neo-start').value;
        const endDate = document.getElementById('neo-end').value;

        const response = await fetch(`/api/neo-feed?startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();
        
        displayNeosTable(data);
        updateHazardousCount(data.filter(item => item.hazardous === 'yes').length);
    } catch (error) {
        console.error('Error fetching NEOs:', error);
        alert('Error fetching near earth objects data');
    } finally {
        hideLoading();
    }
}

async function fetchNaturalEvents() {
    showLoading();
    try {
        const days = document.getElementById('event-days').value;
        const limit = document.getElementById('event-limit').value;
        const status = document.getElementById('event-status').value;
        const category = document.getElementById('event-category').value;

        let url = `/api/natural-events?days=${days}&limit=${limit}&status=${status}`;
        if (category) {
            url += `&category=${category}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        
        displayNaturalEventsTable(data);
    } catch (error) {
        console.error('Error fetching natural events:', error);
        alert('Error fetching natural events data');
    } finally {
        hideLoading();
    }
}

async function loadOverviewData() {
    // Prevent multiple simultaneous calls
    if (isLoadingOverview) {
        console.log('Overview data already loading, skipping...');
        return;
    }
    
    isLoadingOverview = true;
    showLoading();
    
    // Safety timeout to ensure loading is hidden
    const loadingTimeout = setTimeout(() => {
        console.warn('Loading timeout reached, hiding loading indicator');
        hideLoading();
        isLoadingOverview = false;
    }, 30000); // 30 second timeout
    
    // Show initial loading state
    updateOverviewStats([], [], []);
    
    try {
        // Load data sequentially to avoid overwhelming the server
        const today = new Date();
        const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
        const twoDaysFromNow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

        // Load approaches data first
        let approaches = [];
        try {
            const response = await fetch(`/api/close-approaches?dateMin=${formatDate(oneMonthAgo)}&dateMax=${formatDate(oneMonthFromNow)}&distMax=0.05&limit=20`);
            if (response.ok) {
                approaches = await response.json();
                console.log('Loaded approaches:', approaches.length);
            } else {
                console.warn('Approaches API returned:', response.status);
            }
        } catch (e) {
            console.warn('Failed to load approaches data:', e);
        }

        // Update stats with approaches data
        updateOverviewStats(approaches, [], []);
        
        // Load fireballs data
        let fireballs = [];
        try {
            const response = await fetch(`/api/fireballs?sinceDate=${formatDate(oneYearAgo)}&limit=20`);
            if (response.ok) {
                fireballs = await response.json();
                console.log('Loaded fireballs:', fireballs.length);
            } else {
                console.warn('Fireballs API returned:', response.status);
            }
        } catch (e) {
            console.warn('Failed to load fireballs data:', e);
        }

        // Update stats with fireballs data
        updateOverviewStats(approaches, fireballs, []);
        
        // Load NEOs data
        let neos = [];
        try {
            const response = await fetch(`/api/neo-feed?startDate=${formatDate(twoDaysAgo)}&endDate=${formatDate(twoDaysFromNow)}`);
            if (response.ok) {
                neos = await response.json();
                console.log('Loaded NEOs:', neos.length);
            } else {
                console.warn('NEOs API returned:', response.status);
            }
        } catch (e) {
            console.warn('Failed to load NEOs data:', e);
        }

        // Final update with all data
        updateOverviewStats(approaches, fireballs, neos);
        updateDataSummary(approaches, fireballs, neos);
        
        // If no data was loaded, show demo data
        if (approaches.length === 0 && fireballs.length === 0 && neos.length === 0) {
            console.log('No data loaded from APIs, showing demo data');
            showDemoData();
        } else {
            console.log('Data loaded successfully:', {
                approaches: approaches.length,
                fireballs: fireballs.length,
                neos: neos.length
            });
        }
        
        // Force a final update to ensure stats are displayed
        setTimeout(() => {
            const approachesCount = approaches.length;
            const fireballsCount = fireballs.length;
            const hazardousCount = neos.filter(item => item.hazardous === 'yes').length;
            
            // Force update if still showing zeros
            if (document.getElementById('close-approaches-count').textContent === '0' && approachesCount > 0) {
                document.getElementById('close-approaches-count').textContent = approachesCount;
            }
            if (document.getElementById('fireballs-count').textContent === '0' && fireballsCount > 0) {
                document.getElementById('fireballs-count').textContent = fireballsCount;
            }
            if (document.getElementById('hazardous-count').textContent === '0' && hazardousCount > 0) {
                document.getElementById('hazardous-count').textContent = hazardousCount;
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error loading overview data:', error);
        // Show demo data if API is not available
        showDemoData();
    } finally {
        clearTimeout(loadingTimeout);
        hideLoading();
        isLoadingOverview = false;
    }
}

function showDemoData() {
    // Demo data for when API is not available
    const demoApproaches = [
        { object: '2024 AB1', cd: '2024-01-15', dist: '0.02', v_rel: '15.5', h: '20.1' },
        { object: '2024 CD2', cd: '2024-01-16', dist: '0.03', v_rel: '12.3', h: '18.5' },
        { object: '2024 EF3', cd: '2024-01-17', dist: '0.04', v_rel: '18.7', h: '22.1' }
    ];
    
    const demoFireballs = [
        { date: '2024-01-10', lat: '40.7128', lon: '-74.0060', energy: '1.2e12', vel: '15.2', alt: '45.3' },
        { date: '2024-01-11', lat: '34.0522', lon: '-118.2437', energy: '8.5e11', vel: '12.8', alt: '38.7' },
        { date: '2024-01-12', lat: '41.8781', lon: '-87.6298', energy: '2.1e12', vel: '16.4', alt: '42.1' }
    ];
    
    const demoNeos = [
        { date: '2024-01-15', name: '2024 AB1', hazardous: 'yes', min: '0.1', max: '0.3' },
        { date: '2024-01-16', name: '2024 CD2', hazardous: 'no', min: '0.05', max: '0.15' },
        { date: '2024-01-17', name: '2024 EF3', hazardous: 'yes', min: '0.2', max: '0.4' }
    ];
    
    updateOverviewStats(demoApproaches, demoFireballs, demoNeos);
    updateDataSummary(demoApproaches, demoFireballs, demoNeos);
}

// Display functions
function displayApproachesTable(data) {
    const tbody = document.querySelector('#approaches-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.object || item.fullname || item.des || 'N/A'}</td>
            <td>${item.cd || 'N/A'}</td>
            <td>${item.dist || 'N/A'}</td>
            <td>${item.v_rel || 'N/A'}</td>
            <td>${item.h || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}

function displayFireballsTable(data) {
    const tbody = document.querySelector('#fireballs-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.date || 'N/A'}</td>
            <td>${item.lat || 'N/A'}</td>
            <td>${item.lon || 'N/A'}</td>
            <td>${item.energy || 'N/A'}</td>
            <td>${item.vel || 'N/A'}</td>
            <td>${item.alt || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}

function displayNeosTable(data) {
    const tbody = document.querySelector('#neos-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.date || 'N/A'}</td>
            <td>${item.name || 'N/A'}</td>
            <td>${item.hazardous || 'N/A'}</td>
            <td>${item.min || 'N/A'}</td>
            <td>${item.max || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}

function displayNaturalEventsTable(data) {
    const tbody = document.querySelector('#natural-events-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        const categories = Array.isArray(item.categories) ? item.categories.join(', ') : item.categories || 'N/A';
        const location = item.latitude && item.longitude ? 
            `${item.latitude.toFixed(2)}, ${item.longitude.toFixed(2)}` : 'N/A';
        const gibsLayers = Array.isArray(item.gibsLayers) ? item.gibsLayers.join(', ') : item.gibsLayers || 'N/A';
        
        row.innerHTML = `
            <td>${item.title || 'N/A'}</td>
            <td>${categories}</td>
            <td>${item.status || 'N/A'}</td>
            <td>${location}</td>
            <td>${item.date || 'N/A'}</td>
            <td>${gibsLayers}</td>
        `;
        tbody.appendChild(row);
    });
}

// Stats update functions
function updateOverviewStats(approaches, fireballs, neos) {
    const approachesCount = approaches.length;
    const fireballsCount = fireballs.length;
    const hazardousCount = neos.filter(item => item.hazardous === 'yes').length;
    
    console.log('Updating stats:', {
        approaches: approachesCount,
        fireballs: fireballsCount,
        hazardous: hazardousCount
    });
    
    // Format counts to show "20+" when at limit, exact number otherwise
    const approachesDisplay = approachesCount >= 20 ? '20+' : approachesCount.toString();
    const fireballsDisplay = fireballsCount >= 20 ? '20+' : fireballsCount.toString();
    const hazardousDisplay = hazardousCount.toString(); // NEOs don't have a limit
    
    // Update counts with animation
    animateCount('close-approaches-count', approachesDisplay);
    animateCount('fireballs-count', fireballsDisplay);
    animateCount('hazardous-count', hazardousDisplay);
    
    // Also set directly to ensure immediate update
    document.getElementById('close-approaches-count').textContent = approachesDisplay;
    document.getElementById('fireballs-count').textContent = fireballsDisplay;
    document.getElementById('hazardous-count').textContent = hazardousDisplay;
    
    // Update last updated time
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
    
    // Add additional context to stats
    updateStatsContext(approaches, fireballs, neos);
}

function animateCount(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn('Element not found:', elementId);
        return;
    }
    
    // Handle string values like "20+" - set immediately without animation
    if (typeof targetValue === 'string') {
        element.textContent = targetValue;
        return;
    }
    
    const currentValue = parseInt(element.textContent) || 0;
    console.log(`Animating ${elementId}: ${currentValue} -> ${targetValue}`);
    
    // If target is 0, set immediately
    if (targetValue === 0) {
        element.textContent = '0';
        return;
    }
    
    const increment = (targetValue - currentValue) / 10;
    let current = currentValue;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
            current = targetValue;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 50);
}

function updateStatsContext(approaches, fireballs, neos) {
    // Add context information to the stats cards
    const approachesCard = document.querySelector('#close-approaches-count').closest('.stat-card');
    const fireballsCard = document.querySelector('#fireballs-count').closest('.stat-card');
    const hazardousCard = document.querySelector('#hazardous-count').closest('.stat-card');
    
    // Update approaches context
    if (approaches.length > 0) {
        const avgDistance = approaches.reduce((sum, item) => sum + parseFloat(item.dist || 0), 0) / approaches.length;
        const context = approachesCard.querySelector('.stat-context') || document.createElement('div');
        context.className = 'stat-context';
        context.innerHTML = `Avg Distance: ${avgDistance.toFixed(3)} AU`;
        if (!approachesCard.querySelector('.stat-context')) {
            approachesCard.appendChild(context);
        }
    }
    
    // Update fireballs context
    if (fireballs.length > 0) {
        const totalEnergy = fireballs.reduce((sum, item) => sum + parseFloat(item.energy || 0), 0);
        const context = fireballsCard.querySelector('.stat-context') || document.createElement('div');
        context.className = 'stat-context';
        context.innerHTML = `Total Energy: ${(totalEnergy / 1e12).toFixed(2)} TJ`;
        if (!fireballsCard.querySelector('.stat-context')) {
            fireballsCard.appendChild(context);
        }
    }
    
    // Update hazardous context
    if (neos.length > 0) {
        const hazardousPercentage = (neos.filter(item => item.hazardous === 'yes').length / neos.length * 100).toFixed(1);
        const context = hazardousCard.querySelector('.stat-context') || document.createElement('div');
        context.className = 'stat-context';
        context.innerHTML = `${hazardousPercentage}% of tracked NEOs`;
        if (!hazardousCard.querySelector('.stat-context')) {
            hazardousCard.appendChild(context);
        }
    }
}

function updateDataSummary(approaches, fireballs, neos) {
    const summaryElement = document.getElementById('data-summary');
    if (!summaryElement) return;
    
    let summary = '';
    
    // Approaches summary
    if (approaches.length > 0) {
        const avgDistance = approaches.reduce((sum, item) => sum + parseFloat(item.dist || 0), 0) / approaches.length;
        const minDistance = Math.min(...approaches.map(item => parseFloat(item.dist || Infinity)));
        const maxVelocity = Math.max(...approaches.map(item => parseFloat(item.v_rel || 0)));
        const approachesDisplay = approaches.length >= 20 ? '20+' : approaches.length.toString();
        
        summary += `<p><strong>Close Approaches:</strong> ${approachesDisplay} objects tracked with average distance of ${avgDistance.toFixed(3)} AU. Closest approach: ${minDistance.toFixed(3)} AU. Fastest velocity: ${maxVelocity.toFixed(1)} km/s.</p>`;
    } else {
        summary += `<p><strong>Close Approaches:</strong> No recent close approaches detected.</p>`;
    }
    
    // Fireballs summary
    if (fireballs.length > 0) {
        const totalEnergy = fireballs.reduce((sum, item) => sum + parseFloat(item.energy || 0), 0);
        const avgEnergy = totalEnergy / fireballs.length;
        const maxEnergy = Math.max(...fireballs.map(item => parseFloat(item.energy || 0)));
        const avgVelocity = fireballs.reduce((sum, item) => sum + parseFloat(item.vel || 0), 0) / fireballs.length;
        const fireballsDisplay = fireballs.length >= 20 ? '20+' : fireballs.length.toString();
        
        summary += `<p><strong>Fireball Events:</strong> ${fireballsDisplay} events recorded with total energy of ${(totalEnergy / 1e12).toFixed(2)} TJ. Average energy: ${(avgEnergy / 1e9).toFixed(1)} GJ. Most energetic event: ${(maxEnergy / 1e12).toFixed(2)} TJ. Average velocity: ${avgVelocity.toFixed(1)} km/s.</p>`;
    } else {
        summary += `<p><strong>Fireball Events:</strong> No recent fireball events recorded.</p>`;
    }
    
    // NEOs summary
    if (neos.length > 0) {
        const hazardousCount = neos.filter(item => item.hazardous === 'yes').length;
        const hazardousPercentage = (hazardousCount / neos.length * 100).toFixed(1);
        const avgMinDiam = neos.reduce((sum, item) => sum + parseFloat(item.min || 0), 0) / neos.length;
        const avgMaxDiam = neos.reduce((sum, item) => sum + parseFloat(item.max || 0), 0) / neos.length;
        
        summary += `<p><strong>Near Earth Objects:</strong> ${neos.length} objects tracked. ${hazardousCount} (${hazardousPercentage}%) are potentially hazardous. Average size: ${avgMinDiam.toFixed(2)} - ${avgMaxDiam.toFixed(2)} km diameter.</p>`;
    } else {
        summary += `<p><strong>Near Earth Objects:</strong> No NEOs data available for the selected time period.</p>`;
    }
    
    // Data source info
    summary += `<p><strong>Data Sources:</strong> NASA CNEOS Close Approach Data, Fireball API, and NeoWs Feed. Data updated in real-time from NASA's databases.</p>`;
    
    // Add limits information
    summary += `<p><strong>Data Limits:</strong> Close approaches and fireballs are limited to 20 items each for optimal performance. NEOs show all available data in the ±2 day range.</p>`;
    
    summaryElement.innerHTML = summary;
}

function updateApproachesCount(count) {
    document.getElementById('close-approaches-count').textContent = count;
}

function updateFireballsCount(count) {
    document.getElementById('fireballs-count').textContent = count;
}

function updateHazardousCount(count) {
    document.getElementById('hazardous-count').textContent = count;
}

// Chart functions removed as requested

// Map functions
async function showNaturalEventsOnMap() {
    clearMap();
    
    try {
        // Fetch natural events data
        const days = document.getElementById('event-days')?.value || '30';
        const limit = document.getElementById('event-limit')?.value || '50';
        const status = document.getElementById('event-status')?.value || 'all';
        
        const response = await fetch(`/api/natural-events?days=${days}&limit=${limit}&status=${status}`);
        if (response.ok) {
            const events = await response.json();
            
            // Add markers for each natural event
            events.forEach(event => {
                if (event.latitude && event.longitude) {
                    const lat = parseFloat(event.latitude);
                    const lon = parseFloat(event.longitude);
                    
                    if (!isNaN(lat) && !isNaN(lon)) {
                        // Choose icon based on category
                        let iconColor = '#4facfe'; // Default blue
                        let iconSymbol = '🌍';
                        
                        if (event.categories && Array.isArray(event.categories)) {
                            const category = event.categories[0].toLowerCase();
                            if (category.includes('fire') || category.includes('wildfire')) {
                                iconColor = '#ff6b6b';
                                iconSymbol = '🔥';
                            } else if (category.includes('storm') || category.includes('hurricane')) {
                                iconColor = '#4facfe';
                                iconSymbol = '⛈️';
                            } else if (category.includes('volcano')) {
                                iconColor = '#ff8c42';
                                iconSymbol = '🌋';
                            } else if (category.includes('earthquake')) {
                                iconColor = '#8b4513';
                                iconSymbol = '🌍';
                            }
                        }
                        
                        const marker = L.marker([lat, lon], {
                            icon: L.divIcon({
                                className: 'natural-event-marker',
                                html: `<div style="background-color: ${iconColor}; border-radius: 50%; width: 14px; height: 14px; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 8px;">${iconSymbol}</div>`,
                                iconSize: [14, 14]
                            })
                        });
                        
                        const popupContent = `
                            <div style="font-family: Arial, sans-serif;">
                                <h4 style="margin: 0 0 8px 0; color: ${iconColor};">${iconSymbol} ${event.title || 'Natural Event'}</h4>
                                <p style="margin: 4px 0;"><strong>Category:</strong> ${Array.isArray(event.categories) ? event.categories.join(', ') : event.categories || 'Unknown'}</p>
                                <p style="margin: 4px 0;"><strong>Status:</strong> ${event.status || 'Unknown'}</p>
                                <p style="margin: 4px 0;"><strong>Date:</strong> ${event.date || 'Unknown'}</p>
                                <p style="margin: 4px 0;"><strong>Location:</strong> ${lat.toFixed(2)}, ${lon.toFixed(2)}</p>
                                ${event.description ? `<p style="margin: 4px 0;"><strong>Description:</strong> ${event.description}</p>` : ''}
                                ${event.gibsLayers && event.gibsLayers.length > 0 ? `<p style="margin: 4px 0;"><strong>GIBS Layers:</strong> ${Array.isArray(event.gibsLayers) ? event.gibsLayers.join(', ') : event.gibsLayers}</p>` : ''}
                                ${event.link ? `<p style="margin: 4px 0;"><a href="${event.link}" target="_blank" style="color: ${iconColor};">More Info</a></p>` : ''}
                            </div>
                        `;
                        
                        marker.bindPopup(popupContent);
                        marker.addTo(map);
                        naturalEventMarkers.push(marker);
                    }
                }
            });
            
            // Fit map to show all markers
            if (naturalEventMarkers.length > 0) {
                const group = new L.featureGroup(naturalEventMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        }
    } catch (error) {
        console.error('Error loading natural events for map:', error);
    }
}

async function showFireballsOnMap() {
    clearMap();
    
    try {
        // Fetch fireballs data
        const sinceDate = document.getElementById('fireball-since')?.value || '2019-01-01';
        const limit = document.getElementById('fireball-limit')?.value || '15';
        
        const response = await fetch(`/api/fireballs?sinceDate=${sinceDate}&limit=${limit}`);
        if (response.ok) {
            const fireballs = await response.json();
            
            // Add markers for each fireball
            fireballs.forEach(fireball => {
                if (fireball.lat && fireball.lon) {
                    const lat = parseFloat(fireball.lat);
                    const lon = parseFloat(fireball.lon);
                    
                    if (!isNaN(lat) && !isNaN(lon)) {
                        const marker = L.marker([lat, lon], {
                            icon: L.divIcon({
                                className: 'fireball-marker',
                                html: '<div style="background-color: #ff6b6b; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white;"></div>',
                                iconSize: [12, 12]
                            })
                        });
                        
                        const popupContent = `
                            <div style="font-family: Arial, sans-serif;">
                                <h4 style="margin: 0 0 8px 0; color: #ff6b6b;">🔥 Fireball Event</h4>
                                <p style="margin: 4px 0;"><strong>Date:</strong> ${fireball.date || 'Unknown'}</p>
                                <p style="margin: 4px 0;"><strong>Energy:</strong> ${fireball.energy || 'Unknown'} J</p>
                                <p style="margin: 4px 0;"><strong>Velocity:</strong> ${fireball.vel || 'Unknown'} km/s</p>
                                <p style="margin: 4px 0;"><strong>Altitude:</strong> ${fireball.alt || 'Unknown'} km</p>
                            </div>
                        `;
                        
                        marker.bindPopup(popupContent);
                        marker.addTo(map);
                        fireballMarkers.push(marker);
                    }
                }
            });
            
            // Fit map to show all markers
            if (fireballMarkers.length > 0) {
                const group = new L.featureGroup(fireballMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        }
    } catch (error) {
        console.error('Error loading fireballs for map:', error);
    }
}

async function showApproachesOnMap() {
    clearMap();
    
    try {
        // Fetch approaches data
        const today = new Date();
        const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const response = await fetch(`/api/close-approaches?dateMin=${formatDate(oneMonthAgo)}&dateMax=${formatDate(oneMonthFromNow)}&distMax=0.05&limit=20`);
        if (response.ok) {
            const approaches = await response.json();
            
            // Add markers for each approach
            approaches.forEach(approach => {
                // For approaches, we'll show them as orbital markers
                // Since we don't have exact coordinates, we'll place them randomly around Earth
                const lat = (Math.random() - 0.5) * 180;
                const lon = (Math.random() - 0.5) * 360;
                
                const marker = L.marker([lat, lon], {
                    icon: L.divIcon({
                        className: 'approach-marker',
                        html: '<div style="background-color: #4facfe; border-radius: 50%; width: 10px; height: 10px; border: 2px solid white;"></div>',
                        iconSize: [10, 10]
                    })
                });
                
                const popupContent = `
                    <div style="font-family: Arial, sans-serif;">
                        <h4 style="margin: 0 0 8px 0; color: #4facfe;">🛰️ Close Approach</h4>
                        <p style="margin: 4px 0;"><strong>Object:</strong> ${approach.object || approach.fullname || approach.des || 'Unknown'}</p>
                        <p style="margin: 4px 0;"><strong>Date:</strong> ${approach.cd || 'Unknown'}</p>
                        <p style="margin: 4px 0;"><strong>Distance:</strong> ${approach.dist || 'Unknown'} AU</p>
                        <p style="margin: 4px 0;"><strong>Velocity:</strong> ${approach.v_rel || 'Unknown'} km/s</p>
                        <p style="margin: 4px 0;"><strong>Magnitude:</strong> ${approach.h || 'Unknown'}</p>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(map);
                approachMarkers.push(marker);
            });
            
            // Fit map to show all markers
            if (approachMarkers.length > 0) {
                const group = new L.featureGroup(approachMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        }
    } catch (error) {
        console.error('Error loading approaches for map:', error);
    }
}

function clearMap() {
    fireballMarkers.forEach(marker => map.removeLayer(marker));
    approachMarkers.forEach(marker => map.removeLayer(marker));
    naturalEventMarkers.forEach(marker => map.removeLayer(marker));
    fireballMarkers = [];
    approachMarkers = [];
    naturalEventMarkers = [];
}

function debugMap() {
    if (!map) {
        console.log('Map not initialized');
        return;
    }
    
    console.log('Map debug info:');
    console.log('- Map center:', map.getCenter());
    console.log('- Map zoom:', map.getZoom());
    console.log('- Map size:', map.getSize());
    console.log('- Map bounds:', map.getBounds());
    
    // Check if tiles are loading
    const tileLayers = map._layers;
    let tileLayerCount = 0;
    for (let key in tileLayers) {
        if (tileLayers[key] instanceof L.TileLayer) {
            tileLayerCount++;
            console.log('- Tile layer found:', key);
        }
    }
    
    console.log('- Number of tile layers:', tileLayerCount);
    
    // Force refresh
    map.invalidateSize();
    map.setView([20, 0], 2);
    
    // Try to reload tiles
    setTimeout(() => {
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                layer.redraw();
            }
        });
    }, 1000);
    
    alert('Map debug info logged to console. Check browser developer tools.');
}

function updateApiKeyStatus(status) {
    const statusElement = document.getElementById('api-status');
    const statusText = document.getElementById('api-status-text');
    const resetButton = document.getElementById('reset-api-key');
    
    if (statusElement && statusText) {
        statusElement.style.display = 'block';
        
        if (status.using_backup) {
            const backupIndex = status.current_backup_index || 0;
            const totalBackups = status.backup_keys_available || 1;
            statusText.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Using backup API key #${backupIndex + 1} of ${totalBackups} (rate limit reached)`;
            statusText.style.color = '#ff6b6b';
            if (resetButton) {
                resetButton.style.display = 'inline-block';
            }
        } else {
            statusText.innerHTML = '<i class="fas fa-check-circle"></i> Using primary API key';
            statusText.style.color = '#4facfe';
            if (resetButton) {
                resetButton.style.display = 'none';
            }
        }
    }
}

async function resetApiKey() {
    try {
        const response = await fetch('/api/reset-key');
        if (response.ok) {
            const data = await response.json();
            console.log('API key reset:', data);
            updateApiKeyStatus(data);
            alert('Reset to primary API key successfully');
        } else {
            alert('Failed to reset API key');
        }
    } catch (error) {
        console.error('Error resetting API key:', error);
        alert('Error resetting API key');
    }
}

// ===== PREDICTION TAB FUNCTIONALITY =====

function setupPredictionEventListeners() {
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
    
    // Load asteroids on tab switch
    document.querySelector('[data-tab="prediction"]')?.addEventListener('click', loadAsteroids);
}

// Physics calculation functions
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

function calculateMass(diameter, density) {
    const radius = diameter / 2;
    const volume = (4/3) * Math.PI * radius * radius * radius;
    return density * volume;
}

function calculateKineticEnergy(mass, velocity) {
    return 0.5 * mass * velocity * velocity;
}

function calculateTntEquivalent(energy) {
    return energy / TNT_TO_JOULES;
}

function calculateCraterDiameter(energy, angle, targetDensity = ROCK_DENSITY) {
    const angleRad = angle * Math.PI / 180;
    const energyDensity = energy / (targetDensity * EARTH_GRAVITY);
    const diameter = 1.25 * Math.pow(energyDensity, 1/4) * Math.pow(Math.sin(angleRad), 1/3);
    const depth = diameter / 4;
    return { diameter, depth };
}

function calculateSeismicMagnitude(energy) {
    const seismicMoment = energy * 0.01; // 1% efficiency
    const magnitude = (2/3) * Math.log10(seismicMoment) - 10.7;
    return magnitude;
}

function calculateTsunamiHeight(energy, waterDepth, distanceToShore) {
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
    
    return initialHeight;
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
    if (asteroid.estimated_diameter) {
        const avgDiameter = (asteroid.estimated_diameter.meters.estimated_diameter_min + 
                            asteroid.estimated_diameter.meters.estimated_diameter_max) / 2;
        document.getElementById('diameter').value = Math.round(avgDiameter);
        updateDiameter();
    }
    
    if (asteroid.close_approach_data && asteroid.close_approach_data.length > 0) {
        const approach = asteroid.close_approach_data[0];
        if (approach.relative_velocity && approach.relative_velocity.kilometers_per_second) {
            const velocityKmS = parseFloat(approach.relative_velocity.kilometers_per_second);
            document.getElementById('velocity').value = Math.round(velocityKmS * 1000);
            updateVelocity();
        }
    }
    
    if (asteroid.orbital_data && asteroid.orbital_data.inclination) {
        const inclination = parseFloat(asteroid.orbital_data.inclination);
        const estimatedAngle = Math.min(90, Math.abs(inclination) + 15);
        document.getElementById('angle').value = Math.round(estimatedAngle);
        updateAngle();
    }
}

function resetAsteroidParameters() {
    document.getElementById('diameter').value = 500;
    document.getElementById('velocity').value = 15000;
    document.getElementById('angle').value = 45;
    updateDiameter();
    updateVelocity();
    updateAngle();
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
let loadedAsteroids = [];

async function loadAsteroids() {
    if (loadedAsteroids.length > 0) return; // Already loaded
    
    try {
        const response = await fetch('/api/neo-feed?startDate=2024-01-01&endDate=2024-01-07');
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
    }
}

function getSampleAsteroids() {
    return [
        {
            id: '2000433',
            name: '2000433 (2006 QQ23)',
            is_potentially_hazardous_asteroid: true,
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
        // Get parameters
        const diameter = parseFloat(document.getElementById('diameter').value);
        const densityType = document.getElementById('density-type').value;
        const density = ASTEROID_DENSITIES[densityType];
        const velocity = parseFloat(document.getElementById('velocity').value);
        const angle = parseFloat(document.getElementById('angle').value);
        const targetType = document.getElementById('target-type').value;
        const impactLat = parseFloat(document.getElementById('impact-lat').value);
        const impactLon = parseFloat(document.getElementById('impact-lon').value);
        
        // Create simulation request
        const simulationRequest = {
            scenario: {
                asteroid: {
                    diameter: diameter,
                    density_type: densityType,
                    density: density
                },
                orbit: {
                    semi_major_axis: 1.2,
                    eccentricity: 0.3,
                    inclination: 15,
                    longitude_of_ascending_node: 45,
                    argument_of_periapsis: 30,
                    mean_anomaly: 180,
                    epoch: 2460000
                },
                impact_angle: angle,
                impact_velocity: velocity,
                target_type: targetType,
                impact_latitude: impactLat,
                impact_longitude: impactLon
            },
            include_tsunami: true,
            include_seismic: true,
            include_population: true,
            resolution_km: 10.0
        };
        
        // Call backend API
        const response = await fetch('/api/simulate-impact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(simulationRequest)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display results
        if (data.baseline) {
            displayOutcomeCards(data.baseline);
        } else {
            throw new Error('No simulation results received');
        }
        
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
