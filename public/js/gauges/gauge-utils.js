// Shared utility functions for gauge components
import { config } from '../config.js';

/**
 * Creates an SVG path for an arc
 * @param {number} centerX - X coordinate of the center
 * @param {number} centerY - Y coordinate of the center
 * @param {number} radius - Radius of the arc
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 * @param {boolean} includeCenter - Whether to include the center point in the path
 * @param {boolean} clockwise - Direction of the arc: true for clockwise, false for counterclockwise
 * @returns {string} SVG path string
 */
export function createArcPath(centerX, centerY, radius, startAngle, endAngle, includeCenter = false, clockwise = false) {
	// Convert angles from degrees to radians
	const startRad = startAngle * (Math.PI / 180);
	const endRad = endAngle * (Math.PI / 180);

	// Calculate start and end points
	const startX = centerX + radius * Math.cos(startRad);
	const startY = centerY + radius * Math.sin(startRad);
	const endX = centerX + radius * Math.cos(endRad);
	const endY = centerY + radius * Math.sin(endRad);

	// Calculate sweep angle
	let sweepAngle = endAngle - startAngle;
	if (sweepAngle < 0) {
		sweepAngle += 360;
	}

	// Special handling for bottom semicircle (secondary temperature gauge)
	let largeArcFlag;
	if (clockwise && startAngle > endAngle) {
		largeArcFlag = 0;
	} else {
		largeArcFlag = sweepAngle > 180 ? 1 : 0;
	}

	// Set sweep flag based on direction: 0 for clockwise, 1 for counterclockwise
	const sweepFlag = clockwise ? 0 : 1;

	// Create the arc path
	let path = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;

	if (includeCenter) {
		path += ` L ${centerX} ${centerY} L ${startX} ${startY}`;
	}

	return path;
}

/**
 * Creates gradient stops for a gauge
 * @param {string} gradientId - ID for the gradient element
 * @param {Array} colorStops - Array of objects with temperature/value and color
 * @param {number} min - Minimum value for normalization
 * @param {number} max - Maximum value for normalization
 * @returns {Array} Array of objects with offset and color
 */
export function createGradientStops(gradientId, colorStops, min, max) {
	try {
		const valueRange = max - min;

		const stops = colorStops.map(stop => {
			let offset;
			if (stop.temp !== undefined) {
				offset = ((stop.temp - min) / valueRange).toFixed(2);
			} else if (stop.humidity !== undefined) {
				offset = ((stop.humidity - min) / valueRange).toFixed(2);
			} else if (stop.pressure !== undefined) {
				offset = ((stop.pressure - min) / valueRange).toFixed(2);
			} else if (stop.rainfall !== undefined) {
				offset = ((stop.rainfall - min) / valueRange).toFixed(2);
			} else {
				offset = stop.offset;
			}

			return {
				offset,
				color: stop.color
			};
		});

		return stops;
	} catch (error) {
		console.error(`Error creating gradient stops for ${gradientId}:`, error);
		return [];
	}
}

/**
 * Creates scale markers for a gauge
 * @param {string} markersElementId - ID of the SVG group element to add markers to
 * @param {number} centerX - X coordinate of the center
 * @param {number} centerY - Y coordinate of the center
 * @param {number} radius - Radius of the gauge
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} step - Step size between markers
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 * @param {string} unit - Unit to display after the value
 * @param {Object} options - Additional options for customization
 * @returns {boolean} - True if successful, false otherwise
 */
export function createScaleMarkers(markersElementId, centerX, centerY, radius, min, max, step, startAngle, endAngle, unit = '', options = {}) {
	try {
		const markers = document.getElementById(markersElementId);
		if (!markers) {
			console.error(`Markers element with ID ${markersElementId} not found`);
			return false;
		}

		const defaultOptions = {
			hideMinMax: true,
			fontSize: '0.6rem',
			filterValue: null
		};

		const mergedOptions = { ...defaultOptions, ...options };

		// Clear any existing markers
		markers.innerHTML = '';

		// Calculate angle per unit
		const valueRange = max - min;
		const angleRange = Math.abs(endAngle - startAngle);
		const degreesPerUnit = angleRange / valueRange;

		// Determine direction
		const isClockwise = markersElementId === 'temperature-markers' ||
			markersElementId === 'humidity-markers' ||
			markersElementId === 'pressure-markers' ||
			markersElementId === 'rainfall-markers';

		// Create a document fragment to batch DOM operations
		const fragment = document.createDocumentFragment();

		for (let value = min; value <= max; value += step) {
			let angle;
			if (isClockwise) {
				angle = startAngle + ((value - min) * degreesPerUnit);
			} else {
				angle = startAngle - ((value - min) * degreesPerUnit);
			}

			const radians = angle * (Math.PI / 180);

			const textX = centerX + Math.cos(radians) * radius;
			const textY = centerY + Math.sin(radians) * radius;

			const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.setAttribute('x', 0);
			text.setAttribute('y', 0);
			text.setAttribute('text-anchor', 'middle');
			text.setAttribute('dominant-baseline', 'middle');
			text.setAttribute('fill', '#fff');
			text.setAttribute('font-size', mergedOptions.fontSize);
			text.setAttribute('font-weight', 'bold');
			text.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.8);');

			let showValue = true;

			if (mergedOptions.hideMinMax && (value === min || value === max)) {
				showValue = false;
			}

			if (mergedOptions.filterValue && typeof mergedOptions.filterValue === 'function') {
				showValue = showValue && mergedOptions.filterValue(value, min, max);
			}

			text.textContent = `${value}${unit}`;
			if (!showValue) {
				text.setAttribute('opacity', '0');
			}

			markerGroup.appendChild(text);

			let textAngle = angle + 90;
			if (textAngle > 90 && textAngle < 270) {
				textAngle += 180;
			}

			markerGroup.setAttribute('transform', `translate(${textX}, ${textY}) rotate(${textAngle})`);

			fragment.appendChild(markerGroup);
		}

		markers.appendChild(fragment);
		return true;
	} catch (error) {
		console.error(`Error creating scale markers for ${markersElementId}:`, error);
		return false;
	}
}

