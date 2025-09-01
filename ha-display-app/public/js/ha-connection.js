// Home Assistant connection handling - simplified approach matching working minimal test
import { config } from './config.js';
import { updateTemperatureGauge, updateSecondaryTemperatureGauge, updateHumidityGauge, updatePressureGauge, updateRainfallGauge } from './gauge-manager.js';
import { addTempPoint } from './temp-history.js';

let connection = null;
let states = {};
let eventListeners = [];
let ws = null;
let messageId = 1;

// Connect to Home Assistant using simplified WebSocket approach
async function connectToHA() {
    return new Promise((resolve, reject) => {
        try {
            // Check if token is provided
            if (!config.homeAssistant.accessToken) {
                throw new Error('No access token provided. Please configure your access token in the setup page.');
            }

            // Convert HTTP URL to WebSocket URL
            let wsUrl = config.homeAssistant.url.replace('http://', 'ws://').replace('https://', 'wss://') + '/api/websocket';

            // Update connection status in UI
            const connectionStatus = document.getElementById('connection-status');
            const connectionActivity = document.getElementById('connection-activity');
            if (connectionStatus) {
                connectionStatus.textContent = '';
                connectionStatus.className = 'connecting';
            }
            if (connectionActivity) {
                connectionActivity.className = 'idle';
            }

            // Create WebSocket connection
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                // Connection established
            };

            ws.onmessage = (event) => {
                try {
                    // Parse the message first to determine the type of update
                    const message = JSON.parse(event.data);
                    
                    // Determine if this is a UI-affecting update
                    let isUiUpdate = false;
                    
                    // State changes that affect UI elements
                    if (message.type === 'event' && 
                        message.event && 
                        message.event.event_type === 'state_changed' &&
                        message.event.data) {
                        
                        // These are the specific entity types that update the UI when changed
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
                        
                        // Check if this entity update affects the UI
                        if (uiEntities.includes(entityId)) {
                            isUiUpdate = true;
                        }
                    }
                    
                    // Initial state load affects UI
                    if (message.type === 'result' && message.result && Array.isArray(message.result) && message.result.length > 0) {
                        isUiUpdate = true;
                    }
                    
                    // Blink the connection activity indicator with appropriate class
                    const connectionActivity = document.getElementById('connection-activity');
                    if (connectionActivity) {
                        // Use different blink class based on whether this update affects the UI
                        const blinkClass = isUiUpdate ? 'blinking-connected' : 'blinking-connecting';
                        connectionActivity.classList.add(blinkClass);
                        setTimeout(() => {
                            connectionActivity.classList.remove(blinkClass);
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

                        if (connectionStatus) {
                            connectionStatus.textContent = '';
                            connectionStatus.className = 'connected';
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
                        resolve(true);
                    }

                    // Handle authentication failure
                    if (message.type === 'auth_invalid') {
                        if (connectionStatus) {
                            connectionStatus.textContent = '';
                            connectionStatus.className = 'disconnected';
                        }

                        reject(new Error('Authentication failed: ' + message.message));
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

                        // Check configured entities
                        const tempEntity = message.result.find(state =>
                            state.entity_id === config.entities.temperature);
                        const humEntity = message.result.find(state =>
                            state.entity_id === config.entities.humidity);
                        const pressureEntity = message.result.find(state =>
                            state.entity_id === config.entities.pressure);

                        if (tempEntity) {
                            console.log('✓ Temperature entity found:', tempEntity.state + '°C');
                        } else {
                            console.warn('✗ Temperature entity not found:', config.entities.temperature);
                        }

                        if (humEntity) {
                            console.log('✓ Humidity entity found:', humEntity.state + '%');
                        } else {
                            console.warn('✗ Humidity entity not found:', config.entities.humidity);
                        }

                        if (pressureEntity) {
                            console.log('✓ Pressure entity found:', pressureEntity.state + ' hPa');
                        } else {
                            console.warn('✗ Pressure entity not found:', config.entities.pressure);
                        }

                        // Update temperature, humidity, and pressure displays with initial values
                        if (config.entities.temperature && states[config.entities.temperature]) {
                            const tempState = states[config.entities.temperature];
                            if (tempState.state && !isNaN(tempState.state)) {
                                const tempValue = parseFloat(tempState.state);
                                updateTemperatureGauge(tempValue);
                                console.log(`Initial temperature: ${tempValue}°C`);
                            }
                        }

                        // Update secondary temperature display with initial value
                        if (config.entities.temperatureSecondary && states[config.entities.temperatureSecondary]) {
                            const secondaryTempState = states[config.entities.temperatureSecondary];
                            if (secondaryTempState.state && !isNaN(secondaryTempState.state)) {
                                const secondaryTempValue = parseFloat(secondaryTempState.state);
                                updateSecondaryTemperatureGauge(secondaryTempValue);
                                console.log(`Initial secondary temperature: ${secondaryTempValue}°C`);
                            }
                        }

                        if (config.entities.humidity && states[config.entities.humidity]) {
                            const humidityState = states[config.entities.humidity];
                            if (humidityState.state && !isNaN(humidityState.state)) {
                                const humidityValue = parseFloat(humidityState.state);
                                updateHumidityGauge(humidityValue);
                                console.log(`Initial humidity: ${humidityValue}%`);
                            }
                        }

                        if (config.entities.pressure && states[config.entities.pressure]) {
                            const pressureState = states[config.entities.pressure];
                            if (pressureState.state && !isNaN(pressureState.state)) {
                                const pressureValue = parseFloat(pressureState.state);
                                updatePressureGauge(pressureValue);
                                console.log(`Initial pressure: ${pressureValue} hPa`);
                            }
                        }

                        // Update rain last hour value
                        if (config.entities.rainLastHour && states[config.entities.rainLastHour]) {
                            const rainLastHourState = states[config.entities.rainLastHour];
                            if (rainLastHourState.state && !isNaN(rainLastHourState.state)) {
                                const rainLastHourValue = parseFloat(rainLastHourState.state);
                                updateRainLastHour(rainLastHourState);
                                console.log(`Initial rain last hour: ${rainLastHourValue}mm`);
                            }
                        }

                        // Update rain today value and gauge
                        if (config.entities.rainToday && states[config.entities.rainToday]) {
                            const rainTodayState = states[config.entities.rainToday];
                            if (rainTodayState.state && !isNaN(rainTodayState.state)) {
                                const rainTodayValue = parseFloat(rainTodayState.state);
                                updateRainToday(rainTodayState);
                                console.log(`Initial rain today: ${rainTodayValue}mm`);
                            }
                        }

                        // Notify all listeners with initial states
                        Object.keys(states).forEach(entityId => {
                            notifyEntityListeners(entityId, states[entityId]);
                        });
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            };

            ws.onerror = (error) => {
                // Create a more descriptive error object since WebSocket error events don't contain much detail
                const errorMessage = `WebSocket connection error to ${wsUrl}`;
                
                if (connectionStatus) {
                    connectionStatus.textContent = 'Connection error';
                    connectionStatus.className = 'error';
                }

                // Create a proper error object with message
                reject(new Error(errorMessage));
            };

            ws.onclose = (event) => {
                const closeReason = event.reason ? event.reason : `Code: ${event.code}`;
                connection = null;

                if (connectionStatus) {
                    connectionStatus.textContent = `Connection closed: ${closeReason}`;
                    connectionStatus.className = 'error';
                }

                // If connection was never established successfully and then closed, this might be an error
                if (!connection && event.code !== 1000) {
                    reject(new Error(`Connection closed unexpectedly: ${closeReason}`));
                }
            };

            // Set timeout
            setTimeout(() => {
                if (!connection) {
                    if (connectionStatus) {
                        connectionStatus.textContent = '';
                        connectionStatus.className = 'disconnected';
                    }
                    reject(new Error('Connection timeout after 10 seconds'));
                }
            }, 10000);

        } catch (error) {
            const errorMessage = error.message || 'Unknown error creating WebSocket connection';
            
            const connectionStatus = document.getElementById('connection-status');
            if (connectionStatus) {
                connectionStatus.textContent = '';
                connectionStatus.className = 'disconnected';
            }

            reject(new Error(errorMessage));
        }
    });
}

// Get state for a specific entity
function getState(entityId) {
    if (!states[entityId]) {
        console.warn(`Entity ${entityId} not found in states`);
        return null;
    }
    return states[entityId];
}

// Add event listener for entity state changes
function addEntityListener(entityId, callback) {
    eventListeners.push({ entityId, callback });

    // If we already have state for this entity, notify the listener immediately
    if (states[entityId]) {
        callback(states[entityId]);
    }
}

// Notify listeners when an entity state changes
function notifyEntityListeners(entityId, state) {
    eventListeners.forEach(listener => {
        if (listener.entityId === entityId) {
            listener.callback(state);
        }
    });
}

// Update rain last hour value
function updateRainLastHour(state) {
    try {
        if (!state) {
            return;
        }

        const rainLastHourValue = parseFloat(state.state);
        const rainLastHourElement = document.getElementById('rain-last-hour-value');

        if (rainLastHourElement) {
            rainLastHourElement.textContent = rainLastHourValue.toFixed(1);
        }

        // Auto-switch display based on rainfall
        if (rainLastHourValue > 0 && !config.display.showRainView) {
            // Switch to rain view if there's rain
            config.display.showRainView = true;
            if (window.updateRainViewDisplay && typeof window.updateRainViewDisplay === 'function') {
                window.updateRainViewDisplay();
            }
        } else if (rainLastHourValue === 0 && config.display.showRainView) {
            // Switch back to conditions view if there's no rain
            config.display.showRainView = false;
            if (window.updateRainViewDisplay && typeof window.updateRainViewDisplay === 'function') {
                window.updateRainViewDisplay();
            }
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
        if (!state) {
            return;
        }

        const rainTodayValue = parseFloat(state.state);
        const rainTodayElement = document.getElementById('rain-today-value');

        if (rainTodayElement) {
            rainTodayElement.textContent = rainTodayValue.toFixed(1);
        }

        // Always update the rainfall gauge regardless of rain view status
        // The gauge's own visibility logic will handle whether it should be displayed
        updateRainfallGauge(rainTodayValue);

        // Auto-switch display based on rain today (only if rain last hour is also > 0)
        // This prevents switching to rain view for historical rain that's no longer falling
        const rainLastHourElement = document.getElementById('rain-last-hour-value');
        const rainLastHourValue = rainLastHourElement ? parseFloat(rainLastHourElement.textContent) : 0;
        
        if (rainTodayValue > 0 && rainLastHourValue > 0 && !config.display.showRainView) {
            config.display.showRainView = true;
            if (window.updateRainViewDisplay && typeof window.updateRainViewDisplay === 'function') {
                window.updateRainViewDisplay();
            }
        }
    } catch (error) {
        console.error('Error updating rain today:', error);
    }
}

// Update main temperature value and gauge
function updateMainTemperature(state) {
    try {
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
        
        // Format: /api/proxy/api/history/period/{startTime}?filter_entity_id={entityId}
        // Note the additional /api/ in the path to match Home Assistant API structure
        const apiUrl = `/api/proxy/api/history/period/${startTime.toISOString()}?filter_entity_id=${entityId}`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Content-Type': 'application/json',
                // Pass the HA token via a custom header for the proxy
                'ha-auth': config.homeAssistant.accessToken
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch history: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Process the data - history API returns an array of entities, each with state history
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

// Export functions
export {
    connectToHA,
    getState,
    addEntityListener,
    updateRainLastHour,
    updateRainToday,
    updateMainTemperature,
    fetchEntityHistory
};
