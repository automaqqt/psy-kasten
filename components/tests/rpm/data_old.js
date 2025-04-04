// components/tests/rpm/rpmData.js

export const RPM_SETS = ['A', 'B', 'C', 'D', 'E'];
export const ITEMS_PER_SET = 12;

// Correct answers (1-based index) from PDF page 72
const CORRECT_ANSWERS = {
  A: [4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 4, 5],
  B: [2, 6, 1, 2, 1, 3, 5, 6, 4, 3, 4, 5],
  C: [8, 2, 3, 8, 7, 4, 5, 1, 7, 6, 1, 2],
  D: [3, 4, 3, 7, 8, 6, 5, 4, 1, 2, 5, 6],
  E: [7, 6, 8, 2, 1, 5, 5, 6, 4, 3, 2, 8],
};

export const PROBLEMS = [];

RPM_SETS.forEach(set => {
  for (let i = 1; i <= ITEMS_PER_SET; i++) {
    const problemId = `${set}${i}`;
    const numOptions = (set === 'A' || set === 'B') ? 6 : 8; // Sets A/B have 6 options, C/D/E have 8
    const options = [];
    for (let j = 1; j <= numOptions; j++) {
      // Placeholder for option image - replace with actual image paths/URLs
      options.push({ id: j, imagePlaceholder: `Option ${j}` });
    }

    PROBLEMS.push({
      id: problemId,
      set: set,
      number: i,
      // Placeholder for main matrix image - replace with actual image paths/URLs
      matrixImagePlaceholder: `Matrix ${problemId}`,
      options: options,
      correctOptionId: CORRECT_ANSWERS[set][i - 1], // Get 1-based correct answer ID
    });
  }
});

// console.log(PROBLEMS); // Verify structure if needed