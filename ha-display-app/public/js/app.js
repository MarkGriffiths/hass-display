// Main application script
import { config } from './config.js';
import { loadConfig, validateConfig } from './config-manager.js';
import { connectToHA, addEntityListener } from './ha-connection.js';
import { initTemperatureGauge, updateTemperatureGauge, updateSecondaryTemperatureGauge, updateHumidityGauge, updatePressureGauge } from './gauge-manager.js';
import { testGauges } from './test-gauges.js';

// Wait for DOM to be fully loaded and ready
function waitForDOMReady() {
    return new Promise(resolve => {
        if (document.readyState === 'complete') {
            console.log('Document already fully loaded');
            resolve();
        } else {
            console.log(`Document not fully loaded, current state: ${document.readyState}`);
            window.addEventListener('load', () => {
                console.log('Window load event fired, document fully loaded');
                resolve();
            });
        }
    });
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
        
        // Initialize UI components with proper DOM ready handling
        // Make sure DOM is fully loaded before initializing gauges
        const initializeGauges = async () => {
            console.log('Initializing gauges...');
            
            // First check if all required DOM elements exist
            const requiredElements = [
                'temperature-markers',
                'secondary-temp-markers',
                'humidity-markers',
                'pressure-markers',
                'temperature-arc',
                'secondary-temp-arc',
                'humidity-arc',
                'pressure-arc'
            ];
            
            // Log the presence of each required element and SVG structure
            console.log('Checking for required DOM elements:');
            const missingElements = [];
            
            // Log the entire SVG structure to help diagnose issues
            const svgElement = document.querySelector('.gauge-svg');
            if (svgElement) {
                console.log('Found SVG element with class .gauge-svg');
                console.log('SVG children count:', svgElement.childNodes.length);
                
                // Log all elements with IDs in the SVG
                const svgElementsWithId = svgElement.querySelectorAll('[id]');
                console.log(`Found ${svgElementsWithId.length} SVG elements with IDs:`);
                svgElementsWithId.forEach(el => {
                    console.log(`- ${el.id} (${el.tagName})`);
                });
            } else {
                console.error('SVG element with class .gauge-svg not found!');
            }
            
            // Check for each required element
            requiredElements.forEach(id => {
                const element = document.getElementById(id);
                if (!element) {
                    console.error(`Required element #${id} not found in DOM`);
                    missingElements.push(id);
                } else {
                    console.log(`Required element #${id} found in DOM`);
                }
            });
            
            if (missingElements.length > 0) {
                console.error(`Missing ${missingElements.length} required elements: ${missingElements.join(', ')}`);
                console.error('Cannot initialize gauges without required DOM elements');
                return false;
            }
            
            try {
                // Use the gauge initializer which now returns a Promise
                console.log('Calling initTemperatureGauge()...');
                const result = await initTemperatureGauge();
                if (result) {
                    console.log('All gauges initialized successfully');
                    return true;
                } else {
                    console.error('Gauge initialization returned false');
                    return false;
                }
            } catch (error) {
                console.error('Failed to initialize gauges:', error);
                return false;
            }
        };
        
        // Use a more robust approach to ensure DOM is fully loaded
        const waitForFullLoad = () => {
            return new Promise(resolve => {
                // Check if document is already complete
                if (document.readyState === 'complete') {
                    console.log('Document already fully loaded (readyState: complete)');
                    // Still add a small delay to ensure all rendering is complete
                    setTimeout(resolve, 200);
                } else {
                    console.log(`Document not fully loaded, current state: ${document.readyState}`);
                    
                    // Listen for both DOMContentLoaded and load events
                    const domContentLoadedHandler = () => {
                        console.log('DOMContentLoaded event fired');
                    };
                    
                    const loadHandler = () => {
                        console.log('Window load event fired, document fully loaded');
                        document.removeEventListener('DOMContentLoaded', domContentLoadedHandler);
                        // Add a delay after load to ensure all DOM elements are processed
                        setTimeout(resolve, 200);
                    };
                    
                    document.addEventListener('DOMContentLoaded', domContentLoadedHandler);
                    window.addEventListener('load', loadHandler);
                }
            });
        };
        
        // Wait for full load and then initialize with retry logic
        (async () => {
            try {
                console.log('Waiting for document to be fully loaded...');
                await waitForFullLoad();
                
                // Add a delay after full load to ensure all DOM elements are processed
                console.log('Waiting 1500ms before initializing gauges...');
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Try to initialize gauges with retry logic
                let success = false;
                let attempts = 0;
                const maxAttempts = 8; // Increased max attempts
                
                while (!success && attempts < maxAttempts) {
                    attempts++;
                    console.log(`Attempting to initialize gauges (attempt ${attempts}/${maxAttempts})...`);
                    success = await initializeGauges();
                    
                    if (!success && attempts < maxAttempts) {
                        // Exponential backoff for retries
                        const delay = Math.min(1000 * Math.pow(1.5, attempts), 10000); // Cap at 10 seconds
                        console.log(`Initialization failed, retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
                
                if (success) {
                    console.log('Gauge initialization completed successfully after', attempts, 'attempts');
                } else {
                    console.error('Failed to initialize gauges after', maxAttempts, 'attempts');
                    showError('Failed to initialize gauges. Please refresh the page.');
                }
            } catch (error) {
                console.error('Error during gauge initialization process:', error);
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
}

// Validate the Home Assistant configuration
function validateConfiguration() {
    // Use the validateConfig function from config-manager.js
    return validateConfig(config);
}

// Show configuration error
function showConfigError(errorMessage) {
    // Create or update error element
    let errorElement = document.getElementById('connection-error');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'connection-error';
        errorElement.className = 'error-message';
        document.body.appendChild(errorElement);
    }
    
    errorElement.innerHTML = `
        <div class="error-content">
            <h2>Configuration Error</h2>
            <p>${errorMessage}</p>
            <p>Please update your configuration settings.</p>
            <button onclick="window.location.href='/setup.html'">Go to Setup</button>
        </div>
    `;
    errorElement.style.display = 'flex';
    
    // Update connection status
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
        connectionStatus.textContent = 'Configuration Error';
        connectionStatus.className = 'error';
    }
}

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
