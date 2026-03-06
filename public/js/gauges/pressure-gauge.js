// Pressure gauge implementation
import { config } from '../config.js';
import { createGradientStops, createArcPath, calculateAngle, createScaleMarkers } from './gauge-utils.js';

// Pressure gauge configuration
const pressureConfig = {
	minPressure: config.gauges.pressure.min,
	maxPressure: config.gauges.pressure.max,
	startAngle: config.gauges.pressure.startAngle,
	endAngle: config.gauges.pressure.endAngle,
	arcRadius: config.gaugeDimensions.pressureRadius,
	colorStops: config.gauges.pressure.colorStops
};

// Cached DOM elements
let gaugePathEl = null;
let valueDisplayEl = null;
let pressureIconEl = null;

/**
 * Create the pressure gradient for the innermost arc
 */
export function createPressureGradient() {
	try {
		const gradient = document.getElementById('pressure-gradient');
		if (!gradient) {
			console.error('Pressure gradient element not found');
			return;
		}

		// Clear any existing stops
		while (gradient.firstChild) {
			gradient.removeChild(gradient.firstChild);
		}

		// Create gradient stops based on configuration
		const stops = createGradientStops(
			'pressure-gradient',
			pressureConfig.colorStops,
			pressureConfig.minPressure,
			pressureConfig.maxPressure
		);

		// Add stops to the gradient
		stops.forEach(stop => {
			const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
			stopElement.setAttribute('offset', stop.offset);
			stopElement.setAttribute('stop-color', stop.color);
			gradient.appendChild(stopElement);
		});
	} catch (error) {
		console.error('Error creating pressure gradient:', error);
	}
}

/**
 * Create scale markers for the pressure gauge
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function createPressureScaleMarkers() {
	return new Promise((resolve) => {
		try {
			let retryCount = 0;
			const maxRetries = 10;

			const attemptCreate = () => {
				const markers = document.getElementById('pressure-markers');
				if (!markers) {
					retryCount++;
					if (retryCount < maxRetries) {
						setTimeout(attemptCreate, 100);
						return;
					}
					console.error('Maximum retries reached. Could not find pressure markers element.');
					resolve(false);
					return;
				}

				const result = createScaleMarkers(
					'pressure-markers',
					config.gaugeDimensions.centerX,
					config.gaugeDimensions.centerY,
					pressureConfig.arcRadius - 0.5,
					pressureConfig.minPressure,
					pressureConfig.maxPressure,
					10,
					pressureConfig.startAngle,
					pressureConfig.endAngle,
					'',
					{
						hideMinMax: true,
						fontSize: '0.6rem',
					}
				);

				if (!result) {
					console.error('Failed to create pressure markers');
					resolve(false);
					return;
				}

				resolve(true);
			};

			attemptCreate();
		} catch (error) {
			console.error('Error creating pressure scale markers:', error);
			resolve(false);
		}
	});
}

/**
 * Update the pressure gauge with a new value
 * @param {number} pressure - The pressure value to display
 * @param {boolean} initializing - Whether this is the initial update
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function updatePressureGauge(pressure, initializing = false) {
	return new Promise((resolve) => {
		try {
			// Cache DOM elements on first call
			if (!gaugePathEl) {
				gaugePathEl = document.getElementById('pressure-arc');
				valueDisplayEl = document.getElementById('pressure-value');
				pressureIconEl = document.getElementById('pressure-icon');
			}

			const displayPressure = initializing ? pressureConfig.minPressure : pressure;

			if (!gaugePathEl) {
				console.error('Pressure gauge arc element not found');
				resolve(false);
				return;
			}

			// Ensure pressure is within range
			const safePressure = Math.max(pressureConfig.minPressure, Math.min(displayPressure, pressureConfig.maxPressure));

			// Calculate the angle
			const angle = calculateAngle(
				safePressure,
				pressureConfig.minPressure,
				pressureConfig.maxPressure,
				pressureConfig.startAngle,
				pressureConfig.endAngle
			);

			// Get center coordinates and radius
			const centerX = config.gaugeDimensions.centerX;
			const centerY = config.gaugeDimensions.centerY;
			const radius = pressureConfig.arcRadius;

			// Create the arc path
			const arcPath = createArcPath(
				centerX,
				centerY,
				radius,
				pressureConfig.startAngle,
				angle,
				false
			);

			// Update the path
			gaugePathEl.setAttribute('d', arcPath);

			// Update the value display if it exists
			if (valueDisplayEl) {
				valueDisplayEl.textContent = initializing ? '----' : pressure.toFixed(1);

				// Update the pressure icon color
				if (pressureIconEl) {
					const colorStops = pressureConfig.colorStops;
					let iconColor = '#FFFFFF';

					let closestStop = null;
					let minDistance = Number.MAX_VALUE;

					for (let i = 0; i < colorStops.length; i++) {
						const stop = colorStops[i];
						const distance = Math.abs(pressure - stop.pressure);

						if (distance < minDistance) {
							minDistance = distance;
							closestStop = stop;
						}
					}

					if (closestStop) {
						iconColor = closestStop.color;
					}

					pressureIconEl.style.color = iconColor;
				}
			}

			resolve(true);
		} catch (error) {
			console.error('Error updating pressure gauge:', error);
			resolve(false);
		}
	});
}
