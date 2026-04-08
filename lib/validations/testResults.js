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
 */
function validateCorsiData(data) {
  const errors = [];

  // Required fields
  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    // Validate each trial
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (!isArray(trial.sequence)) {
        errors.push(`trials[${index}].sequence must be an array`);
      }
      if (!isArray(trial.userSequence)) {
        errors.push(`trials[${index}].userSequence must be an array`);
      }
      if (!isBoolean(trial.correct)) {
        errors.push(`trials[${index}].correct must be a boolean`);
      }
      if (!isPositiveNumber(trial.reactionTime)) {
        errors.push(`trials[${index}].reactionTime must be a positive number`);
      }
    });
  }

  if (!isPositiveNumber(data.span)) {
    errors.push('span must be a positive number');
  }

  if (!isPositiveNumber(data.totalScore)) {
    errors.push('totalScore must be a positive number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Tower of London test results
 */
function validateTolData(data) {
  const errors = [];

  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (!isPositiveNumber(trial.moves)) {
        errors.push(`trials[${index}].moves must be a positive number`);
      }
      if (!isPositiveNumber(trial.optimalMoves)) {
        errors.push(`trials[${index}].optimalMoves must be a positive number`);
      }
      if (!isPositiveNumber(trial.time)) {
        errors.push(`trials[${index}].time must be a positive number`);
      }
      if (!isBoolean(trial.solved)) {
        errors.push(`trials[${index}].solved must be a boolean`);
      }
    });
  }

  if (!isPositiveNumber(data.totalScore)) {
    errors.push('totalScore must be a positive number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate PVT (Psychomotor Vigilance Task) test results
 */
function validatePvtData(data) {
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
      if (!isBoolean(trial.falseStart)) {
        errors.push(`trials[${index}].falseStart must be a boolean`);
      }
      if (!isPositiveNumber(trial.stimulusDelay)) {
        errors.push(`trials[${index}].stimulusDelay must be a positive number`);
      }
    });
  }

  if (!isPositiveNumber(data.meanRT)) {
    errors.push('meanRT must be a positive number');
  }

  if (!isPositiveNumber(data.medianRT)) {
    errors.push('medianRT must be a positive number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Go/No-Go SST test results
 */
function validateGngData(data) {
  const errors = [];

  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (!isString(trial.type)) {
        errors.push(`trials[${index}].type must be a string`);
      }
      if (!isBoolean(trial.correct)) {
        errors.push(`trials[${index}].correct must be a boolean`);
      }
      if (trial.reactionTime !== null && !isPositiveNumber(trial.reactionTime)) {
        errors.push(`trials[${index}].reactionTime must be null or a positive number`);
      }
    });
  }

  if (!isPositiveNumber(data.accuracy)) {
    errors.push('accuracy must be a positive number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate RPM (Raven's Progressive Matrices) test results
 */
function validateRpmData(data) {
  const errors = [];

  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (!isPositiveNumber(trial.problemId)) {
        errors.push(`trials[${index}].problemId must be a positive number`);
      }
      if (!isPositiveNumber(trial.userAnswer)) {
        errors.push(`trials[${index}].userAnswer must be a positive number`);
      }
      if (!isBoolean(trial.correct)) {
        errors.push(`trials[${index}].correct must be a boolean`);
      }
      if (!isPositiveNumber(trial.time)) {
        errors.push(`trials[${index}].time must be a positive number`);
      }
    });
  }

  if (!isPositiveNumber(data.totalScore)) {
    errors.push('totalScore must be a positive number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate AKT (Attention Concentration Test) test results
 */
function validateAktData(data) {
  const errors = [];

  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (!isPositiveNumber(trial.correctClicks)) {
        errors.push(`trials[${index}].correctClicks must be a positive number`);
      }
      if (!isPositiveNumber(trial.incorrectClicks)) {
        errors.push(`trials[${index}].incorrectClicks must be a positive number`);
      }
      if (!isPositiveNumber(trial.time)) {
        errors.push(`trials[${index}].time must be a positive number`);
      }
    });
  }

  if (!isPositiveNumber(data.totalScore)) {
    errors.push('totalScore must be a positive number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate WTB (Word/Tone/Beat) test results
 */
function validateWtbData(data) {
  const errors = [];

  if (!isArray(data.trials)) {
    errors.push('trials must be an array');
  } else {
    data.trials.forEach((trial, index) => {
      if (!isObject(trial)) {
        errors.push(`trials[${index}] must be an object`);
        return;
      }
      if (!isBoolean(trial.correct)) {
        errors.push(`trials[${index}].correct must be a boolean`);
      }
      if (!isPositiveNumber(trial.reactionTime)) {
        errors.push(`trials[${index}].reactionTime must be a positive number`);
      }
    });
  }

  if (!isPositiveNumber(data.accuracy)) {
    errors.push('accuracy must be a positive number');
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
