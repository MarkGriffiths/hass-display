// Simple test script to connect to Home Assistant and list all available entities
require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');

// Configuration
const haUrl = process.env.HA_URL || 'http://10.0.0.127:8123';
const accessToken = process.env.HA_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwZWViZmI0NzEwYjU0YjVhYWNiYzA4OWU1YTNiYjk2NCIsImlhdCI6MTc1MjUxMjA2NywiZXhwIjoyMDY3ODcyMDY3fQ.BmAXfsT0S9dYFsvnulUlD1QsCB6s5h9gOLBqJreI9n8';

console.log(`Connecting to Home Assistant at ${haUrl}`);

// Test HTTP connection first
http.get(`${haUrl}/api/`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
}, (res) => {
  console.log(`HTTP API Response: ${res.statusCode}`);
  
  // Now connect to WebSocket API
  connectWebSocket();
}).on('error', (err) => {
  console.error('HTTP API Error:', err.message);
});

function connectWebSocket() {
  const wsUrl = haUrl.replace('http', 'ws') + '/api/websocket';
  console.log(`Connecting to WebSocket at ${wsUrl}`);
  
  const ws = new WebSocket(wsUrl);
  
  ws.on('open', () => {
    console.log('WebSocket connection opened');
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('Received message:', message);
    
    // Handle authentication
    if (message.type === 'auth_required') {
      console.log('Authentication required, sending token');
      ws.send(JSON.stringify({
        type: 'auth',
        access_token: accessToken
      }));
    }
    
    // After authentication, get states
    if (message.type === 'auth_ok') {
      console.log('Authentication successful');
      ws.send(JSON.stringify({
        id: 1,
        type: 'get_states'
      }));
    }
    
    // Process received states
    if (message.type === 'result' && message.id === 1) {
      if (message.success) {
        const states = message.result;
        console.log(`Received ${states.length} states from Home Assistant`);
        
        // List all sensor entities
        const sensorEntities = states.filter(state => state.entity_id.startsWith('sensor.'));
        console.log('Sensor entities:');
        sensorEntities.forEach(entity => {
          console.log(`- ${entity.entity_id}: ${entity.state} ${entity.attributes.unit_of_measurement || ''}`);
        });
        
        // Check for specific entities we're looking for
        const temperatureEntity = states.find(s => s.entity_id === 'sensor.living_room_temperature');
        const humidityEntity = states.find(s => s.entity_id === 'sensor.living_room_humidity');
        
        console.log('\nChecking for specific entities:');
        console.log('Temperature entity:', temperatureEntity ? 
          `${temperatureEntity.entity_id}: ${temperatureEntity.state} ${temperatureEntity.attributes.unit_of_measurement || ''}` : 
          'Not found');
        console.log('Humidity entity:', humidityEntity ? 
          `${humidityEntity.entity_id}: ${humidityEntity.state} ${humidityEntity.attributes.unit_of_measurement || ''}` : 
          'Not found');
        
        // Suggest alternative entities if not found
        if (!temperatureEntity) {
          const possibleTempEntities = sensorEntities.filter(s => 
            s.entity_id.includes('temp') || 
            (s.attributes.unit_of_measurement && ['°C', '°F', 'K'].includes(s.attributes.unit_of_measurement))
          );
          console.log('\nPossible temperature entities:');
          possibleTempEntities.forEach(entity => {
            console.log(`- ${entity.entity_id}: ${entity.state} ${entity.attributes.unit_of_measurement || ''}`);
          });
        }
        
        if (!humidityEntity) {
          const possibleHumidityEntities = sensorEntities.filter(s => 
            s.entity_id.includes('humid') || 
            (s.attributes.unit_of_measurement && ['%'].includes(s.attributes.unit_of_measurement))
          );
          console.log('\nPossible humidity entities:');
          possibleHumidityEntities.forEach(entity => {
            console.log(`- ${entity.entity_id}: ${entity.state} ${entity.attributes.unit_of_measurement || ''}`);
          });
        }
      } else {
        console.error('Failed to get states:', message.error);
      }
      
      // Close the connection
      ws.close();
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
}
