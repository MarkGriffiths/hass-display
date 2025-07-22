// Wind display module
// Handles wind and gust direction and speed display

import { config } from './config.js';

// Store the current state of wind and gust data
const windState = {
    left: { angle: 0, speed: 0 },
    right: { angle: 0, speed: 0 }
};

/**
 * Convert wind speed in km/h to Beaufort scale
 * @param {number} speed - Wind speed in km/h
 * @returns {number} - Beaufort scale value (0-12)
 */
export function convertToBeaufort(speed) {
    // Beaufort scale thresholds in km/h
    const beaufortThresholds = [
        1,    // 0: Calm (< 1 km/h)
        5,    // 1: Light air (1-5 km/h)
        11,   // 2: Light breeze (6-11 km/h)
        19,   // 3: Gentle breeze (12-19 km/h)
        28,   // 4: Moderate breeze (20-28 km/h)
        38,   // 5: Fresh breeze (29-38 km/h)
        49,   // 6: Strong breeze (39-49 km/h)
        61,   // 7: High wind (50-61 km/h)
        74,   // 8: Gale (62-74 km/h)
        88,   // 9: Strong gale (75-88 km/h)
        102,  // 10: Storm (89-102 km/h)
        117,  // 11: Violent storm (103-117 km/h)
        Infinity // 12: Hurricane (≥ 118 km/h)
    ];
    
    // Find the appropriate Beaufort scale value
    for (let i = 0; i < beaufortThresholds.length; i++) {
        if (speed < beaufortThresholds[i]) {
            return i;
        }
    }
    
    // Default to highest Beaufort scale value if speed exceeds all thresholds
    return 12;
}

/**
 * Update the wind display with new direction and speed values
 * @param {number|null} angle - Wind direction angle in degrees, or null to use existing value
 * @param {number|null} speed - Wind speed in km/h, or null to use existing value
 * @param {string} position - 'left' for wind, 'right' for gust
 * @returns {boolean} - True if successful
 */
export function updateWindDisplay(angle, speed, position) {
    try {
        // Get the wind display elements
        const container = document.querySelector(`.wind-${position}`);
        if (!container) {
            console.error(`Wind ${position} container not found`);
            return false;
        }
        
        const directionElement = container.querySelector('.wind-direction i');
        const beaufortElement = container.querySelector('.wind-beaufort i');
        
        if (!directionElement || !beaufortElement) {
            console.error(`Wind ${position} direction or beaufort element not found`);
            return false;
        }
        
        // Update state with new values if provided, otherwise keep existing values
        if (angle !== null && angle !== undefined) {
            windState[position].angle = parseFloat(angle) || 0;
        }
        
        if (speed !== null && speed !== undefined) {
            windState[position].speed = parseFloat(speed) || 0;
        }
        
        // Get current state values
        const currentAngle = windState[position].angle;
        const currentSpeed = windState[position].speed;
        
        // Update direction icon
        // Remove existing direction classes
        const directionClasses = Array.from(directionElement.classList).filter(cls => cls.startsWith('from-'));
        directionClasses.forEach(cls => directionElement.classList.remove(cls));
        
        // Add new direction class (rounded to nearest 5 degrees)
        const roundedAngle = Math.round(currentAngle / 5) * 5;
        directionElement.classList.add(`from-${roundedAngle}-deg`);
        
        // Convert speed to Beaufort scale and update beaufort icon
        const beaufortScale = convertToBeaufort(currentSpeed);
        
        // Remove existing beaufort classes
        const beaufortClasses = Array.from(beaufortElement.classList).filter(cls => cls.startsWith('wi-wind-beaufort-'));
        beaufortClasses.forEach(cls => beaufortElement.classList.remove(cls));
        
        // Add new beaufort class
        beaufortElement.classList.add(`wi-wind-beaufort-${beaufortScale}`);
        
        console.log(`Updated ${position} wind display: angle=${currentAngle}°, speed=${currentSpeed} km/h, beaufort=${beaufortScale}`);
        return true;
    } catch (error) {
        console.error(`Error updating ${position} wind display:`, error);
        return false;
    }
}

/**
 * Initialize wind displays
 * @returns {boolean} - True if successful
 */
export function initWindDisplays() {
    try {
        // Check if wind display elements exist
        const leftContainer = document.querySelector('.wind-left');
        const rightContainer = document.querySelector('.wind-right');
        
        if (!leftContainer || !rightContainer) {
            console.error('Wind display containers not found');
            return false;
        }
        
        // Initialize with default values
        updateWindDisplay(0, 0, 'left');
        updateWindDisplay(0, 0, 'right');
        
        console.log('Wind displays initialized');
        return true;
    } catch (error) {
        console.error('Error initializing wind displays:', error);
        return false;
    }
}
