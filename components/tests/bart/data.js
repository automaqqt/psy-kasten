// components/tests/bart/data.js

// BART balloon configuration.
// Each balloon type has a maximum capacity (the integer N for the 1..N array
// from which a number is drawn without replacement on each pump). The average
// break point is N/2. Per Lejuez et al. (2002): blue 1–128, yellow 1–32,
// orange 1–8. Earnings are accrued at PUMP_VALUE_CENTS per pump and lost on
// explosion; pressing collect banks the temporary earnings.
export const BALLOON_TYPES = {
  blue:   { color: '#3b82f6', maxPumps: 128 },
  yellow: { color: '#f5c518', maxPumps: 32 },
  orange: { color: '#ff7a18', maxPumps: 8 },
};

export const DEFAULT_SETTINGS = {
  totalBalloons: 30,        // 90 in the original; 30 keeps a session ~5–8 min
  mixedTrials: 9,           // first N balloons presented in a random color mix
  pumpValueCents: 5,        // money earned per pump (in cents)
  countdownTimer: 3,        // seconds before the test starts
  showEarnings: true,       // show total/last balloon earnings during the task
  enableSounds: true,       // pop / collect sound effects
};

// Short practice block: 6 balloons (2 of each color).
export const PRACTICE_SETTINGS = {
  totalBalloons: 6,
  mixedTrials: 6,
  pumpValueCents: 5,
  countdownTimer: 3,
  showEarnings: true,
  enableSounds: true,
};

export const THEME_COLOR = '#ff5722';

// BART is mouse-only — no keyboard response.
export const RESPONSE_KEY = null;
