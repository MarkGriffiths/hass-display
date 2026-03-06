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
			resolve();
		} else {
			window.addEventListener('DOMContentLoaded', resolve, { once: true });
		}
	});
}

/**
 * Initialize the application
 */
async function initApp() {
	try {
		// Fetch environment config from backend
		const response = await fetch('/api/env-config');

		if (!response.ok) {
			throw new Error(`Failed to fetch environment config: ${response.status} ${response.statusText}`);
		}

		const envConfig = await response.json();

		// Load access token from localStorage or use the one from backend
		const storedToken = localStorage.getItem('haAccessToken');
		config.homeAssistant.accessToken = storedToken || envConfig.accessToken;

		// Set Home Assistant URL from environment config
		config.homeAssistant.url = envConfig.haUrl;

		// Set room names from environment config
		config.secondaryRoomName = envConfig.secondaryName;
		config.tertiaryRoomName = envConfig.tertiaryName;
		config.quadRoomName = envConfig.quadName;
		config.quintRoomName = envConfig.quintName;

		// Initialize room configurations
		window.roomConfigs = [
			{ prefix: 'secondary', name: config.secondaryRoomName || 'Secondary Room' },
			{ prefix: 'tertiary', name: config.tertiaryRoomName || 'Tertiary Room' },
			{ prefix: 'quad', name: config.quadRoomName || 'Bedroom' },
			{ prefix: 'quint', name: config.quintRoomName || 'Servers' }
		];

		// Set room names in DOM elements
		const roomPrefixes = ['secondary', 'tertiary', 'quad', 'quint'];
		const roomDefaults = {
			secondary: 'Secondary Room',
			tertiary: 'Tertiary Room',
			quad: 'Bedroom',
			quint: 'Servers'
		};

		roomPrefixes.forEach(prefix => {
			const el = document.getElementById(`${prefix}-room-name`);
			if (el) {
				const configKey = `${prefix}RoomName`;
				el.textContent = config[configKey] || roomDefaults[prefix];
			}
		});

		// Set up entity listeners for each room
		window.roomConfigs.forEach(roomConfig => {
			setupRoomEntityListeners(roomConfig.prefix);
		});

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
				if (parsedConfig.display) {
					Object.assign(config.display, parsedConfig.display);
				}
			} catch (error) {
				console.error('Error parsing stored config:', error);
			}
		}

		// Validate configuration
		validateConfiguration();

		// Initialize UI components
		initTemperatureGauge();
		initSparkline();
		initPressureSparkline();
		initHumiditySparkline();
		initWindDisplays();

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
