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
let predictionMap = null;
let predictionGlobe = null;

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
        console.log('Prediction tab clicked, loading asteroids...');
        loadAsteroids();
        initializePredictionMap();
    });
    
    // Also load asteroids immediately for debugging
    console.log('Loading asteroids on page load...');
    loadAsteroids();
    
    // Ensure asteroids are loaded after a short delay
    setTimeout(() => {
        if (loadedAsteroids.length === 0) {
            console.log('No asteroids loaded, using sample data...');
            loadedAsteroids = getSampleAsteroids();
            populateAsteroidSelect(loadedAsteroids);
        }
    }, 1000);
    
    // Add manual button to populate dropdown (for debugging)
    const asteroidSelect = document.getElementById('asteroid-select');
    if (asteroidSelect) {
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Load Sample Asteroids';
        debugButton.style.marginTop = '10px';
        debugButton.onclick = () => {
            console.log('Manually loading sample asteroids...');
            loadedAsteroids = getSampleAsteroids();
            populateAsteroidSelect(loadedAsteroids);
        };
        asteroidSelect.parentNode.appendChild(debugButton);
    }
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
    // For impact events, seismic efficiency is much higher than tectonic earthquakes
    // Impact events can have 10-50% seismic efficiency depending on target material
    // Reference values:
    // - 1 MT TNT (4.2e15 J) → ~M4.5 earthquake
    // - 10 MT TNT (4.2e16 J) → ~M5.5 earthquake  
    // - 100 MT TNT (4.2e17 J) → ~M6.5 earthquake
    // - 1000 MT TNT (4.2e18 J) → ~M7.5 earthquake
    
    const seismicEfficiency = 0.15; // 15% efficiency for impact events
    const seismicMoment = energy * seismicEfficiency;
    
    // Use the moment magnitude scale: Mw = (2/3) * log10(M0) - 10.7
    // But adjust for impact events which are more efficient at generating seismic waves
    const magnitude = (2/3) * Math.log10(seismicMoment) - 10.7;
    
    // For very large impacts, add a scaling factor to account for surface wave generation
    const energyJoules = energy;
    if (energyJoules > 1e18) { // For impacts > 1 EJ
        const scalingFactor = Math.log10(energyJoules / 1e18) * 0.3;
        return Math.max(0, Math.min(10, magnitude + scalingFactor));
    }
    
    return Math.max(0, Math.min(10, magnitude));
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
    // For impact events, PGA is typically higher than tectonic earthquakes
    // Use a modified attenuation relationship for impact events
    const basePGA = Math.pow(10, magnitude - 1.5 * Math.log10(distance) - 0.01 * distance);
    
    // For impact events, add a factor to account for the impulsive nature
    const impactFactor = 1.5; // Impact events generate higher peak accelerations
    
    // Apply distance attenuation (PGA decreases with distance)
    const distanceKm = distance / 1000; // Convert to km
    const attenuationFactor = Math.exp(-distanceKm / 50); // Exponential decay over 50km
    
    return Math.max(0.01, basePGA * impactFactor * attenuationFactor);
}

function generateAffectedCities(impactLat, impactLon, energy) {
    // Get region-specific cities based on impact location
    const cities = getRegionalCities(impactLat, impactLon);
    
    // Calculate impact radius based on energy (same as map circle)
    const impactRadius = calculateImpactRadius(energy);
    
    // Calculate distance from impact point to each city
    const affectedCities = cities.map(city => {
        const distance = calculateDistance(impactLat, impactLon, city.lat, city.lon);
        const exposureLevel = calculateExposureLevel(distance, energy);
        return {
            name: city.name,
            distance_from_impact: distance,
            distance: distance,
            population: city.population,
            exposure_level: exposureLevel,
            exposureLevel: exposureLevel
        };
    });
    
    // Filter cities within impact radius and sort by distance
    return affectedCities
        .filter(city => city.distance < impactRadius) // Within impact radius
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 12); // Show top 12 cities to avoid overflow
}

