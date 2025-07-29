// Pressure history sparkline module
import { config } from './config.js';
import { loadEntityHistory, addDataPoint, updateSparkline } from './sparkline-utils.js';
import { fetchEntityHistory } from './ha-connection.js';

// Pressure history data store
const pressureHistory = {
    data: [],
    minPressure: Infinity,
    maxPressure: -Infinity,
    isLoading: false,
    maxPoints: 288 // 24 hours of 5-minute readings
};

/**
 * Initialize the pressure sparkline and load historical data
 */
export async function initPressureSparkline() {
    // Get the sparkline container
    const historyDisplay = document.getElementById('history-display');

    if (!historyDisplay) {
        return;
    }

    // Initialize the pressure history
    pressureHistory.data = [];
    pressureHistory.minPressure = Infinity;
    pressureHistory.maxPressure = -Infinity;
    pressureHistory.isLoading = false;

    // Get the entity IDs from config
    const pressureEntityId = config.entities.pressure;

    // Load historical pressure data
    if (pressureEntityId) {
        // Use setTimeout to ensure this runs after the current execution context
        setTimeout(() => {
            loadPressureHistory(pressureEntityId);
        }, 0);
    } else {
        console.error('Pressure entity ID not found in config');
    }
}

/**
 * Load the pressure history from Home Assistant
 * @param {string} entityId - The pressure entity ID
 */
export async function loadPressureHistory(entityId) {
    // Use the shared loadEntityHistory function
    await loadEntityHistory(entityId, pressureHistory, () => {
        // Process the data to use the correct property names
        pressureHistory.data.forEach(point => {
            point.pressure = point.value;
            delete point.value;
        });

        // Calculate min/max with padding
        let minPressure = Infinity;
        let maxPressure = -Infinity;

        pressureHistory.data.forEach(point => {
            if (point.pressure < minPressure) minPressure = point.pressure;
            if (point.pressure > maxPressure) maxPressure = point.pressure;
        });

        const padding = Math.max(1, (maxPressure - minPressure) * 0.1);
        pressureHistory.minPressure = Math.max(0, minPressure - padding);
        pressureHistory.maxPressure = maxPressure + padding;

        // Update the sparkline
        updatePressureSparkline();
    });
}

/**
 * Add a new pressure point to the history
 * @param {number} pressure - The pressure value to add
 */
export function addPressurePoint(pressure) {
    addDataPoint(
        pressure,
        pressureHistory,
        'pressure',
        'minPressure',
        'maxPressure',
        updatePressureSparkline
    );
}

/**
 * Update the pressure sparkline with current data
 */
export function updatePressureSparkline() {
    updateSparkline(
        pressureHistory,
        'pressure',
        'minPressure',
        'maxPressure',
        'pressure-sparkline-path',
        'pressure-sparkline-points',
        '#2196F3',
        5, // Minimum range of 5 hPa
        40, // yOffset - bottom half of SVG
        40  // height - use bottom 40px
    );
}
