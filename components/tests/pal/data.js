// components/tests/pal/data.js

// Abstract patterns for the PAL test — each is a small grid encoded as a 2D array
// 1 = filled cell, 0 = empty cell. Rendered as colored blocks in a 4x4 grid.
export const PATTERNS = [
  // Pattern 0: L-shape
  [[1,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]],
  // Pattern 1: T-shape
  [[1,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
  // Pattern 2: Cross
  [[0,1,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],
  // Pattern 3: Z-shape
  [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
  // Pattern 4: Square
  [[1,1,0,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
  // Pattern 5: U-shape
  [[1,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
  // Pattern 6: S-shape
  [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
  // Pattern 7: Corner
  [[1,1,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]],
  // Pattern 8: Line horizontal
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  // Pattern 9: Line vertical
  [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  // Pattern 10: Diagonal
  [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
  // Pattern 11: Arrow right
  [[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
];

// Colors assigned to patterns (one per pattern, distinct and colorblind-friendly)
export const PATTERN_COLORS = [
  '#e53935', // red
  '#1e88e5', // blue
  '#43a047', // green
  '#ff9800', // orange
  '#8e24aa', // purple
  '#00acc1', // teal
  '#d81b60', // magenta
  '#6d4c41', // brown
  '#3949ab', // indigo
  '#c0ca33', // lime
  '#f4511e', // deep orange
  '#00897b', // dark teal
];

// Level definitions: how many patterns to remember at each stage
export const LEVELS = [2, 4, 6, 8];

export const DEFAULT_SETTINGS = {
  levels: [2, 4, 6, 8],         // Number of patterns per level
  maxAttempts: 4,                // Max attempts per level before test ends
  boxOpenDuration: 2000,         // ms — how long each box stays open during presentation
  interBoxDelay: 500,            // ms — delay between opening boxes
  feedbackDuration: 800,         // ms — how long correct/incorrect feedback shows
  countdownTimer: 3,
};

export const PRACTICE_SETTINGS = {
  levels: [2],                   // Practice only has 2 patterns
  maxAttempts: 4,
  boxOpenDuration: 2500,         // Slower for practice
  interBoxDelay: 600,
  feedbackDuration: 1000,        // Longer feedback during practice
  countdownTimer: 3,
};

export const THEME_COLOR = '#8e44ad';
export const RESPONSE_KEY = null; // Mouse clicks only
