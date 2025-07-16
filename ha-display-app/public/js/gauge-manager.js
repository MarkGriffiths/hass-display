// Gauge Manager - Central module for all gauge functionality
import { config } from './config.js';

// Import gauge initializer
import { initGauges } from './gauges/gauge-initializer.js';

// Import temperature gauge functions
import { 
    createTemperatureGradient,
    createTemperatureMarkers,
    updateTemperatureGauge,
    testTemperatureGauge
} from './gauges/temperature-gauge.js';

// Import secondary temperature gauge functions
import { 
    createSecondaryTemperatureGradient,
    createSecondaryTemperatureMarkers,
    updateSecondaryTemperatureGauge,
    testSecondaryTemperatureGauge
} from './gauges/secondary-temperature-gauge.js';

// Import humidity gauge functions
import { 
    createHumidityGradient,
    createHumidityMarkers,
    updateHumidityGauge,
    testHumidityGauge
} from './gauges/humidity-gauge.js';

// Import pressure gauge functions
import { 
    createPressureGradient,
    createPressureScaleMarkers,
    updatePressureGauge,
    testPressureGauge
} from './gauges/pressure-gauge.js';

/**
 * Verify that all required DOM elements exist
 * @returns {boolean} True if all elements exist, false otherwise
 */
function verifyRequiredElements() {
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
    
    console.log('Verifying required DOM elements...');
    
    let allFound = true;
    for (const id of requiredElements) {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Required element #${id} not found in DOM`);
            allFound = false;
        } else {
            console.log(`Required element #${id} found in DOM`);
        }
    }
    
    return allFound;
}

/**
 * Initialize all gauges
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export async function initTemperatureGauge() {
    console.log('Initializing all gauges...');
    
    try {
        // Verify that the document is ready
        console.log('Document ready state:', document.readyState);
        
        // First verify that all required elements exist
        const elementsExist = verifyRequiredElements();
        if (!elementsExist) {
            console.error('Some required DOM elements are missing. Cannot initialize gauges.');
            return false;
        }
        
        // Use the centralized gauge initializer - now properly awaited
        console.log('Calling initGauges()...');
        const result = await initGauges();
        
        if (result) {
            console.log('All gauges initialized successfully');
        } else {
            console.error('Failed to initialize one or more gauges');
        }
        
        return result;
    } catch (error) {
        console.error('Error initializing gauges:', error);
        return false;
    }
}

/**
 * Test function to animate all gauges
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export async function testGaugeAnimation() {
    try {
        console.log('Testing all gauges with animation...');
        
        // Test each gauge in sequence with proper async/await
        await testTemperatureGauge();
        console.log('Temperature gauge test complete, waiting 1000ms before next test...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await testSecondaryTemperatureGauge();
        console.log('Secondary temperature gauge test complete, waiting 1000ms before next test...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await testHumidityGauge();
        console.log('Humidity gauge test complete, waiting 1000ms before next test...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await testPressureGauge();
        console.log('Pressure gauge test complete');
        
        console.log('All gauge animation tests completed successfully');
        return true;
    } catch (error) {
        console.error('Error in gauge animation test:', error);
        return false;
    }
}

// Re-export all gauge update functions
export {
    updateTemperatureGauge,
    updateSecondaryTemperatureGauge,
    updateHumidityGauge,
    updatePressureGauge
};
