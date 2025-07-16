// Humidity gauge implementation
import { config } from './config.js';
import { 
    createGradientStops, 
    createScaleMarkers as createBaseScaleMarkers, 
    createArcPath 
} from './gauge-utils.js';

// Humidity gauge configuration
const humidityConfig = {
    minHumidity: config.gauges.humidity.min,
    maxHumidity: config.gauges.humidity.max,
    startAngle: config.gauges.humidity.startAngle,
    endAngle: config.gauges.humidity.endAngle,
    arcRadius: config.gaugeDimensions.humidityRadius,
    colorStops: config.gauges.humidity.colorStops
};

/**
 * Create the humidity gradient for the inner arc
 */
export function createHumidityGradient() {
    try {
        console.log('Creating humidity gradient...');
        
        // Get the gradient element
        const gradient = document.getElementById('humidity-gradient');
        if (!gradient) {
            console.error('Humidity gradient element not found');
            return;
        }
        
        // Clear any existing stops
        while (gradient.firstChild) {
            gradient.removeChild(gradient.firstChild);
        }
        
        // Create gradient stops based on configuration
        const stops = createGradientStops(
            'humidity-gradient',
            humidityConfig.colorStops,
            humidityConfig.minHumidity,
            humidityConfig.maxHumidity
        );
        
        // Add stops to the gradient
        stops.forEach(stop => {
            const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stopElement.setAttribute('offset', stop.offset);
            stopElement.setAttribute('stop-color', stop.color);
            gradient.appendChild(stopElement);
        });
        
        console.log('Humidity gradient created successfully');
    } catch (error) {
        console.error('Error creating humidity gradient:', error);
    }
}

/**
 * Create scale markers for the humidity gauge
 */
export function createHumidityMarkers() {
    try {
        console.log('Creating humidity scale markers...');
        
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = config.gaugeDimensions.humidityRadius;
        
        // Create markers using the shared utility function
        createBaseScaleMarkers(
            'humidity-markers',
            centerX,
            centerY,
            radius,
            humidityConfig.minHumidity,
            humidityConfig.maxHumidity,
            20, // Step size
            humidityConfig.startAngle,
            humidityConfig.endAngle,
            '%'
        );
        
        console.log('Humidity scale markers created successfully');
    } catch (error) {
        console.error('Error creating humidity scale markers:', error);
    }
}

/**
 * Update the humidity gauge with a new value
 * @param {number} humidity - The humidity value to display
 */
export function updateHumidityGauge(humidity) {
    try {
        console.log(`Updating humidity gauge to ${humidity}%`);
        
        // Get the gauge path element
        const gaugePath = document.getElementById('humidity-gauge-path');
        const valueDisplay = document.getElementById('humidity-value');
        
        if (!gaugePath || !valueDisplay) {
            console.error('Humidity gauge elements not found');
            return;
        }
        
        // Ensure humidity is within range
        humidity = Math.max(humidityConfig.minHumidity, Math.min(humidity, humidityConfig.maxHumidity));
        
        // Calculate the angle for the current humidity
        const valueRange = humidityConfig.maxHumidity - humidityConfig.minHumidity;
        const angleRange = humidityConfig.endAngle - humidityConfig.startAngle;
        const degreesPerHumidity = angleRange / valueRange;
        
        // Calculate the angle for the current humidity
        const currentAngle = humidityConfig.startAngle + ((humidity - humidityConfig.minHumidity) * degreesPerHumidity);
        
        // Convert angle to radians
        const radians = currentAngle * (Math.PI / 180);
        
        // Get center coordinates and radius
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = humidityConfig.arcRadius;
        
        // Calculate end point of the arc
        const endX = centerX + radius * Math.cos(radians);
        const endY = centerY + radius * Math.sin(radians);
        
        // Calculate start point (always at the start angle)
        const startRad = humidityConfig.startAngle * (Math.PI / 180);
        const startX = centerX + radius * Math.cos(startRad);
        const startY = centerY + radius * Math.sin(startRad);
        
        // Determine if we need to use the large arc flag
        const largeArcFlag = Math.abs(currentAngle - humidityConfig.startAngle) > 180 ? 1 : 0;
        
        // Create the arc path
        const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
        
        // Update the path
        gaugePath.setAttribute('d', arcPath);
        
        // Update the value display
        valueDisplay.textContent = humidity.toFixed(0);
        
        console.log('Humidity gauge updated successfully');
    } catch (error) {
        console.error('Error updating humidity gauge:', error);
    }
}

/**
 * Test function to animate the humidity gauge
 */
export function testHumidityGauge() {
    try {
        console.log('Testing humidity gauge...');
        
        // Store the current humidity to restore later
        const currentHumidity = document.getElementById('humidity-value').textContent;
        
        // Test with values across the full range
        let humidity = humidityConfig.minHumidity;
        const steps = 50;
        const humidityStep = (humidityConfig.maxHumidity - humidityConfig.minHumidity) / steps;
        
        // Update the gauge with each value at intervals
        const intervalId = setInterval(() => {
            updateHumidityGauge(humidity);
            
            humidity += humidityStep;
            if (humidity > humidityConfig.maxHumidity) {
                clearInterval(intervalId);
                
                // Restore the original humidity after a delay
                setTimeout(() => {
                    updateHumidityGauge(parseFloat(currentHumidity) || 50);
                }, 1000);
                
                console.log('Humidity gauge test complete');
            }
        }, 50);
    } catch (error) {
        console.error('Error testing humidity gauge:', error);
    }
}
