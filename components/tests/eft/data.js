// components/tests/eft/data.js

// Target set 1 → LEFT response
export const LEFT_TARGETS = ['H', 'K'];
// Target set 2 → RIGHT response
export const RIGHT_TARGETS = ['S', 'C'];

// Heterogeneous noise letters that share features with the target sets
// (Gibson feature system: NWZ share features with HK; GJQ share features with SC)
export const NEUTRAL_FLANKERS = ['N', 'W', 'Z', 'G', 'J', 'Q'];

// Flanker conditions (from Eriksen & Eriksen, 1974)
export const CONDITIONS = {
  CONGRUENT: 'congruent',       // e.g. HHHHHHH or SSSSSSS — flankers share response with target
  INCONGRUENT: 'incongruent',   // e.g. SSSHSSS — flankers require opposite response
  NEUTRAL: 'neutral',           // e.g. NWZHNWZ — flankers share set-features but no response mapping
};

export const DEFAULT_SETTINGS = {
  totalTrials: 60,              // Trials in the real test
  flankersPerSide: 3,           // 3 noise letters on each side of target (original paper)
  fixationDuration: 500,        // Fixation cross duration (ms)
  stimulusDuration: 1000,       // Max stimulus display time (ms) — original used 1 sec
  responseWindow: 2000,         // Max time to respond before trial counts as miss (ms)
  interTrialInterval: 800,      // Blank after response (ms)

  // Trial mix (must sum to 1)
  congruentRatio: 0.34,
  incongruentRatio: 0.33,
  neutralRatio: 0.33,

  // Appearance
  stimulusColor: '#222222',     // Letter color (dark on light background for contrast)
  backgroundColor: '#ffffff',
  countdownTimer: 3,
};

export const PRACTICE_SETTINGS = {
  totalTrials: 12,
  flankersPerSide: 3,
  fixationDuration: 500,
  stimulusDuration: 1500,       // More generous during practice
  responseWindow: 3000,
  interTrialInterval: 1000,

  congruentRatio: 0.34,
  incongruentRatio: 0.33,
  neutralRatio: 0.33,

  stimulusColor: '#222222',
  backgroundColor: '#ffffff',
  countdownTimer: 3,
};

// Theme color for this test (used in UI accents)
export const THEME_COLOR = '#3f51b5';

// Response keys — F = left target set (H/K), J = right target set (S/C)
export const LEFT_KEY = 'f';
export const RIGHT_KEY = 'j';
export const RESPONSE_KEYS = [LEFT_KEY, RIGHT_KEY];
