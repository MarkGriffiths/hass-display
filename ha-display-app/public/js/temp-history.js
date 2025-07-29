// Temperature history sparkline module
import { config } from './config.js';
import { loadEntityHistory, addDataPoint, updateSparkline } from './sparkline-utils.js';
import { fetchEntityHistory } from './ha-connection.js';

// Temperature history data store
const tempHistory = {
    data: [],
    minTemp: Infinity,
    maxTemp: -Infinity,
    isLoading: false,
    maxPoints: 288 // 24 hours of 5-minute readings
};

// Initialize the sparklines and load historical data
async function initSparkline() {
    // Get the sparkline container
    const historyDisplay = document.getElementById('history-display');

    if (!historyDisplay) {
        return;
    }

    // Initialize the temperature history
    tempHistory.data = [];
    tempHistory.minTemp = Infinity;
    tempHistory.maxTemp = -Infinity;
    tempHistory.isLoading = false;

    // Get the entity IDs from config
    const temperatureEntityId = config.entities.temperature;

    // Load historical temperature data
    if (temperatureEntityId) {
        // Use setTimeout to ensure this runs after the current execution context
        setTimeout(() => {
            loadTempHistory(temperatureEntityId);
        }, 0);
    } else {
        console.error('Temperature entity ID not found in config');
    }
}

// Load the temperature history from Home Assistant
async function loadTempHistory(entityId) {
    // Use the shared loadEntityHistory function
    await loadEntityHistory(entityId, tempHistory, () => {
        // Process the data to use the correct property names
        tempHistory.data.forEach(point => {
            point.temp = point.value;
            delete point.value;
        });

        // Calculate min/max with padding
        let minTemp = Infinity;
        let maxTemp = -Infinity;

        tempHistory.data.forEach(point => {
            if (point.temp < minTemp) minTemp = point.temp;
            if (point.temp > maxTemp) maxTemp = point.temp;
        });

        const padding = Math.max(1, (maxTemp - minTemp) * 0.1);
        tempHistory.minTemp = Math.max(0, minTemp - padding);
        tempHistory.maxTemp = maxTemp + padding;

        // Update the sparkline
        updateTempSparkline();
    });
}

// Add a new temperature point to the history
function addTempPoint(temp) {
    addDataPoint(
        temp,
        tempHistory,
        'temp',
        'minTemp',
        'maxTemp',
        updateTempSparkline
    );
}

// Update the temperature sparkline with current data
function updateTempSparkline() {
    updateSparkline(
        tempHistory,
        'temp',
        'minTemp',
        'maxTemp',
        'sparkline-path',
        'sparkline-points',
        '#4CAF50',
        2,
        0,  // yOffset - top half of SVG
        40  // height - use top 40px
    );
}

// Export the functions
export {
    initSparkline,
    loadTempHistory,
    addTempPoint
};
