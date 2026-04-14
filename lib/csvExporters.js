/**
 * CSV Exporters
 * Per-test CSV generation functions that mirror each test's built-in exportResultsToCSV.
 * Each function takes result.data and returns { headers: string[], rows: any[][] }
 */

import { PROBLEMS, RPM_SETS } from '../components/tests/rpm/data';

/**
 * Reconstruct an array from an object with numeric keys (same as in resultAdapters)
 */
function reconstructArray(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const numericKeys = Object.keys(data).filter(k => !isNaN(k));
  if (numericKeys.length === 0) return [];
  return numericKeys.sort((a, b) => Number(a) - Number(b)).map(k => data[k]);
}

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildCSV(headers, rows) {
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// ── Corsi ──────────────────────────────────────────────────
export function exportCorsiCSV(data) {
  const rounds = data.rounds || [];
  const ubs = data.ubs || data.corsiSpan || 0;

  const headers = [
    'Round', 'Level', 'Success', 'Error_Type',
    'Total Response Time (ms)', 'Average Click Interval (ms)',
    'Target Sequence', 'User Sequence'
  ];

  const rows = rounds.map((round, i) => [
    i + 1, round.level,
    round.success ? 'Success' : 'Failure',
    round.errorType || '',
    Math.round(round.totalResponseTime),
    Math.round(round.avgClickInterval || 0),
    round.sequence.join('-'),
    round.userSequence.join('-')
  ]);

  rows.push([]);
  rows.push(['SUMMARY']);
  rows.push(['UBS (Corsi Span)', ubs]);
  rows.push(['Total F1 Errors (Sequencing)', data.errorCountF1 || 0]);
  rows.push(['Total F2 Errors (Wrong/Missing)', data.errorCountF2 || 0]);
  rows.push(['Total F3 Errors (Duplicate Clicks)', data.errorCountF3 || 0]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `corsi-results-${new Date().toISOString().split('T')[0]}.csv`);
}

// ── PVT ────────────────────────────────────────────────────
export function exportPvtCSV(data) {
  let trials = data.trials && Array.isArray(data.trials) ? data.trials : reconstructArray(data);

  const headers = ['Trial Number', 'Type', 'Reaction Time (ms)', 'Interval (ms)'];
  const rows = trials.map(trial => [
    trial.trialNumber,
    trial.falseStart ? 'False Start' : 'Valid',
    trial.reactionTime || '',
    trial.intervalTime || ''
  ]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `pvt-results-${new Date().toISOString().split('T')[0]}.csv`);
}

// ── GNG-SST ────────────────────────────────────────────────
export function exportGngCSV(data) {
  let results;
  if (Array.isArray(data)) {
    results = data;
  } else if (data.trials && Array.isArray(data.trials)) {
    results = data.trials;
  } else {
    results = reconstructArray(data);
  }

  const headers = [
    'TrialNum', 'TrialType', 'Stimulus', 'StopSignalTriggered',
    'SSD_Used_ms', 'ResponseKey', 'ResponseTime_ms', 'Outcome'
  ];

  const rows = results.map(r => [
    r.trialNum, r.type, JSON.stringify(r.stimulus), r.stopSignal,
    r.ssd ?? '', r.responseKey ?? '', r.responseTime?.toFixed(2) ?? '', r.outcome
  ]);

  // Summary
  const goTrials = results.filter(r => r.type === 'go');
  const correctGoRTs = results.filter(r => r.outcome === 'correctGo').map(r => r.responseTime).filter(Boolean);
  const meanGoRT = correctGoRTs.length > 0 ? correctGoRTs.reduce((a, b) => a + b, 0) / correctGoRTs.length : 0;

  rows.push([]);
  rows.push(['--- Summary ---']);
  rows.push(['Total Trials', results.length]);
  rows.push(['Correct Go RT Mean (ms)', meanGoRT.toFixed(2)]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `gng-sst-results-${new Date().toISOString().split('T')[0]}.csv`);
}

// ── RPM ────────────────────────────────────────────────────
export function exportRpmCSV(data) {
  const userAnswers = data.userAnswers || {};

  const headers = ['Item', 'Set', 'User Answer', 'Correct Answer', 'Result'];

  let totalScore = 0;
  const resultsByItem = PROBLEMS.map(problem => {
    const userAnswerId = userAnswers[problem.id];
    const isCorrect = userAnswerId === problem.correctOptionId;
    if (isCorrect) totalScore++;
    return { id: problem.id, set: problem.set, userAnswerId: userAnswerId ?? '-', correctAnswerId: problem.correctOptionId, isCorrect };
  });

  const rows = resultsByItem.map(r => [r.id, r.set, r.userAnswerId, r.correctAnswerId, r.isCorrect ? 'Correct' : 'Incorrect']);

  // Summary
  rows.push([]);
  const scoresBySet = RPM_SETS.reduce((acc, set) => {
    acc[set] = resultsByItem.filter(r => r.set === set && r.isCorrect).length;
    return acc;
  }, {});
  RPM_SETS.forEach(set => rows.push([`Set ${set} Score:`, scoresBySet[set]]));
  rows.push([`Total Score:`, totalScore, `(Max: ${PROBLEMS.length})`]);

  if (data.startTime && data.endTime) {
    const secs = Math.round((data.endTime - data.startTime) / 1000);
    rows.push([`Time Taken:`, `${Math.floor(secs / 60)}m ${secs % 60}s`]);
  }

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `rpm-results-${new Date().toISOString().split('T')[0]}.csv`);
}

