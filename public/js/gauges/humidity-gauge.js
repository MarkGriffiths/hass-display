// Humidity gauge implementation
import { config } from '../config.js';
import { createGradientStops, createArcPath, calculateAngle, createScaleMarkers } from './gauge-utils.js';

// Humidity gauge configuration
const humidityConfig = {
	minHumidity: config.gauges.humidity.min,
	maxHumidity: config.gauges.humidity.max,
	startAngle: config.gauges.humidity.startAngle,
	endAngle: config.gauges.humidity.endAngle,
	arcRadius: config.gaugeDimensions.humidityRadius,
	colorStops: config.gauges.humidity.colorStops
};

// Cached DOM elements
let gaugePathEl = null;
let valueDisplayEl = null;
let humidityIconEl = null;

/**
 * Create the humidity gradient for the inner arc
 */
export function createHumidityGradient() {
	try {
		const gradient = document.getElementById('humidity-gradient');
		if (!gradient) {
			console.error('Humidity gradient element not found');
			return;
		}

		// Clear any existing stops
		while (gradient.firstChild) {
			gradient.removeChild(gradient.firstChild);
		}

		// Create gradient stops based on configuration
		const stops = createGradientStops(
			'humidity-gradient',
			humidityConfig.colorStops,
			humidityConfig.minHumidity,
			humidityConfig.maxHumidity
		);

		// Add stops to the gradient
		stops.forEach(stop => {
			const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
			stopElement.setAttribute('offset', stop.offset);
			stopElement.setAttribute('stop-color', stop.color);
			gradient.appendChild(stopElement);
		});
	} catch (error) {
		console.error('Error creating humidity gradient:', error);
	}
}

/**
 * Create scale markers for the humidity gauge
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function createHumidityMarkers() {
	return new Promise((resolve) => {
		try {
			let retryCount = 0;
			const maxRetries = 10;

			const attemptCreate = () => {
				const markers = document.getElementById('humidity-markers');
				if (!markers) {
					retryCount++;
					if (retryCount < maxRetries) {
						setTimeout(attemptCreate, 100);
						return;
					}
					console.error('Maximum retries reached. Could not find humidity markers element.');
					resolve(false);
					return;
				}

				const result = createScaleMarkers(
					'humidity-markers',
					config.gaugeDimensions.centerX,
					config.gaugeDimensions.centerY,
					humidityConfig.arcRadius - 1,
					humidityConfig.minHumidity,
					humidityConfig.maxHumidity,
					10,
					humidityConfig.startAngle,
					humidityConfig.endAngle,
					'%',
					{
						hideMinMax: true,
						fontSize: '0.8rem'
					}
				);

				if (!result) {
					console.error('Failed to create humidity markers');
					resolve(false);
					return;
				}

				resolve(true);
			};

			attemptCreate();
		} catch (error) {
			console.error('Error creating humidity markers:', error);
			resolve(false);
		}
	});
}

/**
 * Update the humidity gauge with a new value
 * @param {number} humidity - The humidity value to display
 * @param {boolean} initializing - Whether this is the initial update
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function updateHumidityGauge(humidity, initializing = false) {
	return new Promise((resolve) => {
		try {
			// Cache DOM elements on first call
			if (!gaugePathEl) {
				gaugePathEl = document.getElementById('humidity-arc');
				valueDisplayEl = document.getElementById('humidity-value');
				humidityIconEl = document.getElementById('humidity-icon');
			}

			const displayHumidity = initializing ? humidityConfig.minHumidity : humidity;

			if (!gaugePathEl) {
				console.error('Humidity gauge arc element not found');
				resolve(false);
				return;
			}

			// Ensure humidity is within range
			const safeHumidity = Math.max(humidityConfig.minHumidity, Math.min(displayHumidity, humidityConfig.maxHumidity));

			// Calculate the angle
			const angle = calculateAngle(
				safeHumidity,
				humidityConfig.minHumidity,
				humidityConfig.maxHumidity,
				humidityConfig.startAngle,
				humidityConfig.endAngle
			);

			// Get center coordinates and radius
			const centerX = config.gaugeDimensions.centerX;
			const centerY = config.gaugeDimensions.centerY;
			const radius = humidityConfig.arcRadius;

			// Create the arc path
			const arcPath = createArcPath(
				centerX,
				centerY,
				radius,
				humidityConfig.startAngle,
				angle,
				false
			);

			// Update the path
			gaugePathEl.setAttribute('d', arcPath);

			// Update the value display if it exists
			if (valueDisplayEl) {
				valueDisplayEl.textContent = initializing ? '--' : Math.round(humidity);

				// Update the humidity icon color
				if (humidityIconEl) {
					const colorStops = humidityConfig.colorStops;
					let iconColor = '#FFFFFF';

					let closestStop = null;
					let minDistance = Number.MAX_VALUE;

					for (let i = 0; i < colorStops.length; i++) {
						const stop = colorStops[i];
						const distance = Math.abs(humidity - stop.humidity);

						if (distance < minDistance) {
							minDistance = distance;
							closestStop = stop;
						}
					}

					if (closestStop) {
						iconColor = closestStop.color;
					}

					humidityIconEl.style.color = iconColor;
				}
			}

			resolve(true);
		} catch (error) {
			console.error('Error updating humidity gauge:', error);
			resolve(false);
		}
	});
}
