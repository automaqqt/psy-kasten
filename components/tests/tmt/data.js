// components/tests/tmt/data.js
//
// The Trail Making Test (TMT) has two parts:
//   Part A — connect numbers 1..25 in order
//   Part B — connect in order alternating number/letter: 1-A-2-B-3-C-...-12-L-13
//
// Each part is preceded by a short practice with fewer circles.
// Positions are expressed in percent of the playing area (0-100) so the
// layout scales to any fullscreen size.

const practiceALayout = [
  { label: '1',   x: 50, y: 60 },
  { label: '2',   x: 70, y: 35 },
  { label: '3',   x: 82, y: 60 },
  { label: '4',   x: 62, y: 50 },
  { label: '5',   x: 68, y: 78 },
  { label: '6',   x: 25, y: 80 },
  { label: '7',   x: 18, y: 45 },
  { label: '8',   x: 42, y: 25 },
];

const practiceBLayout = [
  { label: '1', x: 48, y: 58 },
  { label: 'A', x: 70, y: 30 },
  { label: '2', x: 85, y: 62 },
  { label: 'B', x: 65, y: 50 },
  { label: '3', x: 68, y: 80 },
  { label: 'C', x: 28, y: 80 },
  { label: '4', x: 15, y: 45 },
  { label: 'D', x: 40, y: 22 },
];

// Part A: 25 circles labelled 1..25 in non-overlapping pseudo-random positions.
const partALayout = [
  { label: '1',  x: 62, y: 58 },
  { label: '2',  x: 52, y: 30 },
  { label: '3',  x: 78, y: 40 },
  { label: '4',  x: 70, y: 60 },
  { label: '5',  x: 85, y: 72 },
  { label: '6',  x: 55, y: 82 },
  { label: '7',  x: 30, y: 78 },
  { label: '8',  x: 14, y: 65 },
  { label: '9',  x: 25, y: 45 },
  { label: '10', x: 8,  y: 38 },
  { label: '11', x: 18, y: 18 },
  { label: '12', x: 35, y: 10 },
  { label: '13', x: 50, y: 14 },
  { label: '14', x: 68, y: 8  },
  { label: '15', x: 86, y: 14 },
  { label: '16', x: 92, y: 30 },
  { label: '17', x: 82, y: 52 },
  { label: '18', x: 72, y: 75 },
  { label: '19', x: 45, y: 72 },
  { label: '20', x: 22, y: 90 },
  { label: '21', x: 5,  y: 82 },
  { label: '22', x: 4,  y: 55 },
  { label: '23', x: 38, y: 45 },
  { label: '24', x: 48, y: 48 },
  { label: '25', x: 90, y: 90 },
];

// Part B: 25 circles alternating numbers (1..13) and letters (A..L).
// Correct sequence: 1-A-2-B-3-C-4-D-5-E-6-F-7-G-8-H-9-I-10-J-11-K-12-L-13
const partBLayout = [
  { label: '1',  x: 58, y: 55 },
  { label: 'A', x: 75, y: 72 },
  { label: '2', x: 48, y: 78 },
  { label: 'B', x: 22, y: 82 },
  { label: '3', x: 10, y: 62 },
  { label: 'C', x: 28, y: 50 },
  { label: '4', x: 42, y: 40 },
  { label: 'D', x: 20, y: 25 },
  { label: '5', x: 5,  y: 38 },
  { label: 'E', x: 15, y: 10 },
  { label: '6', x: 38, y: 12 },
  { label: 'F', x: 55, y: 22 },
  { label: '7', x: 68, y: 8  },
  { label: 'G', x: 82, y: 22 },
  { label: '8', x: 92, y: 12 },
  { label: 'H', x: 88, y: 38 },
  { label: '9', x: 72, y: 40 },
  { label: 'I', x: 80, y: 55 },
  { label: '10', x: 92, y: 62 },
  { label: 'J', x: 68, y: 88 },
  { label: '11', x: 40, y: 92 },
  { label: 'K', x: 8,  y: 90 },
  { label: '12', x: 5,  y: 18 },
  { label: 'L', x: 50, y: 62 },
  { label: '13', x: 92, y: 88 },
];

export const LAYOUTS = {
  practiceA: practiceALayout,
  practiceB: practiceBLayout,
  partA: partALayout,
  partB: partBLayout,
};

// Expected correct order of labels for each layout.
export const SEQUENCES = {
  practiceA: ['1', '2', '3', '4', '5', '6', '7', '8'],
  practiceB: ['1', 'A', '2', 'B', '3', 'C', '4', 'D'],
  partA: Array.from({ length: 25 }, (_, i) => String(i + 1)),
  partB: (() => {
    const letters = 'ABCDEFGHIJKL'.split('');
    const seq = [];
    for (let i = 0; i < 12; i++) {
      seq.push(String(i + 1));
      seq.push(letters[i]);
    }
    seq.push('13');
    return seq;
  })(),
};

export const DEFAULT_SETTINGS = {
  maxTimePartA: 100,   // seconds — test aborts at this time (PDF: 100s)
  maxTimePartB: 300,   // seconds — test aborts at this time (PDF: 300s)
  circleSize: 56,      // px — diameter of each circle
  countdownTimer: 3,
};

export const PRACTICE_SETTINGS = {
  maxTimePartA: 60,
  maxTimePartB: 120,
  circleSize: 64,
  countdownTimer: 3,
};

export const THEME_COLOR = '#00897b';

// TMT is a mouse/touch test — no keyboard response key
export const RESPONSE_KEY = null;
