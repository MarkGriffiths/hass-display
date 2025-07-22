// Gauge initializer module
// Handles initialization of all gauge components

import { config } from '../config.js';
import { initGaugePath, initBackgroundArc, initSVGPaths } from './gauge-utils.js';

// Import individual gauge functions
import { createTemperatureGradient, createTemperatureMarkers, updateTemperatureGauge } from './temperature-gauge.js';
import { createSecondaryTemperatureGradient, createSecondaryTemperatureMarkers, updateSecondaryTemperatureGauge } from './secondary-temperature-gauge.js';
import { createHumidityGradient, createHumidityMarkers, updateHumidityGauge } from './humidity-gauge.js';
import { createPressureGradient, createPressureScaleMarkers, updatePressureGauge } from './pressure-gauge.js';
import { createRainfallGradient, createRainfallMarkers, updateRainfallGauge } from './rainfall-gauge.js';

/**
 * Check if all required DOM elements are available
 * @returns {boolean} True if all elements are available, false otherwise
 */
function checkDOMElementsReady() {
    const requiredElements = [
        'temperature-markers',
        'secondary-temp-markers',
        'humidity-markers',
        'pressure-markers',
        'rainfall-markers',
        'temperature-arc',
        'secondary-temp-arc',
        'humidity-arc',
        'pressure-arc',
        'rainfall-arc'
    ];

    let allElementsReady = true;
    const missingElements = [];

    for (const elementId of requiredElements) {
        const element = document.getElementById(elementId);
        if (!element) {
            missingElements.push(elementId);
            allElementsReady = false;
        }
    }

    if (!allElementsReady) {
        console.log(`Missing DOM elements: ${missingElements.join(', ')}`);
    }

    return allElementsReady;
}

/**
 * Wait for DOM elements to be available - optimized version
 * @param {string[]} elementIds - Array of element IDs to wait for
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} interval - Interval between attempts in ms
 * @returns {Promise<boolean>} - Promise that resolves to true if all elements are found
 */
async function waitForDOMElements(elementIds, maxAttempts = 2, interval = 50) {
    return new Promise((resolve) => {
        let attempts = 0;

        function checkElements() {
            attempts++;

            // Use filter for a single pass through the array
            const missing = elementIds.filter(id => !document.getElementById(id));

            if (missing.length === 0) {
                resolve(true);
                return;
            }

            // If we've reached max attempts, resolve with false
            if (attempts >= maxAttempts) {
                console.error(`Failed to find DOM elements after ${maxAttempts} attempts`);
                resolve(false);
                return;
            }

            // Try again after interval - use shorter interval for faster startup
            setTimeout(checkElements, interval);
        }

        // Start checking immediately
        checkElements();
    });
}

/**
 * Ensure the DOM is fully loaded and ready - optimized version
 * @returns {Promise<void>} Promise that resolves when DOM is ready
 */
async function ensureDOMReady() {
    return new Promise(resolve => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // Resolve immediately if DOM is already ready
            resolve();
        } else {
            // Use a single event listener with { once: true } for automatic cleanup
            document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
        }
    });
}

/**
 * Initialize all gauge paths, gradients, and markers
 * @returns {Promise<boolean>} Promise that resolves to true if all gauges initialized successfully, false otherwise
 */
