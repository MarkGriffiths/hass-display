// Main temperature gauge implementation
import { config } from './config.js';
import { 
    createGradientStops, 
    createScaleMarkers as createBaseScaleMarkers, 
    createArcPath 
} from './gauge-utils.js';

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
 */
export function createScaleMarkers() {
    try {
        console.log('Creating temperature scale markers...');
        
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = config.gaugeDimensions.mainRadius;
        
        // Create markers using the shared utility function
        createBaseScaleMarkers(
            'temperature-markers',
            centerX,
            centerY,
            radius,
            tempConfig.minTemp,
            tempConfig.maxTemp,
            10, // Step size
            tempConfig.startAngle,
            tempConfig.endAngle,
            '°C'
        );
        
        console.log('Temperature scale markers created successfully');
    } catch (error) {
        console.error('Error creating temperature scale markers:', error);
    }
}

/**
 * Update the temperature gauge with a new value
 * @param {number} temperature - The temperature value to display
 */
export function updateTemperatureGauge(temperature) {
    try {
        console.log(`Updating temperature gauge to ${temperature}°C`);
        
        // Get the gauge path element
        const gaugePath = document.getElementById('temperature-gauge-path');
        const valueDisplay = document.getElementById('temperature-value');
        
        if (!gaugePath || !valueDisplay) {
            console.error('Temperature gauge elements not found');
            return;
        }
        
        // Ensure temperature is within range
        temperature = Math.max(tempConfig.minTemp, Math.min(temperature, tempConfig.maxTemp));
        
        // Calculate the angle for the current temperature
        const valueRange = tempConfig.maxTemp - tempConfig.minTemp;
        const angleRange = tempConfig.endAngle - tempConfig.startAngle;
        const degreesPerTemp = angleRange / valueRange;
        
        // Calculate the midpoint temperature for reference
        const midTemp = (tempConfig.maxTemp + tempConfig.minTemp) / 2;
        
        // Calculate the angle for the current temperature
        const currentAngle = 270 + (temperature - midTemp) * degreesPerTemp;
        
        // Convert angle to radians
        const radians = currentAngle * (Math.PI / 180);
        
        // Get center coordinates and radius
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = config.gaugeDimensions.mainRadius;
        
        // Calculate end point of the arc
        const endX = centerX + radius * Math.cos(radians);
        const endY = centerY + radius * Math.sin(radians);
        
        // Calculate start point (always at 270 degrees, or bottom)
        const startRad = 270 * (Math.PI / 180);
        const startX = centerX + radius * Math.cos(startRad);
        const startY = centerY + radius * Math.sin(startRad);
        
        // Determine if we need to use the large arc flag
        const largeArcFlag = Math.abs(currentAngle - 270) > 180 ? 1 : 0;
        
        // Create the arc path
        const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
        
        // Update the path
        gaugePath.setAttribute('d', arcPath);
        
        // Update the value display
        valueDisplay.textContent = temperature.toFixed(1);
        
        console.log('Temperature gauge updated successfully');
    } catch (error) {
        console.error('Error updating temperature gauge:', error);
    }
}

/**
 * Test function to animate the temperature gauge
 */
export function testTemperatureGauge() {
    try {
        console.log('Testing temperature gauge...');
        
        // Store the current temperature to restore later
        const currentTemp = document.getElementById('temperature-value').textContent;
        
        // Test with values across the full range
        let temp = tempConfig.minTemp;
        const tempStep = 1;
        const interval = 50; // milliseconds
        
        // Update the gauge with each value at intervals
        const intervalId = setInterval(() => {
            updateTemperatureGauge(temp);
            
            temp += tempStep;
            if (temp > tempConfig.maxTemp) {
                clearInterval(intervalId);
                
                // Restore the original temperature after a delay
                setTimeout(() => {
                    updateTemperatureGauge(parseFloat(currentTemp) || 20);
                }, 1000);
                
                console.log('Temperature gauge test complete');
            }
        }, interval);
    } catch (error) {
        console.error('Error testing temperature gauge:', error);
    }
}
