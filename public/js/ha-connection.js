// Home Assistant connection handling with auto-reconnect
import { config } from './config.js';
import { updateTemperatureGauge, updateSecondaryTemperatureGauge, updateHumidityGauge, updatePressureGauge, updateRainfallGauge } from './gauge-manager.js';
import { addTempPoint } from './temp-history.js';
import { updateRainViewDisplay } from './ui-manager.js';

let connection = null;
let states = {};
let entityListeners = new Map();
let ws = null;
let messageId = 1;
let pingInterval = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;

// Cached DOM elements
let connectionStatusEl = null;
let connectionActivityEl = null;
let rainLastHourEl = null;
let rainTodayEl = null;

// Reconnect config
const RECONNECT_BASE_DELAY = 2000;
const RECONNECT_MAX_DELAY = 60000;
const RECONNECT_JITTER = 0.25;
const PING_INTERVAL = 30000;

/**
 * Cache DOM element references
 */
function cacheDOMElements() {
	connectionStatusEl = document.getElementById('connection-status');
	connectionActivityEl = document.getElementById('connection-activity');
	rainLastHourEl = document.getElementById('rain-last-hour-value');
	rainTodayEl = document.getElementById('rain-today-value');
}

/**
 * Cleanup existing connection resources
 */
function cleanupConnection() {
	if (pingInterval) {
		clearInterval(pingInterval);
		pingInterval = null;
	}
	if (reconnectTimeout) {
		clearTimeout(reconnectTimeout);
		reconnectTimeout = null;
	}
	if (ws) {
		ws.onopen = null;
		ws.onmessage = null;
		ws.onerror = null;
		ws.onclose = null;
		if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
			ws.close();
		}
		ws = null;
	}
	connection = null;
}

/**
 * Schedule a reconnection with exponential backoff and jitter
 */
function scheduleReconnect() {
	if (reconnectTimeout) return;

	const delay = Math.min(
		RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts),
		RECONNECT_MAX_DELAY
	);
	const jitter = delay * RECONNECT_JITTER * (Math.random() * 2 - 1);
	const finalDelay = Math.max(0, delay + jitter);

	reconnectAttempts++;
	console.warn(`Reconnecting in ${Math.round(finalDelay / 1000)}s (attempt ${reconnectAttempts})`);

	reconnectTimeout = setTimeout(async () => {
		reconnectTimeout = null;
		try {
			await connectToHA();
			// Re-notify all listeners with current states
			for (const [entityId, state] of Object.entries(states)) {
				notifyEntityListeners(entityId, state);
			}
		} catch (error) {
			console.error('Reconnection failed:', error.message);
			scheduleReconnect();
		}
	}, finalDelay);
}

/**
 * Start ping/pong keepalive
 */
function startPingPong() {
	if (pingInterval) clearInterval(pingInterval);

	pingInterval = setInterval(() => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ id: messageId++, type: 'ping' }));
		}
	}, PING_INTERVAL);
}