function calculateImpactRadius(energy) {
    // Calculate impact radius based on energy
    // This should match the radius used in the 2D map circle
    const energyFactor = Math.log10(energy / 1e15); // Scale energy
    const baseRadius = 1000; // Base radius in km
    const energyMultiplier = Math.max(1, energyFactor);
    
    // Calculate radius that scales with energy but has reasonable bounds
    const radius = baseRadius * energyMultiplier;
    
    // Set reasonable bounds (100km to 5000km)
    return Math.max(100, Math.min(5000, radius));
}

function getRegionalCities(impactLat, impactLon) {
    // Determine region based on impact location
    const isNorthAmerica = impactLat > 15 && impactLat < 70 && impactLon > -170 && impactLon < -50;
    const isEurope = impactLat > 35 && impactLat < 70 && impactLon > -25 && impactLon < 40;
    const isAsia = impactLat > 5 && impactLat < 55 && impactLon > 60 && impactLon < 180;
    const isSouthAmerica = impactLat > -60 && impactLat < 15 && impactLon > -90 && impactLon < -30;
    const isAfrica = impactLat > -35 && impactLat < 40 && impactLon > -20 && impactLon < 60;
    const isOceania = impactLat > -50 && impactLat < 0 && impactLon > 110 && impactLon < 180;
    
    let cities = [];
    
    if (isNorthAmerica) {
        cities = [
            // North American cities
            { name: 'New York', lat: 40.7128, lon: -74.0060, population: 8e6 },
            { name: 'Boston', lat: 42.3601, lon: -71.0589, population: 4e6 },
            { name: 'Philadelphia', lat: 39.9526, lon: -75.1652, population: 6e6 },
            { name: 'Washington DC', lat: 38.9072, lon: -77.0369, population: 5e6 },
            { name: 'Toronto', lat: 43.6532, lon: -79.3832, population: 6e6 },
            { name: 'Montreal', lat: 45.5017, lon: -73.5673, population: 4e6 },
            { name: 'Chicago', lat: 41.8781, lon: -87.6298, population: 9e6 },
            { name: 'Detroit', lat: 42.3314, lon: -83.0458, population: 4e6 },
            { name: 'Atlanta', lat: 33.7490, lon: -84.3880, population: 5e6 },
            { name: 'Miami', lat: 25.7617, lon: -80.1918, population: 6e6 },
            { name: 'Houston', lat: 29.7604, lon: -95.3698, population: 7e6 },
            { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, population: 12e6 },
            { name: 'San Francisco', lat: 37.7749, lon: -122.4194, population: 8e6 },
            { name: 'Seattle', lat: 47.6062, lon: -122.3321, population: 4e6 },
            { name: 'Vancouver', lat: 49.2827, lon: -123.1207, population: 3e6 },
            { name: 'Mexico City', lat: 19.4326, lon: -99.1332, population: 22e6 }
        ];
    } else if (isEurope) {
        cities = [
            // European cities
            { name: 'London', lat: 51.5074, lon: -0.1278, population: 9e6 },
            { name: 'Paris', lat: 48.8566, lon: 2.3522, population: 2e6 },
            { name: 'Berlin', lat: 52.5200, lon: 13.4050, population: 4e6 },
            { name: 'Madrid', lat: 40.4168, lon: -3.7038, population: 6e6 },
            { name: 'Rome', lat: 41.9028, lon: 12.4964, population: 3e6 },
            { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, population: 1e6 },
            { name: 'Brussels', lat: 50.8503, lon: 4.3517, population: 1e6 },
            { name: 'Vienna', lat: 48.2082, lon: 16.3738, population: 2e6 },
            { name: 'Prague', lat: 50.0755, lon: 14.4378, population: 1e6 },
            { name: 'Warsaw', lat: 52.2297, lon: 21.0122, population: 2e6 },
            { name: 'Moscow', lat: 55.7558, lon: 37.6176, population: 13e6 },
            { name: 'Istanbul', lat: 41.0082, lon: 28.9784, population: 16e6 }
        ];
    } else if (isAsia) {
        cities = [
            // Asian cities
            { name: 'Tokyo', lat: 35.6762, lon: 139.6503, population: 14e6 },
            { name: 'Shanghai', lat: 31.2304, lon: 121.4737, population: 25e6 },
            { name: 'Beijing', lat: 39.9042, lon: 116.4074, population: 22e6 },
            { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, population: 7e6 },
            { name: 'Seoul', lat: 37.5665, lon: 126.9780, population: 10e6 },
            { name: 'Mumbai', lat: 19.0760, lon: 72.8777, population: 12e6 },
            { name: 'Delhi', lat: 28.7041, lon: 77.1025, population: 33e6 },
            { name: 'Bangkok', lat: 13.7563, lon: 100.5018, population: 11e6 },
            { name: 'Jakarta', lat: -6.2088, lon: 106.8456, population: 11e6 },
            { name: 'Manila', lat: 14.5995, lon: 120.9842, population: 13e6 },
            { name: 'Singapore', lat: 1.3521, lon: 103.8198, population: 6e6 },
            { name: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869, population: 8e6 }
        ];
    } else if (isSouthAmerica) {
        cities = [
            // South American cities
            { name: 'São Paulo', lat: -23.5505, lon: -46.6333, population: 12e6 },
            { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, population: 6e6 },
            { name: 'Buenos Aires', lat: -34.6118, lon: -58.3960, population: 3e6 },
            { name: 'Lima', lat: -12.0464, lon: -77.0428, population: 10e6 },
            { name: 'Bogotá', lat: 4.7110, lon: -74.0721, population: 8e6 },
            { name: 'Caracas', lat: 10.4806, lon: -66.9036, population: 3e6 },
            { name: 'Santiago', lat: -33.4489, lon: -70.6693, population: 6e6 },
            { name: 'Montevideo', lat: -34.9011, lon: -56.1645, population: 1e6 },
            { name: 'La Paz', lat: -16.2902, lon: -68.1341, population: 1e6 },
            { name: 'Quito', lat: -0.1807, lon: -78.4678, population: 2e6 }
        ];
    } else if (isAfrica) {
        cities = [
            // African cities
            { name: 'Cairo', lat: 30.0444, lon: 31.2357, population: 20e6 },
            { name: 'Lagos', lat: 6.5244, lon: 3.3792, population: 15e6 },
            { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, population: 5e6 },
            { name: 'Cape Town', lat: -33.9249, lon: 18.4241, population: 4e6 },
            { name: 'Nairobi', lat: -1.2921, lon: 36.8219, population: 4e6 },
            { name: 'Addis Ababa', lat: 9.1450, lon: 38.7667, population: 3e6 },
            { name: 'Casablanca', lat: 33.5731, lon: -7.5898, population: 3e6 },
            { name: 'Algiers', lat: 36.7372, lon: 3.0869, population: 2e6 },
            { name: 'Tunis', lat: 36.8065, lon: 10.1815, population: 1e6 },
            { name: 'Tripoli', lat: 32.8872, lon: 13.1913, population: 1e6 }
        ];
    } else if (isOceania) {
        cities = [
            // Oceanian cities
            { name: 'Sydney', lat: -33.8688, lon: 151.2093, population: 5e6 },
            { name: 'Melbourne', lat: -37.8136, lon: 144.9631, population: 5e6 },
            { name: 'Brisbane', lat: -27.4698, lon: 153.0251, population: 2e6 },
            { name: 'Perth', lat: -31.9505, lon: 115.8605, population: 2e6 },
            { name: 'Adelaide', lat: -34.9285, lon: 138.6007, population: 1e6 },
            { name: 'Auckland', lat: -36.8485, lon: 174.7633, population: 1e6 },
            { name: 'Wellington', lat: -41.2924, lon: 174.7787, population: 0.4e6 },
            { name: 'Christchurch', lat: -43.5321, lon: 172.6362, population: 0.4e6 }
        ];
    } else {
        // Default global cities for other locations
        cities = [
            { name: 'New York', lat: 40.7128, lon: -74.0060, population: 8e6 },
            { name: 'London', lat: 51.5074, lon: -0.1278, population: 9e6 },
            { name: 'Tokyo', lat: 35.6762, lon: 139.6503, population: 14e6 },
            { name: 'Shanghai', lat: 31.2304, lon: 121.4737, population: 25e6 },
            { name: 'Mumbai', lat: 19.0760, lon: 72.8777, population: 12e6 },
            { name: 'Delhi', lat: 28.7041, lon: 77.1025, population: 33e6 },
            { name: 'São Paulo', lat: -23.5505, lon: -46.6333, population: 12e6 },
            { name: 'Cairo', lat: 30.0444, lon: 31.2357, population: 20e6 },
            { name: 'Lagos', lat: 6.5244, lon: 3.3792, population: 15e6 },
            { name: 'Sydney', lat: -33.8688, lon: 151.2093, population: 5e6 },
            { name: 'Paris', lat: 48.8566, lon: 2.3522, population: 2e6 },
            { name: 'Moscow', lat: 55.7558, lon: 37.6176, population: 13e6 }
        ];
    }
    
    return cities;
}

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

