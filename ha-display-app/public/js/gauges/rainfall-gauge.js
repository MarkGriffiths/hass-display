// Rainfall gauge module
// Handles rainfall gauge functionality

import { config } from '../config.js';
import { createArcPath, createScaleMarkers, calculateAngle, createGradientStops } from './gauge-utils.js';

/**
 * Create the rainfall gradient for the gauge
 * @returns {boolean} True if successful, false otherwise
 */
export function createRainfallGradient() {
    try {
        const gradientId = 'rainfall-gradient';
        const gradient = document.getElementById(gradientId);
        
        if (!gradient) {
            console.error(`Gradient element ${gradientId} not found`);
            return false;
        }
        
        // Clear existing stops
        while (gradient.firstChild) {
            gradient.removeChild(gradient.firstChild);
        }
        
        // Get color stops from config
        const rainfallConfig = config.gauges.rainfall;
        const colorStops = rainfallConfig.colorStops;
        
        if (!colorStops || colorStops.length === 0) {
            console.error('No color stops defined for rainfall gauge');
            return false;
        }
        
        // Create gradient stops based on configuration
        const stops = createGradientStops(
            gradientId,
            colorStops,
            rainfallConfig.min,
            rainfallConfig.max
        );
        
        // Add stops to the gradient
        stops.forEach(stop => {
            const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stopElement.setAttribute('offset', stop.offset);
            stopElement.setAttribute('stop-color', stop.color);
            gradient.appendChild(stopElement);
        });
        
        console.log(`Created ${stops.length} gradient stops for rainfall gauge`);
        return true;
    } catch (error) {
        console.error('Error creating rainfall gradient:', error);
        return false;
    }
}

/**
 * Create rainfall scale markers
 * @returns {Promise<boolean>} Promise that resolves to true if successful
 */
