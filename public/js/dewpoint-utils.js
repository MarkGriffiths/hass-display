// Dew point calculation utilities

/**
 * Calculate dew point temperature using the Magnus-Tetens formula
 * @param {number} temperature - Temperature in Celsius
 * @param {number} humidity - Relative humidity as a percentage (0-100)
 * @returns {number} Dew point temperature in Celsius
 */
export function calculateDewPoint(temperature, humidity) {
  // Constants for Magnus-Tetens formula
  const a = 17.27;
  const b = 237.7;
  
  // Validate inputs
  if (typeof temperature !== 'number' || typeof humidity !== 'number' || 
      isNaN(temperature) || isNaN(humidity)) {
    console.error('Invalid inputs for dew point calculation:', { temperature, humidity });
    return null;
  }
  
  // Ensure humidity is within valid range
  const relativeHumidity = Math.max(0, Math.min(100, humidity)) / 100;
  
  // Calculate the term inside the logarithm
  const term = Math.log(relativeHumidity) + ((a * temperature) / (b + temperature));
  
  // Calculate dew point
  const dewPoint = (b * term) / (a - term);
  
  // Round to 1 decimal place
  return Math.round(dewPoint * 10) / 10;
}

/**
 * Update the dew point display in the UI
 * @param {number} temperature - Temperature in Celsius
 * @param {number} humidity - Relative humidity as a percentage (0-100)
 * @returns {boolean} True if update was successful, false otherwise
 */
export function updateDewPointDisplay(temperature, humidity) {
  try {
    const dewPointElement = document.getElementById('dewpoint-value');
    if (!dewPointElement) {
      console.warn('Dew point display element not found');
      return false;
    }
    
    // Calculate dew point
    const dewPoint = calculateDewPoint(temperature, humidity);
    
    // Update the display
    if (dewPoint !== null) {
      dewPointElement.textContent = dewPoint.toFixed(1);
      return true;
    } else {
      dewPointElement.textContent = '--';
      return false;
    }
  } catch (error) {
    console.error('Error updating dew point display:', error);
    return false;
  }
}
