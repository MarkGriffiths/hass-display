// Clock functionality for displaying time and date
let clockInterval = null;

/**
 * Initializes the clock display
 * Updates the time and date elements every second
 */
function initClock() {
	const timeElement = document.getElementById('clock-time');
	const dateElement = document.getElementById('clock-date');

	if (!timeElement || !dateElement) {
		console.error('Clock elements not found');
		return;
	}

	// Clear any existing interval to prevent leaks
	if (clockInterval) {
		clearInterval(clockInterval);
	}

	function updateClock() {
		const now = new Date();

		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		const seconds = String(now.getSeconds()).padStart(2, '0');
		timeElement.textContent = `${hours}:${minutes}:${seconds}`;

		const day = String(now.getDate()).padStart(2, '0');
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const year = now.getFullYear();
		dateElement.textContent = `${day}/${month}/${year}`;
	}

	updateClock();
	clockInterval = setInterval(updateClock, 1000);
}

export { initClock };
