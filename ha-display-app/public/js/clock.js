// Clock functionality for displaying time and date
/**
 * Initializes the clock display
 * Updates the time and date elements every second
 */
function initClock() {
  // Get the clock elements
  const timeElement = document.getElementById('clock-time');
  const dateElement = document.getElementById('clock-date');
  
  if (!timeElement || !dateElement) {
    console.error('Clock elements not found');
    return;
  }
  
  // Function to update the clock
  function updateClock() {
    const now = new Date();
    
    // Format time with hours, minutes, and seconds (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    // Format date (DD/MM/YYYY)
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = now.getFullYear();
    const dateString = `${day}/${month}/${year}`;
    
    // Update the DOM elements
    timeElement.textContent = timeString;
    dateElement.textContent = dateString;
  }
  
  // Update immediately
  updateClock();
  
  // Update every second
  setInterval(updateClock, 1000);
  
  console.log('Clock initialized');
}

// Export the initialization function
export { initClock };
