// Pressure gauge implementation
import { config } from '../config.js';
import { createGradientStops, createArcPath, calculateAngle } from '../gauge-utils.js';

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
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function createPressureScaleMarkers() {
    return new Promise((resolve) => {
        try {
            console.log('Creating pressure scale markers...');
            let retryCount = 0;
            const maxRetries = 15; // Increased max retries
            
            // Function to attempt to create markers
            const attemptCreate = () => {
                // Verify document ready state
                console.log(`Document ready state: ${document.readyState}`);
                
                // Try to get the markers element
                const markers = document.getElementById('pressure-markers');
                if (!markers) {
                    retryCount++;
                    console.error(`Pressure markers element not found (attempt ${retryCount}/${maxRetries})`);
                    
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
                    
                    console.error('Maximum retries reached. Could not find pressure markers element.');
                    resolve(false);
                    return;
                }
                
                // Clear any existing markers
                while (markers.firstChild) {
                    markers.removeChild(markers.firstChild);
                }
                
                // Create markers at 20 hPa intervals
                for (let pressure = pressureConfig.minPressure; pressure <= pressureConfig.maxPressure; pressure += 20) {
                    // Calculate angle based on pressure
                    const angle = calculateAngle(
                        pressure,
                        pressureConfig.minPressure,
                        pressureConfig.maxPressure,
                        pressureConfig.startAngle,
                        pressureConfig.endAngle
                    );
                    const radians = angle * (Math.PI / 180);
                    
                    // Calculate position for text label
                    const textRadius = config.gaugeDimensions.pressureRadius;
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
                    if (pressure === pressureConfig.minPressure || pressure === pressureConfig.maxPressure) {
                        text.setAttribute('opacity', '0');
                    } else {
                        text.setAttribute('opacity', '1');
                    }
                    
                    // Add text shadow for better readability against gradient
                    text.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.8);');
                    
                    // Set the text content
                    text.textContent = `${pressure}`;
                    
                    // Add text to group
                    markerGroup.appendChild(text);
                    
                    // Position and rotate the group
                    markerGroup.setAttribute('transform', `translate(${textX}, ${textY}) rotate(${angle})`);
                    
                    // Add the marker group to the markers container
                    markers.appendChild(markerGroup);
                }
                
                console.log('Pressure scale markers created successfully');
                resolve(true);
            };
            
            // Start the attempt process
            attemptCreate();
            
        } catch (error) {
            console.error('Error creating pressure scale markers:', error);
            resolve(false);
        }
    });
}

/**
 * Update the pressure gauge with a new value
 * @param {number} pressure - The pressure value to display
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export function updatePressureGauge(pressure) {
    return new Promise((resolve) => {
        try {
            console.log(`Updating pressure gauge to ${pressure} hPa`);
            
            // Verify document ready state
            console.log(`Document ready state: ${document.readyState}`);
            
            // Get the gauge path element
            const gaugePath = document.getElementById('pressure-arc');
            const valueDisplay = document.getElementById('pressure-value');
            
            if (!gaugePath) {
                console.error('Pressure gauge arc element not found');
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
                console.warn('Pressure value display element not found');
                // Continue with gauge update even if value display is missing
            }
            
            // Ensure pressure is within range
            pressure = Math.max(pressureConfig.minPressure, Math.min(pressure, pressureConfig.maxPressure));
            
            // Calculate the angle for the current pressure using the shared utility function
            const currentAngle = calculateAngle(
                pressure,
                pressureConfig.minPressure,
                pressureConfig.maxPressure,
                pressureConfig.startAngle,
                pressureConfig.endAngle
            );
            
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
            
            // Update the value display if it exists
            if (valueDisplay) {
                valueDisplay.textContent = pressure.toFixed(0);
            }
            
            console.log('Pressure gauge updated successfully');
            resolve(true);
        } catch (error) {
            console.error('Error updating pressure gauge:', error);
            resolve(false);
        }
    });
}

/**
 * Test function to animate the pressure gauge
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
export async function testPressureGauge() {
    try {
        console.log('Testing pressure gauge...');
        
        // Store the current pressure to restore later
        const valueElement = document.getElementById('pressure-value');
        const currentPressure = valueElement ? valueElement.textContent : '1013';
        
        // Test with values across the full range
        let pressure = pressureConfig.minPressure;
        const steps = 50;
        const pressureStep = (pressureConfig.maxPressure - pressureConfig.minPressure) / steps;
        
        // Create a promise that resolves when the animation is complete
        return new Promise((resolve) => {
            // Update the gauge with each value at intervals
            const intervalId = setInterval(async () => {
                await updatePressureGauge(pressure);
                
                pressure += pressureStep;
                if (pressure > pressureConfig.maxPressure) {
                    clearInterval(intervalId);
                    
                    // Restore the original pressure after a delay
                    setTimeout(async () => {
                        await updatePressureGauge(parseFloat(currentPressure) || 1013);
                        console.log('Pressure gauge test complete');
                        resolve(true);
                    }, 1000);
                }
            }, 50);
        });
    } catch (error) {
        console.error('Error testing pressure gauge:', error);
        return false;
    }
}
