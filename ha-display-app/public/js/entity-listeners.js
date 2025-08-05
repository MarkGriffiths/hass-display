// Entity listeners module
import { config } from './config.js';
import { addEntityListener, updateMainTemperature, getState, updateRainToday, updateRainLastHour } from './ha-connection.js';
import { updateWeatherIcon } from './ui-manager.js';
import { addPressurePoint } from './pressure-history.js';
import { addHumidityPoint } from './humidity-history.js';
import { updateHumidityGauge, updatePressureGauge } from './gauge-manager.js';
import { setupRoomEntityListeners } from './room-manager.js';
import { updateWindDisplay } from './wind-display.js';

/**
 * Setup entity listeners for Home Assistant entities
 */
function setupEntityListeners() {
  console.log('Setting up entity listeners for configured rooms');
  console.log('Room configs:', window.roomConfigs);
  console.log('All available entities:', config.entities);

  // Force a clear debug log of all entity IDs
  console.log('ENTITY DEBUG:');
  console.log('Temperature:', config.entities.temperature);
  console.log('Temperature Trend:', config.entities.temperatureTrend);
  console.log('Humidity:', config.entities.humidity);
  console.log('Pressure:', config.entities.pressure);
  console.log('Secondary Temperature:', config.entities.temperatureSecondary);
  console.log('Secondary Temperature Trend:', config.entities.temperatureSecondaryTrend);
  console.log('Secondary Humidity:', config.entities.humiditySecondary);
  console.log('Secondary CO2:', config.entities.co2Secondary);
  console.log('Tertiary Temperature:', config.entities.temperatureTertiary);
  console.log('Tertiary Temperature Trend:', config.entities.temperatureTertiaryTrend);
  console.log('Tertiary Humidity:', config.entities.humidityTertiary);
  console.log('Tertiary CO2:', config.entities.co2Tertiary);
  console.log('Wind Angle:', config.entities.windAngle);
  console.log('Wind Speed:', config.entities.windSpeed);
  console.log('Gust Angle:', config.entities.gustAngle);
  console.log('Gust Speed:', config.entities.gustSpeed);

  // Debug HTML elements
  console.log('HTML ELEMENTS DEBUG:');
  console.log('Secondary room name element:', document.getElementById('secondary-room-name'));
  console.log('Secondary temperature icon:', document.getElementById('secondary-temperature-trend-icon'));
  console.log('Secondary temperature value:', document.getElementById('secondary-temp-value'));
  console.log('Secondary humidity icon:', document.getElementById('secondary-humidity-icon'));
  console.log('Secondary humidity value:', document.getElementById('secondary-humidity-value'));
  console.log('Secondary CO2 icon:', document.getElementById('secondary-co2-icon'));
  console.log('Secondary CO2 value:', document.getElementById('secondary-co2-value'));
  console.log('Tertiary room name element:', document.getElementById('tertiary-room-name'));
  console.log('Tertiary temperature icon:', document.getElementById('tertiary-temperature-trend-icon'));
  console.log('Tertiary temperature value:', document.getElementById('tertiary-temp-value'));
  console.log('Tertiary humidity icon:', document.getElementById('tertiary-humidity-icon'));
  console.log('Tertiary humidity value:', document.getElementById('tertiary-humidity-value'));
  console.log('Tertiary CO2 icon:', document.getElementById('tertiary-co2-icon'));
  console.log('Tertiary CO2 value:', document.getElementById('tertiary-co2-value'));

  if (window.roomConfigs && Array.isArray(window.roomConfigs)) {
    window.roomConfigs.forEach(roomConfig => {
      if (roomConfig.prefix) {
        setupRoomEntityListeners(roomConfig.prefix);
      }
    });
  }

  // Listen for main temperature changes
  addEntityListener(config.entities.temperature, (state) => {
    if (!state) {
      console.error('Main temperature state is undefined');
      return;
    }

    // Update the main temperature gauge and history
    updateMainTemperature(state);
  });

  // Listen for temperature trend changes
  addEntityListener(config.entities.temperatureTrend, (state) => {
    if (!state) {
      console.error('Temperature trend state is undefined');
      return;
    }

    // Get the temperature trend icon element
    const tempTrendIcon = document.getElementById('temperature-trend-icon');
    if (!tempTrendIcon) {
      console.error('Temperature trend icon element not found');
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

  // Listen for humidity changes
  addEntityListener(config.entities.humidity, (state) => {
    if (!state) {
      console.error('Humidity state is undefined');
      return;
    }

    const humidityValue = parseFloat(state.state);
    if (!isNaN(humidityValue)) {
      // Update humidity gauge with new value
      updateHumidityGauge(humidityValue);

      // Add humidity data point to history sparkline
      addHumidityPoint(humidityValue);
    } else {
      console.warn('Invalid humidity value:', state.state);
    }
  });

  // Listen for pressure changes
  addEntityListener(config.entities.pressure, (state) => {
    if (!state) {
      console.error('Pressure state is undefined');
      return;
    }

    const pressureValue = parseFloat(state.state);
    if (!isNaN(pressureValue)) {
      // Update pressure gauge with new value
      updatePressureGauge(pressureValue);

      // Add pressure data point to history sparkline
      addPressurePoint(pressureValue);
    } else {
      console.warn('Invalid pressure value:', state.state);
    }
  });

  // Listen for pressure trend changes
  addEntityListener(config.entities.pressureTrend, (state) => {
    if (!state) {
      console.error('Pressure trend state is undefined');
      return;
    }

    // Get the pressure trend icon element
    const pressureTrendIcon = document.getElementById('pressure-trend-icon');
    if (!pressureTrendIcon) {
      console.error('Pressure trend icon element not found');
      return;
    }

    // Update trend icon based on state
    const trendValue = state.state;

    // Reset classes
    pressureTrendIcon.classList.remove('wi-direction-up');
    pressureTrendIcon.classList.remove('wi-direction-down');
    pressureTrendIcon.classList.remove('wi-direction-right');

    // Set appropriate class and color
    if (trendValue === 'up') {
      pressureTrendIcon.classList.add('wi-direction-up');
      pressureTrendIcon.style.color = config.colorScheme.trends.pressureUp;
    } else if (trendValue === 'down') {
      pressureTrendIcon.classList.add('wi-direction-down');
      pressureTrendIcon.style.color = config.colorScheme.trends.pressureDown;
    } else {
      pressureTrendIcon.classList.add('wi-direction-right');
      pressureTrendIcon.style.color = config.colorScheme.trends.pressureStable;
    }
  });

  // Listen for rain sensor changes
  if (config.entities.rain) {
    addEntityListener(config.entities.rain, (state) => {
      console.log('Rain state received:', state);
      if (!state) {
        console.error('Rain state is undefined');
        return;
      }

      const value = parseFloat(state.state);
      console.log('Parsed rain value:', value, 'isNaN:', isNaN(value));
      if (!isNaN(value)) {
        // Update the rain value display
        const rainValueElement = document.getElementById('rain-value');
        if (rainValueElement) {
          rainValueElement.textContent = value.toFixed(1);
        }

        // Update the rain icon based on the rain value
        const rainIcon = document.getElementById('rain-conditions-icon');
        if (rainIcon) {
          // Remove all existing rain classes
          rainIcon.className = 'wi';

          // Set the appropriate icon based on rain value
          if (value <= 0.2) {
            rainIcon.classList.add('wi-sprinkle');
          } else if (value <= 0.2) {
            rainIcon.classList.add('wi-rain-showers');
          } else if (value <= 0.4) {
            rainIcon.classList.add('wi-rain-mix');
          } else {
            rainIcon.classList.add('wi-rain');
          }
        }
      }
    });
  }

  // Listen for rain today changes
  addEntityListener(config.entities.rainToday, updateRainToday);

  // Listen for rain last hour changes
  addEntityListener(config.entities.rainLastHour, updateRainLastHour);

  // Listen for wind angle changes
  console.log('Setting up wind angle listener for:', config.entities.windAngle);
  addEntityListener(config.entities.windAngle, (state) => {
    console.log('Wind angle state update received:', state);
    if (!state || !state.state) {
      console.log('Invalid wind angle state');
      return;
    }

    const windAngle = parseFloat(state.state);
    if (!isNaN(windAngle)) {
      // Get the wind speed state
      const windSpeedState = getState(config.entities.windSpeed);
      const windSpeed = windSpeedState ? parseFloat(windSpeedState.state) : 0;
      console.log(`Updating wind display: angle=${windAngle}°, speed=${windSpeed} km/h`);

      // Update wind display
      updateWindDisplay('wind', windAngle, windSpeed);
    } else {
      console.log('Invalid wind angle value:', state.state);
    }
  });

  // Listen for wind speed changes
  addEntityListener(config.entities.windSpeed, (state) => {
    if (!state || !state.state) {
      return;
    }

    const windSpeed = parseFloat(state.state);
    if (!isNaN(windSpeed)) {
      // Get the wind angle state
      const windAngleState = getState(config.entities.windAngle);
      const windAngle = windAngleState ? parseFloat(windAngleState.state) : 0;

      // Update wind display
      updateWindDisplay('wind', windAngle, windSpeed);
    }
  });

  // Listen for gust angle changes
  addEntityListener(config.entities.gustAngle, (state) => {
    if (!state || !state.state) {
      return;
    }

    const gustAngle = parseFloat(state.state);
    if (!isNaN(gustAngle)) {
      // Get the gust speed state
      const gustSpeedState = getState(config.entities.gustSpeed);
      const gustSpeed = gustSpeedState ? parseFloat(gustSpeedState.state) : 0;

      // Update gust display
      updateWindDisplay('gust', gustAngle, gustSpeed);
    }
  });

  // Listen for gust speed changes
  addEntityListener(config.entities.gustSpeed, (state) => {
    if (!state || !state.state) {
      return;
    }

    const gustSpeed = parseFloat(state.state);
    if (!isNaN(gustSpeed)) {
      // Get the gust angle state
      const gustAngleState = getState(config.entities.gustAngle);
      const gustAngle = gustAngleState ? parseFloat(gustAngleState.state) : 0;

      // Update gust display
      updateWindDisplay('gust', gustAngle, gustSpeed);
    }
  });

  // Listen for weather condition changes
  let weatherState = null;
  let sunState = null;

  addEntityListener(config.entities.weather, (state) => {
    weatherState = state;
    updateWeatherIcon(weatherState, sunState);
  });

  // Listen for sun position changes
  addEntityListener(config.entities.sun, (state) => {
    sunState = state;
    updateWeatherIcon(weatherState, sunState);
  });
}

/**
 * Validate the Home Assistant configuration
 */
function validateConfiguration() {
  if (!config.homeAssistant || !config.homeAssistant.url) {
    throw new Error('Home Assistant URL is not configured');
  }
}

export {
  setupEntityListeners,
  validateConfiguration
};
