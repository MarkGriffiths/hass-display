// Gauge initializer module
// Handles initialization of all gauge components

import { config } from '../config.js';
import { initGaugePath, initSVGPaths } from '../gauge-utils.js';

// Import individual gauge functions
import { createTemperatureGradient, createTemperatureMarkers } from './temperature-gauge.js';
import { createSecondaryTemperatureGradient, createSecondaryTemperatureMarkers } from './secondary-temperature-gauge.js';
import { createHumidityGradient, createHumidityMarkers } from './humidity-gauge.js';
import { createPressureGradient, createPressureScaleMarkers } from './pressure-gauge.js';

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
        'temperature-arc',
        'secondary-temp-arc',
        'humidity-arc',
        'pressure-arc'
    ];
    
    console.log('Checking DOM elements...');
    console.log('Document ready state:', document.readyState);
    
    // Log all SVG elements for debugging
    const svgElements = document.querySelectorAll('svg *[id]');
    console.log('Found SVG elements with IDs:');
    svgElements.forEach(el => {
        console.log(`- ${el.id} (${el.tagName})`);
    });
    
    let allElementsReady = true;
    
    for (const elementId of requiredElements) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.log(`Missing DOM element: ${elementId}`);
            allElementsReady = false;
        } else {
            console.log(`Found DOM element: ${elementId}`);
        }
    }
    
    return allElementsReady;
}

/**
 * Wait for DOM elements to be available
 * @param {string[]} elementIds - Array of element IDs to wait for
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} interval - Interval between attempts in ms
 * @returns {Promise<boolean>} - Promise that resolves to true if all elements are found
 */
async function waitForDOMElements(elementIds, maxAttempts = 20, interval = 250) {
    return new Promise((resolve) => {
        let attempts = 0;
        
        function checkElements() {
            attempts++;
            console.log(`Checking for DOM elements (attempt ${attempts}/${maxAttempts})...`);
            
            // Check if all elements exist
            const missing = [];
            const found = [];
            
            for (const id of elementIds) {
                const element = document.getElementById(id);
                if (!element) {
                    missing.push(id);
                } else {
                    found.push(id);
                }
            }
            
            if (missing.length === 0) {
                console.log('All required DOM elements found!');
                resolve(true);
                return;
            }
            
            console.log(`Found elements: ${found.join(', ')}`);
            console.log(`Missing elements: ${missing.join(', ')}`);
            
            // If we've reached max attempts, resolve with false
            if (attempts >= maxAttempts) {
                console.error(`Failed to find all DOM elements after ${maxAttempts} attempts`);
                resolve(false);
                return;
            }
            
            // Try again after interval
            setTimeout(checkElements, interval);
        }
        
        // Start checking
        checkElements();
    });
}

/**
 * Ensure the DOM is fully loaded and ready
 * @returns {Promise<void>} Promise that resolves when DOM is ready
 */
function ensureDOMReady() {
    return new Promise(resolve => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            console.log(`Document already ready (${document.readyState})`);
            // Still add a small delay to ensure all rendering is complete
            setTimeout(resolve, 100);
        } else {
            console.log('Waiting for DOMContentLoaded event...');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOMContentLoaded fired');
                // Add a small delay after DOMContentLoaded to ensure all rendering is complete
                setTimeout(resolve, 100);
            });
        }
    });
}

/**
 * Initialize all gauge paths, gradients, and markers
 * @returns {Promise<boolean>} Promise that resolves to true if all gauges initialized successfully, false otherwise
 */
export async function initGauges() {
    try {
        console.log('Initializing all gauges...');
        
        // First, ensure DOM is fully loaded
        console.log('Ensuring DOM is ready...');
        await ensureDOMReady();
        
        // Log the document ready state
        console.log('Document ready state:', document.readyState);
        
        // Log all SVG elements to help with debugging
        const svgElements = document.querySelectorAll('svg *[id]');
        console.log(`Found ${svgElements.length} SVG elements with IDs:`);
        svgElements.forEach(el => {
            console.log(`- ${el.id} (${el.tagName})`);
        });
        
        // Wait for all required DOM elements to be available
        const requiredElements = [
            'temperature-markers',
            'secondary-temp-markers',
            'humidity-markers',
            'pressure-markers',
            'temperature-arc',
            'secondary-temp-arc',
            'humidity-arc',
            'pressure-arc'
        ];
        
        console.log('Waiting for DOM elements to be available...');
        const elementsReady = await waitForDOMElements(requiredElements, 30, 200); // More retries, shorter interval
        
        if (!elementsReady) {
            console.error('Failed to find all required DOM elements');
            return false;
        }
        
        // Initialize SVG paths
        console.log('Initializing SVG paths...');
        initSVGPaths();
        
        // Create gradients
        console.log('Creating gradients...');
        createTemperatureGradient();
        createSecondaryTemperatureGradient();
        createHumidityGradient();
        createPressureGradient();
        
        // Add a small delay to ensure all DOM operations have completed
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Create scale markers with retry logic
        console.log('Creating temperature markers...');
        const tempMarkersResult = await createTemperatureMarkers();
        console.log('Temperature markers result:', tempMarkersResult);
        
        console.log('Creating secondary temperature markers...');
        const secondaryTempMarkersResult = await createSecondaryTemperatureMarkers();
        console.log('Secondary temperature markers result:', secondaryTempMarkersResult);
        
        console.log('Creating humidity markers...');
        const humidityMarkersResult = await createHumidityMarkers();
        console.log('Humidity markers result:', humidityMarkersResult);
        
        console.log('Creating pressure markers...');
        const pressureMarkersResult = await createPressureScaleMarkers();
        console.log('Pressure markers result:', pressureMarkersResult);
        
        // Check if all markers were created successfully
        if (tempMarkersResult && secondaryTempMarkersResult && 
            humidityMarkersResult && pressureMarkersResult) {
            console.log('All gauges initialized successfully');
            return true;
        } else {
            console.warn('Some gauge markers could not be initialized');
            return false;
        }
    } catch (error) {
        console.error('Error initializing gauges:', error);
        return false;
    }
}


