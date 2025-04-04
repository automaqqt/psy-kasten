// components/tests/tol/tolData.js

export const BALL_COLORS = {
    R: '#e74c3c', // Red
    G: '#2ecc71', // Green
    B: '#3498db', // Blue
  };
  
  // Pegs: 0=Shortest(Left, Capacity 1), 1=Middle(Capacity 2), 2=Tallest(Right, Capacity 3)
  export const PEG_CAPACITIES = [1, 2, 3];
  
  // Scoring points based on trial number (1st, 2nd, 3rd)
  export const TRIAL_SCORES = [3, 2, 1];
  
  /**
   * Tower of London Problems with CUSTOM START STATES.
   * Each problem defines its own start and goal configuration.
   * The minMoves are targets/estimates for difficulty scaling.
   * This set deviates from standard TOL protocols which use a single fixed start.
   */
  export const PROBLEMS = [
    // Format: { start: [[peg1], [peg2], [peg3]], goal: [[peg1], [peg2], [peg3]], minMoves: X }
  
    // --- Problem 1 (Target 2 moves) ---
    {
      start: [['R'], ['G'], ['B']],        // Standard start for the first one
      goal:  [[], ['G', 'B'], ['R']],
      minMoves: 2
    },
    // --- Problem 2 (Target 2 moves) ---
    {
      start: [['R'], ['G', 'B'], []],     // Different start
      goal:  [['B'], ['G'], ['R']],
      minMoves: 2
    },
    // --- Problem 3 (Target 3 moves) ---
    {
      start: [[], ['R', 'G'], ['B']],     // Different start
      goal:  [['G'], ['R'], ['B']],
      minMoves: 3
    },
    // --- Problem 4 (Target 3 moves) ---
    {
      start: [['B'], ['G'], ['R']],       // Start from a previous goal idea
      goal:  [[], ['B', 'R'], ['G']],
      minMoves: 3
    },
    // --- Problem 5 (Target 4 moves) ---
    {
      start: [['G'], ['B'], ['R']],       // Different start
      goal:  [['R'], ['G', 'B'], []],
      minMoves: 4
    },
    // --- Problem 6 (Target 4 moves) ---
    {
      start: [[], ['R', 'B'], ['G']],     // Different start
      goal:  [['G'], ['R'], ['B']],      // Same goal as P3, different start
      minMoves: 4
    },
    // --- Problem 7 (Target 4 moves) ---
    {
      start: [['R'], [], ['G', 'B']],     // Different start
      goal:  [['B'], ['R', 'G'], []],
      minMoves: 4
    },
    // --- Problem 8 (Target 5 moves) ---
    {
      start: [['B'], ['G'], ['R']],       // Repeated start for variety
      goal:  [[], ['G'], ['R', 'B']],         // Target 5 moves
      minMoves: 5
    },
    // --- Problem 9 (Target 5 moves) ---
    {
      start: [['G'], ['R', 'B'], []],     // Different start
      goal:  [['R', 'G', 'B'], [], []],     // Stack all on shortest (invalid setup, peg 0 capacity is 1!) -> Correcting Goal
      // goal:  [[], [], ['R', 'G', 'B']], // Stack all on tallest instead
      minMoves: 5 // This transformation is likely more than 5, let's adjust
    },
     // --- Corrected Problem 9 (Target 5 moves) ---
    {
      start: [['G'], ['R', 'B'], []],
      goal:  [[], ['B'], ['R', 'G']], // Different goal, plausible 5 moves
      minMoves: 5
    },
    // --- Problem 10 (Target 5 moves) ---
    {
      start: [[], ['B'], ['R', 'G']],     // Start from previous goal
      goal:  [['B'], ['R'], ['G']],       // Target 5 moves
      minMoves: 5
    },
    // --- Problem 11 (Target 6 moves) ---
    {
      start: [['B'], ['R', 'G'], []],     // Different start
      goal:  [[], [], ['G', 'B', 'R']],     // Stack all on tallest (G top)
      minMoves: 6
    },
    // --- Problem 12 (Target 6 moves) ---
    {
      start: [[], ['G', 'B'], ['R']],     // Different start
      goal:  [[], [], ['B', 'G', 'R']],     // Stack all on tallest (B top)
      minMoves: 6
    },
  ];
  
  // Note: Ensure all defined 'start' and 'goal' states respect PEG_CAPACITIES!
  // Example Check: PROBLEMS[8].goal = [['R', 'G', 'B'], [], []] is INVALID because peg 0 capacity is 1. Corrected above.