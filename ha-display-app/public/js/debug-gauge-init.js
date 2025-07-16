// Debug script for gauge initialization
import { config } from './config.js';
import { calculateAngle } from './gauge-utils.js';

// Function to create a simple temperature marker
function createSimpleTemperatureMarker(markerId, value, min, max, startAngle, endAngle) {
    return new Promise((resolve) => {
        console.log(`Creating simple marker for ${markerId}...`);
        
        // Try to get the markers element
        const markers = document.getElementById(markerId);
        if (!markers) {
            console.error(`Element with ID '${markerId}' not found`);
            console.log('Document ready state:', document.readyState);
            
            // List all gauge-markers elements
            const allMarkers = document.querySelectorAll('.gauge-markers');
            console.log(`Found ${allMarkers.length} elements with class 'gauge-markers':`);
            allMarkers.forEach(el => {
                console.log(`- ${el.id || 'no-id'} (${el.tagName})`);
            });
            
            resolve(false);
            return;
        }
        
        console.log(`Found element with ID '${markerId}'`);
        
        // Clear any existing markers
        while (markers.firstChild) {
            markers.removeChild(markers.firstChild);
        }
        
        // Create a simple text marker
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', config.gaugeDimensions.centerX);
        text.setAttribute('y', config.gaugeDimensions.centerY - 100);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', '20');
        text.textContent = `${markerId} initialized`;
        
        markers.appendChild(text);
        console.log(`Created marker for ${markerId}`);
        resolve(true);
    });
}

// Initialize all gauge markers with simple test markers
export async function debugInitGauges() {
    console.log('Starting debug gauge initialization...');
    
    try {
        // Create simple markers for each gauge
        const results = [];
        
        // Temperature gauge
        console.log('Initializing temperature markers...');
        const tempResult = await createSimpleTemperatureMarker(
            'temperature-markers', 
            20, 
            config.temperatureConfig.minTemp, 
            config.temperatureConfig.maxTemp,
            config.temperatureConfig.startAngle,
            config.temperatureConfig.endAngle
        );
        results.push({ gauge: 'temperature', success: tempResult });
        
        // Secondary temperature gauge
        console.log('Initializing secondary temperature markers...');
        const secondaryTempResult = await createSimpleTemperatureMarker(
            'secondary-temp-markers',
            20,
            config.secondaryTempConfig.minTemp,
            config.secondaryTempConfig.maxTemp,
            config.secondaryTempConfig.startAngle,
            config.secondaryTempConfig.endAngle
        );
        results.push({ gauge: 'secondary-temperature', success: secondaryTempResult });
        
        // Humidity gauge
        console.log('Initializing humidity markers...');
        const humidityResult = await createSimpleTemperatureMarker(
            'humidity-markers',
            50,
            config.humidityConfig.minHumidity,
            config.humidityConfig.maxHumidity,
            config.humidityConfig.startAngle,
            config.humidityConfig.endAngle
        );
        results.push({ gauge: 'humidity', success: humidityResult });
        
        // Pressure gauge
        console.log('Initializing pressure markers...');
        const pressureResult = await createSimpleTemperatureMarker(
            'pressure-markers',
            1013,
            config.pressureConfig.minPressure,
            config.pressureConfig.maxPressure,
            config.pressureConfig.startAngle,
            config.pressureConfig.endAngle
        );
        results.push({ gauge: 'pressure', success: pressureResult });
        
        // Log results
        console.log('Debug gauge initialization results:', results);
        
        // Return true if all gauges initialized successfully
        return results.every(r => r.success);
    } catch (error) {
        console.error('Error in debug gauge initialization:', error);
        return false;
    }
}

// Export a function to run the debug initialization
export function runDebugInit() {
    console.log('Running debug gauge initialization...');
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        console.log('Document still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded fired, waiting 1 second before initializing...');
            setTimeout(async () => {
                const result = await debugInitGauges();
                console.log('Debug initialization complete, result:', result);
            }, 1000);
        });
    } else {
        console.log('Document already loaded, waiting 1 second before initializing...');
        setTimeout(async () => {
            const result = await debugInitGauges();
            console.log('Debug initialization complete, result:', result);
        }, 1000);
    }
}
