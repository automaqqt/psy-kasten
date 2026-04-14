// components/tests/mot/data.js

export const DEFAULT_SETTINGS = {
  totalTrials: 20,
  numObjects: 8,
  numTargets: 4,
  identificationDuration: 2200,  // ms — how long targets are highlighted
  trackingDuration: 10000,       // ms — how long objects move
  movementSpeed: 3,              // pixels per frame at 60fps
  showFeedback: true,
  feedbackDuration: 1500,        // ms — how long feedback is shown
};

export const PRACTICE_SETTINGS = {
  totalTrials: 5,
  numObjects: 8,
  numTargets: 4,
  identificationDuration: 2200,
  trackingDuration: 8000,
  movementSpeed: 2.5,
  showFeedback: true,
  feedbackDuration: 2000,
};

export const THEME_COLOR = '#607d8b';
export const RESPONSE_KEY = null; // Mouse click — no keyboard response

export const OBJECT_SIZE = 40;    // px diameter
export const AREA_PADDING = 20;   // px padding inside tracking area
export const MIN_DISTANCE = 70;   // min px between object centers at spawn
