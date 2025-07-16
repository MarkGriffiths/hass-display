// Main export file for all gauge modules
// This file centralizes all gauge exports for easier imports elsewhere

// Re-export everything from the gauge modules
export * from './temperature-gauge.js';
export * from './secondary-temperature-gauge.js';
export * from './humidity-gauge.js';
export * from './pressure-gauge.js';

// Export initialization function
export { initGauges } from './gauge-initializer.js';
