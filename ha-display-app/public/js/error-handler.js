// Error handling module for Home Assistant Display
import { config } from './config.js';

/**
 * Display an error message in the UI
 * @param {string} message - The error message to display
 * @param {boolean} isConnectionError - Whether this is a connection error
 */
export function displayError(message, isConnectionError = false) {
  console.error(`Error: ${message}`);
  
  const errorDisplay = document.getElementById('error-display');
  if (!errorDisplay) {
    console.error('Error display element not found');
    return;
  }

  // Create error message element
  const errorMessage = document.createElement('div');
  errorMessage.className = 'error-message';
  errorMessage.textContent = message;
  
  // Clear previous errors if this is a connection error
  if (isConnectionError) {
    errorDisplay.innerHTML = '';
  }
  
  // Add the error message to the display
  errorDisplay.appendChild(errorMessage);
  errorDisplay.style.display = 'block';
  
  // Auto-hide non-connection errors after 5 seconds
  if (!isConnectionError) {
    setTimeout(() => {
      errorDisplay.removeChild(errorMessage);
      if (errorDisplay.children.length === 0) {
        errorDisplay.style.display = 'none';
      }
    }, 5000);
  }
}

/**
 * Clear all error messages from the UI
 */
export function clearErrors() {
  const errorDisplay = document.getElementById('error-display');
  if (errorDisplay) {
    errorDisplay.innerHTML = '';
    errorDisplay.style.display = 'none';
  }
}

/**
 * Update connection status in the UI
 * @param {boolean} connected - Whether the connection is established
 * @param {string} message - Optional message to display
 */
export function updateConnectionStatus(connected, message = '') {
  const connectionStatus = document.getElementById('connection-status');
  if (!connectionStatus) return;

  if (connected) {
    connectionStatus.textContent = '';
    connectionStatus.className = 'connected';
    clearErrors();
  } else {
    connectionStatus.textContent = '';
    connectionStatus.className = 'disconnected';
    if (message) {
      displayError(message, true);
    }
  }
}

/**
 * Log debug messages if debug mode is enabled
 * @param {...any} args - Arguments to log
 */
export function debugLog(...args) {
  if (config.debug) {
    console.log(...args);
  }
}
