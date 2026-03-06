// Status overlay with triple-tap access
import { config } from './config.js';
import { getConnectionInfo } from './ha-connection.js';
import { testGauges } from './test-gauges.js';
import { updateRainViewDisplay } from './ui-manager.js';

const pageLoadTime = Date.now();
let tapTimestamps = [];

function initStatusOverlay() {
	const overlay = document.getElementById('status-overlay');
	if (!overlay) return;

	// Triple-tap detection — use only one event type to avoid double-firing
	const tapEvent = 'ontouchstart' in window ? 'touchstart' : 'click';

	const handleTap = (e) => {
		// Ignore taps within the overlay itself
		if (overlay.contains(e.target) && !overlay.classList.contains('hidden')) return;

		const now = Date.now();
		tapTimestamps.push(now);

		// Keep only the last 3 taps
		if (tapTimestamps.length > 3) {
			tapTimestamps = tapTimestamps.slice(-3);
		}

		// Check if 3 taps within 500ms
		if (tapTimestamps.length === 3 && (now - tapTimestamps[0]) < 500) {
			tapTimestamps = [];
			showStatusOverlay();
		}
	};

	document.addEventListener(tapEvent, handleTap, { passive: true });

	// Close on backdrop click (outside panel)
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) {
			hideStatusOverlay();
		}
	});

	// Button handlers
	document.getElementById('status-test-gauges')?.addEventListener('click', () => {
		hideStatusOverlay();
		testGauges();
	});

	document.getElementById('status-toggle-rain')?.addEventListener('click', () => {
		config.display.showRainView = !config.display.showRainView;
		hideStatusOverlay();
		updateRainViewDisplay();
		saveDisplaySettings();
	});

	document.getElementById('status-close')?.addEventListener('click', () => {
		hideStatusOverlay();
	});
}

function showStatusOverlay() {
	const overlay = document.getElementById('status-overlay');
	if (!overlay) return;

	populateStatus();
	overlay.classList.remove('hidden');
}

function hideStatusOverlay() {
	const overlay = document.getElementById('status-overlay');
	if (!overlay) return;

	overlay.classList.add('hidden');
}

function populateStatus() {
	const connInfo = getConnectionInfo();

	// Connection state
	const statusEl = document.getElementById('status-connection');
	if (statusEl) {
		if (connInfo.isConnected) {
			statusEl.textContent = 'Connected';
			statusEl.style.color = '#4CAF50';
		} else {
			statusEl.textContent = `Disconnected (${connInfo.reconnectAttempts} retries)`;
			statusEl.style.color = '#f44336';
		}
	}

	// HA URL
	const urlEl = document.getElementById('status-ha-url');
	if (urlEl) {
		urlEl.textContent = config.homeAssistant?.url || 'Not configured';
	}

	// Entities
	const entitiesEl = document.getElementById('status-entities');
	if (entitiesEl) {
		entitiesEl.textContent = connInfo.entityCount;
	}

	// Listeners
	const listenersEl = document.getElementById('status-listeners');
	if (listenersEl) {
		listenersEl.textContent = connInfo.listenerCount;
	}

	// Uptime
	const uptimeEl = document.getElementById('status-uptime');
	if (uptimeEl) {
		const elapsed = Date.now() - pageLoadTime;
		const seconds = Math.floor(elapsed / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		if (hours > 0) {
			uptimeEl.textContent = `${hours}h ${minutes % 60}m`;
		} else if (minutes > 0) {
			uptimeEl.textContent = `${minutes}m ${seconds % 60}s`;
		} else {
			uptimeEl.textContent = `${seconds}s`;
		}
	}

	// View mode
	const viewModeEl = document.getElementById('status-view-mode');
	if (viewModeEl) {
		viewModeEl.textContent = config.display.showRainView ? 'Rain' : 'Conditions';
	}
}

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

export { initStatusOverlay };
