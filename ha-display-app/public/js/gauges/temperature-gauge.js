// Temperature gauge implementation
import { config } from '../config.js';
import { createGradientStops, createArcPath, calculateAngle } from '../gauge-utils.js';

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
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function createTemperatureMarkers() {
    return new Promise((resolve) => {
        try {
            console.log('Creating temperature scale markers...');
            let retryCount = 0;
            const maxRetries = 15; // Increased max retries
            
            // Function to attempt to create markers
            const attemptCreate = () => {
                // Verify document ready state
                console.log(`Document ready state: ${document.readyState}`);
                
                // Try to get the markers element
                const markers = document.getElementById('temperature-markers');
                if (!markers) {
                    retryCount++;
                    console.error(`Temperature markers element not found (attempt ${retryCount}/${maxRetries})`);
                    
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
                    
                    console.error('Maximum retries reached. Could not find temperature markers element.');
                    resolve(false);
                    return;
                }
                
                // Clear any existing markers
                while (markers.firstChild) {
                    markers.removeChild(markers.firstChild);
                }
                
                // Create markers at 5-degree intervals
                for (let temp = tempConfig.minTemp; temp <= tempConfig.maxTemp; temp += 5) {
                    // Calculate angle based on temperature
                    const angle = calculateAngle(
                        temp,
                        tempConfig.minTemp,
                        tempConfig.maxTemp,
                        tempConfig.startAngle,
                        tempConfig.endAngle
                    );
                    const radians = angle * (Math.PI / 180);
                    
                    // Calculate position for text label
                    const textRadius = config.gaugeDimensions.mainRadius;
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
                    if (temp === tempConfig.minTemp || temp === tempConfig.maxTemp) {
                        text.setAttribute('opacity', '0');
                    } else {
                        text.setAttribute('opacity', '1');
                    }
                    
                    // Add text shadow for better readability against gradient
                    text.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.8);');
                    
                    // Set the text content
                    text.textContent = `${temp}°`;
                    
                    // Add text to group
                    markerGroup.appendChild(text);
                    
                    // Calculate text rotation angle to be normal to the arc
                    // For radial orientation, we need to adjust by 90 degrees from the angle to the center
                    // This makes text perpendicular to the radius line (normal to the arc)
                    const textRotationAngle = angle + 90;
                    
                    // Position and rotate the group - text now oriented normal to the arc
                    markerGroup.setAttribute('transform', `translate(${textX}, ${textY}) rotate(${textRotationAngle})`);
                    
                    // Add the marker group to the markers container
                    markers.appendChild(markerGroup);
                }
                
                console.log('Temperature markers created successfully');
                resolve(true);
            };
            
            // Start the attempt process
            attemptCreate();
            
        } catch (error) {
            console.error('Error creating temperature markers:', error);
            resolve(false);
        }
    });
}

/**
 * Update the temperature gauge with a new value
 * @param {number} temperature - The temperature value to display
 */
export function updateTemperatureGauge(temperature) {
    try {
        console.log(`Updating temperature gauge to ${temperature}°C`);
        
        // Get the gauge path element
        const gaugePath = document.getElementById('temperature-arc');
        const valueDisplay = document.getElementById('temperature-value');
        
        if (!gaugePath || !valueDisplay) {
            console.error('Temperature gauge elements not found');
            return;
        }
        
        // Ensure temperature is within range
        temperature = Math.max(tempConfig.minTemp, Math.min(temperature, tempConfig.maxTemp));
        
        // Calculate the angle for the current temperature using the config values
        // This will map the temperature to an angle between startAngle and endAngle
        const angle = calculateAngle(
            temperature,
            tempConfig.minTemp,
            tempConfig.maxTemp,
            tempConfig.startAngle,
            tempConfig.endAngle
        );
        
        // Get center coordinates and radius
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = config.gaugeDimensions.mainRadius;
        
        // For temperature gauge, we want it at the top (180° to 360°/0°)
        // Calculate start point (always at startAngle, which is 180 degrees or left side)
        const startRad = tempConfig.startAngle * (Math.PI / 180);
        const startX = centerX + radius * Math.cos(startRad);
        const startY = centerY + radius * Math.sin(startRad);
        
        // Calculate end point based on the current temperature (moving from left toward right)
        const endRad = angle * (Math.PI / 180);
        const endX = centerX + radius * Math.cos(endRad);
        const endY = centerY + radius * Math.sin(endRad);
        
        // Determine if we need to use the large arc flag
        const largeArcFlag = Math.abs(angle - tempConfig.startAngle) > 180 ? 1 : 0;
        
        // Create the SVG arc path
        const sweepFlag = 1; // 0 for clockwise, 1 for counterclockwise - use 1 to draw in the correct direction
        const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
        
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
