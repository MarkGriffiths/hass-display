// Home Assistant connection handling - simplified approach matching working minimal test
import { config } from './config.js';
import { updateTemperatureGauge, updateSecondaryTemperatureGauge, updateHumidityGauge, updatePressureGauge } from './temperature-gauge.js';

let connection = null;
let states = {};
let eventListeners = [];
let ws = null;
let messageId = 1;

// Connect to Home Assistant using simplified WebSocket approach
async function connectToHA() {
    return new Promise((resolve, reject) => {
        try {
            console.log('Connecting to Home Assistant at:', config.homeAssistant.url);
            
            // Check if token is provided
            if (!config.homeAssistant.accessToken) {
                throw new Error('No access token provided. Please configure your access token in the setup page.');
            }
            
            // Convert HTTP URL to WebSocket URL
            let wsUrl = config.homeAssistant.url.replace('http://', 'ws://').replace('https://', 'wss://') + '/api/websocket';
            console.log('WebSocket URL:', wsUrl);
            
            // Update connection status in UI
            const connectionStatus = document.getElementById('connection-status');
            if (connectionStatus) {
                connectionStatus.textContent = 'Connecting...';
                connectionStatus.className = 'connecting';
            }
            
            // Create WebSocket connection
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('✓ WebSocket connection established');
            };
            
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('Received:', message.type, message.message || '');
                    
                    // Handle authentication required
                    if (message.type === 'auth_required') {
                        console.log('Sending authentication token...');
                        ws.send(JSON.stringify({
                            type: 'auth',
                            access_token: config.homeAssistant.accessToken
                        }));
                    }
                    
                    // Handle successful authentication
                    if (message.type === 'auth_ok') {
                        console.log('✓ Authentication successful!');
                        
                        if (connectionStatus) {
                            connectionStatus.textContent = 'Connected to Home Assistant';
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
                        console.error('✗ Authentication failed:', message.message);
                        
                        if (connectionStatus) {
                            connectionStatus.textContent = 'Authentication failed';
                            connectionStatus.className = 'error';
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
                        console.log('✓ Received', message.result.length, 'entity states');
                        
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
                console.error('✗ WebSocket error:', errorMessage, error);
                
                if (connectionStatus) {
                    connectionStatus.textContent = 'Connection error';
                    connectionStatus.className = 'error';
                }
                
                // Create a proper error object with message
                reject(new Error(errorMessage));
            };
            
            ws.onclose = (event) => {
                const closeReason = event.reason ? event.reason : `Code: ${event.code}`;
                console.log('WebSocket connection closed:', event.code, closeReason);
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
                        connectionStatus.textContent = 'Connection timeout';
                        connectionStatus.className = 'error';
                    }
                    reject(new Error('Connection timeout after 10 seconds'));
                }
            }, 10000);
            
        } catch (error) {
            const errorMessage = error.message || 'Unknown error creating WebSocket connection';
            console.error('Error creating WebSocket:', errorMessage);
            
            const connectionStatus = document.getElementById('connection-status');
            if (connectionStatus) {
                connectionStatus.textContent = `Connection error: ${errorMessage}`;
                connectionStatus.className = 'error';
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

// Export functions
export {
    connectToHA,
    getState,
    addEntityListener
};
