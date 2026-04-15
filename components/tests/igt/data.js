// components/tests/igt/data.js
//
// Iowa Gambling Task (Bechara, Damasio, Damasio & Anderson, 1994).
// Four decks. Two "bad" decks (A, B) deliver a large immediate reward with
// occasional larger losses (net loss over 10 cards). Two "good" decks (C, D)
// deliver a smaller reward but smaller losses (net gain over 10 cards).
// Decks A and C have frequent losses (5 of 10 cards); decks B and D have
// infrequent losses (1 of 10 cards).

// Per-deck reward/loss schedule (every 10-card cycle). Each entry is the
// NET outcome for that draw: reward - loss. Cards cycle in order and the
// cycle repeats indefinitely.
//
// Losses follow the traditional Bechara (1994) schedule:
//   Deck A: reward $100, losses of $150, $200, $250, $300, $350 on 5 of 10
//   Deck B: reward $100, single loss of $1250 on 1 of 10
//   Deck C: reward $50,  losses of $25, $75, $50, $25, $75 on 5 of 10
//   Deck D: reward $50,  single loss of $250 on 1 of 10
// Net per 10-card block: A = -250, B = -250, C = +250, D = +250.
export const DECK_SCHEDULES = {
  A: [
    { reward: 100, loss: 0 },
    { reward: 100, loss: 0 },
    { reward: 100, loss: 150 },
    { reward: 100, loss: 0 },
    { reward: 100, loss: 300 },
    { reward: 100, loss: 200 },
    { reward: 100, loss: 0 },
    { reward: 100, loss: 250 },
    { reward: 100, loss: 0 },
    { reward: 100, loss: 350 },
  ],
  B: [
    { reward: 100, loss: 0 },
    { reward: 100, loss: 0 },
    { reward: 100, loss: 0 },
    { reward: 100, loss: 0 },
    { reward: 100, loss: 0 },
    { reward: 100, loss: 0 },
    { reward: 100, loss: 0 },
    { reward: 100, loss: 0 },
    { reward: 100, loss: 1250 },
    { reward: 100, loss: 0 },
  ],
  C: [
    { reward: 50, loss: 0 },
    { reward: 50, loss: 0 },
    { reward: 50, loss: 50 },
    { reward: 50, loss: 0 },
    { reward: 50, loss: 50 },
    { reward: 50, loss: 50 },
    { reward: 50, loss: 0 },
    { reward: 50, loss: 25 },
    { reward: 50, loss: 75 },
    { reward: 50, loss: 0 },
  ],
  D: [
    { reward: 50, loss: 0 },
    { reward: 50, loss: 0 },
    { reward: 50, loss: 0 },
    { reward: 50, loss: 0 },
    { reward: 50, loss: 0 },
    { reward: 50, loss: 0 },
    { reward: 50, loss: 0 },
    { reward: 50, loss: 0 },
    { reward: 50, loss: 250 },
    { reward: 50, loss: 0 },
  ],
};

export const DECK_IDS = ['A', 'B', 'C', 'D'];
export const BAD_DECKS = ['A', 'B'];
export const GOOD_DECKS = ['C', 'D'];

export const DEFAULT_SETTINGS = {
  totalTrials: 100,         // Standard IGT length
  startingBalance: 2000,    // Facsimile money in $
  countdownTimer: 3,        // Countdown seconds before the test starts
  feedbackDuration: 1500,   // How long reward/loss feedback is shown (ms)
  itiDuration: 400,         // Inter-trial interval after feedback (ms)
};

// Practice: short cycle, same mechanics so the participant gets the feel.
export const PRACTICE_SETTINGS = {
  totalTrials: 10,
  startingBalance: 2000,
  countdownTimer: 3,
  feedbackDuration: 1500,
  itiDuration: 400,
};

export const THEME_COLOR = '#f9a825';

// IGT is mouse-only — no keyboard response.
export const RESPONSE_KEY = null;