function calculateExposureLevel(distance, energy) {
    // Calculate exposure level based on distance relative to impact radius
    const impactRadius = calculateImpactRadius(energy);
    const relativeDistance = distance / impactRadius;
    
    // Exposure levels based on distance relative to impact radius
    if (relativeDistance < 0.5) return 'Extreme';      // Within 50% of impact radius
    if (relativeDistance < 1.0) return 'High';       // Within impact radius
    if (relativeDistance < 2.0) return 'Medium';      // Within 2x impact radius
    return 'Low';                                      // Beyond 2x impact radius
}

function calculateExposedPopulation(energy, impactLat, impactLon) {
    // Simplified population exposure calculation
    const energyFactor = Math.log10(energy / 1e15);
    const basePopulation = 100e6; // Base population in impact region
    
    // Adjust based on energy and location (urban areas have higher population)
    const urbanFactor = isUrbanArea(impactLat, impactLon) ? 2 : 1;
    const energyMultiplier = Math.max(1, energyFactor);
    
    return Math.round(basePopulation * urbanFactor * energyMultiplier);
}

function isUrbanArea(lat, lon) {
    // Simple check for urban areas (major cities and their regions)
    const urbanRegions = [
        { lat: 40.7128, lon: -74.0060, radius: 100 }, // New York
        { lat: 35.6762, lon: 139.6503, radius: 100 }, // Tokyo
        { lat: 51.5074, lon: -0.1278, radius: 100 }, // London
        { lat: 28.7041, lon: 77.1025, radius: 100 }, // Delhi
        { lat: 19.0760, lon: 72.8777, radius: 100 }, // Mumbai
        { lat: 31.2304, lon: 121.4737, radius: 100 }, // Shanghai
    ];
    
    return urbanRegions.some(region => 
        calculateDistance(lat, lon, region.lat, region.lon) < region.radius
    );
}

