// Charts visualization component
let chartInstances = {};
const MAX_DATA_POINTS = 24; // Keep 24 data points (e.g., 24 hours of data)

// Initialize charts
function initCharts() {
    // Temperature chart only
    createChart('temperature-chart', 'Temperature History', 'temperature', '°C', '#3498db');
    
    // Humidity chart removed
}

// Create a chart
function createChart(containerId, title, dataType, unit, color) {
    const container = document.getElementById(containerId);
    
    // Check if container exists
    if (!container) {
        console.error(`Chart container '${containerId}' not found`);
        return;
    }
    
    // Create canvas for Chart.js
    const canvas = document.createElement('canvas');
    canvas.id = `${containerId}-canvas`;
    container.appendChild(canvas);
    
    // Initialize data
    const labels = Array(MAX_DATA_POINTS).fill('');
    const data = Array(MAX_DATA_POINTS).fill(null);
    
    // Create chart
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
                legend: {
                    display: false
                },
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
                x: {
                    display: false
                },
                y: {
                    display: false,
                    suggestedMin: dataType === 'temperature' ? 
                        config.gauges.temperature.min : config.gauges.humidity.min,
                    suggestedMax: dataType === 'temperature' ? 
                        config.gauges.temperature.max : config.gauges.humidity.max
                }
            },
            animation: {
                duration: 1000
            }
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

// Add data point to chart
function addChartData(chartId, value, timestamp) {
    // Check if chart ID exists
    if (!chartId) {
        console.error('Invalid chart ID');
        return;
    }
    
    // Check if value is valid
    if (value === null || value === undefined || isNaN(value)) {
        console.error(`Invalid value for chart ${chartId}:`, value);
        return;
    }
    
    const chart = chartInstances[chartId];
    if (!chart) {
        console.error(`Chart ${chartId} not found`);
        return;
    }
    
    const instance = chartInstances[chartId];
    
    // Format timestamp
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Remove first data point and add new one at the end
    instance.data.shift();
    instance.data.push(value);
    
    // Update labels
    instance.labels.shift();
    instance.labels.push(timeStr);
    
    // Update chart data
    instance.chart.data.labels = instance.labels;
    instance.chart.data.datasets[0].data = instance.data;
    
    // Update chart
    instance.chart.update();
}
