// Humidity gauge implementation
import { config } from '../config.js';
import { createGradientStops, createArcPath, calculateAngle } from '../gauge-utils.js';

// Humidity gauge configuration
const humidityConfig = {
    minHumidity: config.gauges.humidity.min,
    maxHumidity: config.gauges.humidity.max,
    startAngle: config.gauges.humidity.startAngle,
    endAngle: config.gauges.humidity.endAngle,
    arcRadius: config.gaugeDimensions.humidityRadius,
    colorStops: config.gauges.humidity.colorStops
};

/**
 * Create the humidity gradient for the inner arc
 */
export function createHumidityGradient() {
    try {
        console.log('Creating humidity gradient...');

        // Get the gradient element
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

        console.log('Humidity gradient created successfully');
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
            console.log('Creating humidity scale markers...');
            let retryCount = 0;
            const maxRetries = 10;

            // Function to attempt to create markers
            const attemptCreate = () => {
                // Try to get the markers element
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

                // Clear any existing markers
                while (markers.firstChild) {
                    markers.removeChild(markers.firstChild);
                }

                // Create markers for humidity scale
                const step = 10; // Show every 10% humidity
                for (let humidity = humidityConfig.minHumidity; humidity <= humidityConfig.maxHumidity; humidity += step) {
                    // Calculate angle based on humidity
                    const angle = calculateAngle(
                        humidity,
                        humidityConfig.minHumidity,
                        humidityConfig.maxHumidity,
                        humidityConfig.startAngle,
                        humidityConfig.endAngle
                    );
                    const radians = angle * (Math.PI / 180);

                    // Calculate position for text label and scale line
                    const textRadius = config.gaugeDimensions.humidityRadius;
                    const innerRadius = config.gaugeDimensions.humidityRadius - 8; // Inner point for scale line
                    const outerRadius = config.gaugeDimensions.humidityRadius + 8; // Outer point for scale line

                    // Calculate positions
                    const textX = config.gaugeDimensions.centerX + Math.cos(radians) * textRadius;
                    const textY = config.gaugeDimensions.centerY + Math.sin(radians) * textRadius;
                    const innerX = config.gaugeDimensions.centerX + Math.cos(radians) * innerRadius;
                    const innerY = config.gaugeDimensions.centerY + Math.sin(radians) * innerRadius;
                    const outerX = config.gaugeDimensions.centerX + Math.cos(radians) * outerRadius;
                    const outerY = config.gaugeDimensions.centerY + Math.sin(radians) * outerRadius;

                    // Create a group for the marker
                    const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

                    // Create scale line (for all humidity values)
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', innerX);
                    line.setAttribute('y1', innerY);
                    line.setAttribute('x2', outerX);
                    line.setAttribute('y2', outerY);
                    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
                    line.setAttribute('stroke-width', humidity % 50 === 0 ? '1.5' : '0.5'); // Thicker lines for major ticks

                    // Add line to markers container
                    markers.appendChild(line);

                    // Create text label
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', 0);
                    text.setAttribute('y', 1);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('dominant-baseline', 'middle');
                    text.setAttribute('fill', '#fff');
                    text.setAttribute('font-size', '0.6rem');

                    // Only show certain humidity values to avoid crowding
                    // Show every 20% but NOT the min/max values
                    const shouldShow = humidity % 20 === 0 &&
                                       humidity !== humidityConfig.minHumidity &&
                                       humidity !== humidityConfig.maxHumidity;

                    if (shouldShow) {
                        text.setAttribute('opacity', '1');
                        // Set the text content - just the humidity value
                        text.textContent = `${humidity}%`;

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

                console.log('Humidity scale markers created successfully');
                resolve(true);
            };

            // Start the creation process
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
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function updateHumidityGauge(humidity) {
    return new Promise((resolve) => {
        try {
            console.log(`Updating humidity gauge to ${humidity}%`);

            // Verify document ready state
            console.log(`Document ready state: ${document.readyState}`);

            // Get the gauge path element
            const gaugePath = document.getElementById('humidity-arc');
            const valueDisplay = document.getElementById('humidity-value');

            if (!gaugePath) {
                console.error('Humidity gauge arc element not found');
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
                console.warn('Humidity value display element not found');
                // Continue with gauge update even if value display is missing
            }

            // Ensure humidity is within range
            humidity = Math.max(humidityConfig.minHumidity, Math.min(humidity, humidityConfig.maxHumidity));

            // Calculate the angle for the current humidity using the shared utility function
            const angle = calculateAngle(
                humidity,
                humidityConfig.minHumidity,
                humidityConfig.maxHumidity,
                humidityConfig.startAngle,
                humidityConfig.endAngle
            );

            // Get center coordinates and radius
            const centerX = config.gaugeDimensions.centerX;
            const centerY = config.gaugeDimensions.centerY;
            const radius = humidityConfig.arcRadius;

            // For humidity gauge, we want it at the top (180° to 360°/0°)
            // Calculate start point (always at startAngle, which is 180 degrees or left side)
            const startRad = humidityConfig.startAngle * (Math.PI / 180);
            const startX = centerX + radius * Math.cos(startRad);
            const startY = centerY + radius * Math.sin(startRad);

            // Calculate end point based on the current humidity (moving from left toward right)
            const endRad = angle * (Math.PI / 180);
            const endX = centerX + radius * Math.cos(endRad);
            const endY = centerY + radius * Math.sin(endRad);

            // Determine if we need to use the large arc flag
            const largeArcFlag = Math.abs(angle - humidityConfig.startAngle) > 180 ? 1 : 0;

            // Create the SVG arc path
            const sweepFlag = 1; // 0 for clockwise, 1 for counterclockwise - use 1 to draw in the correct direction
            const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;

            // Update the path
            gaugePath.setAttribute('d', arcPath);

            // Update the value display if it exists
            if (valueDisplay) {
                valueDisplay.textContent = humidity.toFixed(0);

                // Update the humidity icon color to match the current humidity value
                const humidityIcon = document.querySelector('.humidity-display i.wi-humidity');
                if (humidityIcon) {
                    // Calculate color based on humidity value
                    const colorStops = humidityConfig.colorStops;
                    let iconColor = '#FF00FF'; // Default white

                    // Find the nearest color stop based on humidity value
                    let closestStop = null;
                    let minDistance = Number.MAX_VALUE;

                    // Find the closest color stop to the current humidity value
                    for (let i = 0; i < colorStops.length; i++) {
                        const stop = colorStops[i];
                        const distance = Math.abs(humidity - stop.humidity);

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
                    humidityIcon.style.color = iconColor;
                }
            }

            console.log('Humidity gauge updated successfully');
            resolve(true);
        } catch (error) {
            console.error('Error updating humidity gauge:', error);
            resolve(false);
        }
    });
}

// Test function removed - consolidated in test-gauges.js
