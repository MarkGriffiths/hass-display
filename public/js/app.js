// Main application script
import { waitForDOMReady, initApp } from './app-initializer.js';
import { initStatusOverlay } from './status-overlay.js';

// Main entry point for the application
// Wait for DOM to be ready, then initialize the app
waitForDOMReady().then(() => {
	// Initialize the application
	initApp();

	// Set up status overlay (triple-tap access)
	initStatusOverlay();
});
