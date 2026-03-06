// Room management module
import { config } from './config.js';
import { addEntityListener } from './ha-connection.js';
import { updateRoomIcon } from './room-icons.js';

// Cached DOM elements per room prefix
const roomElements = {};

/**
 * Get or cache DOM elements for a room prefix
 * @param {string} prefix - Room prefix
 * @returns {Object} Cached DOM elements
 */
function getRoomElements(prefix) {
	if (!roomElements[prefix]) {
		roomElements[prefix] = {
			roomName: document.getElementById(`${prefix}-room-name`),
			tempValue: document.getElementById(`${prefix}-temp-value`),
			tempTrendIcon: document.getElementById(`${prefix}-temperature-trend-icon`),
			humidityValue: document.getElementById(`${prefix}-humidity-value`),
			humidityIcon: document.getElementById(`${prefix}-humidity-icon`),
			co2Value: document.getElementById(`${prefix}-co2-value`),
			co2Icon: document.getElementById(`${prefix}-co2-icon`)
		};
	}
	return roomElements[prefix];
}

/**
 * Find the nearest color stop for a given value
 * @param {number} value - The value to match
 * @param {Array} colorStops - Array of color stop objects with value and color properties
 * @returns {Object} The nearest color stop
 */
function findNearestColor(value, colorStops) {
	let nearestStop = colorStops[0];
	let minDistance = Math.abs(value - nearestStop.value);

	for (let i = 1; i < colorStops.length; i++) {
		const distance = Math.abs(value - colorStops[i].value);
		if (distance < minDistance) {
			minDistance = distance;
			nearestStop = colorStops[i];
		}
	}

	return nearestStop;
}

/**
 * Sets up room displays based on configuration
 * @param {Array} roomConfigs - Array of room configuration objects
 */
function setupRoomDisplays(roomConfigs) {
	if (!roomConfigs || !Array.isArray(roomConfigs)) return;

	// Store room configurations globally for later use in entity listeners
	window.roomConfigs = roomConfigs;

	roomConfigs.forEach(cfg => {
		if (!cfg.prefix) return;

		const elements = getRoomElements(cfg.prefix);
		if (elements.roomName) {
			const roomName = cfg.name || `${cfg.prefix.charAt(0).toUpperCase() + cfg.prefix.slice(1)} Room`;
			elements.roomName.textContent = roomName;

			// Update the room icon based on the room name
			updateRoomIcon(cfg.prefix, roomName);
		}
	});
}

/**
 * Sets up entity listeners for room displays
 * @param {string} prefix - Room prefix (e.g., 'secondary', 'tertiary')
 */
function setupRoomEntityListeners(prefix) {
	if (!prefix) return;

	const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);

	// Temperature entity
	const tempEntityKey = `temperature${capitalizedPrefix}`;
	if (config.entities[tempEntityKey]) {
		addEntityListener(config.entities[tempEntityKey], (state) => {
			if (!state) return;

			const value = parseFloat(state.state);
			if (!isNaN(value)) {
				const elements = getRoomElements(prefix);
				if (elements.tempValue) {
					elements.tempValue.textContent = value.toFixed(1);
				}
			}
		});
	}

	// Temperature trend entity
	const tempTrendEntityKey = `temperature${capitalizedPrefix}Trend`;
	if (config.entities[tempTrendEntityKey]) {
		addEntityListener(config.entities[tempTrendEntityKey], (state) => {
			if (!state) return;

			const elements = getRoomElements(prefix);
			if (!elements.tempTrendIcon) return;

			const trendValue = state.state;

			// Reset classes
			elements.tempTrendIcon.classList.remove('wi-direction-up', 'wi-direction-down', 'wi-direction-right');

			// Set appropriate class and color
			if (trendValue === 'up') {
				elements.tempTrendIcon.classList.add('wi-direction-up');
				elements.tempTrendIcon.style.color = config.colorScheme.trends.up;
			} else if (trendValue === 'down') {
				elements.tempTrendIcon.classList.add('wi-direction-down');
				elements.tempTrendIcon.style.color = config.colorScheme.trends.down;
			} else {
				elements.tempTrendIcon.classList.add('wi-direction-right');
				elements.tempTrendIcon.style.color = config.colorScheme.trends.stable;
			}
		});
	}

	// Humidity entity
	const humidityEntityKey = `humidity${capitalizedPrefix}`;
	if (config.entities[humidityEntityKey]) {
		addEntityListener(config.entities[humidityEntityKey], (state) => {
			if (!state) return;

			const value = parseFloat(state.state);
			if (!isNaN(value)) {
				const elements = getRoomElements(prefix);
				if (elements.humidityValue) {
					elements.humidityValue.textContent = Math.round(value);

					if (elements.humidityIcon) {
						const nearestStop = findNearestColor(value, config.colorScheme.roomDisplays.humidity);
						elements.humidityIcon.style.color = nearestStop.color;
					}
				}
			}
		});
	}

	// CO2 entity
	const co2EntityKey = `co2${capitalizedPrefix}`;
	if (config.entities[co2EntityKey]) {
		addEntityListener(config.entities[co2EntityKey], (state) => {
			if (!state) return;

			const value = parseFloat(state.state);
			if (!isNaN(value)) {
				const elements = getRoomElements(prefix);
				if (elements.co2Value) {
					elements.co2Value.textContent = Math.round(value);

					if (elements.co2Icon) {
						const nearestStop = findNearestColor(value, config.colorScheme.roomDisplays.co2);
						elements.co2Icon.style.color = nearestStop.color;
					}
				}
			}
		});
	}
}

export {
	setupRoomDisplays,
	setupRoomEntityListeners
};
