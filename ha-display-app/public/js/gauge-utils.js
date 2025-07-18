// Shared utility functions for gauge components
import { config } from './config.js';

/**
 * Creates an SVG path for an arc
 * @param {number} centerX - X coordinate of the center
 * @param {number} centerY - Y coordinate of the center
 * @param {number} radius - Radius of the arc
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 * @param {boolean} includeCenter - Whether to include the center point in the path
 * @returns {string} SVG path string
 */
export function createArcPath(centerX, centerY, radius, startAngle, endAngle, includeCenter = false) {
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
    
    // Determine if we need to use the large arc flag
    const largeArcFlag = sweepAngle > 180 ? 1 : 0;
    
    // Create the arc path - use sweep flag 1 for counterclockwise direction to match gauge arcs
    let path = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    
    // If includeCenter is true, add a line to the center and back to the start point
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
        console.log(`Creating gradient stops for ${gradientId}`);
        
        // Calculate the total range
        const valueRange = max - min;
        
        // Create normalized gradient stops
        const stops = colorStops.map(stop => {
            // If the stop has a temperature/value property, normalize it
            let offset;
            if (stop.temp !== undefined) {
                offset = ((stop.temp - min) / valueRange).toFixed(2);
            } else if (stop.humidity !== undefined) {
                offset = ((stop.humidity - min) / valueRange).toFixed(2);
            } else if (stop.pressure !== undefined) {
                offset = ((stop.pressure - min) / valueRange).toFixed(2);
            } else {
                // If no specific property is found, use the provided offset
                offset = stop.offset;
            }
            
            return {
                offset,
                color: stop.color
            };
        });
        
        console.log(`Created ${stops.length} gradient stops for ${gradientId}`);
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
 */
export function createScaleMarkers(markersElementId, centerX, centerY, radius, min, max, step, startAngle, endAngle, unit = '') {
    try {
        const markers = document.getElementById(markersElementId);
        if (!markers) {
            return;
        }
        
        // Clear any existing markers - more efficient approach
        markers.innerHTML = '';
        
        // Calculate angle per unit
        const valueRange = max - min;
        const angleRange = Math.abs(endAngle - startAngle);
        const degreesPerUnit = angleRange / valueRange;
        
        // Create a document fragment to batch DOM operations
        const fragment = document.createDocumentFragment();
        
        // Create markers at specified step intervals
        for (let value = min; value <= max; value += step) {
            // Calculate angle based on value
            const angle = startAngle - ((value - min) * degreesPerUnit);
            const radians = angle * (Math.PI / 180);
            
            // Calculate position for text label
            const textX = centerX + Math.cos(radians) * radius;
            const textY = centerY + Math.sin(radians) * radius;
            
            // Create a group for the marker
            const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Create text label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', 0);
            text.setAttribute('y', 0);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', '#fff');
            text.setAttribute('font-size', '14');
            text.setAttribute('font-weight', 'bold');
            
            // Only show values between min and max (not at the extremes)
            text.textContent = (value === min || value === max) ? '' : `${value}${unit}`;
            
            markerGroup.appendChild(text);
            
            // Rotate text to be readable
            let textAngle = angle + 90;
            if (textAngle > 90 && textAngle < 270) {
                textAngle += 180;
            }
            
            // Set transform in one operation
            markerGroup.setAttribute('transform', `translate(${textX}, ${textY}) rotate(${textAngle})`);
            
            fragment.appendChild(markerGroup);
        }
        
        // Add all markers to the DOM in one operation
        markers.appendChild(fragment);
    } catch (error) {
        console.error(`Error creating scale markers for ${markersElementId}:`, error);
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
        // Find the background path element
        const backgroundPath = document.querySelector(`.${backgroundPathClass}`);
        if (!backgroundPath) {
            console.error(`Background path element with class ${backgroundPathClass} not found`);
            return;
        }
        
        let arcPath;
        
        // Special case for secondary temperature gauge background
        // It needs to draw anticlockwise from 160° to 20° through the 90° point at the bottom
        if (backgroundPathClass === 'secondary-temp-background') {
            // Convert angles from degrees to radians
            const startRad = startAngle * (Math.PI / 180);
            const endRad = endAngle * (Math.PI / 180);
            
            // Calculate start and end points
            const startX = centerX + radius * Math.cos(startRad);
            const startY = centerY + radius * Math.sin(startRad);
            const endX = centerX + radius * Math.cos(endRad);
            const endY = centerY + radius * Math.sin(endRad);
            
            // Calculate sweep angle (from 160° to 20° going anticlockwise)
            // Since we're going anticlockwise from 160° to 20°, we need to calculate the sweep angle correctly
            let sweepAngle = startAngle - endAngle;
            if (sweepAngle < 0) {
                sweepAngle += 360;
            }
            
            // Determine if we need to use the large arc flag
            const largeArcFlag = sweepAngle > 180 ? 1 : 0;
            
            // For secondary temp gauge, we need to use sweep flag = 0 for anticlockwise direction
            arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${endX} ${endY}`;
        } else {
            // For all other gauges, use the standard createArcPath function
            arcPath = createArcPath(centerX, centerY, radius, startAngle, endAngle);
        }
        
        // Set the path
        backgroundPath.setAttribute('d', arcPath);
    } catch (error) {
        console.error(`Error initializing gauge path for ${backgroundPathClass}:`, error);
    }
}

/**
 * Initialize all SVG paths for gauges
 */
export function initSVGPaths() {
    try {
        console.log('Initializing SVG paths...');
        
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
        // Secondary temp gauge goes from 160° (bottom-right) to 20° (bottom-left)
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
    // Normalize the value within the range
    const normalizedValue = (value - min) / (max - min);
    
    // Calculate the angle based on the normalized value
    const angleRange = endAngle - startAngle;
    return startAngle + (normalizedValue * angleRange);
}
