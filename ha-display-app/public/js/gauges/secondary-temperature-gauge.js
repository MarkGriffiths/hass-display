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
                    // Use the correct angle direction to match the arc
                    const angle = calculateAngle(
                        temp,
                        secondaryTempConfig.min,
                        secondaryTempConfig.max,
                        secondaryTempConfig.startAngle,  // Use correct startAngle
                        secondaryTempConfig.endAngle     // Use correct endAngle
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
                    
                    // Calculate text rotation angle to be normal to the arc plus additional rotation
                    // For radial orientation, we need to adjust by 90 degrees from the angle to the center
                    // Then add 180 degrees to make the text easier to read (total 270° rotation)
                    const textRotationAngle = angle + 90 + 180;
                    
                    // Position and rotate the group - text now oriented normal to the arc
                    markerGroup.setAttribute('transform', `translate(${textX}, ${textY}) rotate(${textRotationAngle})`);
                    
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
        const gaugePath = document.getElementById('secondary-temp-arc');
        const valueDisplay = document.getElementById('secondary-temp-value');
        
        if (!gaugePath || !valueDisplay) {
            console.error('Secondary temperature gauge elements not found');
            return;
        }
        
        // Ensure temperature is within range
        temperature = Math.max(secondaryTempConfig.min, Math.min(temperature, secondaryTempConfig.max));
        
        // Calculate the angle for the current temperature
        // Use the original angles from config.js
        const angle = calculateAngle(
            temperature,
            secondaryTempConfig.min,
            secondaryTempConfig.max,
            secondaryTempConfig.startAngle,
            secondaryTempConfig.endAngle
        );
        
        // Get center coordinates and radius
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = secondaryTempConfig.arcRadius;
        
        // For secondary temperature gauge, it should go from 160° (bottom-right) to 20° (bottom-left)
        // In the SVG angle system: 0°/360° is far left, 270° is top, 180° is far right, 90° is bottom
        const startRad = secondaryTempConfig.startAngle * (Math.PI / 180);
        const startX = centerX + radius * Math.cos(startRad);
        const startY = centerY + radius * Math.sin(startRad);
        
        // Calculate end point based on the current temperature (moving from right toward bottom)
        const endRad = angle * (Math.PI / 180);
        const endX = centerX + radius * Math.cos(endRad);
        const endY = centerY + radius * Math.sin(endRad);
        
        // Determine if we need to use the large arc flag
        const largeArcFlag = Math.abs(angle - secondaryTempConfig.startAngle) > 180 ? 1 : 0;
        
        // Create the SVG arc path
        // For the bottom half, we need to use sweepFlag = 0 to draw from top to bottom
        const sweepFlag = 0; // 0 for clockwise, 1 for counterclockwise
        const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
        
        // Update the path
        gaugePath.setAttribute('d', arcPath);
        
        // Update the value display
        valueDisplay.textContent = temperature.toFixed(1);
        
        console.log('Secondary temperature gauge updated successfully');
    } catch (error) {
        console.error('Error updating secondary temperature gauge:', error);
    }
}

// Test function removed - consolidated in test-gauges.js
