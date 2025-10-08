// components/tests/pvt/data.js

// Default test settings
export const DEFAULT_SETTINGS = {
  testDuration: 300,      // 5 minutes in seconds
  minInterval: 2000,      // 2 seconds in milliseconds
  maxInterval: 10000,     // 10 seconds in milliseconds
  countdownTimer: 3,      // 3 seconds countdown
  stimulusColor: '#ff0000', // Red
  backgroundColor: '#ffffff', // White
};

// Practice settings (shorter duration for practice)
export const PRACTICE_SETTINGS = {
  testDuration: 90,       // 1.5 minutes in seconds
  minInterval: 2000,      // 2 seconds in milliseconds
  maxInterval: 8000,      // 8 seconds in milliseconds (slightly shorter for practice)
  countdownTimer: 3,
  stimulusColor: '#ff0000',
  backgroundColor: '#ffffff',
};

// Theme color for PVT
export const THEME_COLOR = '#00bcd4'; // Cyan/Teal - represents alertness and vigilance

// Response key
export const RESPONSE_KEY = ' '; // Spacebar