// Connect to Home Assistant using simplified WebSocket approach
async function connectToHA() {
	// Cleanup any existing connection
	cleanupConnection();

	// Cache DOM elements on first connect
	if (!connectionStatusEl) {
		cacheDOMElements();
	}

	return new Promise((resolve, reject) => {
		let settled = false;

		try {
			if (!config.homeAssistant.accessToken) {
				throw new Error('No access token provided. Please configure your access token in the setup page.');
			}

			let wsUrl = config.homeAssistant.url.replace('http://', 'ws://').replace('https://', 'wss://') + '/api/websocket';

			if (connectionStatusEl) {
				connectionStatusEl.textContent = '';
				connectionStatusEl.className = 'connecting';
			}
			if (connectionActivityEl) {
				connectionActivityEl.className = 'idle';
			}

			ws = new WebSocket(wsUrl);

			ws.onopen = () => {
				// Connection established
			};

			ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data);

					// Determine if this is a UI-affecting update
					let isUiUpdate = false;

					if (message.type === 'event' &&
						message.event &&
						message.event.event_type === 'state_changed' &&
						message.event.data) {

						const entityId = message.event.data.entity_id;
						const uiEntities = [
							config.entities.temperature,
							config.entities.humidity,
							config.entities.pressure,
							config.entities.rainToday,
							config.entities.rainLastHour,
							config.entities.windAngle,
							config.entities.windSpeed,
							config.entities.gustAngle,
							config.entities.gustSpeed,
							config.entities.weather,
							config.entities.sun
						];

						if (uiEntities.includes(entityId)) {
							isUiUpdate = true;
						}
					}

					if (message.type === 'result' && message.result && Array.isArray(message.result) && message.result.length > 0) {
						isUiUpdate = true;
					}

					// Blink the connection activity indicator
					if (connectionActivityEl) {
						const blinkClass = isUiUpdate ? 'blinking-connected' : 'blinking-connecting';
						connectionActivityEl.classList.add(blinkClass);
						setTimeout(() => {
							connectionActivityEl.classList.remove(blinkClass);
						}, 200);
					}

					// Handle authentication required
					if (message.type === 'auth_required') {
						ws.send(JSON.stringify({
							type: 'auth',
							access_token: config.homeAssistant.accessToken
						}));
					}

					// Handle successful authentication
					if (message.type === 'auth_ok') {
						if (connectionStatusEl) {
							connectionStatusEl.textContent = '';
							connectionStatusEl.className = 'connected';
						}

						// Subscribe to state changes
						ws.send(JSON.stringify({
							id: messageId++,
							type: 'subscribe_events',
							event_type: 'state_changed'
						}));

						// Get all states
						ws.send(JSON.stringify({
							id: messageId++,
							type: 'get_states'
						}));

						connection = { connected: true };
						reconnectAttempts = 0;

						// Start keepalive
						startPingPong();

						if (!settled) {
							settled = true;
							resolve(true);
						}
					}

					// Handle authentication failure
					if (message.type === 'auth_invalid') {
						if (connectionStatusEl) {
							connectionStatusEl.textContent = '';
							connectionStatusEl.className = 'disconnected';
						}

						if (!settled) {
							settled = true;
							reject(new Error('Authentication failed: ' + message.message));
						}
					}

					// Handle state change events
					if (message.type === 'event' && message.event && message.event.event_type === 'state_changed') {
						const eventData = message.event.data;
						if (eventData && eventData.entity_id && eventData.new_state) {
							states[eventData.entity_id] = eventData.new_state;
							notifyEntityListeners(eventData.entity_id, eventData.new_state);
						}
					}

					// Handle result messages (initial states)
					if (message.type === 'result' && message.result && Array.isArray(message.result)) {
						// Store all states
						message.result.forEach((state) => {
							if (state && state.entity_id) {
								states[state.entity_id] = state;
							}
						});

						// Update temperature, humidity, and pressure displays with initial values
						if (config.entities.temperature && states[config.entities.temperature]) {
							const tempState = states[config.entities.temperature];
							if (tempState.state && !isNaN(tempState.state)) {
								updateTemperatureGauge(parseFloat(tempState.state));
							}
						}

						if (config.entities.temperatureSecondary && states[config.entities.temperatureSecondary]) {
							const secondaryTempState = states[config.entities.temperatureSecondary];
							if (secondaryTempState.state && !isNaN(secondaryTempState.state)) {
								updateSecondaryTemperatureGauge(parseFloat(secondaryTempState.state));
							}
						}

						if (config.entities.humidity && states[config.entities.humidity]) {
							const humidityState = states[config.entities.humidity];
							if (humidityState.state && !isNaN(humidityState.state)) {
								updateHumidityGauge(parseFloat(humidityState.state));
							}
						}

						if (config.entities.pressure && states[config.entities.pressure]) {
							const pressureState = states[config.entities.pressure];
							if (pressureState.state && !isNaN(pressureState.state)) {
								updatePressureGauge(parseFloat(pressureState.state));
							}
						}

						// Update rain last hour value
						if (config.entities.rainLastHour && states[config.entities.rainLastHour]) {
							const rainLastHourState = states[config.entities.rainLastHour];
							if (rainLastHourState.state && !isNaN(rainLastHourState.state)) {
								updateRainLastHour(rainLastHourState);
							}
						}

						// Update rain today value and gauge
						if (config.entities.rainToday && states[config.entities.rainToday]) {
							const rainTodayState = states[config.entities.rainToday];
							if (rainTodayState.state && !isNaN(rainTodayState.state)) {
								updateRainToday(rainTodayState);
							}
						}

						// Notify all listeners with initial states
						Object.keys(states).forEach(entityId => {
							notifyEntityListeners(entityId, states[entityId]);
						});
					}

					// Handle pong responses (keepalive)
					if (message.type === 'pong') {
						// Connection is alive
					}
				} catch (error) {
					console.error('Error processing message:', error);
				}
			};

			ws.onerror = (error) => {
				const errorMessage = `WebSocket connection error to ${wsUrl}`;

				if (connectionStatusEl) {
					connectionStatusEl.textContent = 'Connection error';
					connectionStatusEl.className = 'error';
				}

				if (!settled) {
					settled = true;
					reject(new Error(errorMessage));
				}
			};

			ws.onclose = (event) => {
				const closeReason = event.reason ? event.reason : `Code: ${event.code}`;
				const wasConnected = connection !== null;
				connection = null;

				if (connectionStatusEl) {
					connectionStatusEl.textContent = `Connection closed: ${closeReason}`;
					connectionStatusEl.className = 'error';
				}

				// Clean up ping interval
				if (pingInterval) {
					clearInterval(pingInterval);
					pingInterval = null;
				}

				// If we were previously connected, attempt to reconnect
				if (wasConnected && event.code !== 1000) {
					console.warn('Connection lost, scheduling reconnect...');
					scheduleReconnect();
				}

				if (!settled && event.code !== 1000) {
					settled = true;
					reject(new Error(`Connection closed unexpectedly: ${closeReason}`));
				}
			};

			// Set timeout
			setTimeout(() => {
				if (!settled && !connection) {
					if (connectionStatusEl) {
						connectionStatusEl.textContent = '';
						connectionStatusEl.className = 'disconnected';
					}
					settled = true;
					reject(new Error('Connection timeout after 10 seconds'));
				}
			}, 10000);

		} catch (error) {
			const errorMessage = error.message || 'Unknown error creating WebSocket connection';

			if (connectionStatusEl) {
				connectionStatusEl.textContent = '';
				connectionStatusEl.className = 'disconnected';
			}

			if (!settled) {
				settled = true;
				reject(new Error(errorMessage));
			}
		}
	});
}

