// Secondary temperature gauge implementation
import { config } from './config.js';
import { 
    createGradientStops, 
    createScaleMarkers as createBaseScaleMarkers, 
    createArcPath 
} from './gauge-utils.js';

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
 */
export function createSecondaryTempMarkers() {
    try {
        console.log('Creating secondary temperature scale markers...');
        
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = config.gaugeDimensions.secondaryRadius;
        
        // Get the markers element
        const markers = document.getElementById('secondary-temp-markers');
        if (!markers) {
            console.error('Secondary temperature markers element not found');
            return;
        }
        
        // Clear any existing markers
        while (markers.firstChild) {
            markers.removeChild(markers.firstChild);
        }
        
        // Calculate angle per degree
        const valueRange = secondaryTempConfig.max - secondaryTempConfig.min;
        const angleRange = Math.abs(secondaryTempConfig.endAngle - secondaryTempConfig.startAngle);
        const degreesPerTemp = angleRange / valueRange;
        
        // Create markers at 5-degree intervals
        for (let temp = secondaryTempConfig.min; temp <= secondaryTempConfig.max; temp += 5) {
            // Calculate angle based on temperature
            const angle = secondaryTempConfig.startAngle - ((temp - secondaryTempConfig.min) * degreesPerTemp);
            const radians = angle * (Math.PI / 180);
            
            // Calculate position for text label
            const textRadius = radius;
            const textX = centerX + Math.cos(radians) * textRadius;
            const textY = centerY + Math.sin(radians) * textRadius;
            
            // Create a group for the marker
            const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            // Create text label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', 0);
            text.setAttribute('y', 0);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', '#fff');
            text.setAttribute('font-size', '14');
            text.setAttribute('font-weight', 'bold');
            
            // Hide the first and last numbers but keep their positions
            if (temp === secondaryTempConfig.min || temp === secondaryTempConfig.max) {
                text.textContent = '';
            } else {
                text.textContent = `${temp}°C`;
            }
            
            markerGroup.appendChild(text);
            
            // Position the group at the correct coordinates
            markerGroup.setAttribute('transform', `translate(${textX}, ${textY})`);
            
            // Rotate text to be readable
            // For angles between 90° and 270°, add 180° to prevent upside-down text
            let textAngle = angle + 90;
            if (textAngle > 90 && textAngle < 270) {
                textAngle += 180;
            }
            
            // Apply rotation to the entire group
            const currentTransform = markerGroup.getAttribute('transform');
            markerGroup.setAttribute('transform', `${currentTransform} rotate(${textAngle})`);
            
            markers.appendChild(markerGroup);
        }
        
        console.log('Secondary temperature scale markers created successfully');
    } catch (error) {
        console.error('Error creating secondary temperature scale markers:', error);
    }
}

/**
 * Update the secondary temperature gauge with a new value
 * @param {number} temperature - The temperature value to display
 */
export function updateSecondaryTemperatureGauge(temperature) {
    try {
        console.log(`Updating secondary temperature gauge to ${temperature}°C`);
        
        // Get the gauge path element
        const gaugePath = document.getElementById('secondary-temp-gauge-path');
        const valueDisplay = document.getElementById('secondary-temp-value');
        
        if (!gaugePath || !valueDisplay) {
            console.error('Secondary temperature gauge elements not found');
            return;
        }
        
        // Ensure temperature is within range
        temperature = Math.max(secondaryTempConfig.min, Math.min(temperature, secondaryTempConfig.max));
        
        // Calculate the angle for the current temperature
        const valueRange = secondaryTempConfig.max - secondaryTempConfig.min;
        const angleRange = secondaryTempConfig.endAngle - secondaryTempConfig.startAngle;
        const degreesPerTemp = angleRange / valueRange;
        
        // Calculate the angle for the current temperature
        // The angle decreases as temperature increases
        const currentAngle = secondaryTempConfig.startAngle - ((temperature - secondaryTempConfig.min) * degreesPerTemp);
        
        // Convert angle to radians
        const radians = currentAngle * (Math.PI / 180);
        
        // Get center coordinates and radius
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = secondaryTempConfig.arcRadius;
        
        // Calculate end point of the arc
        const endX = centerX + radius * Math.cos(radians);
        const endY = centerY + radius * Math.sin(radians);
        
        // Calculate start point (always at the start angle)
        const startRad = secondaryTempConfig.startAngle * (Math.PI / 180);
        const startX = centerX + radius * Math.cos(startRad);
        const startY = centerY + radius * Math.sin(startRad);
        
        // Determine if we need to use the large arc flag
        const largeArcFlag = Math.abs(currentAngle - secondaryTempConfig.startAngle) > 180 ? 1 : 0;
        
        // Create the arc path
        const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
        
        // Update the path
        gaugePath.setAttribute('d', arcPath);
        
        // Update the value display
        valueDisplay.textContent = temperature.toFixed(1);
        
        console.log('Secondary temperature gauge updated successfully');
    } catch (error) {
        console.error('Error updating secondary temperature gauge:', error);
    }
}

/**
 * Test function to demonstrate the secondary temperature gauge
 */
export function testSecondaryTemperatureGauge() {
    try {
        console.log('Testing secondary temperature gauge...');
        
        // Store the current temperature to restore later
        const currentTemp = document.getElementById('secondary-temp-value').textContent;
        
        // Test with values across the full range
        let temp = secondaryTempConfig.min;
        const steps = 50;
        const tempStep = (secondaryTempConfig.max - secondaryTempConfig.min) / steps;
        
        // Update the gauge with each value at intervals
        const intervalId = setInterval(() => {
            updateSecondaryTemperatureGauge(temp);
            
            temp += tempStep;
            if (temp > secondaryTempConfig.max) {
                clearInterval(intervalId);
                
                // Restore the original temperature after a delay
                setTimeout(() => {
                    updateSecondaryTemperatureGauge(parseFloat(currentTemp) || 20);
                }, 1000);
                
                console.log('Secondary temperature gauge test complete');
            }
        }, 100);
    } catch (error) {
        console.error('Error testing secondary temperature gauge:', error);
    }
}
