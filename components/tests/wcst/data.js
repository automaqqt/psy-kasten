// components/tests/wcst/data.js

// Card dimensions
export const SHAPES = ['circle', 'star', 'cross', 'triangle'];
export const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835']; // red, blue, green, yellow
export const COLOR_NAMES = ['red', 'blue', 'green', 'yellow'];
export const COUNTS = [1, 2, 3, 4];

// Sorting rules cycle
export const RULES = ['color', 'shape', 'number'];

// The 4 reference cards (one for each value in each dimension)
// Card 1: 1 red triangle
// Card 2: 2 green stars
// Card 3: 3 yellow crosses
// Card 4: 4 blue circles
export const REFERENCE_CARDS = [
  { shape: 'triangle', color: '#e53935', colorName: 'red', count: 1 },
  { shape: 'star', color: '#43a047', colorName: 'green', count: 2 },
  { shape: 'cross', color: '#fdd835', colorName: 'yellow', count: 3 },
  { shape: 'circle', color: '#1e88e5', colorName: 'blue', count: 4 },
];

export const DEFAULT_SETTINGS = {
  trialsPerCategory: 10,    // Rule changes after 10 consecutive correct
  totalCategories: 6,       // 6 categories = 2 full cycles of color/shape/number
  maxTrials: 128,           // Max trials before test ends regardless
  responseWindow: 10000,    // 10 seconds max response time
  feedbackDuration: 800,    // ms to show correct/incorrect feedback
  countdownTimer: 3,
};

export const PRACTICE_SETTINGS = {
  trialsPerCategory: 5,     // Shorter categories for practice
  totalCategories: 2,       // Just 2 categories
  maxTrials: 30,
  responseWindow: 10000,
  feedbackDuration: 1000,   // Longer feedback during practice
  countdownTimer: 3,
};

export const THEME_COLOR = '#d32f2f';
export const RESPONSE_KEY = null; // Mouse clicks only — no keyboard response
