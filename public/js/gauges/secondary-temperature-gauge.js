// Secondary temperature gauge implementation
import { config } from '../config.js';
import { createGradientStops, createArcPath, calculateAngle, createScaleMarkers } from './gauge-utils.js';

// Secondary temperature gauge configuration
const secondaryTempConfig = {
	min: config.gauges.temperatureSecondary.min,
	max: config.gauges.temperatureSecondary.max,
	startAngle: config.gauges.temperatureSecondary.startAngle,
	endAngle: config.gauges.temperatureSecondary.endAngle,
	arcRadius: config.gaugeDimensions.secondaryRadius,
	colorStops: config.gauges.temperatureSecondary.colorStops
};

// Cached DOM elements
let gaugePathEl = null;
let valueDisplayEl = null;

/**
 * Create the secondary temperature gradient for the bottom arc
 */
export function createSecondaryTemperatureGradient() {
	try {
		const gradient = document.getElementById('secondary-temp-gradient');
		if (!gradient) {
			console.error('Secondary temperature gradient element not found');
			return;
		}

		// Clear any existing stops
		while (gradient.firstChild) {
			gradient.removeChild(gradient.firstChild);
		}

		// Create gradient stops based on configuration
		const stops = createGradientStops(
			'secondary-temp-gradient',
			secondaryTempConfig.colorStops,
			secondaryTempConfig.min,
			secondaryTempConfig.max
		);

		// Add stops to the gradient
		stops.forEach(stop => {
			const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
			stopElement.setAttribute('offset', stop.offset);
			stopElement.setAttribute('stop-color', stop.color);
			gradient.appendChild(stopElement);
		});
	} catch (error) {
		console.error('Error creating secondary temperature gradient:', error);
	}
}

/**
 * Create scale markers for the secondary temperature gauge
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function createSecondaryTemperatureMarkers() {
	return new Promise((resolve) => {
		try {
			let retryCount = 0;
			const maxRetries = 15;

			const attemptCreate = () => {
				const markers = document.getElementById('secondary-temp-markers');
				if (!markers) {
					retryCount++;
					if (retryCount < maxRetries) {
						const delay = 200 * retryCount;
						setTimeout(attemptCreate, delay);
						return;
					}

					console.error('Maximum retries reached. Could not find secondary temperature markers element.');
					resolve(false);
					return;
				}

				const result = createScaleMarkers(
					'secondary-temp-markers',
					config.gaugeDimensions.centerX,
					config.gaugeDimensions.centerY,
					secondaryTempConfig.arcRadius + 1,
					secondaryTempConfig.min,
					secondaryTempConfig.max,
					5,
					secondaryTempConfig.startAngle,
					secondaryTempConfig.endAngle,
					'°',
					{
						hideMinMax: true,
						fontSize: '12px'
					}
				);

				if (!result) {
					console.error('Failed to create secondary temperature markers');
					resolve(false);
					return;
				}

				resolve(true);
			};

			attemptCreate();
		} catch (error) {
			console.error('Error creating secondary temperature scale markers:', error);
			resolve(false);
		}
	});
}

/**
 * Update the secondary temperature gauge with a new value
 * @param {number} temperature - The temperature value to display
 * @param {boolean} initializing - Whether this is the initial update (to use minimal values)
 */
export function updateSecondaryTemperatureGauge(temperature, initializing = false) {
	try {
		// Cache DOM elements on first call
		if (!gaugePathEl) {
			gaugePathEl = document.getElementById('secondary-temp-arc');
			valueDisplayEl = document.getElementById('secondary-temp-value');
		}

		if (!gaugePathEl || !valueDisplayEl) {
			console.error('Secondary temperature gauge elements not found');
			return;
		}

		// If initializing, use the minimum temperature value to prevent flash of color
		const displayTemp = initializing ? secondaryTempConfig.min : temperature;

		// Ensure temperature is within range
		const safeTemp = Math.max(secondaryTempConfig.min, Math.min(displayTemp, secondaryTempConfig.max));

		// Calculate the angle
		const angle = calculateAngle(
			safeTemp,
			secondaryTempConfig.min,
			secondaryTempConfig.max,
			secondaryTempConfig.startAngle,
			secondaryTempConfig.endAngle
		);

		// Get center coordinates and radius
		const centerX = config.gaugeDimensions.centerX;
		const centerY = config.gaugeDimensions.centerY;
		const radius = secondaryTempConfig.arcRadius;

		// Create the arc path with clockwise direction
		const arcPath = createArcPath(
			centerX,
			centerY,
			radius,
			secondaryTempConfig.startAngle,
			angle,
			false,
			true
		);

		// Update the path
		gaugePathEl.setAttribute('d', arcPath);

		// Update the value display
		valueDisplayEl.textContent = initializing ? '--.-' : temperature.toFixed(1);
	} catch (error) {
		console.error('Error updating secondary temperature gauge:', error);
	}
}
