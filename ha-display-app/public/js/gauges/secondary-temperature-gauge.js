// Secondary temperature gauge implementation
import { config } from '../config.js';
import { createGradientStops, createArcPath, calculateAngle } from '../gauge-utils.js';

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
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function createSecondaryTemperatureMarkers() {
    return new Promise((resolve) => {
        try {
            console.log('Creating secondary temperature scale markers...');
            let retryCount = 0;
            const maxRetries = 15; // Increased max retries
            
            // Function to attempt to create markers
            const attemptCreate = () => {
                // Verify document ready state
                console.log(`Document ready state: ${document.readyState}`);
                
                // Try to get the markers element
                const markers = document.getElementById('secondary-temp-markers');
                if (!markers) {
                    retryCount++;
                    console.error(`Secondary temperature markers element not found (attempt ${retryCount}/${maxRetries})`);
                    
                    // Check if SVG exists
                    const svg = document.querySelector('.gauge-svg');
                    if (!svg) {
                        console.error('SVG container not found!');
                    } else {
                        console.log('SVG container found');
                    }
                    
                    // Try to find any gauge markers
                    const allMarkers = document.querySelectorAll('.gauge-markers');
                    console.log(`Found ${allMarkers.length} elements with class 'gauge-markers':`);
                    allMarkers.forEach(el => {
                        console.log(`- ${el.id || 'no-id'} (${el.tagName})`);
                    });
                    
                    // If we haven't exceeded max retries, try again
                    if (retryCount < maxRetries) {
                        // Increase delay with each retry
                        const delay = 200 * retryCount;
                        console.log(`Retrying in ${delay}ms...`);
                        setTimeout(attemptCreate, delay);
                        return;
                    }
                    
                    console.error('Maximum retries reached. Could not find secondary temperature markers element.');
                    resolve(false);
                    return;
                }
                
                // Clear any existing markers
                while (markers.firstChild) {
                    markers.removeChild(markers.firstChild);
                }
                
                // Create markers at 5-degree intervals
                for (let temp = secondaryTempConfig.min; temp <= secondaryTempConfig.max; temp += 5) {
                    // Calculate angle based on temperature
                    // Note: We swap start and end angles to maintain the reverse direction
                    const angle = calculateAngle(
                        temp,
                        secondaryTempConfig.min,
                        secondaryTempConfig.max,
                        secondaryTempConfig.endAngle,  // Swapped with startAngle
                        secondaryTempConfig.startAngle  // Swapped with endAngle
                    );
                    const radians = angle * (Math.PI / 180);
                    
                    // Calculate position for text label
                    const textRadius = config.gaugeDimensions.secondaryRadius;
                    const textX = config.gaugeDimensions.centerX + Math.cos(radians) * textRadius;
                    const textY = config.gaugeDimensions.centerY + Math.sin(radians) * textRadius;
                    
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
                        text.setAttribute('opacity', '0');
                    } else {
                        text.setAttribute('opacity', '1');
                    }
                    
                    // Add text shadow for better readability against gradient
                    text.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.8);');
                    
                    // Set the text content
                    text.textContent = `${temp}\u00b0`;
                    
                    // Add text to group
                    markerGroup.appendChild(text);
                    
                    // Position and rotate the group
                    markerGroup.setAttribute('transform', `translate(${textX}, ${textY}) rotate(${angle})`);
                    
                    // Add the marker group to the markers container
                    markers.appendChild(markerGroup);
                }
                
                console.log('Secondary temperature scale markers created successfully');
                resolve(true);
            };
            
            // Start the attempt process
            attemptCreate();
            
        } catch (error) {
            console.error('Error creating secondary temperature scale markers:', error);
            resolve(false);
        }
    });
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
        
        // Calculate the angle for the current temperature using the shared utility function
        // Note: We swap start and end angles to maintain the reverse direction (decreasing angle as temperature increases)
        const currentAngle = calculateAngle(
            temperature,
            secondaryTempConfig.min,
            secondaryTempConfig.max,
            secondaryTempConfig.endAngle,  // Swapped with startAngle
            secondaryTempConfig.startAngle // Swapped with endAngle
        );
        
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
