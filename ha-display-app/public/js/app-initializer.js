// App initialization module
import { config } from './config.js';
import { connectToHA } from './ha-connection.js';
import { initSparkline } from './temp-history.js';
import { initPressureSparkline } from './pressure-history.js';
import { initHumiditySparkline } from './humidity-history.js';
import { initTemperatureGauge } from './gauge-manager.js';
import { initWindDisplays } from './wind-display.js';
import { setupEntityListeners, validateConfiguration } from './entity-listeners.js';
import { setupRoomDisplays, setupRoomEntityListeners } from './room-manager.js';
import { showError, updateRainViewDisplay, initIndoorDisplayScroll } from './ui-manager.js';
import { updateConnectionStatus } from './error-handler.js';
import { initClock } from './clock.js';

/**
 * Wait for DOM to be fully loaded and ready - optimized version
 */
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

/**
 * Initialize the application
 */
async function initApp() {
  try {
    console.log('Initializing application...');

    // Fetch environment config from backend
    const response = await fetch('/api/env-config');

    if (!response.ok) {
      throw new Error(`Failed to fetch environment config: ${response.status} ${response.statusText}`);
    }

    const envConfig = await response.json();
    console.log('Environment config:', envConfig);

    // Load access token from localStorage or use the one from backend
    const storedToken = localStorage.getItem('haAccessToken');
    config.homeAssistant.accessToken = storedToken || envConfig.accessToken;

    // Set Home Assistant URL from environment config
    config.homeAssistant.url = envConfig.haUrl;
    console.log('Home Assistant URL set from environment:', config.homeAssistant.url);

    // Set room names from environment config
    config.secondaryRoomName = envConfig.secondaryName;
    config.tertiaryRoomName = envConfig.tertiaryName;
    config.quadRoomName = envConfig.quadName;
    config.quintRoomName = envConfig.quintName;
    console.log('Room names set from environment:', {
      secondaryRoomName: config.secondaryRoomName,
      tertiaryRoomName: config.tertiaryRoomName,
      quadRoomName: config.quadRoomName,
      quintRoomName: config.quintRoomName
    });

    // Initialize room configurations
    function initRoomConfigs() {
      // Set up room configurations
      window.roomConfigs = [
        { prefix: 'secondary', name: config.secondaryRoomName || 'Secondary Room' },
        { prefix: 'tertiary', name: config.tertiaryRoomName || 'Tertiary Room' },
        { prefix: 'quad', name: config.quadRoomName || 'Bedroom' },
        { prefix: 'quint', name: config.quintRoomName || 'Servers' }
      ];

      console.log('Room configurations initialized with names from env:', window.roomConfigs);
      console.log('Config room names:', {
        secondaryRoomName: config.secondaryRoomName,
        tertiaryRoomName: config.tertiaryRoomName,
        quadRoomName: config.quadRoomName,
        quintRoomName: config.quintRoomName
      });

      // Directly set room names in DOM elements
      const secondaryRoomNameElement = document.getElementById('secondary-room-name');
      const tertiaryRoomNameElement = document.getElementById('tertiary-room-name');
      const quadRoomNameElement = document.getElementById('quad-room-name');
      const quintRoomNameElement = document.getElementById('quint-room-name');

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

      if (quadRoomNameElement) {
        quadRoomNameElement.textContent = config.quadRoomName || 'Bedroom';
        console.log('Set quad room name to:', quadRoomNameElement.textContent);
      } else {
        console.error('Quad room name element not found');
      }

      if (quintRoomNameElement) {
        quintRoomNameElement.textContent = config.quintRoomName || 'Servers';
        console.log('Set quint room name to:', quintRoomNameElement.textContent);
      } else {
        console.error('Quint room name element not found');
      }

      console.log('Config entities available:', config.entities);

      // Debug: Check if tertiary room elements exist in the DOM
      const tertiaryElements = {
        name: document.getElementById('tertiary-room-name'),
        temp: document.getElementById('tertiary-temp-value'),
        tempIcon: document.getElementById('tertiary-temperature-trend-icon'),
        humidity: document.getElementById('tertiary-humidity-value'),
        humidityIcon: document.getElementById('tertiary-humidity-icon'),
        co2: document.getElementById('tertiary-co2-value'),
        co2Icon: document.getElementById('tertiary-co2-icon')
      };

      console.log('Tertiary room DOM elements:', tertiaryElements);

      // Debug: Check if secondary room elements exist in the DOM
      const secondaryElements = {
        name: document.getElementById('secondary-room-name'),
        temp: document.getElementById('secondary-temp-value'),
        tempIcon: document.getElementById('secondary-temperature-trend-icon'),
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
        if (parsedConfig.display) {
          // Apply stored display settings
          Object.assign(config.display, parsedConfig.display);
        }
      } catch (error) {
        console.error('Error parsing stored config:', error);
      }
    }

    // Initialize UI components with optimized DOM handling
    function initializeGauges() {
      // Initialize temperature gauge
      initTemperatureGauge();

      // Initialize sparklines
      initSparkline();
      initPressureSparkline();
      initHumiditySparkline();

      // Initialize wind displays
      initWindDisplays();
    }

    // Validate configuration
    validateConfiguration();

    // Initialize gauges
    initializeGauges();

    // Initialize room configurations
    initRoomConfigs();

    // Set up room displays
    setupRoomDisplays(window.roomConfigs);

    // Connect to Home Assistant
    await connectToHA();

    // Set up entity listeners
    setupEntityListeners();

    // Expose updateRainViewDisplay globally for ha-connection.js
    window.updateRainViewDisplay = updateRainViewDisplay;

    // Initialize indoor display auto-scrolling
    initIndoorDisplayScroll();
    
    // Initialize clock display
    initClock();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    showError(`Failed to initialize application: ${error.message}`);
  }
}

/**
 * Retry connection to Home Assistant
 */
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

export {
  waitForDOMReady,
  initApp,
  retryConnection
};