// ── TOL ────────────────────────────────────────────────────
export function exportTolCSV(data) {
  const testData = data.trials || data.testData || (Array.isArray(data) ? data : []);

  const headers = ['Problem', 'Min Moves', 'Status', 'Moves Used', 'Planning Time (ms)', 'Execution Time (ms)', 'Skipped'];

  const rows = testData.map(result => {
    const attempt = result.attempts?.[0];
    let status = '-';
    if (attempt) {
      if (attempt.skipped) status = 'Skipped';
      else if (attempt.success) status = attempt.moves <= result.minMoves ? 'Solved Successfully' : 'Solved (Too Many Moves)';
      else status = 'Failed';
    }
    return [
      result.problemIndex + 1, result.minMoves, status,
      attempt ? attempt.moves : '-',
      attempt ? attempt.planningTime : '-',
      attempt ? attempt.executionTime : '-',
      attempt && attempt.skipped ? 'Yes' : 'No'
    ];
  });

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `tol-results-${new Date().toISOString().split('T')[0]}.csv`);
}

// ── VM ─────────────────────────────────────────────────────
export function exportVmCSV(data) {
  const roundData = data.roundData || [];

  const headers = [
    'Round', 'Level', 'Trial', 'Success', 'RecognitionTime_ms',
    'Hits', 'Misses_Omissions', 'False_Alarms', 'Target_Sequence', 'User_Selection'
  ];

  const rows = roundData.map((round, i) => [
    i + 1, round.level, round.trialIndex + 1,
    round.success ? 'Success' : 'Failure',
    Math.round(round.responseTime),
    round.hits, round.misses, round.falseAlarms,
    round.targetSequence.join('-'),
    round.userSelection.join('-')
  ]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `vm-results-${new Date().toISOString().split('T')[0]}.csv`);
}

// ── AKT ────────────────────────────────────────────────────
export function exportAktCSV(data) {
  const headers = [
    'Time_sec', 'Correct_R', 'Omissions', 'Errors_F_Total',
    'Errors_F1_RightLeft', 'Errors_F2_Position', 'Errors_F3_Double',
    'Error_Percent_F_perc', 'Total_Score_G'
  ];

  const rows = [[data.T, data.R, data.Omissions, data.F, data.F1, data.F2, data.F3, data.F_perc, data.G]];

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `akt-results-${new Date().toISOString().split('T')[0]}.csv`);
}

// ── WTB ────────────────────────────────────────────────────
export function exportWtbCSV(data) {
  const roundData = data.rounds || [];

  const mapLevelToUT3 = (level) => {
    const mapping = { 2: 'UT3_1', 3: 'UT3_2', 4: 'UT3_3', 5: 'UT3_4', 6: 'UT3_5', 7: 'UT3_6', 8: 'UT3_7', 9: 'UT3_8' };
    return mapping[level] || `Level ${level}`;
  };

  const headers = [
    'Round', 'Level', 'Success', 'Attempt_Number',
    'Points_Level_Solved', 'Points_First_Try_Bonus', 'Points_Total',
    'Target_Sequence', 'User_Sequence'
  ];

  const rows = roundData.map((round, i) => {
    const levelSolvedPoints = round.success ? 1 : 0;
    const firstTryBonusPoints = (round.success && round.level >= 3 && round.attemptNumber === 1) ? 1 : 0;
    return [
      i + 1, mapLevelToUT3(round.level),
      round.success ? 'Yes' : 'No',
      round.attemptNumber || 0,
      levelSolvedPoints, firstTryBonusPoints, levelSolvedPoints + firstTryBonusPoints,
      round.sequence.join(' '),
      round.userSequence.join(' ')
    ];
  });

  // Totals
  const totalLevelPoints = rows.reduce((sum, row) => sum + row[4], 0);
  const totalBonusPoints = rows.reduce((sum, row) => sum + row[5], 0);
  rows.push([]);
  rows.push(['TOTALS', '', '', '', totalLevelPoints, totalBonusPoints, totalLevelPoints + totalBonusPoints]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `wtb-results-${new Date().toISOString().split('T')[0]}.csv`);
}

