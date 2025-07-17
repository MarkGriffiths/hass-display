// Main application script
import { config } from './config.js';
import { loadConfig, validateConfig } from './config-manager.js';
import { connectToHA, addEntityListener } from './ha-connection.js';
import { initTemperatureGauge, updateTemperatureGauge, updateSecondaryTemperatureGauge, updateHumidityGauge, updatePressureGauge } from './gauge-manager.js';
import { testGauges } from './test-gauges.js';

// Wait for DOM to be fully loaded and ready - optimized version
function waitForDOMReady() {
    return new Promise(resolve => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // Resolve immediately if DOM is already ready
            resolve();
        } else {
            // Use a single event listener for DOMContentLoaded
            window.addEventListener('DOMContentLoaded', resolve, { once: true });
        }
    });
}

// Show configuration error
function showConfigError(errorMessage) {
    console.error('Configuration error:', errorMessage);
    
    // Hide the main content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    // Show the error container
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.style.display = 'flex';
        
        // Set the error message
        const errorMessageElement = document.getElementById('error-message');
        if (errorMessageElement) {
            errorMessageElement.textContent = errorMessage;
        }
        
        // Set up the setup button
        const setupButton = document.getElementById('setup-button');
        if (setupButton) {
            setupButton.addEventListener('click', function() {
                window.location.href = '/setup.html';
            });
        }
    }
}

// Show general error message
function showError(errorMessage) {
    console.error('Error:', errorMessage);
    
    // Use the same error container as config errors
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        // Hide the main content
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        errorContainer.style.display = 'flex';
        
        // Set the error message
        const errorMessageElement = document.getElementById('error-message');
        if (errorMessageElement) {
            errorMessageElement.textContent = errorMessage;
        }
    } else {
        // Fallback to alert if error container doesn't exist
        alert('Error: ' + errorMessage);
    }
}

// Initialize the application when DOM is ready
waitForDOMReady().then(() => {
    console.log('DOM is fully ready, initializing application...');
    
    // Initialize the application
    initApp();
    
    // Set up test button event listener
    const testButton = document.getElementById('test-button');
    if (testButton) {
        testButton.addEventListener('click', function() {
            // Call the comprehensive test function that tests all gauges
            testGauges();
        });
    }
    
    // Set up admin button event listener
    const adminButton = document.getElementById('admin-button');
    if (adminButton) {
        adminButton.addEventListener('click', function() {
            // Redirect to admin page
            window.location.href = '/admin.html';
        });
    }
});

// Weather icon mapping based on weather condition and sun position
const weatherIconMapping = {
    'clear-night': { day: 'wi-stars', night: 'wi-stars' },
    'cloudy': { day: 'wi-cloudy', night: 'wi-night-alt-cloudy' },
    'exceptional': { day: 'wi-day-sunny', night: 'wi-night-clear' },
    'fog': { day: 'wi-day-fog', night: 'wi-night-fog' },
    'hail': { day: 'wi-day-hail', night: 'wi-night-alt-hail' },
    'lightning': { day: 'wi-day-lightning', night: 'wi-night-alt-lightning' },
    'lightning-rainy': { day: 'wi-day-thunderstorm', night: 'wi-night-alt-thunderstorm' },
    'partlycloudy': { day: 'wi-day-cloudy', night: 'wi-night-alt-cloudy' },
    'pouring': { day: 'wi-rain', night: 'wi-night-alt-rain' },
    'rainy': { day: 'wi-sprinkle', night: 'wi-night-alt-sprinkle' },
    'snowy': { day: 'wi-snow', night: 'wi-night-snow' },
    'snowy-rainy': { day: 'wi-sleet', night: 'wi-night-sleet' },
    'sunny': { day: 'wi-day-sunny', night: 'wi-night-clear' },
    'windy': { day: 'wi-windy', night: 'wi-night-alt-cloudy-windy' },
    'windy-variant': { day: 'wi-cloudy-gusts', night: 'wi-night-alt-cloudy-gusts' }
};

