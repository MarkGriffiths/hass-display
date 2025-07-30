// Shared utilities for sparkline charts
import { fetchEntityHistory } from './ha-connection.js';

/**
 * Fetch historical entity data from Home Assistant
 * @param {string} entityId - The entity ID to fetch history for
 * @param {Object} historyStore - The history data store object
 * @param {Function} updateFunction - The function to call to update the sparkline
 */
export async function loadEntityHistory(entityId, historyStore, updateFunction) {
    try {
        // Prevent multiple simultaneous loads
        if (historyStore.isLoading) {
            return;
        }

        historyStore.isLoading = true;

        // Calculate start time (24 hours ago)
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - 24);

        // Fetch historical data from Home Assistant API
        const historyData = await fetchEntityHistory(entityId, startTime);

        // Reset data array
        historyStore.data = [];

        // Process the history data
        if (historyData && Array.isArray(historyData) && historyData.length > 0) {
            // Process each history entry
            historyData.forEach(entry => {
                if (entry.state && !isNaN(parseFloat(entry.state))) {
                    const value = parseFloat(entry.state);
                    const time = entry.timestamp;

                    // Add to history
                    historyStore.data.push({
                        value: value,
                        time: new Date(time)
                    });
                }
            });

            // Update the sparkline
            if (typeof updateFunction === 'function') {
                updateFunction();
            }
        }

        historyStore.isLoading = false;
    } catch (error) {
        historyStore.isLoading = false;
    }
}

/**
 * Add a new data point to the history
 * @param {number} value - The value to add
 * @param {Object} historyStore - The history data store object
 * @param {string} valueKey - The key to use for the value in the data object
 * @param {string} minKey - The key for the minimum value in the history store
 * @param {string} maxKey - The key for the maximum value in the history store
 * @param {Function} updateFunction - The function to call to update the sparkline
 */
export function addDataPoint(value, historyStore, valueKey, minKey, maxKey, updateFunction) {
    // Add the new point
    const newPoint = {
        time: new Date()
    };
    newPoint[valueKey] = value;

    historyStore.data.push(newPoint);

    // Update min/max if needed
    const min = historyStore[minKey];
    const max = historyStore[maxKey];

    if (value > max - 2) { // Account for padding
        historyStore[maxKey] = value + 2; // Add some padding
    }
    if (value < min + 2) { // Account for padding
        historyStore[minKey] = value - 2; // Add some padding
    }

    // Limit the number of points
    if (historyStore.data.length > historyStore.maxPoints) {
        historyStore.data.shift(); // Remove oldest point
    }

    // Update the sparkline
    if (typeof updateFunction === 'function') {
        updateFunction();
    }
}

/**
 * Update the sparkline with the current data
 * @param {Object} historyStore - The history data store object
 * @param {string} valueKey - The key to use for the value in the data object
 * @param {string} minKey - The key for the minimum value in the history store
 * @param {string} maxKey - The key for the maximum value in the history store
 * @param {string} pathId - The ID of the SVG path element
 * @param {string} pointsId - The ID of the SVG points group element
 * @param {string} strokeColor - The color to use for the sparkline
 * @param {number} minRange - The minimum range for the y-axis
 * @param {number} yOffset - The vertical offset for the sparkline (0 for top half, 40 for bottom half)
 * @param {number} height - The height of the sparkline area (default: 40)
 */
export function updateSparkline(
    historyStore,
    valueKey,
    minKey,
    maxKey,
    pathId,
    pointsId,
    strokeColor,
    minRange,
    yOffset = 0,
    height = 40
) {
    // Get the SVG elements
    const path = document.getElementById(pathId);
    const pointsGroup = document.getElementById(pointsId);

    if (!path || !pointsGroup) {
        return;
    }

    // Clear existing points
    pointsGroup.innerHTML = '';

    if (historyStore.data.length === 0) {
        // No data, clear the path
        path.setAttribute('d', '');
        return;
    }

    // Calculate the min and max values with a minimum range
    const min = historyStore[minKey];
    const max = historyStore[maxKey];

    // Ensure a minimum range for better visualization
    const range = Math.max(max - min, minRange);

    // Calculate the path data
    let pathData = '';

    // Get the SVG dimensions
    const svgWidth = 260; // Width of the SVG

    // Calculate the x and y scales
    const xScale = svgWidth / (historyStore.data.length - 1 || 1);
    const yScale = height / range;

    // Generate the path data with smooth curves
    const points = historyStore.data.map((point, index) => {
        const x = index * xScale;
        const y = yOffset + height - ((point[valueKey] - min) * yScale);
        return { x, y };
    });

    // Start the path
    if (points.length > 0) {
        pathData = `M ${points[0].x},${points[0].y}`;

        // Add smooth Bezier curves between points
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            // Calculate control points for smooth curve
            // Use 0.8 of the distance between points for control point distance (increased for more smoothing)
            const cpDistance = (next.x - current.x) * 0.2;

            // Add cubic Bezier curve
            pathData += ` C ${current.x + cpDistance},${current.y} ${next.x - cpDistance},${next.y} ${next.x},${next.y}`;
        }

        // Add a point for the latest value
        if (points.length > 0) {
            const lastPoint = points[points.length - 1];
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', lastPoint.x);
            circle.setAttribute('cy', lastPoint.y);
            circle.setAttribute('r', '3');
            circle.setAttribute('fill', strokeColor);
            pointsGroup.appendChild(circle);
        }
    }

    // Update the path
    path.setAttribute('d', pathData);
}
