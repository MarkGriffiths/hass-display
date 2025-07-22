// Configuration for the Home Assistant connection and display settings
export const config = {
    // Home Assistant connection settings
    homeAssistant: {
        url: '', // Will be loaded from backend
        accessToken: '', // Will be loaded from backend
    },

    // Entities to monitor - will be loaded from backend
    entities: {
        temperature: '',
        temperatureTrend: '',
        humidity: '',
        pressure: '',
        pressureTrend: '',
        temperatureSecondary: '',
        temperatureSecondaryTrend: '',
        humiditySecondary: '',
        co2: '',
        weather: '',
        sun: '',
        rain: '',
        rainLastHour: '',
        rainToday: '',
        windAngle: '',    // Wind direction angle
        windSpeed: '',    // Wind speed in km/h
        gustAngle: '',    // Gust direction angle
        gustSpeed: '',    // Gust speed in km/h
        // Add more entities as needed
    },

    // Display settings
    display: {
        width: 720,
        height: 720,
        refreshInterval: 30000, // Update interval in milliseconds (30 seconds)
        showRainView: false,    // Toggle between rain and normal conditions view
    },
    
    // Weather icon mapping
    weather: {
        // Default icons for unknown weather states
        defaultIcons: {
            day: 'wi-day-sunny',
            night: 'wi-night-clear'
        },
        // Mapping of weather states to icon classes
        iconMapping: {
            'clear-night': { day: 'wi-stars', night: 'wi-stars' },
            'cloudy': { day: 'wi-cloudy', night: 'wi-night-alt-cloudy' },
            'exceptional': { day: 'wi-day-sunny', night: 'wi-night-clear' },
            'fog': { day: 'wi-day-fog', night: 'wi-night-fog' },
            'hail': { day: 'wi-day-hail', night: 'wi-night-alt-hail' },
            'lightning': { day: 'wi-day-lightning', night: 'wi-night-alt-lightning' },
            'lightning-rainy': { day: 'wi-day-thunderstorm', night: 'wi-night-alt-thunderstorm' },
            'partlycloudy': { day: 'wi-day-cloudy', night: 'wi-night-alt-cloudy' },
            'pouring': { day: 'wi-rain', night: 'wi-night-alt-rain' },
            'rainy': { day: 'wi-sprinkle', night: 'wi-night-alt-sprinkle' },
            'snowy': { day: 'wi-snow', night: 'wi-night-snow' },
            'snowy-rainy': { day: 'wi-sleet', night: 'wi-night-sleet' },
            'sunny': { day: 'wi-day-sunny', night: 'wi-night-clear' },
            'windy': { day: 'wi-windy', night: 'wi-night-alt-cloudy-windy' },
            'windy-variant': { day: 'wi-cloudy-gusts', night: 'wi-night-alt-cloudy-gusts' }
        }
    },

    // Common gauge dimensions and parameters
    gaugeDimensions: {
        centerX: 360,
        centerY: 360,
        mainRadius: 300,       // Main temperature gauge radius
        secondaryRadius: 316,  // Secondary temperature gauge radius
        humidityRadius: 250,   // Humidity gauge radius
        pressureRadius: 223,   // Pressure gauge radius
        rainfallRadius: 200,   // Rainfall gauge radius (inside humidity gauge)
    },

    // Gauge settings
    gauges: {
        temperature: {
            min: -10,
            startAngle: 180,  // Start angle in degrees (left)
            endAngle: 360,    // End angle in degrees (bottom)
            max: 40,
            unit: '°C',
            colorStops: [
                { temp: -10, color: '#00a2ff' },  // Cold (blue)
                { temp: 0, color: '#2196F3' },    // Cool (light blue)
                { temp: 10, color: '#4caf50' },   // Cool (green)
                { temp: 15, color: '#8BC34A' },   // Mild (light green)
                { temp: 20, color: '#CDDC39' },   // Comfortable (lime)
                { temp: 26, color: '#FFC107' },   // Warm (yellow)
                { temp: 32, color: '#FF9800' },   // Hot (orange)
                { temp: 36, color: '#FF5722' },   // Very hot (deep orange)
                { temp: 40, color: '#f44336' }    // Very hot (red)
            ]
        },
        temperatureSecondary: {
            min: 5,
            max: 40,
            startAngle: 160,    // Start angle in degrees (right)
            endAngle: 20,    // End angle in degrees (bottom)
            unit: '°C',
            colorStops: [
                { temp: 5, color: '#00a2ff' },   // Cold (blue)
                { temp: 10, color: '#2196F3' },  // Cool (light blue)
                { temp: 15, color: '#4caf50' },  // Cool (green)
                { temp: 20, color: '#8BC34A' },  // Mild (light green)
                { temp: 25, color: '#CDDC39' },  // Comfortable (lime)
                { temp: 30, color: '#FFC107' },  // Warm (yellow)
                { temp: 35, color: '#FF9800' },  // Hot (orange)
                { temp: 40, color: '#f44336' }   // Very hot (red)
            ]
        },
        humidity: {
            min: 0,
            max: 100,
            startAngle: 180,  // Start angle in degrees (bottom)
            endAngle: 360,     // End angle in degrees (right)
            unit: '%',
            colorStops: [
                { humidity: 0, color: '#FFEB3B' },    // Very dry (yellow)
                { humidity: 30, color: '#8BC34A' },   // Dry (light green)
                { humidity: 50, color: '#4CAF50' },   // Comfortable (green)
                { humidity: 70, color: '#03A9F4' },   // Humid (light blue)
                { humidity: 100, color: '#0D47A1' }   // Very humid (deep blue)
            ]
        },
        pressure: {
            min: 960,
            max: 1040,
            startAngle: 180,  // Start angle in degrees (bottom)
            endAngle: 360,   // End angle in degrees (left)
            unit: 'hPa',
            colorStops: [
                { pressure: 950, color: '#9C27B0' },      // Purple (very low pressure)
                { pressure: 975, color: '#3F51B5' },  // Blue (low pressure)
                { pressure: 1000, color: '#4CAF50' },   // Green (normal pressure)
                { pressure: 1025, color: '#FF9800' },  // Orange (high pressure)
                { pressure: 1040, color: '#F44336' }      // Red (very high pressure)
            ]
        },
        rainfall: {
            min: 0,
            max: 100,
            startAngle: 180,    // Start angle in degrees (bottom)
            endAngle: 360,    // End angle in degrees (right)
            unit: 'mm',
            colorStops: [
                { rainfall: 0, color: '#1E88E5' },    // Medium blue
                { rainfall: 25, color: '#1565C0' },    // Blue
                { rainfall: 50, color: '#0D47A1' },    // Dark blue
                { rainfall: 75, color: '#880E4F' },    // Deep purple/red
                { rainfall: 100, color: '#D50000' }    // Bright red
            ]
        }
    }
};
