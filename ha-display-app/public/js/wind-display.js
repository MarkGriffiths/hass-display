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
 * Update wind display with new angle and speed
 * @param {number|null} angle - Wind direction angle in degrees, or null to use existing value
 * @param {number|null} speed - Wind speed in km/h, or null to use existing value
 * @param {string} position - 'left' for wind, 'right' for gust
 * @returns {boolean} - True if successful
 */
export function updateWindDisplay(type, angle, speed) {
    try {
        // Map type to position and element ID
        const position = type === 'wind' ? 'left' : 'right';
        const containerId = type === 'wind' ? 'wind-panel-left' : 'wind-panel-right';
        
        // Get the container based on ID
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Wind ${type} container not found with ID: ${containerId}`);
            return false;
        }
        
        console.log(`Updating ${type} display: angle=${angle}°, speed=${speed} km/h`);

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

        // Update speed display
        const speedElement = container.querySelector('.wind-speed');
        if (speedElement) {
            speedElement.textContent = `${currentSpeed}`;
        }

        // Calculate Beaufort scale
        const beaufort = convertToBeaufort(currentSpeed);

        // Update Beaufort display - don't set text content, we'll update the icon class instead

        // Update direction using SVG rotation
        const directionElement = container.querySelector('.wind-direction svg');
        if (directionElement) {
            // Apply rotation to the SVG element
            // We add 180 degrees because the arrow points up by default, but meteorological wind direction
            // is the direction the wind is coming FROM, not going TO
            const rotationAngle = (currentAngle + 180) % 360;
            
            // Get current rotation if it exists
            const currentTransform = directionElement.style.transform;
            const currentRotation = currentTransform ? parseFloat(currentTransform.match(/rotate\((\d+)deg\)/)?.[1] || 0) : 0;
            
            // Determine the shortest path for rotation (clockwise or counterclockwise)
            let newRotation = rotationAngle;
            
            // If we already have a rotation value, calculate the shortest path
            if (currentTransform) {
                // Calculate difference between angles
                let diff = rotationAngle - currentRotation;
                
                // Normalize to -180 to 180 degrees for shortest path
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;
                
                // Add the difference to the current rotation
                newRotation = currentRotation + diff;
            }
            
            // Apply the new rotation
            directionElement.style.transform = `rotate(${newRotation}deg)`;
        }

        console.log(`Updated ${position} wind display: angle=${currentAngle}°, speed=${currentSpeed} km/h, beaufort=${beaufort}`);
        
        // Update Beaufort icon class
        const beaufortIcon = container.querySelector('.wind-beaufort i');
        if (beaufortIcon) {
            // Remove existing beaufort classes
            const beaufortClasses = Array.from(beaufortIcon.classList).filter(cls => cls.startsWith('wi-wind-beaufort-'));
            beaufortClasses.forEach(cls => beaufortIcon.classList.remove(cls));
            
            // Add new beaufort class
            beaufortIcon.classList.add(`wi-wind-beaufort-${beaufort}`);
        }
        
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
        const leftContainer = document.getElementById('wind-panel-left');
        const rightContainer = document.getElementById('wind-panel-right');
        
        if (!leftContainer || !rightContainer) {
            console.error('Wind containers not found');
            return false;
        }
        
        const leftDirectionElement = leftContainer.querySelector('.wind-direction svg');
        const rightDirectionElement = rightContainer.querySelector('.wind-direction svg');
        
        if (leftDirectionElement && rightDirectionElement) {
            // Set initial rotation to 180 degrees (pointing north)
            leftDirectionElement.style.transform = 'rotate(180deg)';
            rightDirectionElement.style.transform = 'rotate(180deg)';
        }
        
        // Initialize wind display (left)
        updateWindDisplay('wind', 0, 0);
        
        // Initialize gust display (right)
        updateWindDisplay('gust', 0, 0);
        
        return true;
    } catch (error) {
        console.error('Error initializing wind displays:', error);
        return false;
    }
}