function calculateEconomicLoss(energy, population) {
    // Simplified economic loss calculation
    const energyFactor = Math.log10(energy / 1e15);
    const populationFactor = Math.log10(population / 1e6);
    
    // Base economic loss in USD
    const baseLoss = 1e12; // 1 trillion USD base
    const energyMultiplier = Math.max(1, energyFactor);
    const populationMultiplier = Math.max(1, populationFactor);
    
    return Math.round(baseLoss * energyMultiplier * populationMultiplier);
}

// Event handlers
function handleAsteroidSelect(event) {
    console.log('Asteroid selection changed:', event.target.value);
    console.log('Event target:', event.target);
    console.log('Available options:', Array.from(event.target.options).map(opt => ({ value: opt.value, text: opt.text })));
    
    const asteroidId = event.target.value;
    if (asteroidId && asteroidId !== '') {
        // Find asteroid in loaded data
        console.log('Looking for asteroid ID:', asteroidId);
        console.log('Available asteroids:', loadedAsteroids.map(a => ({ id: a.id, name: a.name })));
        const asteroid = loadedAsteroids.find(a => a.id === asteroidId);
        if (asteroid) {
            console.log('Found asteroid:', asteroid);
            selectedAsteroid = asteroid;
            updateAsteroidParameters(asteroid);
        } else {
            console.error('Asteroid not found with ID:', asteroidId);
        }
    } else {
        console.log('No asteroid selected, resetting parameters');
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
        console.log('Calculated average diameter:', avgDiameter);
        const diameterInput = document.getElementById('diameter');
        console.log('Diameter input element:', diameterInput);
        
        if (diameterInput) {
            diameterInput.value = Math.round(avgDiameter);
            diameterInput.min = Math.round(asteroid.estimated_diameter.meters.estimated_diameter_min);
            diameterInput.max = Math.round(asteroid.estimated_diameter.meters.estimated_diameter_max);
            
            // Trigger input event to update visual elements
            diameterInput.dispatchEvent(new Event('input', { bubbles: true }));
            updateDiameter();
            console.log('Updated diameter to:', avgDiameter);
        } else {
            console.error('Diameter input element not found!');
        }
    } else {
        console.log('No diameter data available for asteroid');
    }
    
    // Update velocity
    if (asteroid.close_approach_data && asteroid.close_approach_data.length > 0) {
        const approach = asteroid.close_approach_data[0];
        if (approach.relative_velocity && approach.relative_velocity.kilometers_per_second) {
            const velocityKmS = parseFloat(approach.relative_velocity.kilometers_per_second);
            const velocityMs = velocityKmS * 1000;
            const velocityInput = document.getElementById('velocity');
            velocityInput.value = Math.round(velocityMs);
            
            // Trigger input event to update visual elements
            velocityInput.dispatchEvent(new Event('input', { bubbles: true }));
            updateVelocity();
            console.log('Updated velocity to:', velocityMs);
        }
    }
    
    // Update impact angle based on orbital inclination
    if (asteroid.orbital_data && asteroid.orbital_data.inclination) {
        const inclination = parseFloat(asteroid.orbital_data.inclination);
        // Convert orbital inclination to impact angle (simplified)
        const estimatedAngle = Math.min(90, Math.max(10, Math.abs(inclination) + 15));
        const angleInput = document.getElementById('angle');
        angleInput.value = Math.round(estimatedAngle);
        
        // Trigger input event to update visual elements
        angleInput.dispatchEvent(new Event('input', { bubbles: true }));
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
        
        // Trigger change event to update visual elements
        densitySelect.dispatchEvent(new Event('change', { bubbles: true }));
        updateDensity();
        console.log('Updated density type to:', densitySelect.value);
    }
    
    // Update mass display
    updateMass();
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
    console.log('Loading asteroids...');
    if (loadedAsteroids.length > 0) {
        console.log('Asteroids already loaded:', loadedAsteroids.length);
        return; // Already loaded
    }
    
    try {
        console.log('Fetching asteroids from API...');
        const response = await fetch('/api/neo-feed?startDate=2024-01-01&endDate=2024-01-07');
        if (response.ok) {
            const data = await response.json();
            console.log('API response:', data);
            loadedAsteroids = data;
            populateAsteroidSelect(data);
        } else {
            console.log('API failed, using sample data');
            // Fallback to sample data
            loadedAsteroids = getSampleAsteroids();
            console.log('Sample asteroids:', loadedAsteroids);
            populateAsteroidSelect(loadedAsteroids);
        }
    } catch (error) {
        console.error('Failed to load asteroids:', error);
        loadedAsteroids = getSampleAsteroids();
        console.log('Using sample asteroids after error:', loadedAsteroids);
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
    console.log('Populating asteroid select with:', asteroids);
    const select = document.getElementById('asteroid-select');
    console.log('Asteroid select element:', select);
    if (!select) {
        console.error('Asteroid select element not found!');
        return;
    }
    
    select.innerHTML = '<option value="">Choose an asteroid...</option>';
    
    asteroids.forEach(asteroid => {
        const option = document.createElement('option');
        option.value = asteroid.id;
        option.textContent = `${asteroid.name} - ${asteroid.is_potentially_hazardous_asteroid ? '⚠️' : '✅'}`;
        select.appendChild(option);
        console.log('Added asteroid option:', asteroid.id, asteroid.name);
    });
    
    console.log('Asteroid select populated with', asteroids.length, 'options');
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
        
        // Create sample affected cities based on impact location
        const sampleCities = generateAffectedCities(impactLat, impactLon, energy);
        
        // Calculate more realistic population and economic impact
        const exposedPopulation = calculateExposedPopulation(energy, impactLat, impactLon);
        const economicLoss = calculateEconomicLoss(energy, exposedPopulation);
        const gdpPercentage = (economicLoss / 100e12) * 100; // World GDP ~100 trillion
        
        // Create results object with calculated values
        const results = {
            impact_energy_joules: energy,
            tnt_equivalent_megatons: tntEquivalent,
            crater_diameter_m: crater.diameter,
            crater_depth_m: crater.depth,
            tsunami_height_m: tsunamiHeight,
            peak_ground_acceleration: peakGroundAcceleration,
            exposed_population: exposedPopulation,
            affected_cities: sampleCities,
            estimated_damage_usd: economicLoss,
            total_economic_loss_usd: economicLoss,
            gdp_impact_percentage: gdpPercentage,
            uncertainty_bounds: {
                crater_diameter: [crater.diameter * 0.8, crater.diameter * 1.2],
                tsunami_height: tsunamiHeight ? [tsunamiHeight * 0.5, tsunamiHeight * 2.0] : [0, 0],
                exposed_population: [exposedPopulation * 0.7, exposedPopulation * 1.3],
                economic_damage: [economicLoss * 0.6, economicLoss * 1.4]
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
    
    // Display detailed impact metrics
    displayDetailedImpactMetrics(results);
}

function displayDetailedImpactMetrics(results) {
    const detailedMetricsContainer = document.getElementById('detailed-impact-metrics');
    if (!detailedMetricsContainer) return;
    
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
    
    // Update impact energy card
    document.getElementById('impact-energy-value').textContent = formatEnergy(results.impact_energy_joules);
    document.getElementById('impact-energy-subtitle').textContent = `${formatNumber(results.tnt_equivalent_megatons)} MT TNT`;
    
    // Update crater diameter card
    document.getElementById('crater-diameter-value').textContent = formatDistance(results.crater_diameter_m);
    document.getElementById('crater-diameter-subtitle').textContent = `Depth: ${formatDistance(results.crater_depth_m)}`;
    
    
    // Update exposed population card
    const exposedPopulation = results.exposed_population || 0;
    document.getElementById('exposed-population-value').textContent = exposedPopulation > 0 ? formatNumber(exposedPopulation, 0) : '—';
    const affectedCitiesCount = results.affected_cities ? results.affected_cities.length : 0;
    document.getElementById('exposed-population-subtitle').textContent = exposedPopulation > 0 ? 
        `${affectedCitiesCount} cities affected` : 'No populated areas affected';
    
    // Update economic loss card
    const economicLoss = results.estimated_damage_usd || results.total_economic_loss_usd || 0;
    document.getElementById('economic-loss-value').textContent = economicLoss > 0 ? `$${formatNumber(economicLoss, 0)}` : '—';
    const gdpPercentage = results.gdp_impact_percentage || 0;
    document.getElementById('economic-loss-subtitle').textContent = economicLoss > 0 ? 
        (gdpPercentage > 0 ? `${gdpPercentage.toFixed(2)}% of world GDP` : 'USD') : 'No significant damage expected';
    
    // Show the detailed metrics section
    detailedMetricsContainer.style.display = 'block';
    
    // Display affected cities if available
    displayAffectedCities(results.affected_cities);
    
    // Display uncertainty bounds if available
    displayUncertaintyBounds(results.uncertainty_bounds);
}

function displayAffectedCities(affectedCities) {
    const citiesSection = document.getElementById('affected-cities-section');
    const citiesList = document.getElementById('affected-cities-list');
    
    if (!citiesSection || !citiesList) return;
    
    if (!affectedCities || affectedCities.length === 0) {
        citiesSection.style.display = 'none';
        return;
    }
    
    const formatNumber = (num, decimals = 0) => {
        if (num === undefined || num === null || isNaN(num)) return 'N/A';
        if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
        return num.toFixed(decimals);
    };
    
    citiesList.innerHTML = affectedCities.map(city => `
        <div class="city-item">
            <div class="city-name">${city.name || 'Unknown City'}</div>
            <div class="city-details">
                <div class="city-distance">${(city.distance_from_impact || city.distance || 0).toFixed(1)} km away</div>
                <div class="city-exposure ${(city.exposure_level || city.exposureLevel || 'low').toLowerCase()}">
                    ${city.exposure_level || city.exposureLevel || 'Low'} exposure
                </div>
                <div class="city-population">${formatNumber(city.population, 0)} people</div>
            </div>
        </div>
    `).join('');
    
    citiesSection.style.display = 'block';
}

function displayUncertaintyBounds(uncertaintyBounds) {
    const boundsSection = document.getElementById('uncertainty-bounds-section');
    const boundsGrid = document.getElementById('uncertainty-bounds-grid');
    
    if (!boundsSection || !boundsGrid) return;
    
    if (!uncertaintyBounds || Object.keys(uncertaintyBounds).length === 0) {
        boundsSection.style.display = 'none';
        return;
    }
    
    const formatNumber = (num, decimals = 1) => {
        if (num === undefined || num === null || isNaN(num)) return 'N/A';
        if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`;
        if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
        return num.toFixed(decimals);
    };
    
    const formatLabel = (key) => {
        return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };
    
    boundsGrid.innerHTML = Object.entries(uncertaintyBounds).map(([key, bounds]) => `
        <div class="uncertainty-item">
            <h4>${formatLabel(key)}</h4>
            <div class="uncertainty-range">${formatNumber(bounds[0])} - ${formatNumber(bounds[1])}</div>
        </div>
    `).join('');
    
    boundsSection.style.display = 'block';
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
        
        // Add impact circle (will be updated when simulation runs)
        const impactCircle = L.circle([40.7128, -74.0060], {
            color: '#ff0000',
            fillColor: '#ff0000',
            fillOpacity: 0.1,
            radius: 100000 // Default 100km radius, will be updated during simulation
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
        
        // Create continents using a more detailed approach
        const continentGeometry = new THREE.SphereGeometry(1.001, 64, 64);
        
        // Create a canvas texture for continents
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Draw continents on canvas
        ctx.fillStyle = '#4a5d23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw simplified continents
        ctx.fillStyle = '#2d5016';
        
        // North America
        ctx.beginPath();
        ctx.ellipse(200, 150, 80, 60, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // South America
        ctx.beginPath();
        ctx.ellipse(180, 300, 40, 80, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Europe
        ctx.beginPath();
        ctx.ellipse(400, 120, 60, 30, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Africa
        ctx.beginPath();
        ctx.ellipse(420, 250, 50, 100, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Asia
        ctx.beginPath();
        ctx.ellipse(600, 150, 120, 80, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Australia
        ctx.beginPath();
        ctx.ellipse(700, 350, 40, 25, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        const continentTexture = new THREE.CanvasTexture(canvas);
        const continentMaterial = new THREE.MeshPhongMaterial({
            map: continentTexture,
            transparent: true,
            opacity: 0.8
        });
        
        const continents = new THREE.Mesh(continentGeometry, continentMaterial);
        scene.add(continents);
        
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
            continents.rotation.x = rotationX;
            continents.rotation.y = rotationY;
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
        
        // Add impact circle based on energy (same calculation as affected cities)
        if (results && results.impact_energy_joules) {
            const radius = calculateImpactRadius(results.impact_energy_joules);
            L.circle([lat, lon], {
                color: '#ff0000',
                fillColor: '#ff0000',
                fillOpacity: 0.1,
                radius: radius * 1000 // Convert km to meters for Leaflet
            }).addTo(predictionMap);
        }
    }
}
