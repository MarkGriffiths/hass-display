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

                // Use the shared createScaleMarkers utility function
                // Use the enhanced createScaleMarkers utility function
                const result = createScaleMarkers(
                    'humidity-markers',
                    config.gaugeDimensions.centerX,
                    config.gaugeDimensions.centerY,
                    humidityConfig.arcRadius - 1,
                    humidityConfig.minHumidity,
                    humidityConfig.maxHumidity,
                    10, // Step size of 10%
                    humidityConfig.startAngle,
                    humidityConfig.endAngle,
                    '%', // Humidity unit
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
export function updateHumidityGauge(humidity, initializing = false) {
    return new Promise((resolve) => {
        try {
            console.log(`Updating humidity gauge to ${humidity}%${initializing ? ' (initializing)' : ''}`);

            // Verify document ready state
            console.log(`Document ready state: ${document.readyState}`);

            // Get the gauge path element
            const gaugePath = document.getElementById('humidity-arc');
            const valueDisplay = document.getElementById('humidity-value');

            // If initializing, use the minimum humidity value to prevent flash of color
            const displayHumidity = initializing ? humidityConfig.minHumidity : humidity;

            if (!gaugePath) {
                console.error('Humidity gauge arc element not found');
                // Check if SVG exists
                const svg = document.getElementById('gauge-svg');
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
            const safeHumidity = Math.max(humidityConfig.minHumidity, Math.min(displayHumidity, humidityConfig.maxHumidity));

            // Calculate the angle for the current humidity using the shared utility function
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

            // For humidity gauge, we want it at the top (180° to 360°/0°)
            // Use the shared createArcPath utility function to generate the path
            const arcPath = createArcPath(
                centerX,
                centerY,
                radius,
                humidityConfig.startAngle,
                angle,
                false // Don't include center point
            );

            // Update the path
            gaugePath.setAttribute('d', arcPath);

            // Update the value display if it exists
            if (valueDisplay) {
                valueDisplay.textContent = initializing ? '--' : Math.round(humidity);

                // Update the humidity icon color to match the current humidity value
                const humidityIcon = document.getElementById('humidity-icon');
                if (humidityIcon) {
                    // Calculate color based on humidity value (use actual humidity, not displayHumidity)
                    const colorStops = humidityConfig.colorStops;
                    let iconColor = '#FFFFFF'; // Default white

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
