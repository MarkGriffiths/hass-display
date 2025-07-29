// Gauge Manager - Central module for all gauge functionality

// Import gauge initializer
import { initGauges } from './gauges/gauge-initializer.js';

// Import temperature gauge functions
import { updateTemperatureGauge } from './gauges/temperature-gauge.js';

// Import secondary temperature gauge functions
import { updateSecondaryTemperatureGauge } from './gauges/secondary-temperature-gauge.js';

// Import humidity gauge functions
import { updateHumidityGauge } from './gauges/humidity-gauge.js';

// Import pressure gauge functions
import { updatePressureGauge } from './gauges/pressure-gauge.js';

// Import rainfall gauge functions
import { updateRainfallGauge } from './gauges/rainfall-gauge.js';

/**
 * Verify that all required DOM elements exist
 * @returns {boolean} True if all elements exist, false otherwise
 */
function verifyRequiredElements() {
  const requiredElements = [
    'temperature-markers',
    'secondary-temp-markers',
    'humidity-markers',
    'pressure-markers',
    'rainfall-markers',
    'temperature-arc',
    'secondary-temp-arc',
    'humidity-arc',
    'pressure-arc',
    'rainfall-arc',
  ];

  let allFound = true;
  for (const id of requiredElements) {
    const element = document.getElementById(id);
    if (!element) {
      console.error(`Required element #${id} not found in DOM`);
      allFound = false;
    }
  }

  return allFound;
}

/**
 * Initialize all gauges
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export async function initTemperatureGauge() {
  try {
    // First verify that all required elements exist
    const elementsExist = verifyRequiredElements();
    if (!elementsExist) {
      console.error(
        'Some required DOM elements are missing. Cannot initialize gauges.'
      );
      return false;
    }

    // Use the centralized gauge initializer - now properly awaited
    const result = await initGauges();

    if (!result) {
      console.error('Failed to initialize one or more gauges');
    }

    return result;
  } catch (error) {
    console.error('Error initializing gauges:', error);
    return false;
  }
}

// Re-export all gauge update functions
export {
  updateTemperatureGauge,
  updateSecondaryTemperatureGauge,
  updateHumidityGauge,
  updatePressureGauge,
  updateRainfallGauge,
};
