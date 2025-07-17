// Pressure gauge implementation
import { config } from '../config.js';
import { createGradientStops, createArcPath, calculateAngle } from '../gauge-utils.js';

// Pressure gauge configuration
const pressureConfig = {
    minPressure: config.gauges.pressure.min,
    maxPressure: config.gauges.pressure.max,
    startAngle: config.gauges.pressure.startAngle,
    endAngle: config.gauges.pressure.endAngle,
    arcRadius: config.gaugeDimensions.pressureRadius,
    colorStops: config.gauges.pressure.colorStops
};

/**
 * Create the pressure gradient for the innermost arc
 */
export function createPressureGradient() {
    try {
        console.log('Creating pressure gradient...');
        
        // Get the gradient element
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
        
        console.log('Pressure gradient created successfully');
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
            console.log('Creating pressure scale markers with improved formatting...');
            let retryCount = 0;
            const maxRetries = 10;
            
            // Function to attempt to create markers
            const attemptCreate = () => {
                // Try to get the markers element
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
                
                // Clear any existing markers
                while (markers.firstChild) {
                    markers.removeChild(markers.firstChild);
                }
                
                
                // Create markers with increased granularity (10 hPa intervals)
                const step = 10; // 10 hPa intervals for better granularity
                for (let pressure = pressureConfig.minPressure; pressure <= pressureConfig.maxPressure; pressure += step) {
                    // Calculate angle based on pressure
                    const angle = calculateAngle(
                        pressure,
                        pressureConfig.minPressure,
                        pressureConfig.maxPressure,
                        pressureConfig.startAngle,
                        pressureConfig.endAngle
                    );
                    const radians = angle * (Math.PI / 180);
                    
                    // Calculate position for text label and scale line
                    const textRadius = config.gaugeDimensions.pressureRadius;
                    const innerRadius = config.gaugeDimensions.pressureRadius - 8; // Inner point for scale line
                    const outerRadius = config.gaugeDimensions.pressureRadius + 8; // Outer point for scale line
                    
                    // Calculate positions
                    const textX = config.gaugeDimensions.centerX + Math.cos(radians) * textRadius;
                    const textY = config.gaugeDimensions.centerY + Math.sin(radians) * textRadius;
                    const innerX = config.gaugeDimensions.centerX + Math.cos(radians) * innerRadius;
                    const innerY = config.gaugeDimensions.centerY + Math.sin(radians) * innerRadius;
                    const outerX = config.gaugeDimensions.centerX + Math.cos(radians) * outerRadius;
                    const outerY = config.gaugeDimensions.centerY + Math.sin(radians) * outerRadius;
                    
                    // Create a group for the marker
                    const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    
                    // Create scale line (for all pressure values)
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', innerX);
                    line.setAttribute('y1', innerY);
                    line.setAttribute('x2', outerX);
                    line.setAttribute('y2', outerY);
                    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
                    line.setAttribute('stroke-width', pressure % 50 === 0 ? '1.5' : '0.5'); // Thicker lines for major ticks
                    
                    // Add line to markers container
                    markers.appendChild(line);
                    
                    // Create text label
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', 0);
                    text.setAttribute('y', 1);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('dominant-baseline', 'middle');
                    text.setAttribute('fill', '#fff');
                    text.setAttribute('font-size', '0.6rem'); // Now works since CSS default is removed
                    
                    // Show every 10 hPa but NOT the min/max values
                    const shouldShow = pressure % 10 === 0 && 
                                       pressure !== pressureConfig.minPressure && 
                                       pressure !== pressureConfig.maxPressure;
                    
                    if (shouldShow) {
                        text.setAttribute('opacity', '1');
                        // Set the text content - just the pressure value
                        text.textContent = `${pressure}`;
                        
                        // Add text shadow for better readability against gradient
                        text.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.8); font-size: 0.6rem;');
                        
                        // Add text to group
                        markerGroup.appendChild(text);
                        
                        // Position and rotate the group with 90° rotation for text
                        // This makes the text perpendicular to the radius
                        const textAngle = angle + 90; // Rotate text by 90°
                        markerGroup.setAttribute('transform', `translate(${textX}, ${textY}) rotate(${textAngle})`);
                        
                        // Add the marker group to the markers container
                        markers.appendChild(markerGroup);
                    }
                }
                
                console.log('Pressure scale markers created successfully');
                resolve(true);
            };
            
            // Start the attempt process
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
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function updatePressureGauge(pressure) {
    return new Promise((resolve) => {
        try {
            console.log(`Updating pressure gauge to ${pressure} hPa`);
            
            // Verify document ready state
            console.log(`Document ready state: ${document.readyState}`);
            
            // Get the gauge path element
            const gaugePath = document.getElementById('pressure-arc');
            const valueDisplay = document.getElementById('pressure-value');
            
            if (!gaugePath) {
                console.error('Pressure gauge arc element not found');
                // Check if SVG exists
                const svg = document.querySelector('.gauge-svg');
                if (!svg) {
                    console.error('SVG container not found!');
                } else {
                    console.log('SVG container found');
                    // Log all elements with IDs in the SVG
                    const svgElementsWithId = svg.querySelectorAll('[id]');
                    console.log(`Found ${svgElementsWithId.length} SVG elements with IDs:`);
                    svgElementsWithId.forEach(el => {
                        console.log(`- ${el.id || 'no-id'} (${el.tagName})`);
                    });
                }
                resolve(false);
                return;
            }
            
            if (!valueDisplay) {
                console.warn('Pressure value display element not found');
                // Continue with gauge update even if value display is missing
            }
            
            // Ensure pressure is within range
            pressure = Math.max(pressureConfig.minPressure, Math.min(pressure, pressureConfig.maxPressure));
            
            // Calculate the angle for the current pressure using the shared utility function
            const angle = calculateAngle(
                pressure,
                pressureConfig.minPressure,
                pressureConfig.maxPressure,
                pressureConfig.startAngle,
                pressureConfig.endAngle
            );
            
            // Get center coordinates and radius
            const centerX = config.gaugeDimensions.centerX;
            const centerY = config.gaugeDimensions.centerY;
            const radius = pressureConfig.arcRadius;
            
            // For pressure gauge, we want it at the top (180° to 360°/0°)
            // Calculate start point (always at startAngle, which is 180 degrees or left side)
            const startRad = pressureConfig.startAngle * (Math.PI / 180);
            const startX = centerX + radius * Math.cos(startRad);
            const startY = centerY + radius * Math.sin(startRad);
            
            // Calculate end point based on the current pressure (moving from left toward right)
            const endRad = angle * (Math.PI / 180);
            const endX = centerX + radius * Math.cos(endRad);
            const endY = centerY + radius * Math.sin(endRad);
            
            // Determine if we need to use the large arc flag
            const largeArcFlag = Math.abs(angle - pressureConfig.startAngle) > 180 ? 1 : 0;
            
            // Create the SVG arc path
            const sweepFlag = 1; // 0 for clockwise, 1 for counterclockwise - use 1 to draw in the correct direction
            const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
            
            // Update the path
            gaugePath.setAttribute('d', arcPath);
            
            // Update the value display if it exists
            if (valueDisplay) {
                valueDisplay.textContent = pressure.toFixed(0);
                
                // Update the pressure icon color to match the current pressure value
                const pressureIcon = document.querySelector('.pressure-display i.wi-barometer');
                if (pressureIcon) {
                    // Calculate color based on pressure value
                    const colorStops = pressureConfig.colorStops;
                    let iconColor = '#FFFFFF'; // Default white
                    
                    // Find the nearest color stop based on pressure value
                    let closestStop = null;
                    let minDistance = Number.MAX_VALUE;
                    
                    // Find the closest color stop to the current pressure value
                    for (let i = 0; i < colorStops.length; i++) {
                        const stop = colorStops[i];
                        const distance = Math.abs(pressure - stop.pressure);
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestStop = stop;
                        }
                    }
                    
                    // Use the color from the closest stop
                    if (closestStop) {
                        iconColor = closestStop.color;
                    }
                    
                    // Apply the color to the icon
                    pressureIcon.style.color = iconColor;
                }
            }
            
            console.log('Pressure gauge updated successfully');
            resolve(true);
        } catch (error) {
            console.error('Error updating pressure gauge:', error);
            resolve(false);
        }
    });
}

// Test function removed - consolidated in test-gauges.js
