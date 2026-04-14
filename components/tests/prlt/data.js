// components/tests/prlt/data.js

// Stimuli: two abstract decks/options shown side by side
export const OPTION_COLORS = ['#5c6bc0', '#ef5350']; // indigo, coral
export const OPTION_LABELS = ['A', 'B'];

export const DEFAULT_SETTINGS = {
  totalTrials: 120,           // Max trials per session
  highProbability: 0.80,      // Reward probability for the "good" option
  lowProbability: 0.20,       // Reward probability for the "bad" option
  reversalWindow: 15,         // Look-back window for reversal criterion
  reversalCriterion: 12,      // Must choose high-prob option this many times in last N
  responseWindow: 5000,       // Max time to respond (ms)
  feedbackDuration: 1000,     // How long to show win/loss feedback (ms)
  itiDuration: 800,           // Inter-trial interval (ms)
  countdownTimer: 3,
};

export const PRACTICE_SETTINGS = {
  totalTrials: 20,
  highProbability: 0.80,
  lowProbability: 0.20,
  reversalWindow: 8,
  reversalCriterion: 6,
  responseWindow: 8000,
  feedbackDuration: 1200,
  itiDuration: 1000,
  countdownTimer: 3,
};

export const THEME_COLOR = '#607d8b';
export const RESPONSE_KEY = null; // Mouse clicks only
