// components/tests/nback/data.js

// Letters used as stimuli (consonants to avoid vowel confusion)
export const LETTERS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'V'];

export const DEFAULT_SETTINGS = {
  nLevel: 2,                // N-back level (1, 2, or 3)
  trialsPerBlock: 20,       // Trials per block (not counting initial N non-scorable trials)
  targetPercentage: 0.30,   // ~30% of trials are targets (matches)
  lurePercentage: 0.10,     // ~10% of trials are lures (match at wrong N distance)
  stimulusDuration: 500,    // How long each letter is shown (ms)
  interStimulusInterval: 1800, // Blank screen between stimuli (ms)
  responseWindow: 2500,     // Max time to respond from stimulus onset (ms)
};

export const PRACTICE_SETTINGS = {
  nLevel: 1,                // Practice starts at 1-back
  trialsPerBlock: 10,       // Shorter practice
  targetPercentage: 0.30,
  lurePercentage: 0.10,
  stimulusDuration: 500,
  interStimulusInterval: 1800,
  responseWindow: 2500,
};

export const THEME_COLOR = '#607d8b';

// Two-key response: F = match, J = non-match
export const MATCH_KEY = 'f';
export const NON_MATCH_KEY = 'j';
