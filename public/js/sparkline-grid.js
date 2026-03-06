// Sparkline grid utilities
// Adds vertical hour lines to the sparkline chart

/**
 * Adds vertical hour lines to the sparkline SVG
 * @param {string} svgId - The ID of the SVG element
 */
function addHourlyGridLines(svgId) {
  // Get the SVG element
  const svg = document.getElementById(svgId);
  if (!svg) {
    console.error(`SVG element with ID ${svgId} not found`);
    return;
  }

  // Create a group for grid lines if it doesn't exist
  let gridGroup = document.getElementById('grid-lines-group');
  if (!gridGroup) {
    gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('id', 'grid-lines-group');
    // Insert the grid group before other elements so lines appear behind the data
    svg.insertBefore(gridGroup, svg.firstChild);
  } else {
    // Clear existing grid lines
    gridGroup.innerHTML = '';
  }

  // Get SVG dimensions
  const svgWidth = 260; // Width of the SVG
  const svgHeight = 80; // Height of the SVG
  
  // Calculate spacing for 24 hours
  // The sparkline shows 24 hours of data, so we need 25 lines (0h to 24h)
  const hourSpacing = svgWidth / 24;
  
  // Draw vertical lines for each hour
  for (let i = 0; i <= 24; i++) {
    const x = i * hourSpacing;
    
    // Create line element
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', 0);
    line.setAttribute('x2', x);
    line.setAttribute('y2', svgHeight);
    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)'); // Faint white line
    line.setAttribute('stroke-width', '1');
    
    // Add the line to the grid group
    gridGroup.appendChild(line);
  }
  
  console.log('Added hourly grid lines to sparkline');
}

export { addHourlyGridLines };
