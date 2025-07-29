// Main application script
import { config } from './config.js';
import { loadConfig, validateConfig } from './config-manager.js';
import { connectToHA, addEntityListener } from './ha-connection.js';
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
waitForDOMReady().then(() => {
  console.log('DOM is fully ready, initializing application...');

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
    // Fetch configuration from backend
    console.log('Fetching configuration from backend...');
    const response = await fetch('/api/env-config');

    if (!response.ok) {
      throw new Error(
        `Failed to fetch environment config: ${response.status} ${response.statusText}`
      );
    }

    const envConfig = await response.json();
    console.log('Received environment config:', envConfig);

    // Update config with values from backend
    config.homeAssistant.url = envConfig.haUrl;

    // Load access token from localStorage or use the one from backend
    const storedToken = localStorage.getItem('haAccessToken');
    config.homeAssistant.accessToken = storedToken || envConfig.accessToken;

    // Update entity IDs from backend
    Object.keys(envConfig.entities).forEach((key) => {
      if (config.entities.hasOwnProperty(key)) {
        config.entities[key] = envConfig.entities[key];
      }
    });

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

    console.log(
      'Updated config with backend values and stored settings:',
      config
    );

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

        // Initialize wind displays
        console.log('Initializing wind displays...');
        const windSuccess = initWindDisplays();
        if (windSuccess) {
          console.log('Wind displays initialized successfully');
        } else {
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

    console.log(
      'Updating weather icon with weather:',
      currentWeatherState,
      'sun up:',
      isSunUp
    );

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
      console.log('Selected icon class:', iconClass);
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
      console.log(
        'Parsed secondary temperature value:',
        value,
        'isNaN:',
        isNaN(value)
      );
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
      const secondaryTempTrendIcon = document.querySelector(
        '.secondary-temp-trend i'
      );
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

  // Listen for secondary humidity changes
  if (config.entities.humiditySecondary) {
    addEntityListener(config.entities.humiditySecondary, (state) => {
      console.log('Secondary humidity state received:', state);
      if (!state) {
        console.error('Secondary humidity state is undefined');
        return;
      }

      const value = parseFloat(state.state);
      console.log(
        'Parsed secondary humidity value:',
        value,
        'isNaN:',
        isNaN(value)
      );
      if (!isNaN(value)) {
        // Update secondary humidity display
        const secondaryHumidityValue = document.getElementById(
          'secondary-humidity-value'
        );
        if (secondaryHumidityValue) {
          secondaryHumidityValue.textContent = Math.round(value);

          // Update humidity icon color based on value
          const secondaryHumidityIcon = document.querySelector(
            '.secondary-humidity-display i'
          );
          if (secondaryHumidityIcon) {
            // Get the nearest color stop for the humidity value
            const colorStops = [
              { value: 30, color: '#3498db' }, // Blue for low humidity
              { value: 50, color: '#2ecc71' }, // Green for medium humidity
              { value: 70, color: '#f39c12' }, // Orange for high humidity
              { value: 100, color: '#e74c3c' }, // Red for very high humidity
            ];

            // Find the nearest color stop
            let nearestStop = colorStops[0];
            let smallestDiff = Math.abs(value - nearestStop.value);

            for (let i = 1; i < colorStops.length; i++) {
              const diff = Math.abs(value - colorStops[i].value);
              if (diff < smallestDiff) {
                smallestDiff = diff;
                nearestStop = colorStops[i];
              }
            }

            // Set the icon color
            secondaryHumidityIcon.style.color = nearestStop.color;
          }
        } else {
          console.error('Secondary humidity value element not found');
        }
      } else {
        console.warn('Invalid secondary humidity value:', state.state);
      }
    });
  }

  // Listen for CO2 changes
  if (config.entities.co2) {
    addEntityListener(config.entities.co2, (state) => {
      console.log('CO2 state received:', state);
      if (!state) {
        console.error('CO2 state is undefined');
        return;
      }

      const value = parseFloat(state.state);
      console.log('Parsed CO2 value:', value, 'isNaN:', isNaN(value));
      if (!isNaN(value)) {
        // Update CO2 display
        const co2Value = document.getElementById('secondary-co2-value');
        if (co2Value) {
          co2Value.textContent = Math.round(value);

          // Update CO2 icon color based on value
          const co2Icon = document.querySelector('.secondary-co2-display svg');
          if (co2Icon) {
            // Get the nearest color stop for the CO2 value
            const colorStops = [
              { value: 400, color: '#2ecc71' }, // Green for good CO2 levels
              { value: 800, color: '#f39c12' }, // Orange for moderate CO2 levels
              { value: 1200, color: '#e74c3c' }, // Red for high CO2 levels
              { value: 2000, color: '#9b59b6' }, // Purple for very high CO2 levels
            ];

            // Find the nearest color stop
            let nearestStop = colorStops[0];
            let smallestDiff = Math.abs(value - nearestStop.value);

            for (let i = 1; i < colorStops.length; i++) {
              const diff = Math.abs(value - colorStops[i].value);
              if (diff < smallestDiff) {
                smallestDiff = diff;
                nearestStop = colorStops[i];
              }
            }

            // Set the icon color
            co2Icon.style.color = nearestStop.color;
          }
        } else {
          console.error('CO2 value element not found');
        }
      } else {
        console.warn('Invalid CO2 value:', state.state);
      }
    });
  }

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
        const rainIcon = document.querySelector('.rain-conditions i');
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
      console.log('Wind angle state received:', state);
      if (!state) {
        console.error('Wind angle state is undefined');
        return;
      }

      const angle = parseFloat(state.state);
      if (!isNaN(angle)) {
        // Update wind display (left side) with new angle only
        updateWindDisplay(angle, null, 'left');
      } else {
        console.warn('Invalid wind angle value:', state.state);
      }
    });
  }

  // Listen for wind speed changes
  if (config.entities.windSpeed) {
    addEntityListener(config.entities.windSpeed, (state) => {
      console.log('Wind speed state received:', state);
      if (!state) {
        console.error('Wind speed state is undefined');
        return;
      }

      const speed = parseFloat(state.state);
      if (!isNaN(speed)) {
        // Update wind display (left side) with new speed only
        updateWindDisplay(null, speed, 'left');
      } else {
        console.warn('Invalid wind speed value:', state.state);
      }
    });
  }

  // Listen for gust angle changes
  if (config.entities.gustAngle) {
    addEntityListener(config.entities.gustAngle, (state) => {
      console.log('Gust angle state received:', state);
      if (!state) {
        console.error('Gust angle state is undefined');
        return;
      }

      const angle = parseFloat(state.state);
      if (!isNaN(angle)) {
        // Update gust display (right side) with new angle only
        updateWindDisplay(angle, null, 'right');
      } else {
        console.warn('Invalid gust angle value:', state.state);
      }
    });
  }

  // Listen for gust speed changes
  if (config.entities.gustSpeed) {
    addEntityListener(config.entities.gustSpeed, (state) => {
      console.log('Gust speed state received:', state);
      if (!state) {
        console.error('Gust speed state is undefined');
        return;
      }

      const speed = parseFloat(state.state);
      if (!isNaN(speed)) {
        // Update gust display (right side) with new speed only
        updateWindDisplay(null, speed, 'right');
      } else {
        console.warn('Invalid gust speed value:', state.state);
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

// Update connection status in the UI
function updateConnectionStatus(connected, message) {
  const connectionStatus = document.getElementById('connection-status');
  if (!connectionStatus) {
    console.error('Connection status element not found');
    return;
  }

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
    console.log('Successfully reconnected to Home Assistant');

    // Set up entity listeners after successful reconnection
    setupEntityListeners();

    // Update connection status
    updateConnectionStatus(true);
  } catch (error) {
    console.error('Reconnection failed:', error.message);

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
