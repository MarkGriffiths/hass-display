// Humidity gauge implementation
import { config } from '../config.js';
import { createGradientStops, createArcPath, calculateAngle } from '../gauge-utils.js';

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
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function createHumidityMarkers() {
    return new Promise((resolve) => {
        try {
            console.log('Creating humidity scale markers...');
            let retryCount = 0;
            const maxRetries = 15; // Increased max retries
            
            // Function to attempt to create markers
            const attemptCreate = () => {
                // Verify document ready state
                console.log(`Document ready state: ${document.readyState}`);
                
                // Try to get the markers element
                const markers = document.getElementById('humidity-markers');
                if (!markers) {
                    retryCount++;
                    console.error(`Humidity markers element not found (attempt ${retryCount}/${maxRetries})`);
                    
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
                    
                    console.error('Maximum retries reached. Could not find humidity markers element.');
                    resolve(false);
                    return;
                }
                
                // Clear any existing markers
                while (markers.firstChild) {
                    markers.removeChild(markers.firstChild);
                }
                
                // Create markers at 20% intervals
                for (let humidity = humidityConfig.minHumidity; humidity <= humidityConfig.maxHumidity; humidity += 20) {
                    // Calculate angle based on humidity
                    const angle = calculateAngle(
                        humidity,
                        humidityConfig.minHumidity,
                        humidityConfig.maxHumidity,
                        humidityConfig.startAngle,
                        humidityConfig.endAngle
                    );
                    const radians = angle * (Math.PI / 180);
                    
                    // Calculate position for text label
                    const textRadius = config.gaugeDimensions.humidityRadius;
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
                    if (humidity === humidityConfig.minHumidity || humidity === humidityConfig.maxHumidity) {
                        text.setAttribute('opacity', '0');
                    } else {
                        text.setAttribute('opacity', '1');
                    }
                    
                    // Add text shadow for better readability against gradient
                    text.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.8);');
                    
                    // Set the text content
                    text.textContent = `${humidity}%`;
                    
                    // Add text to group
                    markerGroup.appendChild(text);
                    
                    // Position and rotate the group
                    markerGroup.setAttribute('transform', `translate(${textX}, ${textY}) rotate(${angle})`);
                    
                    // Add the marker group to the markers container
                    markers.appendChild(markerGroup);
                }
                
                console.log('Humidity scale markers created successfully');
                resolve(true);
            };
            
            // Start the attempt process
            attemptCreate();
            
        } catch (error) {
            console.error('Error creating humidity scale markers:', error);
            resolve(false);
        }
    });
}

/**
 * Update the humidity gauge with a new value
 * @param {number} humidity - The humidity value to display
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function updateHumidityGauge(humidity) {
    return new Promise((resolve) => {
        try {
            console.log(`Updating humidity gauge to ${humidity}%`);
            
            // Verify document ready state
            console.log(`Document ready state: ${document.readyState}`);
            
            // Get the gauge path element
            const gaugePath = document.getElementById('humidity-arc');
            const valueDisplay = document.getElementById('humidity-value');
            
            if (!gaugePath) {
                console.error('Humidity gauge arc element not found');
                // Check if SVG exists
                const svg = document.querySelector('.gauge-svg');
                if (!svg) {
                    console.error('SVG container not found!');
                } else {
                    console.log('SVG container found');
                    // Log all elements with IDs in the SVG
                    const svgElementsWithId = svg.querySelectorAll('[id]');
                    console.log(`Found ${svgElementsWithId.length} SVG elements with IDs:`);
                    svgElementsWithId.forEach(el => {
                        console.log(`- ${el.id || 'no-id'} (${el.tagName})`);
                    });
                }
                resolve(false);
                return;
            }
            
            if (!valueDisplay) {
                console.warn('Humidity value display element not found');
                // Continue with gauge update even if value display is missing
            }
            
            // Ensure humidity is within range
            humidity = Math.max(humidityConfig.minHumidity, Math.min(humidity, humidityConfig.maxHumidity));
            
            // Calculate the angle for the current humidity using the shared utility function
            const currentAngle = calculateAngle(
                humidity,
                humidityConfig.minHumidity,
                humidityConfig.maxHumidity,
                humidityConfig.startAngle,
                humidityConfig.endAngle
            );
            
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
            
            // Update the value display if it exists
            if (valueDisplay) {
                valueDisplay.textContent = humidity.toFixed(0);
            }
            
            console.log('Humidity gauge updated successfully');
            resolve(true);
        } catch (error) {
            console.error('Error updating humidity gauge:', error);
            resolve(false);
        }
    });
}

/**
 * Test function to animate the humidity gauge
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export async function testHumidityGauge() {
    try {
        console.log('Testing humidity gauge...');
        
        // Store the current humidity to restore later
        const valueElement = document.getElementById('humidity-value');
        const currentHumidity = valueElement ? valueElement.textContent : '50';
        
        // Test with values across the full range
        let humidity = humidityConfig.minHumidity;
        const steps = 50;
        const humidityStep = (humidityConfig.maxHumidity - humidityConfig.minHumidity) / steps;
        
        // Create a promise that resolves when the animation is complete
        return new Promise((resolve) => {
            // Update the gauge with each value at intervals
            const intervalId = setInterval(async () => {
                await updateHumidityGauge(humidity);
                
                humidity += humidityStep;
                if (humidity > humidityConfig.maxHumidity) {
                    clearInterval(intervalId);
                    
                    // Restore the original humidity after a delay
                    setTimeout(async () => {
                        await updateHumidityGauge(parseFloat(currentHumidity) || 50);
                        console.log('Humidity gauge test complete');
                        resolve(true);
                    }, 1000);
                }
            }, 50);
        });
    } catch (error) {
        console.error('Error testing humidity gauge:', error);
        return false;
    }
}
