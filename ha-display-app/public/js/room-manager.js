// Room management module
import { config } from './config.js';
import { addEntityListener } from './ha-connection.js';
import { updateRoomIcon } from './room-icons.js';

/**
 * Sets up room displays based on configuration
 * @param {Array} roomConfigs - Array of room configuration objects
 */
function setupRoomDisplays(roomConfigs) {
  if (!roomConfigs || !Array.isArray(roomConfigs)) return;

  // Store room configurations globally for later use in entity listeners
  window.roomConfigs = roomConfigs;

  console.log('Setting up room displays with roomConfigs:', window.roomConfigs);
  roomConfigs.forEach(config => {
    if (!config.prefix) return;

    const roomNameElement = document.getElementById(`${config.prefix}-room-name`);
    console.log(`Setting ${config.prefix} room name to '${config.name}', element exists:`, !!roomNameElement);
    if (roomNameElement) {
      const roomName = config.name || `${config.prefix.charAt(0).toUpperCase() + config.prefix.slice(1)} Room`;
      roomNameElement.textContent = roomName;
      console.log(`Updated ${config.prefix} room name element to:`, roomNameElement.textContent);
      
      // Update the room icon based on the room name
      updateRoomIcon(config.prefix, roomName);
    }
  });
}

/**
 * Sets up entity listeners for room displays
 * @param {string} prefix - Room prefix (e.g., 'secondary', 'tertiary')
 */