// ── CPT ────────────────────────────────────────────────────
export function exportCptCSV(data) {
  const trials = data.trials || [];

  const headers = ['Trial', 'Time_ms', 'Stimulus', 'IsTarget', 'ResponseType', 'ResponseTime_ms'];
  const rows = trials.map((t, i) => [
    i + 1, t.trialStartTime, t.stimulus, t.isTarget,
    t.responseType, t.responseTime || ''
  ]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `cpt-results-${new Date().toISOString().split('T')[0]}.csv`);
}



// ── WCST ────────────────────────────────────────────────
export function exportWcstCSV(data) {
  let trials = data.trials && Array.isArray(data.trials) ? data.trials : reconstructArray(data);

  const headers = [
    'Trial', 'Rule', 'Category', 'Shape', 'Color', 'Count',
    'Selected Card', 'Correct Card', 'Correct', 'RT (ms)',
    'Error', 'Perseveration', 'Non-Perseveration', 'Too Slow'
  ];
  const rows = trials.map(trial => [
    trial.trialNumber, trial.rule || '', trial.categoryNumber || '',
    trial.stimulus?.shape || '', trial.stimulus?.colorName || '', trial.stimulus?.count || '',
    trial.selectedCard != null ? trial.selectedCard + 1 : '',
    trial.correctCard != null ? trial.correctCard + 1 : '',
    trial.correct ? 1 : 0,
    trial.reactionTime || '',
    trial.correct ? 0 : 1,
    trial.isPerseveration ? 1 : 0,
    trial.isNonPerseverationError ? 1 : 0,
    trial.tooSlow ? 1 : 0
  ]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `wcst-results-${new Date().toISOString().split('T')[0]}.csv`);
}


// ── MOT ────────────────────────────────────────────────
export function exportMotCSV(data) {
  let trials = data.trials && Array.isArray(data.trials) ? data.trials : reconstructArray(data);

  const headers = ['Trial', 'Targets', 'Correct', 'Incorrect', 'Missed', 'Accuracy (%)', 'Response Time (ms)'];
  const rows = trials.map(trial => [
    trial.trialNumber,
    trial.numTargets,
    trial.correctSelections,
    trial.incorrectSelections,
    trial.missedTargets,
    (trial.accuracy * 100).toFixed(1),
    trial.responseTime
  ]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `mot-results-${new Date().toISOString().split('T')[0]}.csv`);
}


// ── PRLT ────────────────────────────────────────────────
export function exportPrltCSV(data) {
  let trials = data.trials && Array.isArray(data.trials) ? data.trials : reconstructArray(data);

  const headers = [
    'Trial', 'High Prob Side', 'Chosen Side', 'Chose High Prob',
    'Rewarded', 'RT (ms)', 'Reversal #', 'Win-Stay', 'Lose-Shift', 'Timeout'
  ];
  const rows = trials.map(trial => [
    trial.trialNumber,
    trial.highProbSide || '',
    trial.chosenSide || '',
    trial.choseHighProb ? 1 : 0,
    trial.rewarded ? 1 : 0,
    trial.reactionTime || '',
    trial.reversalNumber,
    trial.isWinStay === null ? '' : (trial.isWinStay ? 1 : 0),
    trial.isLoseShift === null ? '' : (trial.isLoseShift ? 1 : 0),
    trial.tooSlow ? 1 : 0
  ]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `prlt-results-${new Date().toISOString().split('T')[0]}.csv`);
}


// ── NBACK ────────────────────────────────────────────────
export function exportNbackCSV(data) {
  let trials = data.trials && Array.isArray(data.trials) ? data.trials : reconstructArray(data);

  const headers = ['Trial', 'Letter', 'Is Target', 'Is Lure', 'Response', 'Correct', 'Outcome', 'RT (ms)', 'N-Level'];
  const rows = trials.filter(t => t.isScorable).map(trial => [
    trial.trialNumber,
    trial.letter,
    trial.isTarget,
    trial.isLure,
    trial.response || '',
    trial.correct,
    trial.outcomeType || '',
    trial.reactionTime || '',
    trial.nLevel
  ]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `nback-results-${new Date().toISOString().split('T')[0]}.csv`);
}


// ── PAL ────────────────────────────────────────────────
export function exportPalCSV(data) {
  let responses = data.responses && Array.isArray(data.responses) ? data.responses : reconstructArray(data);

  const headers = ['Response', 'Level', 'Num Patterns', 'Attempt', 'Correct', 'Selected Box', 'Correct Box', 'Pattern Index'];
  const rows = responses.map((r, i) => [
    i + 1,
    r.levelIndex + 1,
    r.numPatterns,
    r.attempt + 1,
    r.correct ? 1 : 0,
    r.selectedBoxIndex + 1,
    r.correctBoxIndex + 1,
    r.patternIndex
  ]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `pal-results-${new Date().toISOString().split('T')[0]}.csv`);
}


