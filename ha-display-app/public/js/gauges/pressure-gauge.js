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

                // Use the shared createScaleMarkers utility function
                // Use the enhanced createScaleMarkers utility function with custom filter
                const result = createScaleMarkers(
                    'pressure-markers',
                    config.gaugeDimensions.centerX,
                    config.gaugeDimensions.centerY,
                    pressureConfig.arcRadius - 0.5,
                    pressureConfig.minPressure,
                    pressureConfig.maxPressure,
                    10, // Step size of 10 hPa
                    pressureConfig.startAngle,
                    pressureConfig.endAngle,
                    '', // No unit suffix
                    {
                        hideMinMax: true,
                        fontSize: '0.6rem',
                        // Only show values divisible by 20 (but not min/max)
                        // filterValue: (value, min, max) => {
                        //     return value % 20 === 0 && value !== min && value !== max;
                        // }
                    }
                );

                if (!result) {
                    console.error('Failed to create pressure markers');
                    resolve(false);
                    return;
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
 * @param {boolean} initializing - Whether this is the initial update (to use minimal values)
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function updatePressureGauge(pressure, initializing = false) {
    return new Promise((resolve) => {
        try {
            console.log(`Updating pressure gauge to ${pressure} hPa${initializing ? ' (initializing)' : ''}`);

            // Verify document ready state
            console.log(`Document ready state: ${document.readyState}`);

            // Get the gauge path element
            const gaugePath = document.getElementById('pressure-arc');
            const valueDisplay = document.getElementById('pressure-value');

            // If initializing, use the minimum pressure value to prevent flash of color
            const displayPressure = initializing ? pressureConfig.minPressure : pressure;

            if (!gaugePath) {
                console.error('Pressure gauge arc element not found');
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
                console.warn('Pressure value display element not found');
                // Continue with gauge update even if value display is missing
            }

            // Ensure pressure is within range
            const safePressure = Math.max(pressureConfig.minPressure, Math.min(displayPressure, pressureConfig.maxPressure));

            // Calculate the angle for the current pressure using the shared utility function
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

            // For pressure gauge, we want it at the top (180° to 360°/0°)
            // Use the shared createArcPath utility function to generate the path
            const arcPath = createArcPath(
                centerX,
                centerY,
                radius,
                pressureConfig.startAngle,
                angle,
                false // Don't include center point
            );

            // Update the path
            gaugePath.setAttribute('d', arcPath);

            // Update the value display if it exists
            if (valueDisplay) {
                valueDisplay.textContent = initializing ? '----' : pressure.toFixed(0);

                // Update the pressure icon color to match the current pressure value
                const pressureIcon = document.getElementById('pressure-icon');
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
