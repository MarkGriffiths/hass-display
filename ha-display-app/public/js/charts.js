// Charts visualization component - optimized for performance
let chartInstances = {};
const MAX_DATA_POINTS = 24; // Keep 24 data points (e.g., 24 hours of data)

/**
 * Initialize charts with lazy loading
 * Only creates charts when the container is visible
 */
function initCharts() {
    // Only initialize temperature chart - optimized for startup performance
    // Defer chart creation until after critical UI elements are loaded
    setTimeout(() => {
        createChart('temperature-chart', 'Temperature History', 'temperature', '°C', '#3498db');
    }, 100);
}

/**
 * Create a chart with optimized performance settings
 * @param {string} containerId - ID of the container element
 * @param {string} title - Chart title
 * @param {string} dataType - Type of data (temperature, humidity, etc.)
 * @param {string} unit - Unit of measurement
 * @param {string} color - Chart color
 * @returns {Object} Chart instance
 */
function createChart(containerId, title, dataType, unit, color) {
    const container = document.getElementById(containerId);
    
    // Check if container exists - fail fast
    if (!container) {
        console.error(`Chart container '${containerId}' not found`);
        return null;
    }
    
    // Check if chart already exists - prevent duplicates
    if (chartInstances[containerId]) {
        return chartInstances[containerId].chart;
    }
    
    // Create canvas for Chart.js
    const canvas = document.createElement('canvas');
    canvas.id = `${containerId}-canvas`;
    container.appendChild(canvas);
    
    // Initialize data with optimized arrays
    const labels = new Array(MAX_DATA_POINTS).fill('');
    const data = new Array(MAX_DATA_POINTS).fill(null);
    
    // Get min/max values for the chart based on dataType
    const minValue = dataType === 'temperature' ? 
        (config.gauges?.temperature?.min || -10) : 
        (config.gauges?.humidity?.min || 0);
    const maxValue = dataType === 'temperature' ? 
        (config.gauges?.temperature?.max || 40) : 
        (config.gauges?.humidity?.max || 100);
    
    // Create chart with optimized options
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                borderColor: color,
                backgroundColor: `${color}33`, // Add transparency
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} ${unit}`;
                        }
                    }
                }
            },
            scales: {
                x: { display: false },
                y: {
                    display: false,
                    suggestedMin: minValue,
                    suggestedMax: maxValue
                }
            },
            animation: {
                duration: 500 // Reduced animation time for better performance
            },
            // Disable hover animations for better performance
            hover: { animationDuration: 0 }
        }
    });
    
    // Store chart instance
    chartInstances[containerId] = {
        chart,
        data,
        labels,
        dataType
    };
    
    return chart;
}

/**
 * Add data point to chart with optimized performance
 * @param {string} chartId - ID of the chart container
 * @param {number} value - Data value to add
 * @param {number|string} timestamp - Timestamp for the data point
 */
function addChartData(chartId, value, timestamp) {
    // Fast validation - fail early
    if (!chartId || value === null || value === undefined || isNaN(value)) {
        return;
    }
    
    const instance = chartInstances[chartId];
    if (!instance) {
        return;
    }
    
    // Format timestamp efficiently
    let timeStr = '';
    if (timestamp) {
        const date = new Date(timestamp);
        timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Efficient array updates
    instance.data.shift();
    instance.data.push(value);
    instance.labels.shift();
    instance.labels.push(timeStr);
    
    // Update chart with minimal redraws
    // Use a requestAnimationFrame to batch updates if multiple charts are updated in the same frame
    if (!instance.updatePending) {
        instance.updatePending = true;
        requestAnimationFrame(() => {
            if (instance.chart) {
                instance.chart.data.labels = instance.labels;
                instance.chart.data.datasets[0].data = instance.data;
                instance.chart.update('none'); // Use 'none' mode for faster updates
                instance.updatePending = false;
            }
        });
    }
}
