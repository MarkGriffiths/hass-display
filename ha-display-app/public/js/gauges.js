// Gauge visualization component
let gaugeInstances = {};

// Initialize gauges
function initGauges() {
    try {
        console.log('Initializing humidity gauge...');
        // Only initialize the humidity gauge since temperature uses custom gauge
        createGauge('humidity-gauge', 'Humidity', config.gauges.humidity);
    } catch (error) {
        console.error('Failed to initialize gauges:', error);
    }
}

// Create a gauge
function createGauge(containerId, title, gaugeConfig) {
    try {
        console.log(`Creating gauge: ${containerId}`);
        
        const container = document.getElementById(containerId);
        
        // Check if container exists
        if (!container) {
            console.error(`Gauge container '${containerId}' not found`);
            return null;
        }
        
        // Clear any existing content
        container.innerHTML = '';
        
        // Create gauge element with explicit dimensions
        const gaugeElement = document.createElement('div');
        gaugeElement.className = 'gauge';
        gaugeElement.id = `${containerId}-element`;
        gaugeElement.style.width = '200px';
        gaugeElement.style.height = '200px';
        container.appendChild(gaugeElement);
        
        // Create title element
        const titleElement = document.createElement('div');
        titleElement.className = 'gauge-title';
        titleElement.textContent = title;
        container.appendChild(titleElement);
        
        // Create value element
        const valueElement = document.createElement('div');
        valueElement.className = 'gauge-value';
        valueElement.id = `${containerId}-value`;
        valueElement.textContent = '-- ' + gaugeConfig.unit;
        container.appendChild(valueElement);
        
        // Wait for DOM to be ready
        setTimeout(() => {
            try {
                // Create a simple gauge using a different approach
                // First, create an SVG element manually
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', '200');
                svg.setAttribute('height', '200');
                svg.setAttribute('viewBox', '0 0 200 200');
                gaugeElement.appendChild(svg);
                
                // Create a circle for the gauge background
                const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                bgCircle.setAttribute('cx', '100');
                bgCircle.setAttribute('cy', '100');
                bgCircle.setAttribute('r', '80');
                bgCircle.setAttribute('fill', 'none');
                bgCircle.setAttribute('stroke', '#333');
                bgCircle.setAttribute('stroke-width', '20');
                svg.appendChild(bgCircle);
                
                // Create a circle for the gauge value
                const valueCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                valueCircle.setAttribute('cx', '100');
                valueCircle.setAttribute('cy', '100');
                valueCircle.setAttribute('r', '80');
                valueCircle.setAttribute('fill', 'none');
                valueCircle.setAttribute('stroke', '#2ecc71');
                valueCircle.setAttribute('stroke-width', '20');
                valueCircle.setAttribute('stroke-dasharray', '0 502'); // 2πr = 502
                valueCircle.setAttribute('transform', 'rotate(-90 100 100)');
                svg.appendChild(valueCircle);
                
                // Store gauge instance with our custom implementation
                gaugeInstances[containerId] = {
                    valueCircle,
                    valueElement,
                    config: gaugeConfig
                };
                
                // Initialize with 0
                updateGauge(containerId, 0);
                
                console.log(`Gauge ${containerId} created successfully`);
            } catch (error) {
                console.error(`Error creating gauge SVG for ${containerId}:`, error);
            }
        }, 0);
        
        return true;
    } catch (error) {
        console.error(`Error in createGauge for ${containerId}:`, error);
        return null;
    }
}

// Update gauge with new value
function updateGauge(gaugeId, value) {
    // Validate inputs
    if (!gaugeId) {
        console.error('Invalid gauge ID');
        return;
    }
    
    if (value === null || value === undefined || isNaN(value)) {
        console.error(`Invalid value for gauge ${gaugeId}:`, value);
        return;
    }
    
    // Check if gauge exists
    if (!gaugeInstances[gaugeId]) {
        console.error(`Gauge ${gaugeId} not found`);
        return;
    }
    
    try {
        // Get the gauge instance
        const gaugeInstance = gaugeInstances[gaugeId];
        
        // Update the SVG circle dash array for our custom gauge
        if (gaugeInstance.valueCircle) {
            const config = gaugeInstance.config;
            const percentage = Math.min(Math.max(value / config.max, 0), 1);
            const circumference = 2 * Math.PI * 80; // 2πr where r=80
            const dashLength = percentage * circumference;
            const dashArray = `${dashLength} ${circumference - dashLength}`;
            
            // Update the stroke color based on value ranges
            let strokeColor = '#cccccc'; // Default color
            for (const range of config.colorRanges) {
                if (value >= range.start && value <= range.end) {
                    strokeColor = range.color;
                    break;
                }
            }
            
            // Apply the updates to the SVG
            gaugeInstance.valueCircle.setAttribute('stroke-dasharray', dashArray);
            gaugeInstance.valueCircle.setAttribute('stroke', strokeColor);
            
            // Update value display
            if (gaugeInstance.valueElement) {
                gaugeInstance.valueElement.textContent = `${value.toFixed(1)} ${config.unit}`;
                gaugeInstance.valueElement.style.color = strokeColor;
            }
            
            console.log(`Updated gauge ${gaugeId} to value ${value}`);
        }
    } catch (error) {
        console.error(`Error updating gauge ${gaugeId}:`, error);
    }
}