// ── STB ────────────────────────────────────────────────
export function exportStbCSV(data) {
  let trials = data.trials && Array.isArray(data.trials) ? data.trials : reconstructArray(data);

  const headers = [
    'Trial', 'Set Size', 'Ignore Count', 'Memorize Letters', 'Probe',
    'Probe In Set', 'Response', 'Correct', 'RT (ms)', 'Maintenance (ms)'
  ];
  const rows = trials.map(trial => [
    trial.trialNumber,
    trial.setSize || trial.memorizeCount,
    trial.ignoreCount,
    (trial.memorizeLetters || []).join(' '),
    trial.probeLetter,
    trial.probeInSet,
    trial.response,
    trial.correct,
    trial.reactionTime || '',
    trial.maintenanceDuration || ''
  ]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `stb-results-${new Date().toISOString().split('T')[0]}.csv`);
}


// ── TMT ────────────────────────────────────────────────
// Exports per-click data for Part A and Part B, plus a summary row.
export function exportTmtCSV(data) {
  const parts = [];
  if (data.partA) parts.push({ label: 'A', ...data.partA });
  if (data.partB) parts.push({ label: 'B', ...data.partB });

  const headers = ['Part', 'Click Number', 'Label', 'Correct', 'Elapsed (ms)'];
  const rows = [];
  parts.forEach(part => {
    const clicks = Array.isArray(part.clicks) ? part.clicks : reconstructArray(part.clicks);
    clicks.forEach((c, i) => {
      rows.push([part.label, i + 1, c.label, c.correct ? 1 : 0, Math.round(c.elapsedMs)]);
    });
  });

  // Summary rows at the top
  const summaryHeaders = ['Metric', 'Value'];
  const summaryRows = [];
  if (data.partA) {
    summaryRows.push(['Part A time (s)', data.partA.aborted ? 'Aborted' : data.partA.timeSec?.toFixed(2)]);
    summaryRows.push(['Part A errors', data.partA.errors ?? 0]);
  }
  if (data.partB) {
    summaryRows.push(['Part B time (s)', data.partB.aborted ? 'Aborted' : data.partB.timeSec?.toFixed(2)]);
    summaryRows.push(['Part B errors', data.partB.errors ?? 0]);
  }
  if (data.bMinusA != null) {
    summaryRows.push(['B − A (s)', data.bMinusA.toFixed(2)]);
  }

  const csv =
    buildCSV(summaryHeaders, summaryRows) +
    '\n\n' +
    buildCSV(headers, rows);
  downloadCSV(csv, `tmt-results-${new Date().toISOString().split('T')[0]}.csv`);
}


// ── BART ────────────────────────────────────────────────
export function exportBartCSV(data) {
  let trials = data.trials && Array.isArray(data.trials) ? data.trials : reconstructArray(data);

  const headers = ['Trial Number', 'Color', 'Pumps', 'Break Point', 'Outcome', 'Earnings ($)'];
  const rows = trials.map(trial => [
    trial.trialNumber,
    trial.color || '',
    trial.pumps != null ? trial.pumps : '',
    trial.breakPoint != null ? trial.breakPoint : '',
    trial.exploded ? 'exploded' : 'collected',
    trial.earningsCents != null ? (trial.earningsCents / 100).toFixed(2) : '0.00',
  ]);

  const csv = buildCSV(headers, rows);
  downloadCSV(csv, `bart-results-${new Date().toISOString().split('T')[0]}.csv`);
}

// --- Exporter Registry ---
const EXPORTERS = {
  'corsi': exportCorsiCSV,
  'pvt': exportPvtCSV,
  'gng-sst': exportGngCSV,
  'rpm': exportRpmCSV,
  'tol': exportTolCSV,
  'vm': exportVmCSV,
  'akt': exportAktCSV,
  'wtb': exportWtbCSV,
  'cpt': exportCptCSV,
  'wcst': exportWcstCSV,
  'mot': exportMotCSV,
  'prlt': exportPrltCSV,
  'nback': exportNbackCSV,
  'pal': exportPalCSV,
  'stb': exportStbCSV,
  'tmt': exportTmtCSV,
  'bart': exportBartCSV,
};

/**
 * Register a new CSV exporter.
 * Usage: registerExporter('mytest', exportMyTestCSV);
 */
export function registerExporter(testType, exporterFn) {
  EXPORTERS[testType] = exporterFn;
}

/**
 * Get the CSV exporter function for a given test type
 */
export function getCSVExporter(testType) {
  return EXPORTERS[testType] || null;
}