// Get state for a specific entity
function getState(entityId) {
	return states[entityId] || null;
}

// Add event listener for entity state changes (Map-based)
function addEntityListener(entityId, callback) {
	if (!entityListeners.has(entityId)) {
		entityListeners.set(entityId, []);
	}
	entityListeners.get(entityId).push(callback);

	// If we already have state for this entity, notify the listener immediately
	if (states[entityId]) {
		callback(states[entityId]);
	}
}

// Notify listeners when an entity state changes (Map-based lookup)
function notifyEntityListeners(entityId, state) {
	const listeners = entityListeners.get(entityId);
	if (listeners) {
		listeners.forEach(callback => callback(state));
	}
}

// Update rain last hour value
function updateRainLastHour(state) {
	try {
		if (!state) return;

		const rainLastHourValue = parseFloat(state.state);
		if (rainLastHourEl) {
			rainLastHourEl.textContent = rainLastHourValue.toFixed(1);
		}

		// Auto-switch display based on rainfall
		if (rainLastHourValue > 0 && !config.display.showRainView) {
			config.display.showRainView = true;
			updateRainViewDisplay();
		} else if (rainLastHourValue === 0 && config.display.showRainView) {
			config.display.showRainView = false;
			updateRainViewDisplay();
		}
	} catch (error) {
		console.error('Error updating rain last hour:', error);
	}
}

/**
 * Update the rain today display with new state data
 * @param {Object} state - The state object from Home Assistant
 */
function updateRainToday(state) {
	try {
		if (!state) return;

		const rainTodayValue = parseFloat(state.state);
		if (rainTodayEl) {
			rainTodayEl.textContent = rainTodayValue.toFixed(1);
		}

		// Always update the rainfall gauge regardless of rain view status
		updateRainfallGauge(rainTodayValue);

		// Auto-switch display based on rain today (only if rain last hour is also > 0)
		const rainLastHourValue = rainLastHourEl ? parseFloat(rainLastHourEl.textContent) : 0;

		if (rainTodayValue > 0 && rainLastHourValue > 0 && !config.display.showRainView) {
			config.display.showRainView = true;
			updateRainViewDisplay();
		}
	} catch (error) {
		console.error('Error updating rain today:', error);
	}
}

// Update main temperature value and gauge
function updateMainTemperature(state) {
	try {
		if (!state) return;

		const tempValue = parseFloat(state.state);
		if (!isNaN(tempValue)) {
			updateTemperatureGauge(tempValue);
			addTempPoint(tempValue);
		}
	} catch (error) {
		console.error('Error updating main temperature:', error);
	}
}

// Fetch historical data for an entity
async function fetchEntityHistory(entityId, startTime) {
	try {
		if (!config.homeAssistant.url || !config.homeAssistant.accessToken) {
			throw new Error('Home Assistant URL or access token not configured');
		}

		const apiUrl = `/api/proxy/api/history/period/${startTime.toISOString()}?filter_entity_id=${entityId}`;

		const response = await fetch(apiUrl, {
			headers: {
				'Content-Type': 'application/json',
				'ha-auth': config.homeAssistant.accessToken
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch history: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
			return data[0].map(state => ({
				state: state.state,
				timestamp: new Date(state.last_changed)
			}));
		}

		return [];
	} catch (error) {
		return [];
	}
}

// Get connection info for status overlay
function getConnectionInfo() {
	return {
		entityCount: Object.keys(states).length,
		listenerCount: entityListeners.size,
		reconnectAttempts,
		isConnected: ws !== null && ws.readyState === WebSocket.OPEN
	};
}

// Export functions
export {
	connectToHA,
	getState,
	addEntityListener,
	updateRainLastHour,
	updateRainToday,
	updateMainTemperature,
	fetchEntityHistory,
	getConnectionInfo
};
