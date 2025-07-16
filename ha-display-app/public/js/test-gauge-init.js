// Test script for gauge initialization
import { initGauges } from './gauges/gauge-initializer.js';

/**
 * Check if all required DOM elements exist
 * @returns {boolean} True if all elements exist, false otherwise
 */
export function checkDOMElements() {
    console.log('Checking required DOM elements...');
    
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
    
    let allFound = true;
    const missing = [];
    const found = [];
    
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Required element #${id} not found in DOM`);
            missing.push(id);
            allFound = false;
        } else {
            console.log(`Required element #${id} found in DOM`);
            found.push(id);
        }
    });
    
    // Log SVG structure
    const svg = document.querySelector('.gauge-svg');
    if (svg) {
        console.log('SVG element found');
        console.log('SVG children count:', svg.childNodes.length);
        
        // Log all elements with IDs in the SVG
        const svgElementsWithId = svg.querySelectorAll('[id]');
        console.log(`Found ${svgElementsWithId.length} SVG elements with IDs:`);
        svgElementsWithId.forEach(el => {
            console.log(`- ${el.id} (${el.tagName})`);
        });
    } else {
        console.error('SVG element not found!');
    }
    
    return {
        allFound,
        missing,
        found
    };
}

/**
 * Wait for DOM to be fully loaded and ready
 * @returns {Promise<void>} Promise that resolves when DOM is ready
 */
export function waitForDOMReady() {
    return new Promise(resolve => {
        if (document.readyState === 'complete') {
            console.log('Document already fully loaded (readyState: complete)');
            // Still add a small delay to ensure all rendering is complete
            setTimeout(resolve, 200);
        } else {
            console.log(`Document not fully loaded, current state: ${document.readyState}`);
            
            // Listen for both DOMContentLoaded and load events
            const domContentLoadedHandler = () => {
                console.log('DOMContentLoaded event fired');
            };
            
            const loadHandler = () => {
                console.log('Window load event fired, document fully loaded');
                document.removeEventListener('DOMContentLoaded', domContentLoadedHandler);
                // Add a delay after load to ensure all DOM elements are processed
                setTimeout(resolve, 200);
            };
            
            document.addEventListener('DOMContentLoaded', domContentLoadedHandler);
            window.addEventListener('load', loadHandler);
        }
    });
}

/**
 * Initialize gauges with retry logic
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export async function testInitGauges() {
    console.log('Testing gauge initialization...');
    
    try {
        // First, wait for DOM to be fully loaded
        console.log('Waiting for DOM to be fully loaded...');
        await waitForDOMReady();
        
        // Add a delay after full load to ensure all DOM elements are processed
        console.log('Waiting 1000ms before checking DOM elements...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if all required DOM elements exist
        const domCheck = checkDOMElements();
        if (!domCheck.allFound) {
            console.error(`Missing ${domCheck.missing.length} required elements: ${domCheck.missing.join(', ')}`);
            console.error('Cannot initialize gauges without required DOM elements');
            return false;
        }
        
        // Try to initialize gauges with retry logic
        let success = false;
        let attempts = 0;
        const maxAttempts = 8;
        
        while (!success && attempts < maxAttempts) {
            attempts++;
            console.log(`Attempting to initialize gauges (attempt ${attempts}/${maxAttempts})...`);
            
            try {
                success = await initGauges();
                
                if (success) {
                    console.log('Gauge initialization successful!');
                } else {
                    console.error('Gauge initialization returned false');
                }
            } catch (error) {
                console.error('Error during gauge initialization:', error);
            }
            
            if (!success && attempts < maxAttempts) {
                // Exponential backoff for retries
                const delay = Math.min(1000 * Math.pow(1.5, attempts), 10000); // Cap at 10 seconds
                console.log(`Initialization failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        if (success) {
            console.log('Gauge initialization completed successfully after', attempts, 'attempts');
        } else {
            console.error('Failed to initialize gauges after', maxAttempts, 'attempts');
        }
        
        return success;
    } catch (error) {
        console.error('Error during gauge initialization process:', error);
        return false;
    }
}

// Export a function to run the test from the console or a button click
export function runTest() {
    console.log('Running gauge initialization test...');
    testInitGauges()
        .then(result => {
            console.log('Test completed with result:', result);
        })
        .catch(error => {
            console.error('Test failed with error:', error);
        });
}

// Log when this module is loaded
console.log('test-gauge-init.js loaded');
