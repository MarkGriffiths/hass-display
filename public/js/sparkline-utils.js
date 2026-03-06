// Shared utilities for sparkline charts
import { fetchEntityHistory } from './ha-connection.js';

// Cached SVG element references
const svgCache = {};

/**
 * Get or cache SVG elements for a sparkline
 * @param {string} pathId - Path element ID
 * @param {string} pointsId - Points group element ID
 * @returns {Object|null} Cached elements or null
 */
function getSvgElements(pathId, pointsId) {
	const cacheKey = `${pathId}:${pointsId}`;
	if (!svgCache[cacheKey]) {
		const path = document.getElementById(pathId);
		const pointsGroup = document.getElementById(pointsId);
		if (!path || !pointsGroup) return null;

		svgCache[cacheKey] = { path, pointsGroup };
	}
	return svgCache[cacheKey];
}

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
			// Process each history entry - filter valid entries in-place
			for (let i = 0; i < historyData.length; i++) {
				const entry = historyData[i];
				if (entry.state && !isNaN(parseFloat(entry.state))) {
					historyStore.data.push({
						value: parseFloat(entry.state),
						time: new Date(entry.timestamp)
					});
				}
			}

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

	if (value > max - 2) {
		historyStore[maxKey] = value + 2;
	}
	if (value < min + 2) {
		historyStore[minKey] = value - 2;
	}

	// Remove data points older than 24 hours
	const twentyFourHoursAgo = new Date();
	twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

	// Filter out old data points in-place
	let writeIdx = 0;
	for (let readIdx = 0; readIdx < historyStore.data.length; readIdx++) {
		if (historyStore.data[readIdx].time >= twentyFourHoursAgo) {
			historyStore.data[writeIdx] = historyStore.data[readIdx];
			writeIdx++;
		}
	}
	historyStore.data.length = writeIdx;

	// Also limit by max points as a safety measure
	if (historyStore.data.length > historyStore.maxPoints) {
		historyStore.data.shift();
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
	// Get cached SVG elements
	const elements = getSvgElements(pathId, pointsId);
	if (!elements) return;

	const { path, pointsGroup } = elements;

	// Clear existing points
	pointsGroup.innerHTML = '';

	if (historyStore.data.length === 0) {
		path.setAttribute('d', '');
		return;
	}

	// Calculate the min and max values with a minimum range
	const min = historyStore[minKey];
	const max = historyStore[maxKey];

	// Ensure a minimum range for better visualization
	const range = Math.max(max - min, minRange);

	// Get the SVG dimensions
	const svgWidth = 260;

	// Calculate the x and y scales
	const xScale = svgWidth / (historyStore.data.length - 1 || 1);
	const yScale = height / range;

	// Generate the path data with smooth curves
	const points = historyStore.data.map((point, index) => {
		const x = index * xScale;
		const y = yOffset + height - ((point[valueKey] - min) * yScale);
		return { x, y };
	});

	// Build path using array.join() for efficiency
	if (points.length > 0) {
		const pathParts = [`M ${points[0].x},${points[0].y}`];

		// Add smooth Bezier curves between points
		for (let i = 0; i < points.length - 1; i++) {
			const current = points[i];
			const next = points[i + 1];
			const cpDistance = (next.x - current.x) * 0.2;
			pathParts.push(`C ${current.x + cpDistance},${current.y} ${next.x - cpDistance},${next.y} ${next.x},${next.y}`);
		}

		// Add a point for the latest value
		const lastPoint = points[points.length - 1];
		const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		circle.setAttribute('cx', lastPoint.x);
		circle.setAttribute('cy', lastPoint.y);
		circle.setAttribute('r', '3');
		circle.setAttribute('fill', strokeColor);
		pointsGroup.appendChild(circle);

		// Update the path using join
		path.setAttribute('d', pathParts.join(' '));
	}
}
