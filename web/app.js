// Global variables
let approachesChart = null;
let energyChart = null;
let map = null;
let fireballMarkers = [];
let approachMarkers = [];
let naturalEventMarkers = [];
let isLoadingOverview = false;

// Tab-specific maps
let closeApproachesMap = null;
let fireballsMap = null;
let nearEarthMap = null;

// Prediction tab variables
let selectedAsteroid = null;
let isSimulating = false;
let customSettingsExpanded = false;
let predictionMap = null;
let predictionGlobe = null;
let parametersManuallyAdjusted = false; // Track if user manually adjusted parameters

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setDefaultDates();
    loadEventCategories();
    testAPI();
    loadOverviewData();
    setupCustomSettingsListener();
});

function initializeApp() {
    // Initialize tab maps when needed
    initializeTabMaps();
}

function initializeTabMaps() {
    // Initialize maps for each tab
    initializeCloseApproachesMap();
    initializeFireballsMap();
    initializeNearEarthMap();
}

function initializeCloseApproachesMap() {
    const mapContainer = document.getElementById('close-approaches-map');
    if (!mapContainer || closeApproachesMap) return;
    
    try {
        closeApproachesMap = L.map('close-approaches-map', {
            center: [20, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(closeApproachesMap);
        
        console.log('Close approaches map initialized');
    } catch (error) {
        console.error('Failed to initialize close approaches map:', error);
    }
}

function initializeFireballsMap() {
    const mapContainer = document.getElementById('fireballs-map');
    if (!mapContainer || fireballsMap) return;
    
    try {
        fireballsMap = L.map('fireballs-map', {
            center: [20, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(fireballsMap);
        
        console.log('Fireballs map initialized');
    } catch (error) {
        console.error('Failed to initialize fireballs map:', error);
    }
}

function initializeNearEarthMap() {
    const mapContainer = document.getElementById('near-earth-map');
    if (!mapContainer || nearEarthMap) return;
    
    try {
        nearEarthMap = L.map('near-earth-map', {
            center: [20, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(nearEarthMap);
        
        console.log('Near Earth map initialized');
    } catch (error) {
        console.error('Failed to initialize near Earth map:', error);
    }
}


function addHideLoadingButtonToTabs() {
    // Add Hide Loading button to each tab that has controls
    const tabsWithControls = [
        'close-approaches',
        'fireballs', 
        'near-earth',
        'natural-events',
        'prediction'
    ];
    
    tabsWithControls.forEach(tabId => {
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            const controlsDiv = tabElement.querySelector('.controls');
            if (controlsDiv) {
                // Check if button already exists
                if (!controlsDiv.querySelector('.hide-loading-btn')) {
                    const hideLoadingButton = document.createElement('button');
                    hideLoadingButton.className = 'btn-secondary hide-loading-btn';
                    hideLoadingButton.innerHTML = '<i class="fas fa-stop"></i> Hide Loading (if any error occurs)';
                    hideLoadingButton.style.marginLeft = '10px';
                    hideLoadingButton.addEventListener('click', () => {
                        console.log('Manually hiding loading indicator');
                        hideLoading();
                        isLoadingOverview = false;
                    });
                    controlsDiv.appendChild(hideLoadingButton);
                }
            }
        }
    });
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

    // Add loading debug button to each tab for troubleshooting
    addHideLoadingButtonToTabs();
    
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
    } else if (tabName === 'close-approaches') {
        // Initialize map if not already done
        setTimeout(() => {
            initializeCloseApproachesMap();
            if (closeApproachesMap) {
                closeApproachesMap.invalidateSize();
            }
        }, 100);
    } else if (tabName === 'fireballs') {
        // Initialize map if not already done
        setTimeout(() => {
            initializeFireballsMap();
            if (fireballsMap) {
                fireballsMap.invalidateSize();
            }
        }, 100);
    } else if (tabName === 'near-earth') {
        // Initialize map if not already done
        setTimeout(() => {
            initializeNearEarthMap();
            if (nearEarthMap) {
                nearEarthMap.invalidateSize();
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
        updateCloseApproachesMap(data);
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
        updateFireballsMap(data);
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
        updateNearEarthMap(data);
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

// Tab-specific map update functions
function updateCloseApproachesMap(data) {
    if (!closeApproachesMap) return;
    
    // Clear existing markers
    closeApproachesMap.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            closeApproachesMap.removeLayer(layer);
        }
    });
    
    // Add markers for each approach
    data.forEach(approach => {
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
        marker.addTo(closeApproachesMap);
    });
    
    // Fit map to show all markers if there are any
    if (data.length > 0) {
        const group = new L.featureGroup(closeApproachesMap._layers);
        if (group.getBounds().isValid()) {
            closeApproachesMap.fitBounds(group.getBounds().pad(0.1));
        }
    }
}

function updateFireballsMap(data) {
    if (!fireballsMap) return;
    
    // Clear existing markers
    fireballsMap.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            fireballsMap.removeLayer(layer);
        }
    });
    
    // Add markers for each fireball
    data.forEach(fireball => {
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
                marker.addTo(fireballsMap);
            }
        }
    });
    
    // Fit map to show all markers if there are any
    if (data.length > 0) {
        const group = new L.featureGroup(fireballsMap._layers);
        if (group.getBounds().isValid()) {
            fireballsMap.fitBounds(group.getBounds().pad(0.1));
        }
    }
}

function updateNearEarthMap(data) {
    if (!nearEarthMap) return;
    
    // Clear existing markers
    nearEarthMap.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            nearEarthMap.removeLayer(layer);
        }
    });
    
    // Add markers for each NEO (simplified - no exact coordinates available)
    data.forEach(neo => {
        // Place markers randomly around Earth
        const lat = (Math.random() - 0.5) * 180;
        const lon = (Math.random() - 0.5) * 360;
        
        const isHazardous = neo.hazardous === 'yes';
        const marker = L.marker([lat, lon], {
            icon: L.divIcon({
                className: 'neo-marker',
                html: `<div style="background-color: ${isHazardous ? '#ff6b6b' : '#4facfe'}; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white;"></div>`,
                iconSize: [12, 12]
            })
        });
        
        const popupContent = `
            <div style="font-family: Arial, sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: ${isHazardous ? '#ff6b6b' : '#4facfe'};">${isHazardous ? '⚠️' : '✅'} NEO</h4>
                <p style="margin: 4px 0;"><strong>Name:</strong> ${neo.name || 'Unknown'}</p>
                <p style="margin: 4px 0;"><strong>Date:</strong> ${neo.date || 'Unknown'}</p>
                <p style="margin: 4px 0;"><strong>Hazardous:</strong> ${neo.hazardous || 'Unknown'}</p>
                <p style="margin: 4px 0;"><strong>Size:</strong> ${neo.min || 'Unknown'} - ${neo.max || 'Unknown'} km</p>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.addTo(nearEarthMap);
    });
    
    // Fit map to show all markers if there are any
    if (data.length > 0) {
        const group = new L.featureGroup(nearEarthMap._layers);
        if (group.getBounds().isValid()) {
            nearEarthMap.fitBounds(group.getBounds().pad(0.1));
        }
    }
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

// ===== CUSTOM SETTINGS LISTENER =====
function setupCustomSettingsListener() {
    // Listen for custom settings state changes
    window.addEventListener('customSettingsChanged', function(event) {
        customSettingsExpanded = event.detail.expanded;
        updateMapsSectionLayout();
    });
}

function updateMapsSectionLayout() {
    const mapsSection = document.querySelector('.maps-section');
    if (mapsSection) {
        if (customSettingsExpanded) {
            mapsSection.classList.remove('custom-collapsed');
            mapsSection.classList.add('custom-expanded');
        } else {
            mapsSection.classList.remove('custom-expanded');
            mapsSection.classList.add('custom-collapsed');
        }
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
    document.querySelector('[data-tab="prediction"]')?.addEventListener('click', () => {
        loadAsteroids();
        initializePredictionMap();
        initializePredictionGlobe();
    });
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
    // Energy efficiency for tsunami generation
    const tsunamiEnergy = energy * 0.1; // 10% efficiency
    
    // Initial wave height (simplified)
    const impactArea = Math.PI * 1000 * 1000; // 1km radius
    const energyDensity = tsunamiEnergy / impactArea;
    const initialHeight = 0.1 * Math.sqrt(energyDensity / (WATER_DENSITY * EARTH_GRAVITY));
    
    // Distance attenuation
    if (distanceToShore > 0) {
        const geometricFactor = 1 / Math.sqrt(distanceToShore / 1000); // km
        const dissipationFactor = Math.exp(-distanceToShore / (100 * 1000)); // 100km scale
        const shoreAmplification = 1 / Math.sqrt(0.01); // 1% slope
        
        return Math.max(0, initialHeight * geometricFactor * dissipationFactor * shoreAmplification);
    }
    
    return Math.max(0, initialHeight);
}

function calculatePeakGroundAcceleration(magnitude, distance) {
    // Simplified attenuation relationship
    const pga = Math.pow(10, magnitude - 1.5 * Math.log10(distance) - 0.01 * distance);
    return pga;
}

// Calculate exposed population based on affected cities (impactor-2025 style)
function calculateExposedPopulation(lat, lon, craterDiameter, energy) {
    // Calculate blast and tsunami radius based on energy
    const blastRadius = Math.sqrt(energy / (Math.PI * 1e12)); // km
    const tsunamiRadius = Math.max(blastRadius * 2, 200); // km
    const seismicRadius = Math.min(1000, blastRadius * 10);
    
    // Get affected cities for population calculation
    const affectedCities = calculateAffectedCities(lat, lon, craterDiameter, Math.log10(energy) / 3);
    
    let totalPopulationAffected = 0;
    let highExposurePopulation = 0;
    let mediumExposurePopulation = 0;
    let lowExposurePopulation = 0;
    
    // Calculate population by exposure level
    affectedCities.forEach(city => {
        totalPopulationAffected += city.population;
        
        switch (city.exposure_level) {
            case 'Extreme':
            case 'High':
                highExposurePopulation += city.population;
                break;
            case 'Medium':
                mediumExposurePopulation += city.population;
                break;
            case 'Low':
                lowExposurePopulation += city.population;
                break;
        }
    });
    
    return {
        total: totalPopulationAffected,
        high_exposure: highExposurePopulation,
        medium_exposure: mediumExposurePopulation,
        low_exposure: lowExposurePopulation,
        blastRadius: blastRadius,
        tsunamiRadius: tsunamiRadius,
        seismicRadius: seismicRadius
    };
}

// Calculate affected cities (impactor-2025 style)
function calculateAffectedCities(lat, lon, craterDiameter, magnitude) {
    // Major cities database (expanded from impactor-2025)
    const cities = [
        { name: "New York", lat: 40.7128, lon: -74.0060, population: 8336817, gdp_per_capita: 65000 },
        { name: "London", lat: 51.5074, lon: -0.1278, population: 8982000, gdp_per_capita: 45000 },
        { name: "Tokyo", lat: 35.6762, lon: 139.6503, population: 13929286, gdp_per_capita: 40000 },
        { name: "Beijing", lat: 39.9042, lon: 116.4074, population: 21540000, gdp_per_capita: 10000 },
        { name: "Mumbai", lat: 19.0760, lon: 72.8777, population: 12478447, gdp_per_capita: 2000 },
        { name: "São Paulo", lat: -23.5505, lon: -46.6333, population: 12325232, gdp_per_capita: 15000 },
        { name: "Mexico City", lat: 19.4326, lon: -99.1332, population: 9209944, gdp_per_capita: 20000 },
        { name: "Cairo", lat: 30.0444, lon: 31.2357, population: 20484965, gdp_per_capita: 3000 },
        { name: "Lagos", lat: 6.5244, lon: 3.3792, population: 15388000, gdp_per_capita: 2000 },
        { name: "Buenos Aires", lat: -34.6118, lon: -58.3960, population: 15155000, gdp_per_capita: 12000 },
        { name: "Shanghai", lat: 31.2304, lon: 121.4737, population: 24870895, gdp_per_capita: 12000 },
        { name: "Delhi", lat: 28.7041, lon: 77.1025, population: 32941000, gdp_per_capita: 3000 },
        { name: "Istanbul", lat: 41.0082, lon: 28.9784, population: 15519267, gdp_per_capita: 15000 },
        { name: "Karachi", lat: 24.8607, lon: 67.0011, population: 15741000, gdp_per_capita: 1500 },
        { name: "Dhaka", lat: 23.8103, lon: 90.4125, population: 21000000, gdp_per_capita: 2000 },
        { name: "Lima", lat: -12.0464, lon: -77.0428, population: 12120000, gdp_per_capita: 8000 },
        { name: "Bangkok", lat: 13.7563, lon: 100.5018, population: 10539000, gdp_per_capita: 6000 },
        { name: "Jakarta", lat: -6.2088, lon: 106.8456, population: 10560000, gdp_per_capita: 4000 },
        { name: "Manila", lat: 14.5995, lon: 120.9842, population: 12877253, gdp_per_capita: 3000 },
        { name: "Paris", lat: 48.8566, lon: 2.3522, population: 2161000, gdp_per_capita: 45000 },
        { name: "Los Angeles", lat: 34.0522, lon: -118.2437, population: 3971883, gdp_per_capita: 65000 },
        { name: "Moscow", lat: 55.7558, lon: 37.6176, population: 12615000, gdp_per_capita: 25000 },
        { name: "Sydney", lat: -33.8688, lon: 151.2093, population: 5312163, gdp_per_capita: 55000 }
    ];
    
    const affectedCities = [];
    // Calculate blast and tsunami radius based on magnitude
    const blastRadius = Math.pow(10, (magnitude - 4) / 2) * 10; // km
    const tsunamiRadius = Math.max(blastRadius * 2, 200); // km
    const totalImpactRadius = Math.max(blastRadius, tsunamiRadius, craterDiameter * 2);
    
    cities.forEach(city => {
        const distance = calculateDistance(lat, lon, city.lat, city.lon);
        
        if (distance <= totalImpactRadius) {
            // Determine exposure level based on distance (impactor-2025 style)
            let exposureLevel = "Low";
            if (distance <= craterDiameter) {
                exposureLevel = "Extreme";
            } else if (distance <= blastRadius) {
                exposureLevel = "High";
            } else if (distance <= tsunamiRadius) {
                exposureLevel = "Medium";
            } else {
                exposureLevel = "Low";
            }
            
            affectedCities.push({
                name: city.name,
                distance: distance,
                population: city.population,
                exposure_level: exposureLevel,
                gdp_per_capita: city.gdp_per_capita
            });
        }
    });
    
    return affectedCities.sort((a, b) => a.distance - b.distance);
}

// Calculate economic impact (impactor-2025 style)
function calculateEconomicImpact(lat, lon, craterDiameter, energy) {
    // Calculate blast and tsunami radius based on energy
    const blastRadius = Math.sqrt(energy / (Math.PI * 1e12)); // km
    const tsunamiRadius = Math.max(blastRadius * 2, 200); // km
    const seismicRadius = Math.min(1000, blastRadius * 10);
    
    // Get affected cities for economic calculation
    const affectedCities = calculateAffectedCities(lat, lon, craterDiameter, Math.log10(energy) / 3);
    
    let totalEconomicLoss = 0;
    let totalPopulationAffected = 0;
    
    // Calculate economic loss based on affected cities
    affectedCities.forEach(city => {
        totalPopulationAffected += city.population;
        
        // Calculate economic loss based on exposure level and GDP
        const cityGDP = city.population * city.gdp_per_capita;
        let lossMultiplier = 0;
        
        switch (city.exposure_level) {
            case 'Extreme':
                lossMultiplier = 0.95; // 95% loss - total destruction
                break;
            case 'High':
                lossMultiplier = 0.5; // 50% loss - severe damage
                break;
            case 'Medium':
                lossMultiplier = 0.2; // 20% loss - moderate damage
                break;
            case 'Low':
                lossMultiplier = 0.05; // 5% loss - minor damage
                break;
        }
        
        totalEconomicLoss += cityGDP * lossMultiplier;
    });
    
    return {
        totalDamage: totalEconomicLoss,
        blastRadius: blastRadius,
        tsunamiRadius: tsunamiRadius,
        seismicRadius: seismicRadius,
        populationAffected: totalPopulationAffected
    };
}

// Calculate GDP impact percentage
function calculateGDPImpactPercentage(economicImpact) {
    const worldGDP = 100e12; // $100 trillion world GDP
    return (economicImpact.totalDamage / worldGDP) * 100;
}

// Calculate MMI zones
function calculateMMIZones(magnitude, lat, lon) {
    const zones = [];
    const mmiLevels = [2, 3, 4, 5, 6, 7, 8, 9];
    
    mmiLevels.forEach(mmi => {
        if (mmi <= magnitude + 2) {
            const distance = Math.pow(10, (magnitude - mmi + 1) / 1.5);
            zones.push({
                mmi: mmi,
                distance: distance,
                color: getMMIColor(mmi),
                coordinates: generateCircleCoordinates(lat, lon, distance)
            });
        }
    });
    
    return zones;
}

// Calculate tsunami zones
function calculateTsunamiZones(tsunamiHeight, lat, lon) {
    const zones = [];
    const heightLevels = [1, 5, 10, 20, 50];
    
    heightLevels.forEach(height => {
        if (height <= tsunamiHeight) {
            const distance = height * 100; // Simplified distance calculation
            zones.push({
                height: height,
                category: getTsunamiCategory(height),
                distance: distance,
                color: getTsunamiColor(height),
                coordinates: generateCircleCoordinates(lat, lon, distance)
            });
        }
    });
    
    return zones;
}

// Helper functions
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function getMMIColor(mmi) {
    const colors = {
        2: '#00FF00', 3: '#80FF00', 4: '#FFFF00', 5: '#FF8000',
        6: '#FF4000', 7: '#FF0000', 8: '#8000FF', 9: '#4000FF'
    };
    return colors[mmi] || '#FF0000';
}

function getTsunamiCategory(height) {
    if (height < 1) return 'Minor';
    if (height < 5) return 'Moderate';
    if (height < 10) return 'Major';
    if (height < 20) return 'Severe';
    return 'Catastrophic';
}

function getTsunamiColor(height) {
    if (height < 1) return '#00FF00';
    if (height < 5) return '#80FF00';
    if (height < 10) return '#FFFF00';
    if (height < 20) return '#FF8000';
    return '#FF0000';
}

function generateCircleCoordinates(centerLat, centerLon, radiusKm) {
    const coordinates = [];
    const points = 32;
    const R = 6371; // Earth's radius in km
    
    for (let i = 0; i < points; i++) {
        const angle = (i * 360 / points) * Math.PI / 180;
        const lat = centerLat + (radiusKm / R) * (180 / Math.PI) * Math.cos(angle);
        const lon = centerLon + (radiusKm / R) * (180 / Math.PI) * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180);
        coordinates.push([lat, lon]);
    }
    
    return coordinates;
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
    console.log('Updating asteroid parameters from API data:', asteroid);
    
    // Reset manual adjustment flag when selecting new asteroid
    parametersManuallyAdjusted = false;
    
    // Update diameter (impactor-2025 style) - prioritize API data
    if (asteroid.estimated_diameter && asteroid.estimated_diameter.meters) {
        const avgDiameter = (asteroid.estimated_diameter.meters.estimated_diameter_min + 
                            asteroid.estimated_diameter.meters.estimated_diameter_max) / 2;
        const diameterInput = document.getElementById('diameter');
        diameterInput.value = Math.round(avgDiameter);
        diameterInput.min = Math.round(asteroid.estimated_diameter.meters.estimated_diameter_min);
        diameterInput.max = Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max);
        updateDiameter();
        console.log('Updated diameter to API value:', avgDiameter, 'm');
    }
    
    // Update velocity from close approach data (impactor-2025 style) - prioritize API data
    if (asteroid.close_approach_data && asteroid.close_approach_data.length > 0) {
        const approach = asteroid.close_approach_data[0];
        if (approach.relative_velocity && approach.relative_velocity.kilometers_per_second) {
            const velocityKmS = parseFloat(approach.relative_velocity.kilometers_per_second);
            const velocityMs = velocityKmS * 1000;
            document.getElementById('velocity').value = Math.round(velocityMs);
            updateVelocity();
            console.log('Updated velocity to API value:', velocityKmS, 'km/s');
        }
    }
    
    // Update impact angle based on orbital inclination (impactor-2025 style) - prioritize API data
    if (asteroid.orbital_data && asteroid.orbital_data.inclination) {
        const inclination = parseFloat(asteroid.orbital_data.inclination);
        // Convert orbital inclination to impact angle (more accurate)
        const estimatedAngle = Math.min(90, Math.max(15, Math.abs(inclination) + 20));
        document.getElementById('angle').value = Math.round(estimatedAngle);
        updateAngle();
        console.log('Updated angle to API-based value:', estimatedAngle, 'degrees');
    }
    
    // Update density based on absolute magnitude (impactor-2025 style) - prioritize API data
    if (asteroid.absolute_magnitude_h) {
        const magnitude = parseFloat(asteroid.absolute_magnitude_h);
        const densitySelect = document.getElementById('density-type');
        
        // Estimate density based on absolute magnitude
        if (magnitude < 15) {
            densitySelect.value = 'iron'; // Bright, likely metallic
        } else if (magnitude > 20) {
            densitySelect.value = 'carbonaceous'; // Dim, likely carbonaceous
        } else {
            densitySelect.value = 'stony'; // Default to stony
        }
        updateDensity();
        console.log('Updated density type to API-based value:', densitySelect.value, 'based on magnitude:', magnitude);
    }
    
    // Update mass display first
    updateMass();
    
    // Display API data in UI after all parameters are updated
    setTimeout(() => {
        displayAsteroidInfo(asteroid);
    }, 100);
}

// Display asteroid API data (impactor-2025 style)
function displayAsteroidInfo(asteroid) {
    const infoContainer = document.getElementById('asteroid-info');
    if (!infoContainer) return;
    
    // Get current diameter from input (the one being used in simulation)
    const currentDiameter = document.getElementById('diameter').value;
    const currentVelocity = document.getElementById('velocity').value;
    const currentAngle = document.getElementById('angle').value;
    
    // Get API data for reference (use same values as set in updateAsteroidParameters)
    const apiDiameterMin = asteroid.estimated_diameter?.meters?.estimated_diameter_min || 0;
    const apiDiameterMax = asteroid.estimated_diameter?.meters?.estimated_diameter_max || 0;
    const apiDiameter = apiDiameterMin && apiDiameterMax ? 
        Math.round((apiDiameterMin + apiDiameterMax) / 2) : 'Unknown';
    const apiVelocity = asteroid.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || 'Unknown';
    const magnitude = asteroid.absolute_magnitude_h || 'Unknown';
    const hazard = asteroid.is_potentially_hazardous ? 'Yes' : 'No';
    const jplUrl = asteroid.nasa_jpl_url || '#';
    
    // Debug logging
    console.log('Displaying asteroid info:');
    console.log('API Diameter:', apiDiameter);
    console.log('Set Diameter:', currentDiameter);
    console.log('API Velocity:', apiVelocity);
    console.log('Set Velocity:', currentVelocity);
    
    infoContainer.innerHTML = `
        <div class="asteroid-info-card">
            <h4>API Data & Current Settings</h4>
            <div class="info-grid">
                <div class="info-item">
                    <label>Diameter (API):</label>
                    <span>${apiDiameter}m</span>
                </div>
                <div class="info-item">
                    <label>Diameter (Set):</label>
                    <span class="current-value">${currentDiameter}m</span>
                </div>
                <div class="info-item">
                    <label>Velocity (API):</label>
                    <span>${apiVelocity} km/s</span>
                </div>
                <div class="info-item">
                    <label>Velocity (Set):</label>
                    <span class="current-value">${(currentVelocity / 1000).toFixed(1)} km/s</span>
                </div>
                <div class="info-item">
                    <label>Angle (Set):</label>
                    <span class="current-value">${currentAngle}°</span>
                </div>
                <div class="info-item">
                    <label>Magnitude:</label>
                    <span>${magnitude}</span>
                </div>
                <div class="info-item">
                    <label>Hazardous:</label>
                    <span class="${hazard === 'Yes' ? 'hazardous' : 'safe'}">${hazard}</span>
                </div>
            </div>
            <div class="info-note">
                <small>💡 API数据仅供参考，实际模拟使用Set中的参数值</small>
            </div>
        </div>
    `;
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
    
    // Mark as manually adjusted if asteroid is selected
    if (selectedAsteroid) {
        parametersManuallyAdjusted = true;
        setTimeout(() => {
            displayAsteroidInfo(selectedAsteroid);
        }, 50);
    }
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
    
    // Mark as manually adjusted if asteroid is selected
    if (selectedAsteroid) {
        parametersManuallyAdjusted = true;
        setTimeout(() => {
            displayAsteroidInfo(selectedAsteroid);
        }, 50);
    }
}

function updateAngle() {
    const angle = document.getElementById('angle').value;
    document.getElementById('angle-value').textContent = angle + '°';
    
    // Mark as manually adjusted if asteroid is selected
    if (selectedAsteroid) {
        parametersManuallyAdjusted = true;
        setTimeout(() => {
            displayAsteroidInfo(selectedAsteroid);
        }, 50);
    }
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
        console.log('Loading asteroids from API...');
        const response = await fetch('/api/neo-feed?startDate=2024-01-01&endDate=2024-01-07');
        if (response.ok) {
            const data = await response.json();
            
            if (data.near_earth_objects) {
                const asteroids = Object.values(data.near_earth_objects).flat();
                console.log('Loaded asteroids:', asteroids.length);
                
                // Filter and process asteroids (impactor-2025 style)
                const processedAsteroids = asteroids
                    .filter(asteroid => asteroid.estimated_diameter && 
                            asteroid.estimated_diameter.meters && 
                            asteroid.estimated_diameter.meters.estimated_diameter_max > 10) // Min 10m diameter
                    .map(asteroid => ({
                        id: asteroid.id,
                        name: asteroid.name,
                        estimated_diameter: asteroid.estimated_diameter,
                        close_approach_data: asteroid.close_approach_data,
                        orbital_data: asteroid.orbital_data,
                        is_potentially_hazardous: asteroid.is_potentially_hazardous,
                        absolute_magnitude_h: asteroid.absolute_magnitude_h,
                        nasa_jpl_url: asteroid.nasa_jpl_url
                    }))
                    .sort((a, b) => {
                        // Sort by diameter (largest first)
                        const aDiameter = a.estimated_diameter.meters.estimated_diameter_max;
                        const bDiameter = b.estimated_diameter.meters.estimated_diameter_max;
                        return bDiameter - aDiameter;
                    });
                
                loadedAsteroids = processedAsteroids;
                populateAsteroidSelect(processedAsteroids);
            } else {
                // Fallback to sample data
                loadedAsteroids = getSampleAsteroids();
                populateAsteroidSelect(loadedAsteroids);
            }
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
        
        // Display API data (impactor-2025 style)
        const diameter = asteroid.estimated_diameter?.meters?.estimated_diameter_max || 'Unknown';
        const hazard = asteroid.is_potentially_hazardous ? '⚠️' : '✅';
        const velocity = asteroid.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || 'Unknown';
        
        option.textContent = `${asteroid.name} - ${diameter}m - ${velocity}km/s ${hazard}`;
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
            throw new Error('Please select an impact location by clicking on the map or 3D globe');
        }
        if (isNaN(impactLon) || impactLon < -180 || impactLon > 180) {
            throw new Error('Please select an impact location by clicking on the map or 3D globe');
        }
        if (!density || density <= 0) {
            throw new Error('Invalid density type selected');
        }
        
        console.log('Simulation parameters:', {
            diameter, density, velocity, angle, targetType, impactLat, impactLon
        });
        
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
        
        // Calculate additional impact effects
        const exposedPopulation = calculateExposedPopulation(impactLat, impactLon, crater.diameter, energy);
        const affectedCities = calculateAffectedCities(impactLat, impactLon, crater.diameter, seismicMagnitude);
        const economicImpact = calculateEconomicImpact(impactLat, impactLon, crater.diameter, energy);
        const gdpImpactPercentage = calculateGDPImpactPercentage(economicImpact);
        
        // Create results object with all impactor-2025 fields
        const results = {
            // Basic impact parameters
            impact_energy_joules: energy,
            tnt_equivalent_megatons: tntEquivalent,
            crater_diameter_m: crater.diameter,
            crater_depth_m: crater.depth,
            seismic_magnitude: seismicMagnitude,
            tsunami_height_m: tsunamiHeight,
            peak_ground_acceleration: peakGroundAcceleration,
            
            // Population and cities
            exposed_population: exposedPopulation.total,
            affected_cities: affectedCities,
            
            // Economic impact
            estimated_damage_usd: economicImpact.totalDamage,
            total_economic_loss_usd: economicImpact.totalDamage,
            gdp_impact_percentage: gdpImpactPercentage,
            
            // MMI and tsunami zones (simplified)
            mmi_zones: calculateMMIZones(seismicMagnitude, impactLat, impactLon),
            tsunami_zones: tsunamiHeight ? calculateTsunamiZones(tsunamiHeight, impactLat, impactLon) : [],
            
            // Uncertainty bounds
            uncertainty_bounds: {
                crater_diameter: [crater.diameter * 0.8, crater.diameter * 1.2],
                seismic_magnitude: [seismicMagnitude - 0.5, seismicMagnitude + 0.5],
                tsunami_height: tsunamiHeight ? [tsunamiHeight * 0.5, tsunamiHeight * 2.0] : [0, 0],
                exposed_population: [exposedPopulation.total * 0.7, exposedPopulation.total * 1.3],
                economic_damage: [economicImpact.totalDamage * 0.6, economicImpact.totalDamage * 1.4]
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
    
    const formatLabel = (key) => {
        // snake_case -> Title Case
        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };
    
    container.innerHTML = `
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
                <div class="card-value">${results.seismic_magnitude?.toFixed(1) || 'N/A'}</div>
                <div class="card-subtitle">PGA: ${results.peak_ground_acceleration?.toFixed(2) || 'N/A'} m/s²</div>
            </div>
        </div>

        ${typeof results.tsunami_height_m === 'number' && results.tsunami_height_m > 0 ? `
        <div class="outcome-card tsunami">
            <div class="card-icon">🌊</div>
            <div class="card-content">
                <h3>Tsunami Height</h3>
                <div class="card-value">${results.tsunami_height_m?.toFixed(1) || 'N/A'} m</div>
                <div class="card-subtitle">Maximum wave height</div>
            </div>
        </div>
        ` : ''}

        <div class="outcome-card population">
            <div class="card-icon">👥</div>
            <div class="card-content">
                <h3>Exposed Population</h3>
                <div class="card-value">
                    ${results.exposed_population && results.exposed_population > 0
                        ? formatNumber(results.exposed_population, 0)
                        : '—'}
                </div>
                <div class="card-subtitle">
                    ${results.exposed_population && results.exposed_population > 0
                        ? `${results.affected_cities?.length || 0} cities affected`
                        : 'No populated areas affected'}
                </div>
            </div>
        </div>

        <div class="outcome-card economic">
            <div class="card-icon">💰</div>
            <div class="card-content">
                <h3>Economic Loss</h3>
                <div class="card-value">
                    ${(results.total_economic_loss_usd || results.estimated_damage_usd) > 0
                        ? `$${formatNumber(results.total_economic_loss_usd || results.estimated_damage_usd, 0)}`
                        : '—'}
                </div>
                <div class="card-subtitle">
                    ${(results.total_economic_loss_usd || results.estimated_damage_usd) > 0
                        ? (results.gdp_impact_percentage
                            ? `${results.gdp_impact_percentage?.toFixed(2) || 'N/A'}% of world GDP`
                            : 'USD')
                        : 'No significant damage expected'}
                </div>
            </div>
        </div>

        ${results.affected_cities && results.affected_cities.length > 0 ? `
        <div class="affected-cities">
            <h3>Affected Cities</h3>
            <div class="cities-list">
                ${results.affected_cities.map(city => `
                    <div class="city-item">
                        <div class="city-name">${city.name}</div>
                        <div class="city-details">
                            <span class="city-distance">${city.distance.toFixed(1)} km away</span>
                            <span class="city-exposure ${city.exposure_level}">${city.exposure_level} exposure</span>
                            <span class="city-population">${formatNumber(city.population, 0)} people</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="uncertainty-bounds">
            <h3>Uncertainty Bounds</h3>
            <div class="uncertainty-grid">
                ${Object.entries(results.uncertainty_bounds).map(([key, bounds]) => `
                    <div class="uncertainty-item">
                        <h4>${formatLabel(key)}</h4>
                        <div class="uncertainty-range">
                            ${formatNumber(bounds[0])} - ${formatNumber(bounds[1])}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ===== PREDICTION VISUALIZATION FUNCTIONS =====

function initializePredictionVisualizations() {
    initializePredictionMap();
    initializePredictionGlobe();
}

function initializePredictionMap() {
    const mapContainer = document.getElementById('impact-map');
    if (!mapContainer || predictionMap) return;
    
    try {
        predictionMap = L.map('impact-map', {
            center: [0, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: true
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(predictionMap);
        
        // Add click event listener for impact point selection
        predictionMap.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            console.log('=== 2D MAP CLICK DEBUG ===');
            console.log('2D Map clicked at:', lat, lng);
            console.log('==========================');
            
            // Update impact coordinates
            updateImpactCoordinates(lat, lng);
            
            // Update 3D globe impact point
            update3DGlobeImpactPoint(lat, lng);
        });
        
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
        
        // Set up renderer with enhanced quality
        const containerWidth = globeContainer.clientWidth;
        const containerHeight = globeContainer.clientHeight;
        renderer.setSize(containerWidth, containerHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.antialias = true;
        renderer.pixelRatio = window.devicePixelRatio;
        globeContainer.appendChild(renderer.domElement);
        
        // Create Earth geometry with higher resolution
        const earthGeometry = new THREE.SphereGeometry(1, 128, 128);
        
        // Create Earth material with NASA Blue Marble texture
        const earthTexture = new THREE.TextureLoader().load(
            'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
            undefined, // onLoad
            undefined, // onProgress
            (error) => {
                console.error('Failed to load Earth texture:', error);
            }
        );
        
        // Create fallback material in case texture fails
        const fallbackMaterial = new THREE.MeshPhongMaterial({
            color: 0x4a90e2, // Blue color
            shininess: 100,
            transparent: false
        });
        
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: earthTexture,
            shininess: 100,
            transparent: false
        });
        
        // Create Earth mesh
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.castShadow = true;
        earth.receiveShadow = true;
        scene.add(earth);
        
        // Add night lights texture for realistic night side
        const nightTexture = new THREE.TextureLoader().load(
            'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.jpg',
            undefined, // onLoad
            undefined, // onProgress
            (error) => {
                console.error('Failed to load night lights texture:', error);
            }
        );
        const nightMaterial = new THREE.MeshBasicMaterial({
            map: nightTexture,
            transparent: true,
            opacity: 0.8
        });
        
        const nightEarth = new THREE.Mesh(earthGeometry, nightMaterial);
        scene.add(nightEarth);
        
        // Atmosphere removed for cleaner look
        
        // Add clouds with NASA cloud texture
        const cloudGeometry = new THREE.SphereGeometry(1.05, 32, 32);
        const cloudTexture = new THREE.TextureLoader().load(
            'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
            undefined, // onLoad
            undefined, // onProgress
            (error) => {
                console.error('Failed to load cloud texture:', error);
            }
        );
        const cloudMaterial = new THREE.MeshBasicMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.3
        });
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        scene.add(clouds);
        
        // Cloud animation variables
        let cloudRotationSpeed = 0.0005; // Slow rotation speed for clouds
        let cloudRotationY = 0;
        let cloudOpacity = 0.3;
        let cloudOpacityDirection = 1;
        let cloudOpacitySpeed = 0.001;
        let cloudSpeedVariation = 0;
        let frameCount = 0;
        
        // Impact marker animation variables
        let impactPulseTime = 0;
        
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
        
        // Add impact point marker (simplified and properly positioned)
        const impactGroup = new THREE.Group();
        impactGroup.userData = { isImpactPoint: true };
        impactGroup.visible = false;
        
        // Main impact marker - simple sphere directly on Earth surface (larger for visibility)
        const impactGeometry = new THREE.SphereGeometry(0.02, 12, 12);
        const impactMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: false,
            opacity: 1.0
        });
        const impactSphere = new THREE.Mesh(impactGeometry, impactMaterial);
        impactGroup.add(impactSphere);
        
        // Simple pulsing ring effect (larger for visibility)
        const ringGeometry = new THREE.RingGeometry(0.03, 0.05, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        impactGroup.add(ring);
        
        // Add impact group as child of Earth so it rotates with Earth
        earth.add(impactGroup);
        
        console.log('Impact group created and added to scene:', impactGroup);
        console.log('Impact group visible:', impactGroup.visible);
        
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

        // Add click event listener for impact point selection
        renderer.domElement.addEventListener('click', (event) => {
            // Only handle click if not dragging
            if (isMouseDown) return;
            
            // Get mouse position in normalized device coordinates
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // Create raycaster
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);

            // Find intersection with Earth sphere
            const intersects = raycaster.intersectObject(earth);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                
                // Convert 3D point to lat/lng (consistent with update3DGlobeImpactPoint)
                const lat = Math.asin(point.y) * (180 / Math.PI);
                const lng = Math.atan2(point.z, point.x) * (180 / Math.PI);
                
                console.log('=== 3D EARTH CLICK DEBUG ===');
                console.log('3D Earth clicked at:', lat, lng);
                console.log('3D point:', point.x, point.y, point.z);
                console.log('=============================');
                
                // Update impact coordinates
                updateImpactCoordinates(lat, lng);

                // Update 3D impact marker position - directly on Earth surface
                impactGroup.position.copy(point);
                impactGroup.position.normalize();
                impactGroup.position.multiplyScalar(1.0); // Exactly on Earth surface
                
                console.log('Impact group position set to:', impactGroup.position);
                
                // Position ring at the same location as the sphere
                ring.position.set(0, 0, 0);
                
                // Make ring face outward from Earth surface
                const surfaceNormal = impactGroup.position.clone();
                ring.lookAt(ring.position.clone().add(surfaceNormal));
                
                impactGroup.visible = true; // Show the impact point
                
                console.log('Impact group visible set to:', impactGroup.visible);
                console.log('Impact group children count:', impactGroup.children.length);
                
                // Update 2D map marker
                update2DMapImpactPoint(lat, lng);
            }
        });
        
        // Handle window resize
        function handleResize() {
            const container = globeContainer;
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        
        window.addEventListener('resize', handleResize);
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Smooth rotation interpolation
            rotationX += (targetRotationX - rotationX) * 0.1;
            rotationY += (targetRotationY - rotationY) * 0.1;
            
            // Apply rotations
            earth.rotation.x = rotationX;
            earth.rotation.y = rotationY;
            nightEarth.rotation.x = rotationX;
            nightEarth.rotation.y = rotationY;
            
            // Independent cloud rotation for dynamic effect
            frameCount++;
            
            // Add slight speed variation every 100 frames for more natural movement
            if (frameCount % 100 === 0) {
                cloudSpeedVariation = (Math.random() - 0.5) * 0.0002;
            }
            
            cloudRotationY += cloudRotationSpeed + cloudSpeedVariation;
            clouds.rotation.x = rotationX;
            clouds.rotation.y = cloudRotationY;
            
            // Dynamic cloud opacity for weather effect
            cloudOpacity += cloudOpacityDirection * cloudOpacitySpeed;
            if (cloudOpacity >= 0.5) {
                cloudOpacity = 0.5;
                cloudOpacityDirection = -1;
            } else if (cloudOpacity <= 0.1) {
                cloudOpacity = 0.1;
                cloudOpacityDirection = 1;
            }
            cloudMaterial.opacity = cloudOpacity;
            
            // Impact point should NOT rotate with Earth - it stays fixed on the surface
            // The impact point position is already set relative to Earth's surface
            
            // Animate impact marker pulse effect
            if (impactGroup.visible) {
                impactPulseTime += 0.05;
                const pulseScale = 1 + Math.sin(impactPulseTime) * 0.03; // Very small pulse scale
                
                // Apply pulse scale to the main sphere
                impactSphere.scale.setScalar(pulseScale);
                
                // Animate ring opacity
                const ringOpacity = 0.5 + Math.sin(impactPulseTime * 2) * 0.3;
                ring.material.opacity = Math.max(0.2, ringOpacity);
            }
            
            renderer.render(scene, camera);
        }
        
        // Initial resize and start animation
        handleResize();
        animate();
        
        // Store references
        predictionGlobe = {
            scene: scene,
            camera: camera,
            renderer: renderer,
            earth: earth,
            impactPoint: impactGroup,
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

// Update impact coordinates in UI
function updateImpactCoordinates(lat, lng) {
    // Update latitude input
    const latInput = document.getElementById('impact-lat');
    if (latInput) {
        latInput.value = lat.toFixed(4);
    }
    
    // Update longitude input
    const lngInput = document.getElementById('impact-lon');
    if (lngInput) {
        lngInput.value = lng.toFixed(4);
    }
    
    console.log('Updated impact coordinates:', lat, lng);
}

// Update 3D globe impact point
function update3DGlobeImpactPoint(lat, lng) {
    if (!predictionGlobe || !predictionGlobe.scene) return;
    
    // Convert lat/lng to 3D coordinates (consistent with click conversion)
    const phi = (90 - lat) * Math.PI / 180;
    const theta = lng * Math.PI / 180;
    
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.cos(phi);
    const z = Math.sin(phi) * Math.sin(theta);
    
    console.log('update3DGlobeImpactPoint called with:', lat, lng);
    console.log('3D coordinates:', x, y, z);
    
    // Find and update impact point in 3D scene
    let impactPointFound = false;
    predictionGlobe.scene.traverse((child) => {
        if (child.userData && child.userData.isImpactPoint) {
            console.log('Found impact point in scene:', child);
            // Position exactly on Earth surface
            child.position.set(x, y, z);
            child.visible = true; // Show the impact point
            impactPointFound = true;
            
            console.log('Impact point position set to:', child.position);
            console.log('Impact point visible:', child.visible);
            
            // Update ring orientation
            child.traverse((subChild) => {
                if (subChild.geometry && subChild.geometry.type === 'RingGeometry') {
                    console.log('Found ring geometry, updating orientation');
                    // Position ring at the same location
                    subChild.position.set(0, 0, 0);
                    // Make ring face outward from Earth surface
                    const surfaceNormal = child.position.clone();
                    subChild.lookAt(subChild.position.clone().add(surfaceNormal));
                }
            });
        }
    });
    
    if (!impactPointFound) {
        console.error('Impact point not found in scene!');
    }
}

// Update 2D map impact point
function update2DMapImpactPoint(lat, lng) {
    if (!predictionMap) return;
    
    // Clear existing markers
    predictionMap.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
            predictionMap.removeLayer(layer);
        }
    });
    
    // Add new impact marker
    const impactMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'impact-marker',
            html: '<div style="background-color: #ff0000; border-radius: 50%; width: 20px; height: 20px; border: 3px solid white; animation: pulse 2s infinite;"></div>',
            iconSize: [20, 20]
        })
    }).addTo(predictionMap);
    
    impactMarker.bindPopup(`<b>Impact Location</b><br>Lat: ${lat.toFixed(4)}°<br>Lon: ${lng.toFixed(4)}°`);
    
    // Center map on impact point
    predictionMap.setView([lat, lng], 8);
}

function updatePredictionVisualizations(lat, lon, results) {
    // Update map center and markers
    if (predictionMap) {
        predictionMap.setView([lat, lon], 8);
        
        // Update impact marker
        const impactMarker = L.marker([lat, lon], {
            icon: L.divIcon({
                className: 'impact-marker',
                html: '<div style="background-color: #ff0000; border-radius: 50%; width: 20px; height: 20px; border: 3px solid white; animation: pulse 2s infinite;"></div>',
                iconSize: [20, 20]
            })
        });
        
        // Clear existing markers
        predictionMap.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Circle) {
                predictionMap.removeLayer(layer);
            }
        });
        
        impactMarker.addTo(predictionMap);
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