export async function createRainfallMarkers() {
    try {
        const markersContainer = document.getElementById('rainfall-markers');
        if (!markersContainer) {
            console.error('Rainfall markers container not found');
            return false;
        }

        // Clear existing markers
        markersContainer.innerHTML = '';

        // Create markers for rainfall
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = config.gaugeDimensions.rainfallRadius;
        const startAngle = config.gauges.rainfall.startAngle;
        const endAngle = config.gauges.rainfall.endAngle;
        const min = config.gauges.rainfall.min;
        const max = config.gauges.rainfall.max;

        // Create scale markers with labels
        const markers = [
            { value: 0, label: '0' },
            { value: 25, label: '25' },
            { value: 50, label: '50' },
            { value: 75, label: '75' },
            { value: 100, label: '100' }
        ];

        // Use the enhanced createScaleMarkers utility with options
        const result = createScaleMarkers(
            'rainfall-markers',
            centerX,
            centerY,
            radius,
            min,
            max,
            25, // Step size between markers (0, 25, 50, 75, 100)
            startAngle,
            endAngle,
            'mm', // No unit
            {
                hideMinMax: true, // Show all values including min/max for rainfall
                fontSize: '0.6rem',
                filterValue: null // Show all values
            }
        );

        if (!result) {
            console.error('Failed to create rainfall markers');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error creating rainfall markers:', error);
        return false;
    }
}

/**
 * Update the rainfall gauge with new value
 * @param {number} rainfall - Rainfall value in mm
 * @param {boolean} initializing - Whether this is the initial update
 * @returns {boolean} - True if successful
 */
export function updateRainfallGauge(rainTodayValue, initializing = false) {
    try {
        // Get the rainfall gauge elements
        const rainfallPath = document.getElementById('rainfall-arc');
        const rainfallBackground = document.querySelector('.rainfall-background');
        const rainfallMarkers = document.getElementById('rainfall-markers');
        const gaugeSvg = document.querySelector('.gauge-svg');

        if (!rainfallPath || !rainfallBackground || !rainfallMarkers || !gaugeSvg) {
            console.error('Rainfall gauge elements not found');
            return false;
        }

        // Always ensure the background path is properly set
        const centerX = config.gaugeDimensions.centerX;
        const centerY = config.gaugeDimensions.centerY;
        const radius = config.gaugeDimensions.rainfallRadius;
        const startAngle = config.gauges.rainfall.startAngle;
        const endAngle = config.gauges.rainfall.endAngle;
        
        // Get current rain (rain last hour) value from global state using config entity
        const rainLastHourEntity = config.entities.rainLastHour;
        const currentRainValue = rainLastHourEntity ? window.hassStates?.[rainLastHourEntity]?.state || 0 : 0;
        const hasCurrentRain = parseFloat(currentRainValue) > 0;
        
        // Parse rainTodayValue to ensure it's a number
        rainTodayValue = parseFloat(rainTodayValue) || 0;
        
        // Debug logging for entity values
        console.log('DEBUG - Rain entities:', {
            rainTodayValue,
            rainTodayType: typeof rainTodayValue,
            rainLastHourEntity,
            currentRainValue,
            hasCurrentRain
        });
        
        // Create the background arc path
        const backgroundPath = createArcPath(centerX, centerY, radius, startAngle, endAngle, false);
        
        // Force SVG to redraw by ensuring viewBox is set correctly
        if (!gaugeSvg.getAttribute('viewBox')) {
            gaugeSvg.setAttribute('viewBox', '0 0 720 720');
        }
        
        // Ensure rain today value is within bounds
        const min = config.gauges.rainfall.min;
        const max = config.gauges.rainfall.max;
        rainTodayValue = Math.max(min, Math.min(max, rainTodayValue));

        // Calculate angle based on rain today value
        // Ensure small rain values still create a visible arc (minimum 5 degrees)
        let angle = calculateAngle(rainTodayValue, min, max, startAngle, endAngle);
        
        // If rain is detected but the angle is too close to startAngle, make it at least 5 degrees different
        // This ensures small rainfall values still create a visible arc
        if (rainTodayValue > 0 && Math.abs(angle - startAngle) < 5) {
            console.log(`Adjusting small rainfall angle from ${angle}° to ${startAngle + 5}° for better visibility`);
            angle = startAngle + 5;
        }
        
        // Create the arc path for the rainfall gauge
        const arcPath = createArcPath(centerX, centerY, radius, startAngle, angle, false);
        
        // CRITICAL: Set explicit SVG attributes for both paths
        // These must be set BEFORE checking visibility
        
        // Set attributes for the rainfall background
        rainfallBackground.setAttribute('d', backgroundPath);
        rainfallBackground.setAttribute('stroke-width', '16');
        
        // Set attributes for the rainfall path
        rainfallPath.setAttribute('d', arcPath);
        rainfallPath.setAttribute('stroke-width', '16');
        
        // Explicitly set the SVG attributes to ensure proper rendering
        // Using explicit pixel values instead of percentages
        rainfallPath.setAttribute('stroke-opacity', '1');
        rainfallBackground.setAttribute('stroke-opacity', '1');
        
        // Ensure the rainfall gauge is properly positioned in the SVG stacking context
        // Move the rainfall elements to be after the pressure elements in the DOM if needed
        const pressureArc = document.getElementById('pressure-arc');
        if (pressureArc && pressureArc.nextSibling !== rainfallBackground) {
            // Only reorder if needed to avoid unnecessary DOM operations
            const parent = pressureArc.parentNode;
            if (parent) {
                // Ensure proper ordering: pressure -> rainfall -> secondary temp
                const secondaryTempBackground = document.querySelector('.secondary-temp-background');
                if (secondaryTempBackground) {
                    parent.insertBefore(rainfallBackground, secondaryTempBackground);
                    parent.insertBefore(rainfallPath, secondaryTempBackground);
                }
            }
        }
        
        // Check if we should show or hide the gauge
        if (rainTodayValue <= 0 && !hasCurrentRain && !initializing) {
            // Only hide if there's no rain today AND no current rain
            rainfallPath.style.display = 'none';
            rainfallBackground.style.display = 'none';
            rainfallMarkers.style.display = 'none';
            console.log(`Hiding rainfall gauge: rain today=${rainTodayValue}mm, current rain=${currentRainValue}mm`);
        } else {
            // Show if there's rain today OR current rain
            console.log('DEBUG - Setting rainfall gauge to visible');
            
            // IMPORTANT: Use explicit style.display = 'block' to ensure visibility
            rainfallPath.style.display = 'block';
            rainfallBackground.style.display = 'block';
            rainfallMarkers.style.display = 'block';
            
            // Also remove any display attributes that might be overriding the style
            rainfallPath.removeAttribute('display');
            rainfallBackground.removeAttribute('display');
            rainfallMarkers.removeAttribute('display');
            
            // Debug element visibility state after setting
            console.log('DEBUG - Rainfall elements after setting display:', {
                pathDisplay: rainfallPath.getAttribute('display') || 'not set',
                backgroundDisplay: rainfallBackground.getAttribute('display') || 'not set',
                markersDisplay: rainfallMarkers.getAttribute('display') || 'not set',
                pathStyleDisplay: rainfallPath.style.display,
                backgroundStyleDisplay: rainfallBackground.style.display,
                markersStyleDisplay: rainfallMarkers.style.display
            });
            
            console.log(`Showing rainfall gauge: rain today=${rainTodayValue}mm, current rain=${currentRainValue}mm`);
        }
        
        // Log the update with detailed information
        if (!initializing) {
            console.log(`Updated rainfall gauge: rain today=${rainTodayValue}mm, angle: ${angle}\u00b0, path: ${arcPath}`);
            console.log(`Rainfall path attributes: d=${rainfallPath.getAttribute('d')}, stroke-width=${rainfallPath.getAttribute('stroke-width')}`);
        } else {
            console.log(`Initialized rainfall gauge with path: ${arcPath}`);
        }

        return true;
    } catch (error) {
        console.error('Error updating rainfall gauge:', error);
        return false;
    }
}
