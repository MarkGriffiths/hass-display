// Rainfall history bar chart module
import { config } from './config.js';
import { loadEntityHistory } from './sparkline-utils.js';

// Rainfall history data store
const rainHistory = {
	data: [],
	maxRain: 0,
	isLoading: false,
	maxPoints: 288 // 24 hours of 5-minute readings
};

// Cached SVG group element
let barsGroup = null;

// Initialize rainfall sparkline and load historical data
async function initRainfallSparkline() {
	barsGroup = document.getElementById('rainfall-bars-group');
	if (!barsGroup) return;

	rainHistory.data = [];
	rainHistory.maxRain = 0;
	rainHistory.isLoading = false;

	const rainEntityId = config.entities.rain;
	if (rainEntityId) {
		setTimeout(() => {
			loadRainHistory(rainEntityId);
		}, 0);
	}
}

// Load rainfall history from Home Assistant
async function loadRainHistory(entityId) {
	await loadEntityHistory(entityId, rainHistory, () => {
		// Rename value to rain
		rainHistory.data.forEach(point => {
			point.rain = point.value;
			delete point.value;
		});

		// Calculate max rainfall
		let maxRain = 0;
		for (let i = 0; i < rainHistory.data.length; i++) {
			if (rainHistory.data[i].rain > maxRain) {
				maxRain = rainHistory.data[i].rain;
			}
		}
		rainHistory.maxRain = Math.max(maxRain, 0.5); // minimum scale of 0.5mm

		updateRainfallBars();
	});
}

// Add a new rainfall data point
function addRainfallPoint(value) {
	const newPoint = {
		rain: value,
		time: new Date()
	};

	rainHistory.data.push(newPoint);

	if (value > rainHistory.maxRain) {
		rainHistory.maxRain = value;
	}

	// Remove data points older than 24 hours
	const twentyFourHoursAgo = new Date();
	twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

	let writeIdx = 0;
	for (let readIdx = 0; readIdx < rainHistory.data.length; readIdx++) {
		if (rainHistory.data[readIdx].time >= twentyFourHoursAgo) {
			rainHistory.data[writeIdx] = rainHistory.data[readIdx];
			writeIdx++;
		}
	}
	rainHistory.data.length = writeIdx;

	if (rainHistory.data.length > rainHistory.maxPoints) {
		rainHistory.data.shift();
	}

	updateRainfallBars();
}

// Render rainfall bars into SVG
function updateRainfallBars() {
	if (!barsGroup) {
		barsGroup = document.getElementById('rainfall-bars-group');
	}
	if (!barsGroup || rainHistory.data.length === 0) return;

	// Clear existing bars
	barsGroup.innerHTML = '';

	const svgWidth = 260;
	const svgHeight = 80;
	const xScale = svgWidth / (rainHistory.data.length - 1 || 1);
	const barWidth = Math.max(1, xScale * 0.8);
	const maxRain = rainHistory.maxRain || 0.5;

	for (let i = 0; i < rainHistory.data.length; i++) {
		const rain = rainHistory.data[i].rain;
		if (rain <= 0) continue;

		const barHeight = (rain / maxRain) * svgHeight;
		const x = i * xScale - barWidth / 2;
		const y = svgHeight - barHeight;

		const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rect.setAttribute('x', x);
		rect.setAttribute('y', y);
		rect.setAttribute('width', barWidth);
		rect.setAttribute('height', barHeight);
		rect.setAttribute('fill', 'rgba(13, 71, 161, 0.5)');
		barsGroup.appendChild(rect);
	}
}

export { initRainfallSparkline, addRainfallPoint };
