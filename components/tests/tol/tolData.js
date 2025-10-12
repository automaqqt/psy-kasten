// components/tests/tol/tolData.js

export const BALL_COLORS = {
  R: '#e74c3c', // Red
  G: '#f1c40f', // Yellow (Gelb)
  B: '#3498db', // Blue (Blau)
};

// Pegs: 0=Tallest(Left, Capacity 3), 1=Middle(Capacity 2), 2=Shortest(Right, Capacity 1)
export const PEG_CAPACITIES = [3, 2, 1];

// Scoring points based on trial number (1st, 2nd, 3rd)
export const TRIAL_SCORES = [3, 2, 1];

/**
 * Tower of London Problems from the "Turm von London - Deutsche Version (TL-D)" manual.
 * The goal configuration of one problem serves as the start configuration for the next.
 * The set includes 2 practice problems and 20 main test problems.
 */
export const PROBLEMS = [
  // Format: { start: [[peg0], [peg1], [peg2]], goal: [[peg0], [peg1], [peg2]], minMoves: X }
  // Ball order in peg arrays is from BOTTOM to TOP.

 

  // --- 5 x 3-Move Problems ---
  {
    // Problem 1
    start: [['B'], ['R'], ['G']],
    goal:  [['B','G'], [], ['R']],
    minMoves: 2
  },
  {
    // Problem 2
    start: [['B','G'], [], ['R']],
    goal:  [['B','R'], ['G'], []],
    minMoves: 2
  },
  {
    // Problem 3
    start: [['B','R'], ['G'], []],
    goal:  [['B','G','R'], [], []],
    minMoves: 3
  },
  {
    // Problem 4
    start: [['B','G','R'], [], []],
    goal:  [['B', 'R'], [], ['G']],
    minMoves: 3
  },
  {
    // Problem 5
    start: [['B', 'R'], [], ['G']],
    goal:  [[], ['G','B'], ['R']],
    minMoves: 3
  },

  // --- 5 x 4-Move Problems ---
  {
    // Problem 6
    start: [[], ['G','B'], ['R']],
    goal:  [['R', 'G'], [], ['B']],
    minMoves: 3
  },
  {
    // Problem 7
    start: [['R', 'G'], [], ['B']],
    goal:  [['R','B','G'], [], []],
    minMoves: 3
  },
  {
    // Problem 8
    start: [['R','B','G'], [], []],
    goal:  [['R','G','B'], [], []],
    minMoves: 4
  },
  {
    // Problem 9
    start: [['R','G','B'], [], []],
    goal:  [['B'], ['G','R'], []],
    minMoves: 4
  },
  {
    // Problem 10
    start: [['B'], ['G','R'], []],
    goal:  [['R','B'], [], ['G']],
    minMoves: 4
  },

  // --- 5 x 5-Move Problems ---
  {
    // Problem 11
    start: [['R','B'], [], ['G']],
    goal:  [['G','R'], ['B'], []],
    minMoves: 5
  },
  {
    // Problem 12
    start: [['G','R'], ['B'], []],
    goal:  [['B'], ['R','G'], []],
    minMoves: 5
  },
  {
    // Problem 13
    start: [['B'], ['R','G'], []],
    goal:  [['G'], ['B'], ['R']],
    minMoves: 5
  },
  {
    // Problem 14
    start: [['G'], ['B'], ['R']],
    goal:  [['R','B','G'], [], []],
    minMoves: 5
  },
  {
    // Problem 15
    start: [['R','B','G'], [], []],
    goal:  [['G', 'R'], ['B'], []],
    minMoves: 5
  },

  // --- 5 x 6-Move Problems ---
  {
    // Problem 16
    start: [['G', 'R'], ['B'], []],
    goal:  [['R', 'G'], [], ['B']],
    minMoves: 6
  },
  {
    // Problem 17
    start: [['R', 'G'], [], ['B']],
    goal:  [['B', 'G'], [], ['R']],
    minMoves: 6
  },
  {
    // Problem 18
    start: [['B', 'G'], [], ['R']],
    goal:  [['R','G','B'], [], []],
    minMoves: 6
  },
  {
    // Problem 19
    start: [['R','G','B'], [], []],
    goal:  [['G', 'B'], ['R'], []],
    minMoves: 6
  },
  {
    // Problem 20
    start: [['G', 'B'], ['R'], []],
    goal:  [['R', 'B'], [], ['G']],
    minMoves: 6
  },
  {
    // Problem 21
    start: [['R', 'B'], [], ['G']],
    goal:  [['B', 'R','G'], [], []],
    minMoves: 6
  },
  {
    // Problem 22
    start: [['B', 'R','G'], [], []],
    goal:  [['G', 'R','B'], [], []],
    minMoves: 6
  }
];