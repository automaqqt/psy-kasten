/**
 * Main Score Formatters
 * Per-test functions that extract a short summary score string for the results list view.
 * Each formatter receives the result data object and returns a display string.
 */

const FORMATTERS = {
  'corsi': (d) => `UBS: ${d.ubs || d.corsiSpan || '?'}`,
  'pvt': (d) => d.meanRT ? `Mean RT: ${Math.round(d.meanRT)} ms` : 'N/A',
  'gng-sst': (d) => d.accuracy !== undefined ? `Accuracy: ${d.accuracy.toFixed(1)}%` : 'N/A',
  'rpm': (d) => `${d.correctCount || d.totalScore || 0} / ${d.totalProblems || '?'}`,
  'vm': (d) => {
    const rd = d.roundData || [];
    const span = rd.filter(r => r.success).map(r => r.level);
    return span.length ? `Span: ${Math.max(...span)}` : 'N/A';
  },
  'akt': (d) => d.G !== undefined ? `G: ${d.G}` : 'N/A',
  'wtb': (d) => d.totalScore !== undefined ? `Score: ${d.totalScore}` : 'N/A',
  'wcst': (d) => {
    const pe = d.perseverationErrors !== undefined ? d.perseverationErrors : '?';
    const cat = d.categoriesCompleted !== undefined ? d.categoriesCompleted : '?';
    return `Cat: ${cat} | PE: ${pe}`;
  },
};

/**
 * Register a new main score formatter.
 * Usage: registerMainScoreFormatter('mytest', (d) => `Score: ${d.totalScore}`);
 */
export function registerMainScoreFormatter(testType, formatterFn) {
  FORMATTERS[testType] = formatterFn;
}

/**
 * Get formatted main score for a given test type and result data.
 */
export function getMainScore(testType, data) {
  const formatter = FORMATTERS[testType];
  if (formatter) return formatter(data);
  // Fallback for unknown tests
  if (data.totalScore !== undefined) {
    return `${data.totalScore}${data.maxScore ? ' / ' + data.maxScore : ''}`;
  }
  return 'N/A';
}
