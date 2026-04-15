// components/tests/iat/data.js
// Standard 7-block IAT (Greenwald et al. 1998/2003) — Flowers/Insects + Pleasant/Unpleasant

export const CATEGORY_KEYS = {
  TARGET_A: 'flowers',
  TARGET_B: 'insects',
  ATTR_A: 'pleasant',
  ATTR_B: 'unpleasant',
};

// Stimulus word pools — kept in English; the category labels themselves are translated.
export const STIMULI = {
  flowers: ['rose', 'tulip', 'daisy', 'orchid', 'lily', 'daffodil', 'violet', 'marigold'],
  insects: ['bee', 'wasp', 'mosquito', 'ant', 'cockroach', 'beetle', 'fly', 'spider'],
  pleasant: ['happy', 'joy', 'love', 'peace', 'wonderful', 'pleasure', 'friend', 'paradise'],
  unpleasant: ['evil', 'hate', 'disaster', 'terrible', 'horrible', 'awful', 'nasty', 'grief'],
};

// Block definitions — which categories go on which side and how many trials.
// side='L' maps to the left response key; 'R' to the right.
// kind: 'target', 'attribute', 'combined' (combined = target + attribute interleaved)
// compat: true = compatible pairing (flower+pleasant / insect+unpleasant)
//         false = incompatible pairing (insect+pleasant / flower+unpleasant)
//         null = not combined
export const BLOCKS = [
  { index: 0, kind: 'target',    trials: 20, compat: null,  left: ['flowers'],             right: ['insects'],              practice: true  },
  { index: 1, kind: 'attribute', trials: 20, compat: null,  left: ['pleasant'],            right: ['unpleasant'],           practice: true  },
  { index: 2, kind: 'combined',  trials: 20, compat: true,  left: ['flowers', 'pleasant'], right: ['insects', 'unpleasant'], practice: true  },
  { index: 3, kind: 'combined',  trials: 40, compat: true,  left: ['flowers', 'pleasant'], right: ['insects', 'unpleasant'], practice: false },
  { index: 4, kind: 'target',    trials: 20, compat: null,  left: ['insects'],             right: ['flowers'],              practice: true  },
  { index: 5, kind: 'combined',  trials: 20, compat: false, left: ['insects', 'pleasant'], right: ['flowers', 'unpleasant'], practice: true  },
  { index: 6, kind: 'combined',  trials: 40, compat: false, left: ['insects', 'pleasant'], right: ['flowers', 'unpleasant'], practice: false },
];

export const DEFAULT_SETTINGS = {
  iti: 250,              // inter-trial interval (ms)
  errorPenalty: true,    // require correct response to continue
  trialMultiplier: 1.0,  // scales all block trial counts (0.5–2.0)
  fontSize: 36,          // stimulus font size (px)
};

export const PRACTICE_SETTINGS = {
  iti: 250,
  errorPenalty: true,
  trialMultiplier: 0.3,  // ~6/6/6/12/6/6/12 — short familiarization
  fontSize: 36,
};

export const THEME_COLOR = '#3f51b5';
export const TARGET_COLOR = '#2e7d32';     // green for target categories
export const ATTRIBUTE_COLOR = '#1565c0';  // blue for attribute categories

// Response keys
export const LEFT_KEY = 'e';
export const RIGHT_KEY = 'i';
export const RESPONSE_KEY = null;  // multi-key test, not single — keeps template happy
