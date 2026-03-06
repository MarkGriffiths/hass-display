// Main application script
import { config } from './config.js';
import { loadConfig, validateConfig } from './config-manager.js';
import { connectToHA, addEntityListener, updateRainToday, updateRainLastHour } from './ha-connection.js';
import { initSparkline, addTempPoint } from './temp-history.js';
import { initPressureSparkline, addPressurePoint } from './pressure-history.js';
import { initHumiditySparkline, addHumidityPoint } from './humidity-history.js';
import {
  initTemperatureGauge,
  updateTemperatureGauge,
  updateSecondaryTemperatureGauge,
  updateHumidityGauge,
  updatePressureGauge,
  updateRainfallGauge,
} from './gauge-manager.js';
import { initWindDisplays, updateWindDisplay } from './wind-display.js';
import { testGauges } from './test-gauges.js';

// Wait for DOM to be fully loaded and ready - optimized version
function waitForDOMReady() {
  return new Promise((resolve) => {
    if (
      document.readyState === 'complete' ||
      document.readyState === 'interactive'
    ) {
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
      setupButton.addEventListener('click', function () {
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
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize the application
  initApp();

  // Set up test button event listener
  const testButton = document.getElementById('test-button');
  if (testButton) {
    testButton.addEventListener('click', function () {
      // Call the comprehensive test function that tests all gauges
      testGauges();
    });
  }

  // Set up admin button event listener
  const adminButton = document.getElementById('admin-button');
  if (adminButton) {
    adminButton.addEventListener('click', function () {
      // Redirect to admin page
      window.location.href = '/admin.html';
    });
  }

  // Set up toggle rain view button event listener
  const toggleRainViewButton = document.getElementById('toggle-rain-view');
  if (toggleRainViewButton) {
    toggleRainViewButton.addEventListener('click', function () {
      // Toggle the showRainView flag
      config.display.showRainView = !config.display.showRainView;
      // Update the display
      updateRainViewDisplay();
      // Save the setting to localStorage
      const configToSave = {
        display: {
          showRainView: config.display.showRainView,
        },
      };
      localStorage.setItem('haDisplayConfig', JSON.stringify(configToSave));

      console.log('Rain view toggled:', config.display.showRainView);
    });
  }
});

// Weather icon mapping based on weather condition and sun position
// Weather icon mapping is now in config.js

// Function to update the rain view display based on config setting
// Make updateRainViewDisplay globally accessible for ha-connection.js
window.updateRainViewDisplay = function () {
  const rainCenter = document.getElementById('rain-center');
  const conditionsCenter = document.getElementById('conditions-center');
  const rainfallArc = document.getElementById('rainfall-arc');
  const rainfallBackground = document.querySelector('.rainfall-background');
  const rainfallMarkers = document.getElementById('rainfall-markers');

  if (!rainCenter || !conditionsCenter) {
    console.error('Could not find rain-center or conditions-center elements');
    return;
  }

  console.log(
    'Updating rain view display, showRainView:',
    config.display.showRainView
  );

  // Toggle rain-center/conditions-center visibility based on showRainView setting
  if (config.display.showRainView) {
    rainCenter.classList.add('active');
    conditionsCenter.classList.add('inactive');
  } else {
    rainCenter.classList.remove('active');
    conditionsCenter.classList.remove('inactive');
  }

  // IMPORTANT: Rainfall gauge visibility is now independent of the view toggle
  // Always check if there's rain today and show the gauge if needed
  if (rainfallArc && rainfallBackground && rainfallMarkers) {
    const rainTodayValue = parseFloat(
      document.getElementById('rain-today-value')?.textContent || '0'
    );
    console.log(
      'Checking rainfall gauge visibility, rain today value:',
      rainTodayValue
    );

    if (rainTodayValue > 0) {
      // Always show rainfall gauge if there's rain today, regardless of which view is active
      console.log('Showing rainfall gauge because rain today > 0');
      rainfallArc.style.display = 'block'; // Use explicit 'block' instead of empty string
      rainfallBackground.style.display = 'block';
      rainfallMarkers.style.display = 'block';
      // Update the rainfall gauge with the current value
      updateRainfallGauge(rainTodayValue);
    } else {
      // Only hide if there's no rain today
      console.log('Hiding rainfall gauge because rain today = 0');
      rainfallArc.style.display = 'none';
      rainfallBackground.style.display = 'none';
      rainfallMarkers.style.display = 'none';
    }
  }
};

// Initialize the application
async function initApp() {
  try {
    console.log('Initializing application...');

    // Fetch environment config from backend
    const response = await fetch('/api/env-config');

    if (!response.ok) {
      throw new Error(
        `Failed to fetch environment config: ${response.status} ${response.statusText}`
      );
    }

    const envConfig = await response.json();
    console.log('Environment config received:', envConfig);

    // Update config with values from backend
    config.homeAssistant.url = envConfig.haUrl;

    // Load access token from localStorage or use the one from backend
    const storedToken = localStorage.getItem('haAccessToken');
    config.homeAssistant.accessToken = storedToken || envConfig.accessToken;

    // Set room names from environment config
    config.secondaryRoomName = envConfig.secondaryName;
    config.tertiaryRoomName = envConfig.tertiaryName;
    console.log('Room names set from environment config:', {
      secondaryRoomName: config.secondaryRoomName,
      tertiaryRoomName: config.tertiaryRoomName
    });

    // Initialize room configurations
    function initRoomConfigs() {
      // Set up room configurations
      window.roomConfigs = [
        { prefix: 'secondary', name: config.secondaryRoomName || 'Secondary Room' },
        { prefix: 'tertiary', name: config.tertiaryRoomName || 'Tertiary Room' }
      ];

      console.log('Room configurations initialized with names from env:', window.roomConfigs);
      console.log('Config room names:', {
        secondaryRoomName: config.secondaryRoomName,
        tertiaryRoomName: config.tertiaryRoomName
      });

      // Directly set room names in DOM elements
      const secondaryRoomNameElement = document.getElementById('secondary-room-name');
      const tertiaryRoomNameElement = document.getElementById('tertiary-room-name');

      if (secondaryRoomNameElement) {
        secondaryRoomNameElement.textContent = config.secondaryRoomName || 'Secondary Room';
        console.log('Set secondary room name to:', secondaryRoomNameElement.textContent);
      } else {
        console.error('Secondary room name element not found');
      }

      if (tertiaryRoomNameElement) {
        tertiaryRoomNameElement.textContent = config.tertiaryRoomName || 'Tertiary Room';
        console.log('Set tertiary room name to:', tertiaryRoomNameElement.textContent);
      } else {
        console.error('Tertiary room name element not found');
      }

      console.log('Config entities available:', config.entities);

      // Debug: Check if tertiary room elements exist in the DOM
      const tertiaryElements = {
        name: document.getElementById('tertiary-room-name'),
        temp: document.getElementById('tertiary-temperature-value'),
        tempTrend: document.getElementById('tertiary-temperature-trend'),
        humidity: document.getElementById('tertiary-humidity-value'),
        humidityIcon: document.getElementById('tertiary-humidity-icon'),
        co2: document.getElementById('tertiary-co2-value'),
        co2Icon: document.getElementById('tertiary-co2-icon')
      };

      console.log('Tertiary room DOM elements:', tertiaryElements);

      // Debug: Check if secondary room elements exist in the DOM
      const secondaryElements = {
        name: document.getElementById('secondary-room-name'),
        temp: document.getElementById('secondary-temperature-value'),
        tempTrend: document.getElementById('secondary-temperature-trend'),
        humidity: document.getElementById('secondary-humidity-value'),
        humidityIcon: document.getElementById('secondary-humidity-icon'),
        co2: document.getElementById('secondary-co2-value'),
        co2Icon: document.getElementById('secondary-co2-icon')
      };

      console.log('Secondary room DOM elements:', secondaryElements);

      // Set up entity listeners for each room
      window.roomConfigs.forEach(roomConfig => {
        setupRoomEntityListeners(roomConfig.prefix);
      });
    }

    initRoomConfigs();

    // Apply room names to DOM elements
    setupRoomDisplays(window.roomConfigs);

    // Update entity IDs from backend
    console.log('Entities from backend:', envConfig.entities);
    console.log('Current config entities before update:', {...config.entities});

    Object.keys(envConfig.entities).forEach((key) => {
      if (config.entities.hasOwnProperty(key)) {
        config.entities[key] = envConfig.entities[key];
      } else {
        console.warn(`Entity key not found in config: ${key}`);
      }
    });

    console.log('Updated config entities:', {...config.entities});

    // Load display settings from localStorage
    const storedConfig = localStorage.getItem('haDisplayConfig');
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        if (
          parsedConfig.display &&
          parsedConfig.display.showRainView !== undefined
        ) {
          config.display.showRainView = parsedConfig.display.showRainView;
        }
      } catch (e) {
        console.error('Error parsing stored config:', e);
      }
    }

    // Configuration updated with backend values and stored settings

    // Apply rain view setting
    updateRainViewDisplay();
  } catch (error) {
    console.error('Error loading environment config:', error);
    showError(`Failed to load configuration from backend: ${error.message}`);
    return;
  }

  // Validate configuration
  const validationResult = validateConfig(config);
  if (!validationResult.valid) {
    console.error('Configuration validation failed:', validationResult.error);
    showError(validationResult.error);
    return;
  }

  // Configuration validated

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

    // Initialize UI components with optimized DOM handling
    const initializeGauges = async () => {
      // Fast check for SVG container - fail early if missing
      const svgElement = document.getElementById('gauge-svg');
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
        // Single attempt initialization with minimal error handling
        const success = await initializeGauges();

        if (!success) {
          console.error('Failed to initialize gauges');
          showError('Failed to initialize gauges. Please refresh the page.');
        }

        // Initialize wind displays
        const windSuccess = initWindDisplays();
        if (!windSuccess) {
          console.error('Failed to initialize wind displays');
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        showError('Error initializing components: ' + error.message);
      }
    })();

    // Connect to Home Assistant using simplified logic
    try {
      await connectToHA();
      console.log('Successfully connected to Home Assistant');

      // Hide error message if it was previously shown
      const connectionErrorElement =
        document.getElementById('connection-error');
      if (connectionErrorElement) {
        connectionErrorElement.style.display = 'none';
      }

      // Initialize sparklines
      initSparkline();
      initPressureSparkline();
      initHumiditySparkline();

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
    const errorContentElement = errorElement.querySelector(
      '.error-content p:first-of-type'
    );
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
    connectionStatus.textContent = '';
    connectionStatus.classList.add('connected');
  }

  // Variables to store weather and sun state
  let currentWeatherState = '';
  let isSunUp = false;

  // Function to update the weather icon based on current states
  function updateWeatherIcon() {
    const weatherIcon = document.querySelector('#conditions-center i');
    if (!weatherIcon) {
      console.error('Weather icon element not found');
      return;
    }

    // Remove all existing weather classes
    weatherIcon.className = 'wi'; // Reset to base class

    // Set the appropriate icon based on weather and sun position
    const timeOfDay = isSunUp ? 'day' : 'night';

    if (
      currentWeatherState &&
      config.weather.iconMapping[currentWeatherState]
    ) {
      const iconClass =
        config.weather.iconMapping[currentWeatherState][timeOfDay];
      weatherIcon.classList.add(iconClass);
    } else {
      // Default icon if weather state is unknown - use config value
      const defaultIcon = config.weather.defaultIcons[timeOfDay];
      weatherIcon.classList.add(defaultIcon);
      console.warn('Unknown weather state:', currentWeatherState);
    }
  }

  // Listen for temperature changes
  addEntityListener(config.entities.temperature, (state) => {
    if (!state) {
      console.error('Temperature state is undefined');
      return;
    }

    const tempValue = parseFloat(state.state);
    if (!isNaN(tempValue)) {
      // Update temperature gauge with new value
      updateTemperatureGauge(tempValue);

      // Add temperature data point to history sparkline
      addTempPoint(tempValue);
    } else {
      console.warn('Invalid temperature value:', state.state);
    }
  });

  // Listen for temperature trend changes
  addEntityListener(config.entities.temperatureTrend, (state) => {
    if (!state) {
      console.error('Temperature trend state is undefined');
      return;
    }

    // Get the temperature trend icon element
    const temperatureTrendIcon = document.getElementById('temperature-trend-icon');
    if (!temperatureTrendIcon) {
      console.error('Temperature trend icon element not found');
      return;
    }

    // Update the icon based on the trend value
    const trend = state.state.toLowerCase();

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
    if (!state) {
      console.error('Humidity state is undefined');
      return;
    }

    const value = parseFloat(state.state);
    if (!isNaN(value)) {
      // Update custom humidity gauge
      updateHumidityGauge(value);

      // Update the humidity sparkline
      addHumidityPoint(value);
    } else {
      console.warn('Invalid humidity value:', state.state);
    }
  });

  // Listen for pressure changes
  addEntityListener(config.entities.pressure, (state) => {
    if (!state) {
      console.error('Pressure state is undefined');
      return;
    }

    const value = parseFloat(state.state);
    if (!isNaN(value)) {
      // Update custom pressure gauge
      updatePressureGauge(value);
    } else {
      console.warn('Invalid pressure value:', state.state);
    }
  });

  // Listen for pressure trend changes
  addEntityListener(config.entities.pressureTrend, (state) => {
    if (!state) {
      console.error('Pressure trend state is undefined');
      return;
    }

    // Get the pressure trend icon element
    const pressureTrendIcon = document.getElementById('pressure-trend-icon');
    if (!pressureTrendIcon) {
      console.error('Pressure trend icon element not found');
      return;
    }

    // Update the icon based on the trend value
    const trend = state.state.toLowerCase();

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

  // Set up room entity listeners for each configured room
  console.log('Setting up room entity listeners for configured rooms');
  console.log('Room configs:', window.roomConfigs);
  console.log('All available entities:', config.entities);

  // Force a clear debug log of all entity IDs
  console.log('ENTITY DEBUG:');
  console.log('Temperature:', config.entities.temperature);
  console.log('Temperature Trend:', config.entities.temperatureTrend);
  console.log('Secondary Temperature:', config.entities.temperatureSecondary);
  console.log('Secondary Temperature Trend:', config.entities.temperatureSecondaryTrend);
  console.log('Secondary Humidity:', config.entities.humiditySecondary);
  console.log('Secondary CO2:', config.entities.co2Secondary);
  console.log('Tertiary Temperature:', config.entities.temperatureTertiary);
  console.log('Tertiary Temperature Trend:', config.entities.temperatureTertiaryTrend);
  console.log('Tertiary Humidity:', config.entities.humidityTertiary);
  console.log('Tertiary CO2:', config.entities.co2Tertiary);

  // Debug HTML elements
  console.log('HTML ELEMENTS DEBUG:');
  console.log('Secondary room name element:', document.getElementById('secondary-room-name'));
  console.log('Secondary temp value element:', document.getElementById('secondary-temp-value'));
  console.log('Secondary humidity icon:', document.getElementById('secondary-humidity-icon'));
  console.log('Secondary humidity value:', document.getElementById('secondary-humidity-value'));
  console.log('Secondary CO2 icon:', document.getElementById('secondary-co2-icon'));
  console.log('Secondary CO2 value:', document.getElementById('secondary-co2-value'));
  console.log('Tertiary room name element:', document.getElementById('tertiary-room-name'));
  console.log('Tertiary temp value element:', document.getElementById('tertiary-temp-value'));
  console.log('Tertiary humidity icon:', document.getElementById('tertiary-humidity-icon'));
  console.log('Tertiary humidity value:', document.getElementById('tertiary-humidity-value'));
  console.log('Tertiary CO2 icon:', document.getElementById('tertiary-co2-icon'));
  console.log('Tertiary CO2 value:', document.getElementById('tertiary-co2-value'));

  if (window.roomConfigs && Array.isArray(window.roomConfigs)) {
    window.roomConfigs.forEach(roomConfig => {
      if (roomConfig.prefix) {
        console.log(`Setting up listeners for room: ${roomConfig.prefix}`);
        setupRoomEntityListeners(roomConfig.prefix);
      }
    });
  } else {
    console.error('No room configs found or roomConfigs is not an array');
  }

  // Secondary temperature trend changes now handled by setupRoomEntityListeners

  // Secondary humidity changes now handled by setupRoomEntityListeners

  // CO2 changes now handled by setupRoomEntityListeners

  // Listen for weather condition changes
  if (config.entities.weather) {
    addEntityListener(config.entities.weather, (state) => {
      console.log('Weather state changed:', state);
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

  // Listen for rain sensor changes
  if (config.entities.rain) {
    addEntityListener(config.entities.rain, (state) => {
      console.log('Rain state received:', state);
      if (!state) {
        console.error('Rain state is undefined');
        return;
      }

      const value = parseFloat(state.state);
      console.log('Parsed rain value:', value, 'isNaN:', isNaN(value));
      if (!isNaN(value)) {
        // Update the rain value display
        const rainValueElement = document.getElementById('rain-value');
        if (rainValueElement) {
          rainValueElement.textContent = value.toFixed(1);
        }

        // Update the rain icon based on the rain value
        const rainIcon = document.getElementById('rain-conditions-icon');
        if (rainIcon) {
          // Remove all existing rain classes
          rainIcon.className = 'wi';

          // Set the appropriate icon based on rain value
          if (value <= 0.2) {
            rainIcon.classList.add('wi-sprinkle');
          } else if (value <= 0.2) {
            rainIcon.classList.add('wi-rain-showers');
          } else if (value <= 0.4) {
            rainIcon.classList.add('wi-rain-mix');
          } else {
            rainIcon.classList.add('wi-rain');
          }
        }
      }
    });
  }

  // Listen for rain last hour changes
  if (config.entities.rainLastHour) {
    addEntityListener(config.entities.rainLastHour, (state) => {
      console.log('Rain last hour state received:', state);
      if (!state) {
        console.error('Rain last hour state is undefined');
        return;
      }

      const value = parseFloat(state.state);
      console.log(
        'Parsed rain last hour value:',
        value,
        'isNaN:',
        isNaN(value)
      );
      if (!isNaN(value)) {
        // Update the rain last hour value display
        const rainLastHourValueElement = document.getElementById(
          'rain-last-hour-value'
        );
        if (rainLastHourValueElement) {
          rainLastHourValueElement.textContent = value.toFixed(1);
        }

        // Automatically show rain view if rain amount is greater than zero
        if (value > 0) {
          config.display.showRainView = true;
        } else {
          config.display.showRainView = false;
        }

        // Update the display based on the new setting
        updateRainViewDisplay();
      }
    });
  }

  // Listen for rain today changes
  if (config.entities.rainToday) {
    addEntityListener(config.entities.rainToday, (state) => {
      console.log('Rain today state received:', state);
      if (!state) {
        console.error('Rain today state is undefined');
        return;
      }

      const value = parseFloat(state.state);
      console.log('Parsed rain today value:', value, 'isNaN:', isNaN(value));
      if (!isNaN(value)) {
        // Update the rain today value display
        const rainTodayValueElement =
          document.getElementById('rain-today-value');
        if (rainTodayValueElement) {
          rainTodayValueElement.textContent = value.toFixed(1);
        }

        // Always update the rainfall gauge with the current value
        // This ensures the gauge is visible when there's rainfall
        console.log('Updating rainfall gauge with value:', value);
        updateRainfallGauge(value);
      }
    });
  }

  // Listen for wind angle changes
  if (config.entities.windAngle) {
    addEntityListener(config.entities.windAngle, (state) => {
      if (!state) return;

      const angle = parseFloat(state.state);
      if (!isNaN(angle)) {
        // Update wind display (left side) with new angle only
        updateWindDisplay(angle, null, 'left');
      }
    });
  }

  // Listen for wind speed changes
  if (config.entities.windSpeed) {
    addEntityListener(config.entities.windSpeed, (state) => {
      if (!state) return;

      const speed = parseFloat(state.state);
      if (!isNaN(speed)) {
        // Update wind display (left side) with new speed only
        updateWindDisplay(null, speed, 'left');
      }
    });
  }

  // Listen for gust angle changes
  if (config.entities.gustAngle) {
    addEntityListener(config.entities.gustAngle, (state) => {
      if (!state) return;

      const angle = parseFloat(state.state);
      if (!isNaN(angle)) {
        // Update gust display (right side) with new angle only
        updateWindDisplay(angle, null, 'right');
      }
    });
  }

  // Listen for gust speed changes
  if (config.entities.gustSpeed) {
    addEntityListener(config.entities.gustSpeed, (state) => {
      if (!state) return;

      const speed = parseFloat(state.state);
      if (!isNaN(speed)) {
        // Update gust display (right side) with new speed only
        updateWindDisplay(null, speed, 'right');
      }
    });
  }

  // Listen for pressure changes
  if (config.entities.pressure) {
    addEntityListener(config.entities.pressure, (state) => {
      if (!state) return;

      const pressure = parseFloat(state.state);
      if (!isNaN(pressure)) {
        // Update the pressure gauge
        updatePressureGauge(pressure);

        // Update the pressure sparkline
        addPressurePoint(pressure);
      }
    });
  }
}

// Validate the Home Assistant configuration
function validateConfiguration() {
  // Use the validateConfig function from config-manager.js
  return validateConfig(config);
}

// Function removed to fix duplicate declaration

/**
 * Sets up room displays based on configuration
 * @param {Array} roomConfigs - Array of room configuration objects
 */
function setupRoomDisplays(roomConfigs) {
  if (!roomConfigs || !Array.isArray(roomConfigs)) return;

  // Store room configurations globally for later use in entity listeners
  window.roomConfigs = roomConfigs;

  console.log('Setting up room displays with roomConfigs:', window.roomConfigs);
  roomConfigs.forEach(config => {
    if (!config.prefix) return;

    const roomNameElement = document.getElementById(`${config.prefix}-room-name`);
    console.log(`Setting ${config.prefix} room name to '${config.name}', element exists:`, !!roomNameElement);
    if (roomNameElement) {
      roomNameElement.textContent = config.name;
      console.log(`Set ${config.prefix} room name element text to:`, roomNameElement.textContent);
    } else {
      console.error(`Room name element not found for ${config.prefix}`);
    }
  });
}

/**
 * Sets up entity listeners for room displays
 * @param {string} prefix - Room prefix (e.g., 'secondary', 'tertiary')
 */
function setupRoomEntityListeners(prefix) {
  if (!prefix) return;

  console.log(`Setting up entity listeners for ${prefix} room`);
  console.log('Available entities:', Object.keys(config.entities));
  console.log('Full config entities object:', config.entities);

  // Temperature entity
  const tempEntityKey = `temperature${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`;
  console.log(`Looking for temperature entity with key: ${tempEntityKey}, value:`, config.entities[tempEntityKey]);
  if (config.entities[tempEntityKey]) {
    addEntityListener(config.entities[tempEntityKey], (state) => {
      if (!state) {
        console.error(`${prefix} temperature state is undefined`);
        return;
      }

      const value = parseFloat(state.state);
      console.log(`Parsed ${prefix} temperature value:`, value);

      if (!isNaN(value)) {
        // Update temperature display
        const tempValue = document.getElementById(`${prefix}-temp-value`);
        if (tempValue) {
          tempValue.textContent = value.toFixed(1);
          console.log(`Updated ${prefix} temperature value to:`, value.toFixed(1));
        } else {
          console.error(`${prefix} temperature value element not found with ID: ${prefix}-temp-value`);
          // Try alternative ID format as fallback
          const altTempValue = document.getElementById(`${prefix}-temperature-value`);
          if (altTempValue) {
            altTempValue.textContent = value.toFixed(1);
            console.log(`Updated ${prefix} temperature value (alt ID) to:`, value.toFixed(1));
          }
        }
      } else {
        console.warn(`Invalid ${prefix} temperature value:`, state.state);
      }
    });
  }

  // Temperature trend entity
  const tempTrendEntityKey = `temperature${prefix.charAt(0).toUpperCase() + prefix.slice(1)}Trend`;
  if (config.entities[tempTrendEntityKey]) {
    addEntityListener(config.entities[tempTrendEntityKey], (state) => {
      if (!state) {
        console.error(`${prefix} temperature trend state is undefined`);
        return;
      }

      // Get the temperature trend icon element
      const tempTrendIcon = document.getElementById(`${prefix}-temperature-trend-icon`);
      if (!tempTrendIcon) {
        console.error(`${prefix} temperature trend icon element not found`);
        return;
      }

      // Update trend icon based on state
      const trendValue = state.state;

      // Reset classes
      tempTrendIcon.classList.remove('wi-direction-up');
      tempTrendIcon.classList.remove('wi-direction-down');
      tempTrendIcon.style.display = 'inline';

      // Set appropriate class and color
      if (trendValue === 'up') {
        tempTrendIcon.classList.add('wi-direction-up');
        tempTrendIcon.style.color = '#ff0000'; // Red for upward trend
      } else if (trendValue === 'down') {
        tempTrendIcon.classList.add('wi-direction-down');
        tempTrendIcon.style.color = '#00a2ff'; // Blue for downward trend
      } else {
        // Hide icon if trend is not up or down
        tempTrendIcon.style.display = 'none';
      }
    });
  }

  // Humidity entity
  const humidityEntityKey = `humidity${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`;
  console.log(`Looking for humidity entity with key: ${humidityEntityKey}, value:`, config.entities[humidityEntityKey]);
  if (config.entities[humidityEntityKey]) {
    addEntityListener(config.entities[humidityEntityKey], (state) => {
      if (!state) {
        console.error(`${prefix} humidity state is undefined`);
        return;
      }

      const value = parseFloat(state.state);
      console.log(`Parsed ${prefix} humidity value:`, value);

      if (!isNaN(value)) {
        // Update humidity display
        const humidityValue = document.getElementById(`${prefix}-humidity-value`);
        if (humidityValue) {
          humidityValue.textContent = Math.round(value);
          console.log(`Updated ${prefix} humidity value element to:`, Math.round(value));

          // Update humidity icon color based on value
          const humidityIcon = document.getElementById(`${prefix}-humidity-icon`);
          if (humidityIcon) {
            console.log(`Found ${prefix} humidity icon element:`, humidityIcon);
            // Get the nearest color stop for the humidity value
            const colorStops = [
              { value: 0, color: '#00a2ff' },   // Blue for very dry
              { value: 30, color: '#2ecc71' },  // Green for comfortable
              { value: 60, color: '#f39c12' },  // Orange for humid
              { value: 80, color: '#e74c3c' }   // Red for very humid
            ];

            // Find the nearest color stop
            let nearestStop = colorStops[0];
            let minDistance = Math.abs(value - nearestStop.value);

            for (let i = 1; i < colorStops.length; i++) {
              const distance = Math.abs(value - colorStops[i].value);
              if (distance < minDistance) {
                minDistance = distance;
                nearestStop = colorStops[i];
              }
            }

            // Set the humidity icon color
            humidityIcon.style.color = nearestStop.color;
            console.log(`Set ${prefix} humidity icon color to:`, nearestStop.color, 'for value:', value);
          } else {
            console.error(`${prefix} humidity icon element not found with ID: ${prefix}-humidity-icon`);
          }
        } else {
          console.error(`${prefix} humidity value element not found with ID: ${prefix}-humidity-value`);
        }
      } else {
        console.warn(`Invalid ${prefix} humidity value:`, state.state);
      }
    });
  } else {
    console.error(`No entity found for ${prefix} humidity with key: ${humidityEntityKey}`);
  }

  // CO2 entity
  const co2EntityKey = `co2${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`;
  console.log(`Looking for CO2 entity with key: ${co2EntityKey}, value:`, config.entities[co2EntityKey]);
  if (config.entities[co2EntityKey]) {
    addEntityListener(config.entities[co2EntityKey], (state) => {
      if (!state) {
        console.error(`${prefix} CO2 state is undefined`);
        return;
      }

      const value = parseFloat(state.state);
      console.log(`Parsed ${prefix} CO2 value:`, value, 'isNaN:', isNaN(value));

      if (!isNaN(value)) {
        // Update CO2 display
        const co2Value = document.getElementById(`${prefix}-co2-value`);
        if (co2Value) {
          co2Value.textContent = Math.round(value);
          console.log(`Updated ${prefix} CO2 value element to:`, Math.round(value));

          // Update CO2 icon color based on value
          const co2Icon = document.getElementById(`${prefix}-co2-icon`);
          if (co2Icon) {
            console.log(`Found ${prefix} CO2 icon element:`, co2Icon);
            // Get the nearest color stop for the CO2 value
            const colorStops = [
              { value: 400, color: '#2ecc71' }, // Green for good CO2 levels
              { value: 800, color: '#f39c12' }, // Orange for moderate CO2 levels
              { value: 1200, color: '#e74c3c' }, // Red for high CO2 levels
              { value: 2000, color: '#9b59b6' }, // Purple for very high CO2 levels
            ];

            // Find the nearest color stop
            let nearestStop = colorStops[0];
            let minDistance = Math.abs(value - nearestStop.value);

            for (let i = 1; i < colorStops.length; i++) {
              const distance = Math.abs(value - colorStops[i].value);
              if (distance < minDistance) {
                minDistance = distance;
                nearestStop = colorStops[i];
              }
            }

            // Set the CO2 icon color
            co2Icon.style.color = nearestStop.color;
            console.log(`Set ${prefix} CO2 icon color to:`, nearestStop.color, 'for value:', value);
          }
        } else {
          console.error(`${prefix} CO2 value element not found with ID: ${prefix}-co2-value`);
        }
      } else {
        console.warn(`Invalid ${prefix} CO2 value:`, state.state);
      }
    });
  }
}

// Update connection status in the UI
function updateConnectionStatus(connected, message) {
  const connectionStatus = document.getElementById('connection-status');
  if (!connectionStatus) return;

  if (connected) {
    connectionStatus.textContent = '';
    connectionStatus.className = 'connected';
  } else {
    connectionStatus.textContent = '';
    connectionStatus.className = 'disconnected';
  }
}

// Retry connection to Home Assistant
async function retryConnection() {
  try {
    // Update UI to show we're attempting to reconnect
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
      connectionStatus.textContent = '';
      connectionStatus.className = 'connecting';
    }

    // Hide the error overlay
    document.getElementById('connection-error').style.display = 'none';

    // Attempt to reconnect
    await connectToHA();

    // Set up entity listeners after successful reconnection
    setupEntityListeners();

    // Update connection status
    updateConnectionStatus(true);
  } catch (error) {
    // Show error message with specific error details
    const errorElement = document.getElementById('connection-error');
    const errorContentElement = errorElement.querySelector(
      '.error-content p:first-of-type'
    );
    if (errorContentElement) {
      errorContentElement.textContent = `Could not connect to Home Assistant: ${error.message}`;
    }
    errorElement.style.display = 'flex';

    // Update connection status
    updateConnectionStatus(false, error.message || 'Reconnection failed');
  }
}