// Initialize the application
async function initApp() {
    // Load configuration from localStorage
    const loadedConfig = loadConfig();
    
    if (!loadedConfig) {
        // No configuration found, redirect to setup page
        window.location.href = '/setup.html';
        return;
    }
    
    // Validate configuration
    const validationResult = validateConfig(config);
    if (!validationResult.valid) {
        console.error('Configuration validation failed:', validationResult.error);
        showError(validationResult.error);
        return;
    }
    
    console.log('Loaded entities:', config.entities);

    // Add connection error element
    const errorElement = document.createElement('div');
    errorElement.id = 'connection-error';
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <div class="error-content">
            <h2>Connection Error</h2>
            <p>Could not connect to Home Assistant at ${config.homeAssistant.url}</p>
            <p>Please check your connection settings and make sure Home Assistant is running.</p>
            <button onclick="retryConnection()">Retry Connection</button>
            <button onclick="window.location.href='/setup.html'">Change Settings</button>
        </div>
    `;
    errorElement.style.display = 'none';
    document.body.appendChild(errorElement);

    // Connect to Home Assistant - simplified approach matching working minimal test
    try {
        console.log('Connecting to Home Assistant at:', config.homeAssistant.url);
        console.log('Using temperature entity:', config.entities.temperature);
        console.log('Using humidity entity:', config.entities.humidity);
        
        // Initialize UI components with optimized DOM handling
        const initializeGauges = async () => {
            // Fast check for SVG container - fail early if missing
            const svgElement = document.querySelector('.gauge-svg');
            if (!svgElement) {
                console.error('SVG container not found - gauge initialization aborted');
                return false;
            }
            
            // We'll let the gauge initializer handle the detailed element checks
            // This avoids redundant DOM queries and improves startup performance
            
            try {
                // Use the gauge initializer which now returns a Promise
                const result = await initTemperatureGauge();
                return result;
            } catch (error) {
                console.error('Failed to initialize gauges:', error);
                return false;
            }
        };
        
        // Initialize gauges immediately with optimized approach
        (async () => {
            try {
                console.log('Initializing gauges...');
                
                // Single attempt initialization with minimal error handling
                const success = await initializeGauges();
                
                if (success) {
                    console.log('Gauge initialization completed successfully');
                } else {
                    console.error('Failed to initialize gauges');
                    showError('Failed to initialize gauges. Please refresh the page.');
                }
            } catch (error) {
                console.error('Error during gauge initialization:', error);
                showError('Error initializing gauges: ' + error.message);
            }
        })();
        
        // Connect to Home Assistant using simplified logic
        try {
            await connectToHA();
            console.log('Successfully connected to Home Assistant');
            
            // Hide error message if it was previously shown
            const connectionErrorElement = document.getElementById('connection-error');
            if (connectionErrorElement) {
                connectionErrorElement.style.display = 'none';
            }
        } catch (error) {
            console.error('Error connecting to Home Assistant:', error);
        }
        
        // Set up entity listeners after successful connection
        setupEntityListeners();
        
        // Update connection status
        updateConnectionStatus(true);
        
    } catch (error) {
        const errorMessage = error.message || 'Unknown connection error';
        console.error('Connection failed:', errorMessage);
        
        // Update error message with specific details
        const errorElement = document.getElementById('connection-error');
        const errorContentElement = errorElement.querySelector('.error-content p:first-of-type');
        if (errorContentElement) {
            errorContentElement.textContent = `Could not connect to Home Assistant: ${errorMessage}`;
        }
        errorElement.style.display = 'flex';
        
        // Update connection status
        updateConnectionStatus(false, errorMessage);
    }
}

// Setup entity listeners
function setupEntityListeners() {
    // Entity name display removed
    
    // Update connection status
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
        connectionStatus.textContent = 'Connected to Home Assistant';
        connectionStatus.classList.add('connected');
    }
    
    // Variables to store weather and sun state
    let currentWeatherState = '';
    let isSunUp = false;
    
    // Function to update the weather icon based on current states
    function updateWeatherIcon() {
        const weatherIcon = document.querySelector('.conditions-center i');
        if (!weatherIcon) {
            console.error('Weather icon element not found');
            return;
        }
        
        console.log('Updating weather icon with weather:', currentWeatherState, 'sun up:', isSunUp);
        
        // Remove all existing weather classes
        weatherIcon.className = 'wi'; // Reset to base class
        
        // Set the appropriate icon based on weather and sun position
        if (currentWeatherState && weatherIconMapping[currentWeatherState]) {
            const timeOfDay = isSunUp ? 'day' : 'night';
            const iconClass = weatherIconMapping[currentWeatherState][timeOfDay];
            console.log('Selected icon class:', iconClass);
            weatherIcon.classList.add(iconClass);
        } else {
            // Default icon if weather state is unknown
            weatherIcon.classList.add(isSunUp ? 'wi-day-sunny' : 'wi-night-clear');
            console.warn('Unknown weather state:', currentWeatherState);
        }
    }
    
    // Listen for temperature changes
    addEntityListener(config.entities.temperature, (state) => {
        console.log('Temperature state received:', state);
        if (!state) {
            console.error('Temperature state is undefined');
            return;
        }
        
        const value = parseFloat(state.state);
        console.log('Parsed temperature value:', value, 'isNaN:', isNaN(value));
        if (!isNaN(value)) {
            // Update custom temperature gauge
            updateTemperatureGauge(value);
            
            // Temperature chart update removed
            // Entity name update removed
        } else {
            console.warn('Invalid temperature value:', state.state);
        }
    });
    
    // Listen for temperature trend changes
    addEntityListener(config.entities.temperatureTrend, (state) => {
        console.log('Temperature trend state received:', state);
        if (!state) {
            console.error('Temperature trend state is undefined');
            return;
        }
        
        // Get the temperature trend icon element
        const temperatureTrendIcon = document.querySelector('.temperature-trend i');
        if (!temperatureTrendIcon) {
            console.error('Temperature trend icon element not found');
            return;
        }
        
        // Update the icon based on the trend value
        const trend = state.state.toLowerCase();
        console.log('Temperature trend value:', trend);
        
        // Remove all existing direction classes
        temperatureTrendIcon.classList.remove('wi-direction-up');
        temperatureTrendIcon.classList.remove('wi-direction-down');
        temperatureTrendIcon.style.display = 'inline';
        
        // Set the appropriate icon based on the trend
        if (trend === 'up' || trend === 'rising') {
            temperatureTrendIcon.classList.add('wi-direction-up');
            temperatureTrendIcon.style.color = '#ff0000'; // Red for upward trend
        } else if (trend === 'down' || trend === 'falling') {
            temperatureTrendIcon.classList.add('wi-direction-down');
            temperatureTrendIcon.style.color = '#00a2ff'; // Blue for downward trend
        } else {
            // Hide the icon if stable or unknown
            temperatureTrendIcon.style.display = 'none';
        }
    });
    
    // Listen for humidity changes
    addEntityListener(config.entities.humidity, (state) => {
        console.log('Humidity state received:', state);
        if (!state) {
            console.error('Humidity state is undefined');
            return;
        }
        
        const value = parseFloat(state.state);
        console.log('Parsed humidity value:', value, 'isNaN:', isNaN(value));
        if (!isNaN(value)) {
            // Update custom humidity gauge
            updateHumidityGauge(value);
        } else {
            console.warn('Invalid humidity value:', state.state);
        }
    });
    
    // Listen for pressure changes
    addEntityListener(config.entities.pressure, (state) => {
        console.log('Pressure state received:', state);
        if (!state) {
            console.error('Pressure state is undefined');
            return;
        }
        
        const value = parseFloat(state.state);
        console.log('Parsed pressure value:', value, 'isNaN:', isNaN(value));
        if (!isNaN(value)) {
            // Update custom pressure gauge
            updatePressureGauge(value);
        } else {
            console.warn('Invalid pressure value:', state.state);
        }
    });
    
    // Listen for pressure trend changes
    addEntityListener(config.entities.pressureTrend, (state) => {
        console.log('Pressure trend state received:', state);
        if (!state) {
            console.error('Pressure trend state is undefined');
            return;
        }
        
        // Get the pressure trend icon element
        const pressureTrendIcon = document.querySelector('.pressure-trend i');
        if (!pressureTrendIcon) {
            console.error('Pressure trend icon element not found');
            return;
        }
        
        // Update the icon based on the trend value
        const trend = state.state.toLowerCase();
        console.log('Pressure trend value:', trend);
        
        // Remove all existing direction classes
        pressureTrendIcon.classList.remove('wi-direction-up');
        pressureTrendIcon.classList.remove('wi-direction-down');
        pressureTrendIcon.style.display = 'inline';
        
        // Set the appropriate icon based on the trend
        if (trend === 'up' || trend === 'rising') {
            pressureTrendIcon.classList.add('wi-direction-up');
        } else if (trend === 'down' || trend === 'falling') {
            pressureTrendIcon.classList.add('wi-direction-down');
        } else {
            // Hide the icon if stable or unknown
            pressureTrendIcon.style.display = 'none';
        }
    });
    
    // Listen for secondary temperature changes
    if (config.entities.temperatureSecondary) {
        addEntityListener(config.entities.temperatureSecondary, (state) => {
            console.log('Secondary temperature state received:', state);
            if (!state) {
                console.error('Secondary temperature state is undefined');
                return;
            }
            
            const value = parseFloat(state.state);
            console.log('Parsed secondary temperature value:', value, 'isNaN:', isNaN(value));
            if (!isNaN(value)) {
                // Update secondary temperature gauge
                updateSecondaryTemperatureGauge(value);
            } else {
                console.warn('Invalid secondary temperature value:', state.state);
            }
        });
    }
    
    // Listen for secondary temperature trend changes
    if (config.entities.temperatureSecondaryTrend) {
        addEntityListener(config.entities.temperatureSecondaryTrend, (state) => {
            console.log('Secondary temperature trend state received:', state);
            if (!state) {
                console.error('Secondary temperature trend state is undefined');
                return;
            }
            
            // Get the secondary temperature trend icon element
            const secondaryTempTrendIcon = document.querySelector('.secondary-temp-trend i');
            if (!secondaryTempTrendIcon) {
                console.error('Secondary temperature trend icon element not found');
                return;
            }
            
            // Update the icon based on the trend value
            const trend = state.state.toLowerCase();
            console.log('Secondary temperature trend value:', trend);
            
            // Remove all existing direction classes
            secondaryTempTrendIcon.classList.remove('wi-direction-up');
            secondaryTempTrendIcon.classList.remove('wi-direction-down');
            secondaryTempTrendIcon.style.display = 'inline';
            
            // Set the appropriate icon based on the trend
            if (trend === 'up' || trend === 'rising') {
                secondaryTempTrendIcon.classList.add('wi-direction-up');
                secondaryTempTrendIcon.style.color = '#ff0000'; // Red for upward trend
            } else if (trend === 'down' || trend === 'falling') {
                secondaryTempTrendIcon.classList.add('wi-direction-down');
                secondaryTempTrendIcon.style.color = '#00a2ff'; // Blue for downward trend
            } else {
                // Hide the icon if stable or unknown
                secondaryTempTrendIcon.style.display = 'none';
            }
        });
    }
    
    // Listen for weather condition changes
    if (config.entities.weather) {
        addEntityListener(config.entities.weather, (state) => {
            console.log('Weather state received:', state);
            if (!state) {
                console.error('Weather state is undefined');
                return;
            }
            
            // Update the current weather state
            currentWeatherState = state.state.toLowerCase();
            console.log('Current weather state:', currentWeatherState);
            
            // Update the weather icon
            updateWeatherIcon();
        });
    }
    
    // Listen for sun position changes
    if (config.entities.sun) {
        addEntityListener(config.entities.sun, (state) => {
            console.log('Sun state received:', state);
            if (!state) {
                console.error('Sun state is undefined');
                return;
            }
            
            // Check if the sun is above the horizon
            isSunUp = state.state.toLowerCase() === 'above_horizon';
            console.log('Sun is up:', isSunUp);
            
            // Update the weather icon
            updateWeatherIcon();
        });
    }
}

// Validate the Home Assistant configuration
function validateConfiguration() {
    // Use the validateConfig function from config-manager.js
    return validateConfig(config);
}

// Function removed to fix duplicate declaration

// Update connection status in the UI
function updateConnectionStatus(connected, message) {
    const connectionStatus = document.getElementById('connection-status');
    if (!connectionStatus) {
        console.error('Connection status element not found');
        return;
    }
    
    if (connected) {
        connectionStatus.textContent = 'Connected to Home Assistant';
        connectionStatus.className = 'connected';
    } else {
        connectionStatus.textContent = message || 'Connection error';
        connectionStatus.className = 'error';
    }
}

// Retry connection to Home Assistant
async function retryConnection() {
    try {
        // Update UI to show we're attempting to reconnect
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.textContent = 'Reconnecting...';
            connectionStatus.className = 'connecting';
        }
        
        // Hide the error overlay
        document.getElementById('connection-error').style.display = 'none';
        
        // Attempt to reconnect
        await connectToHA();
        console.log('Successfully reconnected to Home Assistant');
        
        // Set up entity listeners after successful reconnection
        setupEntityListeners();
        
        // Update connection status
        updateConnectionStatus(true);
    } catch (error) {
        console.error('Reconnection failed:', error.message);
        
        // Show error message with specific error details
        const errorElement = document.getElementById('connection-error');
        const errorContentElement = errorElement.querySelector('.error-content p:first-of-type');
        if (errorContentElement) {
            errorContentElement.textContent = `Could not connect to Home Assistant: ${error.message}`;
        }
        errorElement.style.display = 'flex';
        
        // Update connection status
        updateConnectionStatus(false, error.message || 'Reconnection failed');
    }
}