function setupRoomEntityListeners(prefix) {
  if (!prefix) return;

  console.log(`Setting up entity listeners for ${prefix} room`);
  console.log('Available entities:', Object.keys(config.entities));
  console.log('Full config entities object:', config.entities);

  // Temperature entity
  const tempEntityKey = `temperature${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`;
  console.log(`Looking for temperature entity with key: ${tempEntityKey}, value:`, config.entities[tempEntityKey]);
  if (config.entities[tempEntityKey]) {
    addEntityListener(config.entities[tempEntityKey], (state) => {
      if (!state) {
        console.error(`${prefix} temperature state is undefined`);
        return;
      }

      const value = parseFloat(state.state);
      console.log(`Parsed ${prefix} temperature value:`, value);

      if (!isNaN(value)) {
        // Update temperature display
        const tempValue = document.getElementById(`${prefix}-temp-value`);
        if (tempValue) {
          tempValue.textContent = value.toFixed(1);
          console.log(`Updated ${prefix} temperature value element to:`, value.toFixed(1));
        } else {
          console.error(`${prefix} temperature value element not found with ID: ${prefix}-temp-value`);
        }
      } else {
        console.warn(`Invalid ${prefix} temperature value:`, state.state);
      }
    });
  } else {
    console.error(`No entity found for ${prefix} temperature with key: ${tempEntityKey}`);
  }

  // Temperature trend entity
  const tempTrendEntityKey = `temperature${prefix.charAt(0).toUpperCase() + prefix.slice(1)}Trend`;
  if (config.entities[tempTrendEntityKey]) {
    addEntityListener(config.entities[tempTrendEntityKey], (state) => {
      if (!state) {
        console.error(`${prefix} temperature trend state is undefined`);
        return;
      }

      // Get the temperature trend icon element
      const tempTrendIcon = document.getElementById(`${prefix}-temperature-trend-icon`);
      if (!tempTrendIcon) {
        console.error(`${prefix} temperature trend icon element not found`);
        return;
      }

      // Update trend icon based on state
      const trendValue = state.state;

      // Reset classes
      tempTrendIcon.classList.remove('wi-direction-up');
      tempTrendIcon.classList.remove('wi-direction-down');
      tempTrendIcon.classList.remove('wi-direction-right');

      // Set appropriate class and color
      if (trendValue === 'up') {
        tempTrendIcon.classList.add('wi-direction-up');
        tempTrendIcon.style.color = config.colorScheme.trends.up;
      } else if (trendValue === 'down') {
        tempTrendIcon.classList.add('wi-direction-down');
        tempTrendIcon.style.color = config.colorScheme.trends.down;
      } else {
        tempTrendIcon.classList.add('wi-direction-right');
        tempTrendIcon.style.color = config.colorScheme.trends.stable;
      }
    });
  }

  // Humidity entity
  const humidityEntityKey = `humidity${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`;
  console.log(`Looking for humidity entity with key: ${humidityEntityKey}, value:`, config.entities[humidityEntityKey]);
  if (config.entities[humidityEntityKey]) {
    addEntityListener(config.entities[humidityEntityKey], (state) => {
      if (!state) {
        console.error(`${prefix} humidity state is undefined`);
        return;
      }

      const value = parseFloat(state.state);
      console.log(`Parsed ${prefix} humidity value:`, value);

      if (!isNaN(value)) {
        // Update humidity display
        const humidityValue = document.getElementById(`${prefix}-humidity-value`);
        if (humidityValue) {
          humidityValue.textContent = Math.round(value);
          console.log(`Updated ${prefix} humidity value element to:`, Math.round(value));

          // Update humidity icon color based on value
          const humidityIcon = document.getElementById(`${prefix}-humidity-icon`);
          if (humidityIcon) {
            console.log(`Found ${prefix} humidity icon element:`, humidityIcon);
            // Get the nearest color stop for the humidity value from config
            const colorStops = config.colorScheme.roomDisplays.humidity;
            
            // Find the nearest color stop
            let nearestStop = colorStops[0];
            let minDistance = Math.abs(value - nearestStop.value);

            for (let i = 1; i < colorStops.length; i++) {
              const distance = Math.abs(value - colorStops[i].value);
              if (distance < minDistance) {
                minDistance = distance;
                nearestStop = colorStops[i];
              }
            }

            // Set the humidity icon color
            humidityIcon.style.color = nearestStop.color;
            console.log(`Set ${prefix} humidity icon color to:`, nearestStop.color, 'for value:', value);
          }
        } else {
          console.error(`${prefix} humidity value element not found with ID: ${prefix}-humidity-value`);
        }
      } else {
        console.warn(`Invalid ${prefix} humidity value:`, state.state);
      }
    });
  } else {
    console.error(`No entity found for ${prefix} humidity with key: ${humidityEntityKey}`);
  }

  // CO2 entity
  const co2EntityKey = `co2${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`;
  console.log(`Looking for CO2 entity with key: ${co2EntityKey}, value:`, config.entities[co2EntityKey]);
  if (config.entities[co2EntityKey]) {
    addEntityListener(config.entities[co2EntityKey], (state) => {
      if (!state) {
        console.error(`${prefix} CO2 state is undefined`);
        return;
      }

      const value = parseFloat(state.state);
      console.log(`Parsed ${prefix} CO2 value:`, value, 'isNaN:', isNaN(value));

      if (!isNaN(value)) {
        // Update CO2 display
        const co2Value = document.getElementById(`${prefix}-co2-value`);
        if (co2Value) {
          co2Value.textContent = Math.round(value);
          console.log(`Updated ${prefix} CO2 value element to:`, Math.round(value));

          // Update CO2 icon color based on value
          const co2Icon = document.getElementById(`${prefix}-co2-icon`);
          if (co2Icon) {
            console.log(`Found ${prefix} CO2 icon element:`, co2Icon);
            // Get the nearest color stop for the CO2 value from config
            const colorStops = config.colorScheme.roomDisplays.co2;
            
            // Find the nearest color stop
            let nearestStop = colorStops[0];
            let minDistance = Math.abs(value - nearestStop.value);

            for (let i = 1; i < colorStops.length; i++) {
              const distance = Math.abs(value - colorStops[i].value);
              if (distance < minDistance) {
                minDistance = distance;
                nearestStop = colorStops[i];
              }
            }

            // Set the CO2 icon color
            co2Icon.style.color = nearestStop.color;
            console.log(`Set ${prefix} CO2 icon color to:`, nearestStop.color, 'for value:', value);
          }
        } else {
          console.error(`${prefix} CO2 value element not found with ID: ${prefix}-co2-value`);
        }
      } else {
        console.warn(`Invalid ${prefix} CO2 value:`, state.state);
      }
    });
  }
}

export {
  setupRoomDisplays,
  setupRoomEntityListeners
};
