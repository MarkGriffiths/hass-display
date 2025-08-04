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

/**
 * Create the temperature gradient for the arc
 */
export function createTemperatureGradient() {
    try {
        console.log('Creating temperature gradient...');

        // Get the gradient element
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

        console.log('Temperature gradient created successfully');
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
            console.log('Creating temperature scale markers...');
            let retryCount = 0;
            const maxRetries = 15; // Increased max retries

            // Function to attempt to create markers
            const attemptCreate = () => {
                // Verify document ready state
                console.log(`Document ready state: ${document.readyState}`);

                // Try to get the markers element
                const markers = document.getElementById('temperature-markers');
                if (!markers) {
                    retryCount++;
                    console.error(`Temperature markers element not found (attempt ${retryCount}/${maxRetries})`);

                    // Check if SVG exists
                    const svg = document.getElementById('gauge-svg');
                    if (!svg) {
                        console.error('SVG container not found!');
                    } else {
                        console.log('SVG container found');
                    }

                    // Try to find any gauge markers
                    const allMarkers = document.querySelectorAll('.gauge-markers');
                    console.log(`Found ${allMarkers.length} elements with class 'gauge-markers':`);
                    allMarkers.forEach(el => {
                        console.log(`- ${el.id || 'no-id'} (${el.tagName})`);
                    });

                    // If we haven't exceeded max retries, try again
                    if (retryCount < maxRetries) {
                        // Increase delay with each retry
                        const delay = 200 * retryCount;
                        console.log(`Retrying in ${delay}ms...`);
                        setTimeout(attemptCreate, delay);
                        return;
                    }

                    console.error('Maximum retries reached. Could not find temperature markers element.');
                    resolve(false);
                    return;
                }

                // Use the enhanced createScaleMarkers utility function
                const result = createScaleMarkers(
                    'temperature-markers',
                    config.gaugeDimensions.centerX,
                    config.gaugeDimensions.centerY,
                    config.gaugeDimensions.mainRadius - 3,
                    tempConfig.minTemp,
                    tempConfig.maxTemp,
                    5, // Step size of 5 degrees
                    tempConfig.startAngle,
                    tempConfig.endAngle,
                    '°', // Temperature unit
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

                console.log('Temperature markers created successfully');
                resolve(true);
            };

            // Start the attempt process
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
        console.log(`Updating temperature gauge to ${temperature}°C${initializing ? ' (initializing)' : ''}`);

        // Get the gauge path element
        const gaugePath = document.getElementById('temperature-arc');
        const valueDisplay = document.getElementById('temperature-value');

        if (!gaugePath || !valueDisplay) {
            console.error('Temperature gauge elements not found');
            return;
        }

        // If initializing, use the minimum temperature value to prevent flash of color
        const displayTemp = initializing ? tempConfig.minTemp : temperature;

        // Ensure temperature is within range
        const safeTemp = Math.max(tempConfig.minTemp, Math.min(displayTemp, tempConfig.maxTemp));

        // Calculate the angle for the current temperature using the config values
        // This will map the temperature to an angle between startAngle and endAngle
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

        // For temperature gauge, we want it at the top (180° to 360°/0°)
        // Use the shared createArcPath utility function to generate the path
        const arcPath = createArcPath(
            centerX,
            centerY,
            radius,
            tempConfig.startAngle,
            angle,
            false // Don't include center point
        );

        // Update the path
        gaugePath.setAttribute('d', arcPath);

        // Update the value display - show actual temperature even during initialization
        valueDisplay.textContent = initializing ? '--.-' : temperature.toFixed(1);

        console.log('Temperature gauge updated successfully');
    } catch (error) {
        console.error('Error updating temperature gauge:', error);
    }
}

// Test function removed - consolidated in test-gauges.js
