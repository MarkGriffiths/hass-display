// Test script for verifying gauge configurations
// Optimized for performance and clarity
import { updateTemperatureGauge, updateSecondaryTemperatureGauge, updateHumidityGauge, updatePressureGauge, updateRainfallGauge } from './gauge-manager.js';

/**
 * Main entry point for testing all gauges
 * Runs a comprehensive test of all gauge displays
 */
export function testGauges() {
    // Show test options dialog
    showTestOptions();
}

/**
 * Comprehensive test for all gauges with optimized animation
 * Sweeps through the full range of values for all gauges
 */
function testGaugeSweep() {
    try {
        // Define gauge ranges with consistent structure
        const gaugeRanges = {
            temperature: { min: -10, max: 40, increment: 0.2 },
            secondaryTemp: { min: 5, max: 40, increment: 0.2 },
            humidity: { min: 0, max: 100, increment: 0.5 },
            pressure: { min: 950, max: 1050, increment: 1 },
            rainfall: { min: 0, max: 100, increment: 0.5 }
        };

        // Initialize current values
        const currentValues = {
            temperature: gaugeRanges.temperature.min,
            secondaryTemp: gaugeRanges.secondaryTemp.min,
            humidity: gaugeRanges.humidity.min,
            pressure: gaugeRanges.pressure.min,
            rainfall: gaugeRanges.rainfall.min
        };

        // Store original values to restore later (with safe defaults)
        const originalValues = {
            temperature: parseFloat(document.getElementById('temperature-value')?.textContent || '20'),
            secondaryTemp: parseFloat(document.getElementById('secondary-temp-value')?.textContent || '20'),
            humidity: parseFloat(document.getElementById('humidity-value')?.textContent || '50'),
            pressure: parseFloat(document.getElementById('pressure-value')?.textContent || '1013'),
            rainfall: parseFloat(document.getElementById('rain-today-value')?.textContent || '0')
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
            updateRainfallGauge(currentValues.rainfall);

            // Increment values with larger steps for faster sweep
            currentValues.temperature += gaugeRanges.temperature.increment;
            currentValues.secondaryTemp += gaugeRanges.secondaryTemp.increment;
            currentValues.humidity += gaugeRanges.humidity.increment;
            currentValues.pressure += gaugeRanges.pressure.increment;
            currentValues.rainfall += gaugeRanges.rainfall.increment;

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
            if (currentValues.rainfall > gaugeRanges.rainfall.max) {
                currentValues.rainfall = gaugeRanges.rainfall.min;
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
                updateRainfallGauge(originalValues.rainfall);
            }
        }

        // Start animation
        animationId = requestAnimationFrame(animate);

    } catch (error) {
        console.error('Error in gauge sweep test:', error);
    }
}

/**
 * Test specifically for rainfall gauge auto-scaling
 * Tests each of the rainfall bands: 0-3mm, 0-10mm, 0-50mm, 0-100mm
 */
function testRainfallAutoScaling() {
    try {
        // Store original value to restore later
        const originalValue = parseFloat(document.getElementById('rain-today-value')?.textContent || '0');
        
        // Define test values for each band
        const testValues = [
            { value: 0, delay: 1000, label: 'No rain' },
            { value: 1.5, delay: 2000, label: '0-3mm band' },
            { value: 7, delay: 2000, label: '0-10mm band' },
            { value: 35, delay: 2000, label: '0-50mm band' },
            { value: 90, delay: 2000, label: '0-100mm band' },
            { value: originalValue, delay: 0, label: 'Original value' } // Return to original value
        ];
        
        // Create status display
        const statusElement = document.createElement('div');
        statusElement.id = 'test-status';
        statusElement.style.position = 'fixed';
        statusElement.style.bottom = '80px';
        statusElement.style.left = '50%';
        statusElement.style.transform = 'translateX(-50%)';
        statusElement.style.background = 'rgba(0,0,0,0.7)';
        statusElement.style.color = 'white';
        statusElement.style.padding = '10px 20px';
        statusElement.style.borderRadius = '5px';
        statusElement.style.zIndex = '1000';
        statusElement.style.fontSize = '18px';
        statusElement.textContent = 'Testing rainfall auto-scaling...';
        document.body.appendChild(statusElement);
        
        // Run tests sequentially
        let currentIndex = 0;
        
        function runNextTest() {
            if (currentIndex >= testValues.length) {
                // All tests complete, remove status element
                document.body.removeChild(statusElement);
                return;
            }
            
            const test = testValues[currentIndex];
            statusElement.textContent = `Testing: ${test.label} (${test.value}mm)`;
            
            // Update the rainfall gauge
            updateRainfallGauge(test.value);
            
            // Move to next test after delay
            currentIndex++;
            setTimeout(runNextTest, test.delay);
        }
        
        // Start the test sequence
        runNextTest();
        
    } catch (error) {
        console.error('Error in rainfall auto-scaling test:', error);
    }
}

/**
 * Show a dialog with test options
 */
function showTestOptions() {
    // Create dialog container
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.background = '#222';
    dialog.style.color = 'white';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '10px';
    dialog.style.zIndex = '1000';
    dialog.style.minWidth = '300px';
    dialog.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Select Test';
    title.style.marginTop = '0';
    title.style.marginBottom = '20px';
    title.style.textAlign = 'center';
    dialog.appendChild(title);
    
    // Add test options
    const tests = [
        { name: 'All Gauges Sweep', fn: testGaugeSweep },
        { name: 'Rainfall Auto-Scaling', fn: testRainfallAutoScaling },
    ];
    
    tests.forEach(test => {
        const button = document.createElement('button');
        button.textContent = test.name;
        button.style.display = 'block';
        button.style.width = '100%';
        button.style.padding = '10px';
        button.style.margin = '10px 0';
        button.style.background = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '16px';
        
        button.addEventListener('click', () => {
            document.body.removeChild(dialog);
            test.fn();
        });
        
        dialog.appendChild(button);
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Cancel';
    closeButton.style.display = 'block';
    closeButton.style.width = '100%';
    closeButton.style.padding = '10px';
    closeButton.style.margin = '10px 0';
    closeButton.style.background = '#f44336';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    
    closeButton.addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
    
    dialog.appendChild(closeButton);
    
    // Add to document
    document.body.appendChild(dialog);
}
