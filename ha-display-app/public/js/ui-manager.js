// UI components module
import { config } from './config.js';

/**
 * Function to update the rain view display based on config setting
 * Make updateRainViewDisplay globally accessible
 */
function updateRainViewDisplay() {
  const rainCenter = document.getElementById('rain-center');
  const conditionsCenter = document.getElementById('conditions-center');
  const toggleRainViewButton = document.getElementById('toggle-rain-view');

  if (rainCenter && conditionsCenter) {
    if (config.display.showRainView) {
      rainCenter.style.display = 'flex';
      rainCenter.classList.add('active');
      conditionsCenter.style.display = 'none';
      if (toggleRainViewButton) {
        toggleRainViewButton.textContent = 'Show Temperature';
      }
    } else {
      rainCenter.style.display = 'none';
      rainCenter.classList.remove('active');
      conditionsCenter.style.display = 'flex';
      if (toggleRainViewButton) {
        toggleRainViewButton.textContent = 'Show Rainfall';
      }
    }
  }

  // Update gauge visibility based on the current view
  const rainGauge = document.getElementById('rainfall-gauge');

  if (rainGauge) {
    if (config.display.showRainView) {
      rainGauge.style.display = 'block';
    } else {
      rainGauge.style.display = 'none';
    }
  }


}

/**
 * Update connection status in the UI
 * @param {boolean} connected - Whether the connection is established
 * @param {string} message - Optional message to display
 */
function updateConnectionStatus(connected, message) {
  const connectionStatus = document.getElementById('connection-status');
  if (!connectionStatus) return;

  if (connected) {
    connectionStatus.textContent = '';
    connectionStatus.className = 'connected';
  } else {
    connectionStatus.textContent = '';
    connectionStatus.className = 'disconnected';
  }
}

/**
 * Show configuration error
 * @param {string} errorMessage - Error message to display
 */
function showConfigError(errorMessage) {
  console.error('Configuration error:', errorMessage);

  // Hide the main content
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.style.display = 'none';
  }

  // Show the error container
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.style.display = 'flex';

    // Set the error message
    const errorMessageElement = document.getElementById('error-message');
    if (errorMessageElement) {
      errorMessageElement.textContent = errorMessage;
    }

    // Set up the setup button
    const setupButton = document.getElementById('setup-button');
    if (setupButton) {
      setupButton.addEventListener('click', function () {
        window.location.href = '/setup.html';
      });
    }
  }
}

/**
 * Show general error message
 * @param {string} errorMessage - Error message to display
 */
function showError(errorMessage) {
  console.error('Error:', errorMessage);

  // Use the same error container as config errors
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    // Hide the main content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.display = 'none';
    }

    errorContainer.style.display = 'flex';

    // Set the error message
    const errorMessageElement = document.getElementById('error-message');
    if (errorMessageElement) {
      errorMessageElement.textContent = errorMessage;
    }
  } else {
    // Fallback to alert if error container doesn't exist
    alert('Error: ' + errorMessage);
  }
}

/**
 * Function to update the weather icon based on current states
 * @param {Object} weatherState - Weather state from Home Assistant
 * @param {Object} sunState - Sun state from Home Assistant
 */
function updateWeatherIcon(weatherState, sunState) {
  if (!weatherState || !sunState) {
    return;
  }

  const weatherCondition = weatherState.state;
  const sunPosition = sunState.state;
  const isDay = sunPosition === 'above_horizon';

  // Get the weather icon element
  const weatherIcon = document.getElementById('weather-icon');
  if (!weatherIcon) {
    return;
  }

  // Remove all existing weather icon classes
  weatherIcon.className = '';
  weatherIcon.classList.add('wi'); // Add base weather icon class

  // Get the appropriate icon class based on condition and sun position
  const iconClass = config.weather.iconMapping[weatherCondition]?.[isDay ? 'day' : 'night'];
  if (iconClass) {
    weatherIcon.classList.add(iconClass);
  } else {
    // Fallback to a default icon if the condition is not recognized
    weatherIcon.classList.add(isDay ? 'wi-day-sunny' : 'wi-night-clear');
  }
}

/**
 * Initialize auto-scrolling for indoor display room containers
 * Scrolls to the next room container every 6 seconds, looping back to the first after the last
 */
function initIndoorDisplayScroll() {
  const indoorDisplay = document.querySelector('.indoor-display');
  if (!indoorDisplay) {
    console.error('Indoor display element not found');
    return;
  }

  const roomContainers = indoorDisplay.querySelectorAll('.room-container');
  if (roomContainers.length <= 1) {
    console.log('Not enough room containers to scroll');
    return;
  }

  console.log(`Found ${roomContainers.length} room containers for auto-scrolling`);

  let currentIndex = 0;
  const scrollInterval = 6000; // 6 seconds
  const containerHeightPx = 56;

  console.log(`Container height: ${containerHeightPx}px`);

  // Function to scroll to the next room container
  function scrollToNextRoom() {
    currentIndex = (currentIndex + 1) % roomContainers.length;
    const scrollPosition = currentIndex * containerHeightPx;

    console.log(`Scrolling to room ${currentIndex} at position ${scrollPosition}px`);

    // Smooth scroll to the next container
    indoorDisplay.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  }

  // Start the auto-scrolling interval
  const intervalId = setInterval(scrollToNextRoom, scrollInterval);

  // Store the interval ID on the element for potential cleanup later
  indoorDisplay.dataset.scrollIntervalId = intervalId;

  console.log('Indoor display auto-scrolling initialized');
}

export {
  updateRainViewDisplay,
  updateConnectionStatus,
  showConfigError,
  showError,
  updateWeatherIcon,
  initIndoorDisplayScroll
};
