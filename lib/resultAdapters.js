/**
 * Result Adapters
 * Maps stored result.data from the database to the props expected by each test's result component.
 */

import { PROBLEMS, RPM_SETS } from '../components/tests/rpm/data';

/**
 * Reconstruct an array from an object with numeric keys.
 * The API does {...testData, completedAt} which spreads arrays into objects like {0: item0, 1: item1, ...}
 */
function reconstructArray(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  const numericKeys = Object.keys(data).filter(k => !isNaN(k));
  if (numericKeys.length === 0) return [];

  return numericKeys
    .sort((a, b) => Number(a) - Number(b))
    .map(k => data[k]);
}

/**
 * Corsi Block Test
 * Stored: { corsiSpan, ubs, totalScore, errorCountF1, errorCountF2, errorCountF3, rounds, settingsUsed, ... }
 * Component: DetailedResults({ roundData, calculateCorsiSpan, ubs, errorCountF1, errorCountF2, errorCountF3, isStandalone, t })
 */
export function adaptCorsiResult(data) {
  if (!data || !data.rounds) return null;
  return {
    roundData: data.rounds || [],
    calculateCorsiSpan: data.corsiSpan || data.ubs || 0,
    ubs: data.ubs || data.corsiSpan || 0,
    errorCountF1: data.errorCountF1 || 0,
    errorCountF2: data.errorCountF2 || 0,
    errorCountF3: data.errorCountF3 || 0,
    isStandalone: false,
  };
}

/**
 * PVT (Psychomotor Vigilance Task)
 * Stored: raw trials array spread into object OR { trials, meanRT, medianRT, ... }
 * Component: PVTResults({ trials, falseStarts, t })
 */
export function adaptPvtResult(data) {
  if (!data) return null;

  let trials;
  if (data.trials && Array.isArray(data.trials)) {
    trials = data.trials;
  } else {
    // Might be a spread array {0: t0, 1: t1, ...}
    trials = reconstructArray(data);
  }

  if (!trials || trials.length === 0) return null;

  const falseStarts = trials.filter(t => t.falseStart).length;
  return { trials, falseStarts };
}

/**
 * Go/No-Go Stop Signal Task
 * Stored: raw trialData array spread into object OR array
 * Component: GNGResults({ results, settings, onRestart, t })
 */
export function adaptGngResult(data) {
  if (!data) return null;

  let results;
  if (Array.isArray(data)) {
    results = data;
  } else if (data.trials && Array.isArray(data.trials)) {
    results = data.trials;
  } else {
    results = reconstructArray(data);
  }

  if (!results || results.length === 0) return null;

  // Provide default settings — the component uses settings.stopSignalProbability for conditional rendering
  const hasStopTrials = results.some(r => r.type === 'stop');
  const settings = {
    stopSignalProbability: hasStopTrials ? 0.25 : 0,
  };

  return { results, settings, onRestart: null };
}

/**
 * RPM (Raven's Progressive Matrices)
 * Stored: { userAnswers, correctCount, totalProblems, accuracy, startTime, endTime, timeTaken, settingsUsed }
 * Component: RPMResults({ userAnswers, problems, startTime, endTime, settings, onRestart })
 */
export function adaptRpmResult(data) {
  if (!data || !data.userAnswers) return null;
  return {
    userAnswers: data.userAnswers,
    problems: PROBLEMS,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    settings: data.settingsUsed || { isTimed: false },
    onRestart: null,
  };
}

/**
 * Tower of London
 * Stored: { trials, totalScore } — but TOL doesn't submit results yet
 * Component: TOLResults({ testData, onRestart })
 */
export function adaptTolResult(data) {
  if (!data) return null;
  // TOL component expects testData as an array of problem results
  const testData = data.trials || data.testData || (Array.isArray(data) ? data : null);
  if (!testData) return null;
  return { testData, onRestart: null };
}

/**
 * Visual Memory
 * Stored: { vmSpan, totalCorrect, roundData, settingsUsed }
 * Component: VmResults({ roundData })
 */
export function adaptVmResult(data) {
  if (!data || !data.roundData) return null;
  return { roundData: data.roundData };
}

/**
 * AKT (Attention Concentration Test)
 * Stored: { T, R, F, F1, F2, F3, Omissions, F_perc, G }
 * Component: AktResults({ results, t })
 */
export function adaptAktResult(data) {
  if (!data || data.G === undefined) return null;
  return { results: data };
}

/**
 * WTB (Word/Tone/Beat)
 * Stored: { maxLevel, totalScore, rounds, settingsUsed, ... }
 * Component: WtbResults({ roundData, maxLevel, totalScore, isStandalone, t })
 */
export function adaptWtbResult(data) {
  if (!data || !data.rounds) return null;
  return {
    roundData: data.rounds,
    maxLevel: data.maxLevel || 0,
    totalScore: data.totalScore || 0,
    isStandalone: false,
  };
}

/**
 * CPT (Continuous Performance Test)
 * Stored: { trials, stats, targetLetter }
 * Component: CPTResults({ trials, stats, targetLetter })
 */
export function adaptCptResult(data) {
  if (!data || !data.trials || !data.stats) return null;
  return {
    trials: data.trials,
    stats: data.stats,
    targetLetter: data.targetLetter || 'X',
  };
}



/**
 * WCST (Wisconsin Card Sorting Test)
 * Stored: { trials, totalTrials, totalErrors, perseverationErrors, nonPerseverationErrors, categoriesCompleted, accuracy, settingsUsed }
 * Component: WcstResults({ trials, categoriesCompleted, settings, onRestart, t })
 */
export function adaptWcstResult(data) {
  if (!data) return null;

  let trials;
  if (data.trials && Array.isArray(data.trials)) {
    trials = data.trials;
  } else {
    trials = reconstructArray(data);
  }

  if (!trials || trials.length === 0) return null;

  return {
    trials,
    categoriesCompleted: data.categoriesCompleted || 0,
    settings: data.settingsUsed || {},
    onRestart: null,
  };
}

// --- Adapter Registry ---
const ADAPTERS = {
  'corsi': adaptCorsiResult,
  'pvt': adaptPvtResult,
  'gng-sst': adaptGngResult,
  'rpm': adaptRpmResult,
  'tol': adaptTolResult,
  'vm': adaptVmResult,
  'akt': adaptAktResult,
  'wtb': adaptWtbResult,
  'cpt': adaptCptResult,
  'wcst': adaptWcstResult,
};

/**
 * Register a new result adapter.
 * Usage: registerAdapter('mytest', adaptMyTestResult);
 */
export function registerAdapter(testType, adapterFn) {
  ADAPTERS[testType] = adapterFn;
}

/**
 * Main adapter function — returns adapted props for the given test type, or null if unsupported/invalid data.
 */
export function getAdaptedProps(testType, data) {
  const adapter = ADAPTERS[testType];
  return adapter ? adapter(data) : null;
}
