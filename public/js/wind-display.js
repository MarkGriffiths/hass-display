// Wind display module
// Handles wind and gust direction and speed display

import { config } from './config.js';

// Store the current state of wind and gust data
const windState = {
	left: { angle: 0, speed: 0 },
	right: { angle: 0, speed: 0 }
};

// Cached container elements per container ID
const containerCache = {};

// Beaufort scale thresholds in km/h (module-level constant)
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
	Infinity // 12: Hurricane (>= 118 km/h)
];

/**
 * Convert wind speed in km/h to Beaufort scale
 * @param {number} speed - Wind speed in km/h
 * @returns {number} - Beaufort scale value (0-12)
 */
export function convertToBeaufort(speed) {
	for (let i = 0; i < beaufortThresholds.length; i++) {
		if (speed < beaufortThresholds[i]) {
			return i;
		}
	}
	return 12;
}

/**
 * Get or cache container elements
 * @param {string} containerId - Container element ID
 * @returns {Object|null} Cached elements or null
 */
function getContainerElements(containerId) {
	if (!containerCache[containerId]) {
		const container = document.getElementById(containerId);
		if (!container) return null;

		containerCache[containerId] = {
			container,
			speedEl: container.querySelector('.wind-speed'),
			directionSvg: container.querySelector('.wind-direction svg'),
			beaufortIcon: container.querySelector('.wind-beaufort i')
		};
	}
	return containerCache[containerId];
}

/**
 * Update wind display with new angle and speed
 * @param {string} type - 'wind' or 'gust'
 * @param {number|null} angle - Wind direction angle in degrees, or null to use existing value
 * @param {number|null} speed - Wind speed in km/h, or null to use existing value
 * @returns {boolean} - True if successful
 */
export function updateWindDisplay(type, angle, speed) {
	try {
		const position = type === 'wind' ? 'left' : 'right';
		const containerId = type === 'wind' ? 'wind-panel-left' : 'wind-panel-right';

		const elements = getContainerElements(containerId);
		if (!elements) {
			console.error(`Wind ${type} container not found with ID: ${containerId}`);
			return false;
		}

		// Update state with new values if provided
		if (angle !== null && angle !== undefined) {
			windState[position].angle = parseFloat(angle) || 0;
		}
		if (speed !== null && speed !== undefined) {
			windState[position].speed = parseFloat(speed) || 0;
		}

		const currentAngle = windState[position].angle;
		const currentSpeed = windState[position].speed;

		// Update speed display
		if (elements.speedEl) {
			elements.speedEl.textContent = `${currentSpeed}`;
		}

		// Calculate Beaufort scale
		const beaufort = convertToBeaufort(currentSpeed);

		// Update direction using SVG rotation
		if (elements.directionSvg) {
			const rotationAngle = (currentAngle + 180) % 360;
			const currentTransform = elements.directionSvg.style.transform;
			const currentRotation = currentTransform ? parseFloat(currentTransform.match(/rotate\((\d+)deg\)/)?.[1] || 0) : 0;

			let newRotation = rotationAngle;

			if (currentTransform) {
				let diff = rotationAngle - currentRotation;
				if (diff > 180) diff -= 360;
				if (diff < -180) diff += 360;
				newRotation = currentRotation + diff;
			}

			elements.directionSvg.style.transform = `rotate(${newRotation}deg)`;
		}

		// Update Beaufort icon class
		if (elements.beaufortIcon) {
			const beaufortClasses = Array.from(elements.beaufortIcon.classList).filter(cls => cls.startsWith('wi-wind-beaufort-'));
			beaufortClasses.forEach(cls => elements.beaufortIcon.classList.remove(cls));
			elements.beaufortIcon.classList.add(`wi-wind-beaufort-${beaufort}`);
		}

		return true;
	} catch (error) {
		console.error(`Error updating wind display:`, error);
		return false;
	}
}

/**
 * Initialize wind displays
 * @returns {boolean} - True if successful
 */
export function initWindDisplays() {
	try {
		const leftElements = getContainerElements('wind-panel-left');
		const rightElements = getContainerElements('wind-panel-right');

		if (!leftElements || !rightElements) {
			console.error('Wind containers not found');
			return false;
		}

		if (leftElements.directionSvg && rightElements.directionSvg) {
			leftElements.directionSvg.style.transform = 'rotate(180deg)';
			rightElements.directionSvg.style.transform = 'rotate(180deg)';
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
