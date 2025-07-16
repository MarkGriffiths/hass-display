// Simple WebSocket test for Home Assistant
const WebSocket = require('ws');
require('dotenv').config();

// Get Home Assistant URL and access token from environment variables
const haUrl = process.env.HA_URL || 'http://10.0.0.127:8123';
const accessToken = process.env.HA_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwZWViZmI0NzEwYjU0YjVhYWNiYzA4OWU1YTNiYjk2NCIsImlhdCI6MTc1MjUxMjA2NywiZXhwIjoyMDY3ODcyMDY3fQ.BmAXfsT0S9dYFsvnulUlD1QsCB6s5h9gOLBqJreI9n8';

// Convert HTTP URL to WebSocket URL
const wsUrl = haUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/api/websocket';

console.log(`Attempting to connect to Home Assistant WebSocket API at: ${wsUrl}`);

// Create WebSocket connection
const ws = new WebSocket(wsUrl);

// Connection opened
ws.on('open', () => {
  console.log('WebSocket connection established!');
  
  // Send authentication message
  const authMessage = {
    type: 'auth',
    access_token: accessToken
  };
  
  console.log('Sending authentication message...');
  ws.send(JSON.stringify(authMessage));
});

// Listen for messages
ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received message:', JSON.stringify(message, null, 2));
  
  // If auth_required message is received, send authentication
  if (message.type === 'auth_required') {
    const authMessage = {
      type: 'auth',
      access_token: accessToken
    };
    
    console.log('Authentication required, sending credentials...');
    ws.send(JSON.stringify(authMessage));
  }
  
  // If auth_ok message is received, subscribe to events
  if (message.type === 'auth_ok') {
    console.log('Authentication successful!');
    
    // Subscribe to state changes
    const subscribeMessage = {
      id: 1,
      type: 'subscribe_events',
      event_type: 'state_changed'
    };
    
    console.log('Subscribing to state changes...');
    ws.send(JSON.stringify(subscribeMessage));
    
    // Get states
    const getStatesMessage = {
      id: 2,
      type: 'get_states'
    };
    
    console.log('Requesting current states...');
    ws.send(JSON.stringify(getStatesMessage));
  }
  
  // If result message is received for get_states (id: 2)
  if (message.type === 'result' && message.id === 2) {
    console.log('Received states, looking for temperature and humidity sensors...');
    
    // Filter for temperature and humidity sensors
    const tempSensors = message.result.filter(entity => 
      entity.entity_id.includes('temperature') && entity.state !== 'unavailable'
    );
    
    const humSensors = message.result.filter(entity => 
      entity.entity_id.includes('humidity') && entity.state !== 'unavailable'
    );
    
    console.log('\nTemperature sensors found:');
    tempSensors.forEach(sensor => {
      console.log(`- ${sensor.entity_id}: ${sensor.state} ${sensor.attributes.unit_of_measurement || ''}`);
    });
    
    console.log('\nHumidity sensors found:');
    humSensors.forEach(sensor => {
      console.log(`- ${sensor.entity_id}: ${sensor.state} ${sensor.attributes.unit_of_measurement || ''}`);
    });
    
    // Close connection after getting states
    console.log('\nTest completed successfully, closing connection.');
    setTimeout(() => ws.close(), 1000);
  }
});

// Error handling
ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
  console.error('Error details:', error);
});

// Connection closed
ws.on('close', (code, reason) => {
  console.log(`WebSocket connection closed: ${code} ${reason}`);
});

// Set a timeout to close the connection if nothing happens
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log('Test timed out after 10 seconds, closing connection.');
    ws.close();
  }
  process.exit(0);
}, 10000);
