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

/**
 * Create the secondary temperature gradient for the bottom arc
 */
export function createSecondaryTemperatureGradient() {
    try {
        console.log('Creating secondary temperature gradient...');

        // Get the gradient element
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

            console.log(`Secondary temperature gradient stop: offset=${stop.offset}, color=${stop.color}`);
        });

        console.log('Secondary temperature gradient created successfully');
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
            console.log('Creating secondary temperature scale markers...');
            let retryCount = 0;
            const maxRetries = 15; // Increased max retries

            // Function to attempt to create markers
            const attemptCreate = () => {
                // Verify document ready state
                console.log(`Document ready state: ${document.readyState}`);

                // Try to get the markers element
                const markers = document.getElementById('secondary-temp-markers');
                if (!markers) {
                    retryCount++;
                    console.error(`Secondary temperature markers element not found (attempt ${retryCount}/${maxRetries})`);

                    // Check if SVG exists
                    const svg = document.querySelector('.gauge-svg');
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

                    console.error('Maximum retries reached. Could not find secondary temperature markers element.');
                    resolve(false);
                    return;
                }

                // Use the enhanced createScaleMarkers utility function
                const result = createScaleMarkers(
                    'secondary-temp-markers',
                    config.gaugeDimensions.centerX,
                    config.gaugeDimensions.centerY,
                    secondaryTempConfig.arcRadius + 1,
                    secondaryTempConfig.min,
                    secondaryTempConfig.max,
                    5, // Step size of 5 degrees
                    secondaryTempConfig.startAngle,
                    secondaryTempConfig.endAngle,
                    '°', // Temperature unit
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

                console.log('Secondary temperature scale markers created successfully');
                resolve(true);
            };

            // Start the attempt process
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
        console.log(`Updating secondary temperature gauge to ${temperature}°C${initializing ? ' (initializing)' : ''}`);

        // Get the gauge path element
        const gaugePath = document.getElementById('secondary-temp-arc');
        const valueDisplay = document.getElementById('secondary-temp-value');

        if (!gaugePath || !valueDisplay) {
            console.error('Secondary temperature gauge elements not found');
            return;
        }

        // If initializing, use the minimum temperature value to prevent flash of color
        const displayTemp = initializing ? secondaryTempConfig.min : temperature;

        // Ensure temperature is within range
        const safeTemp = Math.max(secondaryTempConfig.min, Math.min(displayTemp, secondaryTempConfig.max));

        // Calculate the angle for the current temperature using the config values
        // This will map the temperature to an angle between startAngle and endAngle
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

        // For secondary temperature gauge, we want it at the bottom (160° to 20°)
        // Use the shared createArcPath utility function to generate the path
        // For secondary temperature gauge, we need to use clockwise=true for the correct direction
        const arcPath = createArcPath(
            centerX,
            centerY,
            radius,
            secondaryTempConfig.startAngle,
            angle,
            false, // Don't include center point
            true   // Use clockwise direction
        );

        // Update the path
        gaugePath.setAttribute('d', arcPath);

        // Update the value display - show actual temperature even during initialization
        valueDisplay.textContent = initializing ? '--.-' : temperature.toFixed(1);

        console.log('Secondary temperature gauge updated successfully');
    } catch (error) {
        console.error('Error updating secondary temperature gauge:', error);
    }
}

// Test function removed - consolidated in test-gauges.js