export async function initGauges() {
    try {
        // Ensure DOM is fully loaded - this is a fast check
        await ensureDOMReady();

        // Wait for all required DOM elements to be available
        // Using optimized parameters (fewer attempts, shorter interval)
        const requiredElements = [
            'temperature-markers',
            'secondary-temp-markers',
            'humidity-markers',
            'pressure-markers',
            'rainfall-markers',
            'temperature-arc',
            'secondary-temp-arc',
            'humidity-arc',
            'pressure-arc',
            'rainfall-arc'
        ];

        const elementsReady = await waitForDOMElements(requiredElements, 2, 50);

        if (!elementsReady) {
            console.error('Failed to find required DOM elements');
            return false;
        }

        // Initialize SVG paths
        initSVGPaths();

        // Create gradients
        createTemperatureGradient();
        createSecondaryTemperatureGradient();
        createHumidityGradient();
        createPressureGradient();
        createRainfallGradient();

        // Create scale markers
        const tempMarkersResult = await createTemperatureMarkers();

        const secondaryTempMarkersResult = await createSecondaryTemperatureMarkers();
        const humidityMarkersResult = await createHumidityMarkers();
        const pressureMarkersResult = await createPressureScaleMarkers();
        const rainfallMarkersResult = await createRainfallMarkers();

        // Initialize gauge paths
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;

        // Initialize background arcs first
        // For the main temperature gauge
        initBackgroundArc('gauge-background', centerX, centerY, config.gaugeDimensions.mainRadius, config.gauges.temperature.startAngle, config.gauges.temperature.endAngle);
        // For the humidity gauge
        initBackgroundArc('humidity-background', centerX, centerY, config.gaugeDimensions.humidityRadius, config.gauges.humidity.startAngle, config.gauges.humidity.endAngle);
        // For the pressure gauge
        initBackgroundArc('pressure-background', centerX, centerY, config.gaugeDimensions.pressureRadius, config.gauges.pressure.startAngle, config.gauges.pressure.endAngle);
        // For the secondary temperature gauge
        initBackgroundArc('secondary-temp-background', centerX, centerY, config.gaugeDimensions.secondaryRadius, config.gauges.temperatureSecondary.startAngle, config.gauges.temperatureSecondary.endAngle);
        // For the rainfall gauge
        initBackgroundArc('rainfall-background', centerX, centerY, config.gaugeDimensions.rainfallRadius, config.gauges.rainfall.startAngle, config.gauges.rainfall.endAngle);
        
        // Initialize gauge paths
        // For the temperature gauge
        initGaugePath('gauge-arc', centerX, centerY, config.gaugeDimensions.mainRadius, config.gauges.temperature.startAngle, config.gauges.temperature.endAngle);

        // For the secondary temperature gauge
        initGaugePath('secondary-temp-arc', centerX, centerY, config.gaugeDimensions.secondaryRadius, config.gauges.temperatureSecondary.startAngle, config.gauges.temperatureSecondary.endAngle);
        // For the humidity gauge
        initGaugePath('humidity-arc', centerX, centerY, config.gaugeDimensions.humidityRadius, config.gauges.humidity.startAngle, config.gauges.humidity.endAngle);
        // For the pressure gauge
        initGaugePath('pressure-arc', centerX, centerY, config.gaugeDimensions.pressureRadius, config.gauges.pressure.startAngle, config.gauges.pressure.endAngle);
        // For the rainfall gauge
        initGaugePath('rainfall-arc', centerX, centerY, config.gaugeDimensions.rainfallRadius, config.gauges.rainfall.startAngle, config.gauges.rainfall.endAngle);

        // Initialize all gauges with minimal values to prevent flash of color
        console.log('Initializing gauges with minimal values to prevent flash of color');

        // Use default values for initial display
        const defaultTemp = config.gauges.temperature.min;
        const defaultSecondaryTemp = config.gauges.temperatureSecondary.min;
        const defaultHumidity = config.gauges.humidity.min;
        const defaultPressure = config.gauges.pressure.min;
        const defaultRainfall = config.gauges.rainfall.min;

        // Call update functions with initializing=true
        updateTemperatureGauge(defaultTemp, true);
        updateSecondaryTemperatureGauge(defaultSecondaryTemp, true);
        updateHumidityGauge(defaultHumidity, true);
        updatePressureGauge(defaultPressure, true);
        updateRainfallGauge(defaultRainfall, true);

        return true;
    } catch (error) {
        console.error('Error initializing gauges:', error);
        return false;
    }
}
