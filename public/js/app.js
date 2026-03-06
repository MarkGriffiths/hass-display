// Main application script
import { config } from './config.js';
import { waitForDOMReady, initApp } from './app-initializer.js';
import { updateRainViewDisplay } from './ui-manager.js';
import { testGauges } from './test-gauges.js';

// Main entry point for the application
// Wait for DOM to be ready, then initialize the app
waitForDOMReady().then(() => {
	// Initialize the application
	initApp();

	// Set up event listeners for UI controls
	setupUIEventListeners();
});

/**
 * Set up event listeners for UI controls
 */
function setupUIEventListeners() {
	// Toggle rain view button
	const toggleRainViewButton = document.getElementById('toggle-rain-view');
	if (toggleRainViewButton) {
		toggleRainViewButton.addEventListener('click', () => {
			config.display.showRainView = !config.display.showRainView;
			updateRainViewDisplay();
			saveDisplaySettings();
		});
	}

	// Retry connection button
	const retryButton = document.getElementById('retry-connection');
	if (retryButton) {
		retryButton.addEventListener('click', () => {
			import('./app-initializer.js').then(module => {
				module.retryConnection();
			});
		});
	}

	// Test button
	const testButton = document.getElementById('test-button');
	if (testButton) {
		testButton.addEventListener('click', () => {
			testGauges();
		});
	}
}

/**
 * Save display settings to localStorage
 */
function saveDisplaySettings() {
	try {
		const displaySettings = {
			display: config.display
		};
		localStorage.setItem('haDisplayConfig', JSON.stringify(displaySettings));
	} catch (error) {
		console.error('Error saving display settings:', error);
	}
}
