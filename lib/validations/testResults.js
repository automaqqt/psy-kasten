/**
 * Validation schemas for test result data
 * Prevents malicious or malformed data from being stored
 */

/**
 * Base validation helper functions
 */
const isPositiveNumber = (val) => typeof val === 'number' && val >= 0 && !isNaN(val);
const isBoolean = (val) => typeof val === 'boolean';
const isString = (val) => typeof val === 'string';
const isArray = (val) => Array.isArray(val);
const isObject = (val) => typeof val === 'object' && val !== null && !Array.isArray(val);

/**
 * Validate Corsi Block test results
 * Shape: { corsiSpan, ubs, totalScore, errorCountF1, errorCountF2, errorCountF3,
 *          rounds[], settingsUsed, completedSuccessfully, consecutiveFailures, successesPerLevel }
 */
function validateCorsiData(data) {
  const errors = [];

  if (!isPositiveNumber(data.corsiSpan)) {
    errors.push('corsiSpan must be a non-negative number');
  }
  if (!isPositiveNumber(data.ubs)) {
    errors.push('ubs must be a non-negative number');
  }
  if (!isPositiveNumber(data.totalScore)) {
    errors.push('totalScore must be a non-negative number');
  }
  if (!isPositiveNumber(data.errorCountF1)) {
    errors.push('errorCountF1 must be a non-negative number');
  }
  if (!isPositiveNumber(data.errorCountF2)) {
    errors.push('errorCountF2 must be a non-negative number');
  }
  if (!isPositiveNumber(data.errorCountF3)) {
    errors.push('errorCountF3 must be a non-negative number');
  }
  if (!isArray(data.rounds)) {
    errors.push('rounds must be an array');
  }
  if (typeof data.completedSuccessfully !== 'boolean') {
    errors.push('completedSuccessfully must be a boolean');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Tower of London test results
 * Shape: array of { problemIndex, startState, goalState, minMoves, attempts[] }
 */
function validateTolData(data) {
  const errors = [];

  if (!isArray(data)) {
    errors.push('data must be an array of problem results');
  } else {
    data.forEach((problem, index) => {
      if (!isObject(problem)) {
        errors.push(`problemResults[${index}] must be an object`);
        return;
      }
      if (!isPositiveNumber(problem.problemIndex)) {
        errors.push(`problemResults[${index}].problemIndex must be a non-negative number`);
      }
      if (!isPositiveNumber(problem.minMoves)) {
        errors.push(`problemResults[${index}].minMoves must be a non-negative number`);
      }
      if (!isArray(problem.attempts)) {
        errors.push(`problemResults[${index}].attempts must be an array`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate PVT (Psychomotor Vigilance Task) test results
 * Shape: raw array of { trialNumber, intervalTime, startTime, reactionTime, falseStart, [endTime] }
 */
function validatePvtData(data) {
  const errors = [];

  if (!isArray(data)) {
    errors.push('data must be an array of trials');
  } else {
    data.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (!isPositiveNumber(trial.trialNumber)) {
        errors.push(`trials[${index}].trialNumber must be a non-negative number`);
      }
      if (typeof trial.falseStart !== 'boolean') {
        errors.push(`trials[${index}].falseStart must be a boolean`);
      }
      // reactionTime is null for false starts
      if (!trial.falseStart && trial.reactionTime !== null && !isPositiveNumber(trial.reactionTime)) {
        errors.push(`trials[${index}].reactionTime must be null or a non-negative number`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Go/No-Go SST test results
 * Shape: raw array of { trialNum, type, stimulus, stopSignal, ssd, isi, responseKey, responseTime, outcome }
 */
function validateGngData(data) {
  const errors = [];

  if (!isArray(data)) {
    errors.push('data must be an array of trials');
  } else {
    data.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (!isString(trial.type)) {
        errors.push(`trials[${index}].type must be a string`);
      }
      if (!isString(trial.outcome)) {
        errors.push(`trials[${index}].outcome must be a string`);
      }
      // responseTime can be null when no response was given
      if (trial.responseTime !== null && trial.responseTime !== undefined && !isPositiveNumber(trial.responseTime)) {
        errors.push(`trials[${index}].responseTime must be null or a non-negative number`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate RPM (Raven's Progressive Matrices) test results
 * Shape: { userAnswers, correctCount, totalProblems, accuracy, startTime, endTime, timeTaken, settingsUsed }
 */
function validateRpmData(data) {
  const errors = [];

  if (!isObject(data.userAnswers)) {
    errors.push('userAnswers must be an object');
  }
  if (!isPositiveNumber(data.correctCount)) {
    errors.push('correctCount must be a non-negative number');
  }
  if (!isPositiveNumber(data.totalProblems)) {
    errors.push('totalProblems must be a non-negative number');
  }
  if (!isPositiveNumber(data.accuracy)) {
    errors.push('accuracy must be a non-negative number');
  }
  if (!isPositiveNumber(data.timeTaken)) {
    errors.push('timeTaken must be a non-negative number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate AKT (Attention Concentration Test) test results
 */
function validateAktData(data) {
  const errors = [];

  if (!isPositiveNumber(data.T)) {
    errors.push('T (time) must be a non-negative number');
  }
  if (!isPositiveNumber(data.R)) {
    errors.push('R (correct targets) must be a non-negative number');
  }
  if (!isPositiveNumber(data.F)) {
    errors.push('F (total errors) must be a non-negative number');
  }
  if (!isPositiveNumber(data.F1)) {
    errors.push('F1 (horizontal flip errors) must be a non-negative number');
  }
  if (!isPositiveNumber(data.F2)) {
    errors.push('F2 (vertical flip errors) must be a non-negative number');
  }
  if (!isPositiveNumber(data.F3)) {
    errors.push('F3 (double errors) must be a non-negative number');
  }
  if (!isPositiveNumber(data.Omissions)) {
    errors.push('Omissions must be a non-negative number');
  }
  if (!isPositiveNumber(data.F_perc)) {
    errors.push('F_perc must be a non-negative number');
  }
  if (!isPositiveNumber(data.G)) {
    errors.push('G (total score) must be a non-negative number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate WTB (Word/Tone/Beat) test results
 * Shape: { maxLevel, totalScore, rounds[], settingsUsed, completedSuccessfully, sequenceIndexPerLevel, attemptsPerLevel }
 */
function validateWtbData(data) {
  const errors = [];

  if (!isPositiveNumber(data.maxLevel)) {
    errors.push('maxLevel must be a non-negative number');
  }
  if (!isPositiveNumber(data.totalScore)) {
    errors.push('totalScore must be a non-negative number');
  }
  if (!isArray(data.rounds)) {
    errors.push('rounds must be an array');
  }
  if (typeof data.completedSuccessfully !== 'boolean') {
    errors.push('completedSuccessfully must be a boolean');
  }

  return { valid: errors.length === 0, errors };
}



/**
 * Validate WCST (Wisconsin Card Sorting Test) results
 */
function validateWcstData(data) {
  const errors = [];

  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (!isPositiveNumber(trial.reactionTime)) {
        errors.push(`trials[${index}].reactionTime must be a positive number`);
      }
      if (!isBoolean(trial.correct)) {
        errors.push(`trials[${index}].correct must be a boolean`);
      }
      if (!isString(trial.rule)) {
        errors.push(`trials[${index}].rule must be a string`);
      }
    });
  }

  if (data.categoriesCompleted !== undefined && !isPositiveNumber(data.categoriesCompleted)) {
    errors.push('categoriesCompleted must be a positive number');
  }

  return { valid: errors.length === 0, errors };
}


/**
 * Validate MOT (Multiple Object Tracking) test results
 * Shape: { trials: [{ trialNumber, numTargets, correctSelections, incorrectSelections, missedTargets, accuracy, responseTime }], summary: {...} }
 */
function validateMotData(data) {
  const errors = [];

  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (typeof trial.correctSelections !== 'number') {
        errors.push(`trials[${index}].correctSelections must be a number`);
      }
      if (typeof trial.accuracy !== 'number') {
        errors.push(`trials[${index}].accuracy must be a number`);
      }
      if (!isPositiveNumber(trial.responseTime)) {
        errors.push(`trials[${index}].responseTime must be a positive number`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}


/**
 * Validate Prlt test results
 */
function validatePrltData(data) {
  const errors = [];

  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (!isPositiveNumber(trial.reactionTime)) {
        errors.push(`trials[${index}].reactionTime must be a positive number`);
      }
      if (typeof trial.choseHighProb !== 'boolean') {
        errors.push(`trials[${index}].choseHighProb must be a boolean`);
      }
      if (typeof trial.rewarded !== 'boolean') {
        errors.push(`trials[${index}].rewarded must be a boolean`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}


/**
 * Validate Nback test results
 */
function validateNbackData(data) {
  const errors = [];

  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (typeof trial.letter !== 'string') {
        errors.push(`trials[${index}].letter must be a string`);
      }
      if (typeof trial.isTarget !== 'boolean') {
        errors.push(`trials[${index}].isTarget must be a boolean`);
      }
      if (trial.reactionTime !== null && !isPositiveNumber(trial.reactionTime)) {
        errors.push(`trials[${index}].reactionTime must be a positive number or null`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}


/**
 * Validate PAL (Paired Associates Learning) test results
 */
function validatePalData(data) {
  const errors = [];

  if (!isArray(data.responses)) {
    errors.push('responses must be an array');
  } else {
    data.responses.forEach((r, index) => {
      if (!isObject(r)) {
        errors.push(`responses[${index}] must be an object`);
        return;
      }
      if (typeof r.correct !== 'boolean') {
        errors.push(`responses[${index}].correct must be a boolean`);
      }
      if (typeof r.levelIndex !== 'number') {
        errors.push(`responses[${index}].levelIndex must be a number`);
      }
      if (typeof r.selectedBoxIndex !== 'number') {
        errors.push(`responses[${index}].selectedBoxIndex must be a number`);
      }
      if (typeof r.correctBoxIndex !== 'number') {
        errors.push(`responses[${index}].correctBoxIndex must be a number`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}


/**
 * Validate VM (Visual Memory) test results
 * Shape: { vmSpan, totalCorrect, roundData[], settingsUsed }
 */
function validateVmData(data) {
  const errors = [];

  if (!isPositiveNumber(data.vmSpan)) {
    errors.push('vmSpan must be a non-negative number');
  }
  if (!isPositiveNumber(data.totalCorrect)) {
    errors.push('totalCorrect must be a non-negative number');
  }
  if (!isArray(data.roundData)) {
    errors.push('roundData must be an array');
  } else {
    data.roundData.forEach((round, index) => {
      if (!isObject(round)) {
        errors.push(`roundData[${index}] must be an object`);
        return;
      }
      if (typeof round.level !== 'number') {
        errors.push(`roundData[${index}].level must be a number`);
      }
      if (typeof round.success !== 'boolean') {
        errors.push(`roundData[${index}].success must be a boolean`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}


/**
 * Validate Sternberg Working Memory Task results
 */
function validateStbData(data) {
  const errors = [];

  // Data can be a raw array or { trials: [...] }
  const trials = Array.isArray(data) ? data : data.trials;

  if (!isArray(trials)) {
    errors.push('trials must be an array');
  } else {
    trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (trial.reactionTime !== null && !isPositiveNumber(trial.reactionTime)) {
        errors.push(`trials[${index}].reactionTime must be a positive number or null`);
      }
      if (typeof trial.correct !== 'boolean') {
        errors.push(`trials[${index}].correct must be a boolean`);
      }
      if (!trial.probeLetter || typeof trial.probeLetter !== 'string') {
        errors.push(`trials[${index}].probeLetter must be a non-empty string`);
      }
      if (typeof trial.probeInSet !== 'boolean') {
        errors.push(`trials[${index}].probeInSet must be a boolean`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}


/**
 * Validate Tmt test results
 * Expected shape: { partA: { timeSec, errors, aborted, totalCircles, clicks[] }, partB: {...} }
 */
function validateTmtData(data) {
  const errors = [];

  const validatePart = (name, part) => {
    if (part == null) return;
    if (!isObject(part)) {
      errors.push(`${name} must be an object`);
      return;
    }
    if (!isPositiveNumber(part.timeSec)) {
      errors.push(`${name}.timeSec must be a non-negative number`);
    }
    if (!isPositiveNumber(part.errors)) {
      errors.push(`${name}.errors must be a non-negative number`);
    }
    if (part.clicks != null && !isArray(part.clicks)) {
      errors.push(`${name}.clicks must be an array if present`);
    }
  };

  if (data.partA == null && data.partB == null) {
    errors.push('at least one of partA or partB must be present');
  }
  validatePart('partA', data.partA);
  validatePart('partB', data.partB);

  return { valid: errors.length === 0, errors };
}


/**
 * Validate BART (Balloon Analogue Risk Task) results
 * Expected shape: {
 *   trials: [{ trialNumber, color, breakPoint, pumps, exploded, earningsCents }],
 *   totalEarnedCents: number,
 *   summary: { ... }
 * }
 */
function validateBartData(data) {
  const errors = [];
  const validColors = ['blue', 'yellow', 'orange'];

  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (!isPositiveNumber(trial.trialNumber)) {
        errors.push(`trials[${index}].trialNumber must be a positive number`);
      }
      if (!isString(trial.color) || !validColors.includes(trial.color)) {
        errors.push(`trials[${index}].color must be one of: ${validColors.join(', ')}`);
      }
      if (!isPositiveNumber(trial.pumps)) {
        errors.push(`trials[${index}].pumps must be a non-negative number`);
      }
      if (!isPositiveNumber(trial.breakPoint)) {
        errors.push(`trials[${index}].breakPoint must be a positive number`);
      }
      if (!isBoolean(trial.exploded)) {
        errors.push(`trials[${index}].exploded must be a boolean`);
      }
      if (!isPositiveNumber(trial.earningsCents)) {
        errors.push(`trials[${index}].earningsCents must be a non-negative number`);
      }
    });
  }

  if (data.totalEarnedCents !== undefined && !isPositiveNumber(data.totalEarnedCents)) {
    errors.push('totalEarnedCents must be a non-negative number');
  }

  return { valid: errors.length === 0, errors };
}

// --- Validator Registry ---
const VALIDATORS = {
  'corsi': validateCorsiData,
  'tol': validateTolData,
  'pvt': validatePvtData,
  'gng-sst': validateGngData,
  'rpm': validateRpmData,
  'akt': validateAktData,
  'wtb': validateWtbData,
  'wcst': validateWcstData,
  'mot': validateMotData,
  'prlt': validatePrltData,
  'nback': validateNbackData,
  'pal': validatePalData,
  'stb': validateStbData,
  'vm': validateVmData,
  'tmt': validateTmtData,
  'bart': validateBartData,
};

/**
 * Register a new test result validator.
 * Usage: registerValidator('mytest', validateMyTestData);
 */
function registerValidator(testType, validatorFn) {
  VALIDATORS[testType] = validatorFn;
}

/**
 * Main validation function - routes to appropriate validator
 * @param {string} testType - The type of test
 * @param {object} testData - The test data to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateTestResult(testType, testData) {
  // Basic validation
  if (!testData || typeof testData !== 'object') {
    return { valid: false, errors: ['testData must be an object'] };
  }

  // Prevent prototype pollution
  if (Object.prototype.hasOwnProperty.call(testData, '__proto__') ||
      Object.prototype.hasOwnProperty.call(testData, 'constructor') ||
      Object.prototype.hasOwnProperty.call(testData, 'prototype')) {
    return { valid: false, errors: ['testData contains forbidden properties'] };
  }

  const validator = VALIDATORS[testType];
  if (validator) {
    return validator(testData);
  }

  // Unknown test type - allow with warning but do basic safety checks
  console.warn(`No validator found for test type: ${testType}`);
  return { valid: true, errors: [], warning: 'No specific validator available' };
}

module.exports = {
  validateTestResult,
  registerValidator,
  validateCorsiData,
  validateTolData,
  validatePvtData,
  validateGngData,
  validateRpmData,
  validateAktData,
  validateWtbData,
  validateWcstData,
};