/**
 * Initialize background arc for a gauge
 * @param {string} backgroundPathClass - Class name for the background path
 * @param {number} centerX - X coordinate of the center
 * @param {number} centerY - Y coordinate of the center
 * @param {number} radius - Radius of the gauge
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 */
export function initBackgroundArc(backgroundPathClass, centerX, centerY, radius, startAngle, endAngle) {
	try {
		const backgroundPathElement = document.querySelector(`.${backgroundPathClass}`);
		if (!backgroundPathElement) {
			console.error(`Background path element with class ${backgroundPathClass} not found`);
			return;
		}

		let clockwise = false;

		if (startAngle > endAngle) {
			clockwise = true;
		} else if (startAngle > 180) {
			clockwise = true;
		}

		const arcPath = createArcPath(centerX, centerY, radius, startAngle, endAngle, false, clockwise);

		backgroundPathElement.setAttribute('d', arcPath);
	} catch (error) {
		console.error(`Error initializing background arc for ${backgroundPathClass}:`, error);
	}
}

/**
 * Initialize SVG paths for a gauge
 * @param {string} backgroundPathClass - Class name for the background path
 * @param {number} centerX - X coordinate of the center
 * @param {number} centerY - Y coordinate of the center
 * @param {number} radius - Radius of the gauge
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 */
export function initGaugePath(backgroundPathClass, centerX, centerY, radius, startAngle, endAngle) {
	try {
		const backgroundPath = document.querySelector(`.${backgroundPathClass}`);
		if (!backgroundPath) {
			console.error(`Background path element with class ${backgroundPathClass} not found`);
			return;
		}

		let arcPath;

		// Special case for secondary temperature gauge background
		if (backgroundPathClass === 'secondary-temp-background') {
			const startRad = startAngle * (Math.PI / 180);
			const endRad = endAngle * (Math.PI / 180);

			const startX = centerX + radius * Math.cos(startRad);
			const startY = centerY + radius * Math.sin(startRad);
			const endX = centerX + radius * Math.cos(endRad);
			const endY = centerY + radius * Math.sin(endRad);

			let sweepAngle = startAngle - endAngle;
			if (sweepAngle < 0) {
				sweepAngle += 360;
			}

			const largeArcFlag = sweepAngle > 180 ? 1 : 0;

			arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${endX} ${endY}`;
		} else {
			arcPath = createArcPath(centerX, centerY, radius, startAngle, endAngle);
		}

		backgroundPath.setAttribute('d', arcPath);

		const svgSize = radius * 2;
		backgroundPath.setAttribute('width', svgSize);
		backgroundPath.setAttribute('height', svgSize);

		backgroundPath.setAttribute('x', centerX - radius);
		backgroundPath.setAttribute('y', centerY - radius);
	} catch (error) {
		console.error(`Error initializing gauge path for ${backgroundPathClass}:`, error);
	}
}

/**
 * Initialize all SVG paths for gauges
 */
export function initSVGPaths() {
	try {
		const centerX = config.gaugeDimensions.centerX;
		const centerY = config.gaugeDimensions.centerY;

		// Initialize main temperature gauge background
		initGaugePath(
			'gauge-background',
			centerX,
			centerY,
			config.gaugeDimensions.mainRadius,
			config.gauges.temperature.startAngle,
			config.gauges.temperature.endAngle
		);

		// Initialize secondary temperature gauge background
		initGaugePath(
			'secondary-temp-background',
			centerX,
			centerY,
			config.gaugeDimensions.secondaryRadius,
			config.gauges.temperatureSecondary.startAngle,
			config.gauges.temperatureSecondary.endAngle
		);

		// Initialize humidity gauge background
		initGaugePath(
			'humidity-background',
			centerX,
			centerY,
			config.gaugeDimensions.humidityRadius,
			config.gauges.humidity.startAngle,
			config.gauges.humidity.endAngle
		);

		// Initialize pressure gauge background
		initGaugePath(
			'pressure-background',
			centerX,
			centerY,
			config.gaugeDimensions.pressureRadius,
			config.gauges.pressure.startAngle,
			config.gauges.pressure.endAngle
		);

		// Initialize rainfall gauge background
		initGaugePath(
			'rainfall-background',
			centerX,
			centerY,
			config.gaugeDimensions.rainfallRadius,
			config.gauges.rainfall.startAngle,
			config.gauges.rainfall.endAngle
		);

		// Initialize rainfall gauge arc
		initGaugePath(
			'rainfall-arc',
			centerX,
			centerY,
			config.gaugeDimensions.rainfallRadius,
			config.gauges.rainfall.startAngle,
			config.gauges.rainfall.endAngle
		);
	} catch (error) {
		console.error('Error initializing SVG paths:', error);
	}
}

/**
 * Calculate the angle for a given value within a range
 * @param {number} value - The value to convert to an angle
 * @param {number} min - Minimum value in the range
 * @param {number} max - Maximum value in the range
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 * @returns {number} The calculated angle in degrees
 */
export function calculateAngle(value, min, max, startAngle, endAngle) {
	const normalizedValue = (value - min) / (max - min);
	const angleRange = endAngle - startAngle;
	return startAngle + (normalizedValue * angleRange);
}
