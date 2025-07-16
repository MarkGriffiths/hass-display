// Configuration manager for admin and setup pages
import { config } from './config.js';

/**
 * Loads configuration from localStorage
 * @returns {Object} The loaded configuration or null if not found
 */
export function loadConfig() {
    const savedConfig = localStorage.getItem('ha-display-config');
    
    if (!savedConfig) {
        return null;
    }
    
    try {
        const parsedConfig = JSON.parse(savedConfig);
        
        // Update the config object with saved values
        if (parsedConfig.homeAssistant) {
            config.homeAssistant.url = parsedConfig.homeAssistant.url || config.homeAssistant.url;
            config.homeAssistant.accessToken = parsedConfig.homeAssistant.accessToken || config.homeAssistant.accessToken;
        }
        
        if (parsedConfig.entities) {
            config.entities.temperature = parsedConfig.entities.temperature || config.entities.temperature;
            config.entities.humidity = parsedConfig.entities.humidity || config.entities.humidity;
            config.entities.pressure = parsedConfig.entities.pressure || config.entities.pressure;
        }
        
        console.log('Loaded configuration:', config);
        return config;
    } catch (error) {
        console.error('Error parsing configuration:', error);
        return null;
    }
}

/**
 * Saves configuration to localStorage
 * @param {Object} configData - Configuration data to save
 */
export function saveConfig(configData) {
    localStorage.setItem('ha-display-config', JSON.stringify(configData));
    
    // Update the config object with new values
    if (configData.homeAssistant) {
        config.homeAssistant.url = configData.homeAssistant.url || config.homeAssistant.url;
        config.homeAssistant.accessToken = configData.homeAssistant.accessToken || config.homeAssistant.accessToken;
    }
    
    if (configData.entities) {
        config.entities.temperature = configData.entities.temperature || config.entities.temperature;
        config.entities.humidity = configData.entities.humidity || config.entities.humidity;
        config.entities.pressure = configData.entities.pressure || config.entities.pressure;
    }
    
    console.log('Saved configuration:', config);
}

/**
 * Validates configuration
 * @param {Object} configData - Configuration data to validate
 * @returns {Object} Validation result with valid flag and error message
 */
export function validateConfig(configData) {
    if (!configData.homeAssistant?.url) {
        return { valid: false, error: 'Home Assistant URL is not configured' };
    }
    
    if (!configData.homeAssistant?.accessToken) {
        return { valid: false, error: 'Access token is not configured' };
    }
    
    if (!configData.entities?.temperature) {
        return { valid: false, error: 'Temperature entity ID is not configured' };
    }
    
    if (!configData.entities?.humidity) {
        return { valid: false, error: 'Humidity entity ID is not configured' };
    }
    
    if (!configData.entities?.pressure) {
        return { valid: false, error: 'Pressure entity ID is not configured' };
    }
    
    return { valid: true };
}
