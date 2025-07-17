// Test script for verifying gauge configurations
// Optimized for performance and clarity
import { updateTemperatureGauge, updateSecondaryTemperatureGauge, updateHumidityGauge, updatePressureGauge } from './gauge-manager.js';

/**
 * Main entry point for testing all gauges
 * Runs a comprehensive test of all gauge displays
 */
export function testGauges() {
    // Run the optimized gauge sweep test
    testGaugeSweep();
}

/**
 * Comprehensive test for all gauges with optimized animation
 * Sweeps through the full range of values for all gauges
 */
function testGaugeSweep() {
    try {
        // Define gauge ranges with consistent structure
        const gaugeRanges = {
            temperature: { min: -10, max: 40, increment: 2 },
            secondaryTemp: { min: 5, max: 40, increment: 2 },
            humidity: { min: 0, max: 100, increment: 4 },
            pressure: { min: 950, max: 1050, increment: 5 }
        };
        
        // Initialize current values
        const currentValues = {
            temperature: gaugeRanges.temperature.min,
            secondaryTemp: gaugeRanges.secondaryTemp.min,
            humidity: gaugeRanges.humidity.min,
            pressure: gaugeRanges.pressure.min
        };
        
        // Store original values to restore later (with safe defaults)
        const originalValues = {
            temperature: parseFloat(document.getElementById('temperature-value')?.textContent || '20'),
            secondaryTemp: parseFloat(document.getElementById('secondary-temp-value')?.textContent || '20'),
            humidity: parseFloat(document.getElementById('humidity-value')?.textContent || '50'),
            pressure: parseFloat(document.getElementById('pressure-value')?.textContent || '1013')
        };
        
        // Use requestAnimationFrame for smoother animation
        let animationId;
        const startTime = performance.now();
        const duration = 5000; // 5 seconds total
        
        // Animation function
        function animate(timestamp) {
            // Calculate progress (0 to 1)
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Update all gauges
            updateTemperatureGauge(currentValues.temperature);
            updateSecondaryTemperatureGauge(currentValues.secondaryTemp);
            updateHumidityGauge(currentValues.humidity);
            updatePressureGauge(currentValues.pressure);
            
            // Increment values with larger steps for faster sweep
            currentValues.temperature += gaugeRanges.temperature.increment;
            currentValues.secondaryTemp += gaugeRanges.secondaryTemp.increment;
            currentValues.humidity += gaugeRanges.humidity.increment;
            currentValues.pressure += gaugeRanges.pressure.increment;
            
            // Reset when reaching max values
            if (currentValues.temperature > gaugeRanges.temperature.max) {
                currentValues.temperature = gaugeRanges.temperature.min;
            }
            if (currentValues.secondaryTemp > gaugeRanges.secondaryTemp.max) {
                currentValues.secondaryTemp = gaugeRanges.secondaryTemp.min;
            }
            if (currentValues.humidity > gaugeRanges.humidity.max) {
                currentValues.humidity = gaugeRanges.humidity.min;
            }
            if (currentValues.pressure > gaugeRanges.pressure.max) {
                currentValues.pressure = gaugeRanges.pressure.min;
            }
            
            // Continue animation if not complete
            if (progress < 1) {
                animationId = requestAnimationFrame(animate);
            } else {
                // Animation complete, restore original values
                updateTemperatureGauge(originalValues.temperature);
                updateSecondaryTemperatureGauge(originalValues.secondaryTemp);
                updateHumidityGauge(originalValues.humidity);
                updatePressureGauge(originalValues.pressure);
            }
        }
        
        // Start animation
        animationId = requestAnimationFrame(animate);
        
    } catch (error) {
        console.error('Error in gauge sweep test:', error);
    }
}

// Secondary temperature gauge test function removed - consolidated into testTemperatureGaugeSweep

// Humidity and pressure gauge test functions removed - consolidated into testTemperatureGaugeSweep
