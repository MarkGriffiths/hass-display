// Humidity history sparkline module
import { config } from './config.js';
import { loadEntityHistory, addDataPoint, updateSparkline } from './sparkline-utils.js';

// Humidity history data store
const humidityHistory = {
    data: [],
    minHumidity: Infinity,
    maxHumidity: -Infinity,
    isLoading: false,
    maxPoints: 288 // 24 hours of 5-minute readings
};

/**
 * Initialize the humidity sparkline and load historical data
 */
export async function initHumiditySparkline() {
    // Get the sparkline container
    const historyDisplay = document.getElementById('history-display');

    if (!historyDisplay) {
        return;
    }

    // Initialize the humidity history
    humidityHistory.data = [];
    humidityHistory.minHumidity = Infinity;
    humidityHistory.maxHumidity = -Infinity;
    humidityHistory.isLoading = false;

    // Get the entity IDs from config
    const humidityEntityId = config.entities.humidity;

    // Load historical humidity data
    if (humidityEntityId) {
        // Use setTimeout to ensure this runs after the current execution context
        setTimeout(() => {
            loadHumidityHistory(humidityEntityId);
        }, 0);
    } else {
        console.error('Humidity entity ID not found in config');
    }
}

/**
 * Load the humidity history from Home Assistant
 * @param {string} entityId - The humidity entity ID
 */
export async function loadHumidityHistory(entityId) {
    // Use the shared loadEntityHistory function
    await loadEntityHistory(entityId, humidityHistory, () => {
        // Process the data to use the correct property names
        humidityHistory.data.forEach(point => {
            point.humidity = point.value;
            delete point.value;
        });

        // Calculate min/max with padding
        let minHumidity = Infinity;
        let maxHumidity = -Infinity;

        humidityHistory.data.forEach(point => {
            if (point.humidity < minHumidity) minHumidity = point.humidity;
            if (point.humidity > maxHumidity) maxHumidity = point.humidity;
        });

        const padding = Math.max(1, (maxHumidity - minHumidity) * 0.1);
        humidityHistory.minHumidity = Math.max(0, minHumidity - padding);
        humidityHistory.maxHumidity = Math.min(100, maxHumidity + padding); // Humidity is 0-100%

        // Update the sparkline
        updateHumiditySparkline();
    });
}

/**
 * Add a new humidity point to the history
 * @param {number} humidity - The humidity value to add
 */
export function addHumidityPoint(humidity) {
    addDataPoint(
        humidity,
        humidityHistory,
        'humidity',
        'minHumidity',
        'maxHumidity',
        updateHumiditySparkline
    );
}

/**
 * Update the humidity sparkline with current data
 */
export function updateHumiditySparkline() {
    updateSparkline(
        humidityHistory,
        'humidity',
        'minHumidity',
        'maxHumidity',
        'humidity-sparkline-path',
        'humidity-sparkline-points',
        '#03A9F4', // Using the humidity gradient color from index.html
        0, // No minimum range
        0, // yOffset
        80 // height
    );
}
