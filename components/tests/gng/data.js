// components/tests/gng/gngData.js

export const STIMULUS_TYPES = {
    SHAPE: 'shape',
    COLOR: 'color',
  };
  
  // Example Stimuli (Customize as needed)
  export const GO_STIMULI = [
      { type: STIMULUS_TYPES.SHAPE, value: 'circle', color: '#2ecc71' }, // Green Circle
      // Add more Go options if needed for variety
  ];
  
  export const NOGO_STIMULI = [
      { type: STIMULUS_TYPES.SHAPE, value: 'square', color: '#e74c3c' }, // Red Square
      // Add more NoGo options if needed
  ];
  
  // Stop signal can be visual or auditory. We'll use a visual change for simplicity.
  // Example: Changing the Go stimulus border or adding an 'X'
  export const STOP_SIGNAL_VISUAL = {
      type: 'border_change', // Or 'overlay_x'
      color: '#e74c3c', // Red border or X
      thickness: '5px',
  };
  
  // Default Settings
  export const DEFAULT_SETTINGS = {
      testDurationMode: 'trials', // 'trials' or 'time'
      totalTrials: 100,           // Number of trials if mode is 'trials'
      testDurationSeconds: 300, // Duration in seconds if mode is 'time'
  
      goStimulus: GO_STIMULI[0],
      nogoStimulus: NOGO_STIMULI[0], // Used only if stopSignalProbability is 0
  
      goProbability: 0.75,        // Probability of a Go or potential Stop trial (vs. NoGo)
      stopSignalProbability: 0.25, // Probability that a Go trial becomes a Stop trial (0 for pure Go/NoGo)
  
      stimulusDurationMs: 500,    // How long the stimulus stays on screen
      minISIMs: 1000,             // Minimum Inter-Stimulus Interval (fixation)
      maxISIMs: 2000,             // Maximum Inter-Stimulus Interval (fixation)
      responseWindowMs: 1000,     // Max time to respond on Go trials
  
      // Stop Signal Specific Settings
      useStaircaseSSD: true,      // Adjust SSD based on performance?
      initialSSDM: 250,           // Starting Stop Signal Delay (milliseconds)
      ssdStepM: 50,               // How much to adjust SSD by (milliseconds)
      targetStopRate: 0.5,        // Target rate for successful stops (for staircase logic, not used directly in simple version yet)
  };
  
  // Response key
  export const RESPONSE_KEY = ' '; // Spacebar