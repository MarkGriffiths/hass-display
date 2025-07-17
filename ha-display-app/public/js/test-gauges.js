// Test script for verifying gauge configurations
import { updateTemperatureGauge, updateSecondaryTemperatureGauge, updateHumidityGauge, updatePressureGauge } from './gauge-manager.js';

// Function to test all gauges with different values
export function testGauges() {
    console.log('Starting gauge tests...');
    
    // Test temperature gauge with a granular sweep
    testTemperatureGaugeSweep();
}

// Test the temperature gauge with a granular 1°C sweep
function testTemperatureGaugeSweep() {
    try {
        console.log('Testing temperature gauges with granular 1°C increments...');
        
        // Get config values
        const tempConfig = {
            min: -10,
            max: 40
        };
        
        const secondaryConfig = {
            min: 5,
            max: 40
        };
        
        const humidityConfig = {
            min: 0,
            max: 100
        };
        
        const pressureConfig = {
            min: 950,
            max: 1050
        };
        
        // Start with minimum values
        let currentTemp = tempConfig.min;
        let currentSecondaryTemp = secondaryConfig.min;
        let currentHumidity = humidityConfig.min;
        let currentPressure = pressureConfig.min;
        
        // Store original values to restore later
        const originalTemp = document.getElementById('temperature-value')?.textContent || '20';
        const originalSecondaryTemp = document.getElementById('secondary-temp-value')?.textContent || '20';
        const originalHumidity = document.getElementById('humidity-value')?.textContent || '50';
        const originalPressure = document.getElementById('pressure-value')?.textContent || '1013';
        
        console.log('Starting test with values:', 
                    `Main temp: ${currentTemp}°C, `,
                    `Secondary temp: ${currentSecondaryTemp}°C, `,
                    `Humidity: ${currentHumidity}%, `,
                    `Pressure: ${currentPressure}hPa`);
        
        // Animate the gauges with 1°C increments
        const interval = setInterval(() => {
            // Update all gauges
            updateTemperatureGauge(currentTemp);
            updateSecondaryTemperatureGauge(currentSecondaryTemp);
            updateHumidityGauge(currentHumidity);
            updatePressureGauge(currentPressure);
            
            // Increment values
            currentTemp += 1;
            currentSecondaryTemp += 1;
            currentHumidity += 2;
            currentPressure += 2;
            
            // Reset when reaching max values
            if (currentTemp > tempConfig.max) {
                currentTemp = tempConfig.min;
            }
            
            if (currentSecondaryTemp > secondaryConfig.max) {
                currentSecondaryTemp = secondaryConfig.min;
            }
            
            if (currentHumidity > humidityConfig.max) {
                currentHumidity = humidityConfig.min;
            }
            
            if (currentPressure > pressureConfig.max) {
                currentPressure = pressureConfig.min;
            }
            
        }, 50); // Update every 50ms for faster animation
        
        // Stop after 10 seconds
        setTimeout(() => {
            clearInterval(interval);
            console.log('Test complete');
            
            // Restore original values
            setTimeout(() => {
                updateTemperatureGauge(parseFloat(originalTemp));
                updateSecondaryTemperatureGauge(parseFloat(originalSecondaryTemp));
                updateHumidityGauge(parseFloat(originalHumidity));
                updatePressureGauge(parseFloat(originalPressure));
            }, 500);
            
        }, 10000);
    } catch (error) {
        console.error('Error in temperature gauge sweep test:', error);
    }
}

// Secondary temperature gauge test function removed - consolidated into testTemperatureGaugeSweep

// Humidity and pressure gauge test functions removed - consolidated into testTemperatureGaugeSweep
