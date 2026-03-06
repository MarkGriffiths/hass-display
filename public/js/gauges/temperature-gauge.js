// Temperature gauge implementation
import { config } from '../config.js';
import { createGradientStops, createArcPath, calculateAngle, createScaleMarkers } from './gauge-utils.js';

// Temperature gauge configuration
const tempConfig = {
	minTemp: config.gauges.temperature.min,
	maxTemp: config.gauges.temperature.max,
	startAngle: config.gauges.temperature.startAngle,
	endAngle: config.gauges.temperature.endAngle,
	colorStops: config.gauges.temperature.colorStops
};

// Cached DOM elements
let gaugePathEl = null;
let valueDisplayEl = null;

/**
 * Create the temperature gradient for the arc
 */
export function createTemperatureGradient() {
	try {
		const gradient = document.getElementById('temperature-gradient');
		if (!gradient) {
			console.error('Temperature gradient element not found');
			return;
		}

		// Clear any existing stops
		while (gradient.firstChild) {
			gradient.removeChild(gradient.firstChild);
		}

		// Create gradient stops based on configuration
		const stops = createGradientStops(
			'temperature-gradient',
			tempConfig.colorStops,
			tempConfig.minTemp,
			tempConfig.maxTemp
		);

		// Add stops to the gradient
		stops.forEach(stop => {
			const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
			stopElement.setAttribute('offset', stop.offset);
			stopElement.setAttribute('stop-color', stop.color);
			gradient.appendChild(stopElement);
		});
	} catch (error) {
		console.error('Error creating temperature gradient:', error);
	}
}

/**
 * Create scale markers for the temperature gauge
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function createTemperatureMarkers() {
	return new Promise((resolve) => {
		try {
			let retryCount = 0;
			const maxRetries = 15;

			const attemptCreate = () => {
				const markers = document.getElementById('temperature-markers');
				if (!markers) {
					retryCount++;
					if (retryCount < maxRetries) {
						const delay = 200 * retryCount;
						setTimeout(attemptCreate, delay);
						return;
					}

					console.error('Maximum retries reached. Could not find temperature markers element.');
					resolve(false);
					return;
				}

				const result = createScaleMarkers(
					'temperature-markers',
					config.gaugeDimensions.centerX,
					config.gaugeDimensions.centerY,
					config.gaugeDimensions.mainRadius - 3,
					tempConfig.minTemp,
					tempConfig.maxTemp,
					5,
					tempConfig.startAngle,
					tempConfig.endAngle,
					'°',
					{
						hideMinMax: true,
						fontSize: '1.2rem'
					}
				);

				if (!result) {
					console.error('Failed to create temperature markers');
					resolve(false);
					return;
				}

				resolve(true);
			};

			attemptCreate();
		} catch (error) {
			console.error('Error creating temperature markers:', error);
			resolve(false);
		}
	});
}

/**
 * Update the temperature gauge with a new value
 * @param {number} temperature - The temperature value to display
 * @param {boolean} initializing - Whether this is the initial update (to use minimal values)
 */
export function updateTemperatureGauge(temperature, initializing = false) {
	try {
		// Cache DOM elements on first call
		if (!gaugePathEl) {
			gaugePathEl = document.getElementById('temperature-arc');
			valueDisplayEl = document.getElementById('temperature-value');
		}

		if (!gaugePathEl || !valueDisplayEl) {
			console.error('Temperature gauge elements not found');
			return;
		}

		// If initializing, use the minimum temperature value to prevent flash of color
		const displayTemp = initializing ? tempConfig.minTemp : temperature;

		// Ensure temperature is within range
		const safeTemp = Math.max(tempConfig.minTemp, Math.min(displayTemp, tempConfig.maxTemp));

		// Calculate the angle for the current temperature
		const angle = calculateAngle(
			safeTemp,
			tempConfig.minTemp,
			tempConfig.maxTemp,
			tempConfig.startAngle,
			tempConfig.endAngle
		);

		// Get center coordinates and radius
		const centerX = config.gaugeDimensions.centerX;
		const centerY = config.gaugeDimensions.centerY;
		const radius = config.gaugeDimensions.mainRadius;

		// Create the arc path
		const arcPath = createArcPath(
			centerX,
			centerY,
			radius,
			tempConfig.startAngle,
			angle,
			false
		);

		// Update the path
		gaugePathEl.setAttribute('d', arcPath);

		// Update the value display
		valueDisplayEl.textContent = initializing ? '--.-' : temperature.toFixed(1);
	} catch (error) {
		console.error('Error updating temperature gauge:', error);
	}
}
