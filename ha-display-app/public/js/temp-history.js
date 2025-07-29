// Temperature history sparkline chart
import { config } from './config.js';
import { fetchEntityHistory } from './ha-connection.js';

// Store temperature history data (24 hours)
const tempHistory = {
    data: [],
    maxPoints: 144, // 24 hours with 10-minute intervals
    maxTemp: 30,
    minTemp: 0,
    isLoading: false
};

// Initialize the sparkline and load historical data
async function initSparkline() {
    // Get the sparkline container
    const historyDisplay = document.getElementById('history-display');

    if (!historyDisplay) {
        return;
    }

    // Initialize the temperature history
    tempHistory.data = [];
    tempHistory.minTemp = 0;
    tempHistory.maxTemp = 30;
    tempHistory.maxPoints = 144; // 24 hours at 10-minute intervals
    tempHistory.isLoading = false;

    // Get the temperature entity ID from config
    const temperatureEntityId = config.entities.temperature;

    // Load historical data
    if (temperatureEntityId) {
        // Use setTimeout to ensure this runs after the current execution context
        setTimeout(() => {
            loadHistoricalData(temperatureEntityId);
        }, 500);
    } else {
        console.error('Temperature entity ID not found in config');
    }
}



// Fetch historical data for an entity
async function loadHistoricalData(entityId) {
    try {
        // Prevent multiple simultaneous loads
        if (tempHistory.isLoading) {
            return;
        }

        tempHistory.isLoading = true;

        // Calculate start time (24 hours ago)
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - 24);

        // Fetch historical data from Home Assistant API
        const historyData = await fetchEntityHistory(entityId, startTime);

        // Reset data array
        tempHistory.data = [];

        // Reset min/max temperature
        tempHistory.minTemp = Infinity;
        tempHistory.maxTemp = -Infinity;

        // Process the history data
        if (historyData && Array.isArray(historyData) && historyData.length > 0) {
            // Process each history entry
            historyData.forEach(entry => {
                if (entry.state && !isNaN(parseFloat(entry.state))) {
                    const temp = parseFloat(entry.state);
                    const time = entry.timestamp;

                    // Add to history
                    tempHistory.data.push({
                        temp: temp,
                        time: time
                    });

                    // Update min/max
                    if (temp < tempHistory.minTemp) tempHistory.minTemp = temp;
                    if (temp > tempHistory.maxTemp) tempHistory.maxTemp = temp;
                }
            });

            // Add padding to min/max
            const padding = Math.max(1, (tempHistory.maxTemp - tempHistory.minTemp) * 0.1);
            tempHistory.minTemp = Math.max(0, tempHistory.minTemp - padding);
            tempHistory.maxTemp = tempHistory.maxTemp + padding;

            // Update the sparkline
            updateSparkline();
        }
    } catch (error) {
        // Silent fail
    } finally {
        tempHistory.isLoading = false;
    }
}

// Add a new temperature point to the history
function addTemperaturePoint(temp) {
    // Add the new data point
    const newPoint = {
        temp: temp,
        time: new Date()
    };
    tempHistory.data.push(newPoint);

    // Update min/max if needed
    if (temp > tempHistory.maxTemp - 2) { // Account for padding
        tempHistory.maxTemp = temp + 2; // Add some padding
    }
    if (temp < tempHistory.minTemp + 2) { // Account for padding
        tempHistory.minTemp = temp - 2; // Add some padding
    }

    // Limit the number of points
    if (tempHistory.data.length > tempHistory.maxPoints) {
        tempHistory.data.shift(); // Remove oldest point
    }

    // Update the sparkline
    updateSparkline();
}

// Update the sparkline with current data
function updateSparkline() {
    // Get the SVG elements
    const sparklinePath = document.getElementById('sparkline-path');
    const sparklinePoints = document.getElementById('sparkline-points');
    const tempHistoryLabel = document.getElementById('temp-history-label');

    if (!sparklinePath || !sparklinePoints) {
        return;
    }

    // Clear existing points
    sparklinePoints.innerHTML = '';

    // If we have no data, return
    if (tempHistory.data.length === 0) {
        sparklinePath.setAttribute('d', '');
        if (tempHistoryLabel) {
            tempHistoryLabel.textContent = 'Temperature History (24h)';
        }
        return;
    }

    // Sort data by timestamp to ensure correct order
    tempHistory.data.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Calculate the range with a minimum of 5 degrees
    let tempRange = tempHistory.maxTemp - tempHistory.minTemp;
    if (tempRange < 5) {
        const midPoint = (tempHistory.maxTemp + tempHistory.minTemp) / 2;
        tempHistory.maxTemp = midPoint + 2.5;
        tempHistory.minTemp = midPoint - 2.5;
        tempRange = 5;
    }

    // Create the path data
    let pathData = '';

    // Generate the sparkline path
    tempHistory.data.forEach((point, index) => {
        // Calculate x position based on time (0 to 260)
        // Use the time difference from the earliest point to the latest
        const earliestTime = tempHistory.data[0].time.getTime();
        const latestTime = tempHistory.data[tempHistory.data.length - 1].time.getTime();
        const timeRange = latestTime - earliestTime || 1; // Avoid division by zero

        const x = ((point.time.getTime() - earliestTime) / timeRange) * 260;

        // Calculate y position (0 to 60), inverted because SVG y increases downward
        const y = 80 - ((point.temp - tempHistory.minTemp) / tempRange) * 80;

        // Start the path or continue it
        if (index === 0) {
            pathData = `M ${x},${y}`;
        } else {
            pathData += ` L ${x},${y}`;
        }

        // Add a point for the latest value
        if (index === tempHistory.data.length - 1) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '3');
            circle.setAttribute('fill', '#4CAF50');
            sparklinePoints.appendChild(circle);

            // Update the label with current temperature
            if (tempHistoryLabel) {
                const currentTemp = Math.round(point.temp * 10) / 10;
                const minTemp = Math.round(tempHistory.minTemp * 10) / 10;
                const maxTemp = Math.round(tempHistory.maxTemp * 10) / 10;
                tempHistoryLabel.textContent = `Temperature: ${currentTemp}°C (${minTemp}°C - ${maxTemp}°C)`;
            }
        }
    });

    // Update the path
    sparklinePath.setAttribute('d', pathData);
}

// Export functions
export {
    initSparkline,
    addTemperaturePoint
};
