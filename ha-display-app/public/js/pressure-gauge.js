// Pressure gauge implementation
import { config } from './config.js';
import { 
    createGradientStops, 
    createScaleMarkers as createBaseScaleMarkers, 
    createArcPath 
} from './gauge-utils.js';

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
 */
export function createPressureMarkers() {
    try {
        console.log('Creating pressure scale markers...');
        
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = config.gaugeDimensions.pressureRadius;
        
        // Create markers using the shared utility function
        createBaseScaleMarkers(
            'pressure-markers',
            centerX,
            centerY,
            radius,
            pressureConfig.minPressure,
            pressureConfig.maxPressure,
            20, // Step size
            pressureConfig.startAngle,
            pressureConfig.endAngle,
            ''
        );
        
        console.log('Pressure scale markers created successfully');
    } catch (error) {
        console.error('Error creating pressure scale markers:', error);
    }
}

/**
 * Update the pressure gauge with a new value
 * @param {number} pressure - The pressure value to display
 */
export function updatePressureGauge(pressure) {
    try {
        console.log(`Updating pressure gauge to ${pressure} hPa`);
        
        // Get the gauge path element
        const gaugePath = document.getElementById('pressure-gauge-path');
        const valueDisplay = document.getElementById('pressure-value');
        
        if (!gaugePath || !valueDisplay) {
            console.error('Pressure gauge elements not found');
            return;
        }
        
        // Ensure pressure is within range
        pressure = Math.max(pressureConfig.minPressure, Math.min(pressure, pressureConfig.maxPressure));
        
        // Calculate the angle for the current pressure
        const valueRange = pressureConfig.maxPressure - pressureConfig.minPressure;
        const angleRange = pressureConfig.endAngle - pressureConfig.startAngle;
        const degreesPerPressure = angleRange / valueRange;
        
        // Calculate the angle for the current pressure
        const currentAngle = pressureConfig.startAngle + ((pressure - pressureConfig.minPressure) * degreesPerPressure);
        
        // Convert angle to radians
        const radians = currentAngle * (Math.PI / 180);
        
        // Get center coordinates and radius
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = pressureConfig.arcRadius;
        
        // Calculate end point of the arc
        const endX = centerX + radius * Math.cos(radians);
        const endY = centerY + radius * Math.sin(radians);
        
        // Calculate start point (always at the start angle)
        const startRad = pressureConfig.startAngle * (Math.PI / 180);
        const startX = centerX + radius * Math.cos(startRad);
        const startY = centerY + radius * Math.sin(startRad);
        
        // Determine if we need to use the large arc flag
        const largeArcFlag = Math.abs(currentAngle - pressureConfig.startAngle) > 180 ? 1 : 0;
        
        // Create the arc path
        const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
        
        // Update the path
        gaugePath.setAttribute('d', arcPath);
        
        // Update the value display
        valueDisplay.textContent = pressure.toFixed(0);
        
        console.log('Pressure gauge updated successfully');
    } catch (error) {
        console.error('Error updating pressure gauge:', error);
    }
}

/**
 * Test function to animate the pressure gauge
 */
export function testPressureGauge() {
    try {
        console.log('Testing pressure gauge...');
        
        // Store the current pressure to restore later
        const currentPressure = document.getElementById('pressure-value').textContent;
        
        // Test with values across the full range
        let pressure = pressureConfig.minPressure;
        const steps = 50;
        const pressureStep = (pressureConfig.maxPressure - pressureConfig.minPressure) / steps;
        
        // Update the gauge with each value at intervals
        const intervalId = setInterval(() => {
            updatePressureGauge(pressure);
            
            pressure += pressureStep;
            if (pressure > pressureConfig.maxPressure) {
                clearInterval(intervalId);
                
                // Restore the original pressure after a delay
                setTimeout(() => {
                    updatePressureGauge(parseFloat(currentPressure) || 1013);
                }, 1000);
                
                console.log('Pressure gauge test complete');
            }
        }, 50);
    } catch (error) {
        console.error('Error testing pressure gauge:', error);
    }
}
