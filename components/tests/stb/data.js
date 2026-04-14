// components/tests/stb/data.js

// Consonant letters used in the task (excluding vowels)
export const CONSONANTS = [
  'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Z'
];

export const DEFAULT_SETTINGS = {
  totalTrials: 18,              // 6 per ignore-count condition (1, 3, 5)
  lettersPerTrial: 8,           // Total letters shown per trial (memorize + ignore)
  fixationDuration: 5000,       // Fixation cross duration (ms)
  letterDuration: 1500,         // How long each letter is shown (ms)
  letterISI: 500,               // Inter-stimulus interval between letters (ms)
  maintenanceMin: 2000,         // Maintenance period min (ms)
  maintenanceMax: 4000,         // Maintenance period max (ms)
  responseWindow: 5000,         // Max time to respond to probe (ms)
  probeInSetRatio: 0.5,         // Probability probe is from memorized set
  showFeedback: true,           // Show correct/incorrect during practice
};

export const PRACTICE_SETTINGS = {
  totalTrials: 6,               // 2 per ignore-count condition
  lettersPerTrial: 8,
  fixationDuration: 3000,
  letterDuration: 1500,
  letterISI: 500,
  maintenanceMin: 2000,
  maintenanceMax: 3000,
  responseWindow: 8000,
  probeInSetRatio: 0.5,
  showFeedback: true,
};

// Theme color for this test (blue-grey)
export const THEME_COLOR = '#607d8b';

// Response keys: F = "in set", J = "not in set"
export const KEY_IN_SET = 'f';
export const KEY_NOT_IN_SET = 'j';
