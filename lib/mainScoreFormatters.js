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
  'mot': (d) => {
    const summary = d.summary || {};
    const acc = summary.meanAccuracy !== undefined ? `${(summary.meanAccuracy * 100).toFixed(0)}%` : '?';
    const correct = summary.totalCorrect !== undefined ? summary.totalCorrect : '?';
    const total = summary.totalPossible !== undefined ? summary.totalPossible : '?';
    return `Acc: ${acc} | ${correct}/${total}`;
  },
  'prlt': (d) => {
    const rev = d.reversalsCompleted !== undefined ? d.reversalsCompleted : '?';
    const acc = d.accuracy !== undefined ? `${(d.accuracy * 100).toFixed(0)}%` : '?';
    return `Rev: ${rev} | Acc: ${acc}`;
  },
  'nback': (d) => {
    const acc = d.accuracy !== undefined ? `${(d.accuracy * 100).toFixed(0)}%` : '?';
    const dp = d.dPrime !== undefined ? d.dPrime : '?';
    return `Acc: ${acc} | d': ${dp}`;
  },
  'pal': (d) => {
    const fams = d.firstAttemptMemoryScore !== undefined ? d.firstAttemptMemoryScore : '?';
    const tea = d.totalErrorsAdjusted !== undefined ? d.totalErrorsAdjusted : '?';
    return `FAMS: ${fams} | TEA: ${tea}`;
  },
  'stb': (d) => {
    const trials = Array.isArray(d) ? d : (d.trials || []);
    if (trials.length === 0) return 'N/A';
    const correct = trials.filter(t => t.correct).length;
    const accuracy = ((correct / trials.length) * 100).toFixed(0);
    const rts = trials.filter(t => t.correct && t.reactionTime).map(t => t.reactionTime);
    const meanRT = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
    return `Acc: ${accuracy}% | RT: ${meanRT}ms`;
  },
  'tmt': (d) => {
    const fmt = (p) => {
      if (!p) return '—';
      if (p.aborted) return 'abort';
      return `${p.timeSec.toFixed(1)}s/${p.errors ?? 0}e`;
    };
    return `A: ${fmt(d.partA)} | B: ${fmt(d.partB)}`;
  },
  'bart': (d) => {
    if (!d) return 'N/A';
    const earned = typeof d.totalEarnedCents === 'number' ? `$${(d.totalEarnedCents / 100).toFixed(2)}` : null;
    const adj = d.summary && typeof d.summary.adjBlue === 'number' ? d.summary.adjBlue.toFixed(1) : null;
    const exp = d.summary && typeof d.summary.explosions === 'number' ? d.summary.explosions : null;
    if (!earned && adj === null) return 'N/A';
    const parts = [];
    if (earned) parts.push(earned);
    if (adj !== null) parts.push(`Adj(blue): ${adj}`);
    if (exp !== null) parts.push(`Pops: ${exp}`);
    return parts.join(' | ');
  },
  'igt': (d) => {
    if (!d) return 'N/A';
    const parts = [];
    if (typeof d.finalBalance === 'number') parts.push(`$${d.finalBalance}`);
    if (typeof d.netScore === 'number') parts.push(`Net: ${d.netScore >= 0 ? '+' : ''}${d.netScore}`);
    return parts.length > 0 ? parts.join(' | ') : 'N/A';
  },
  'iat': (d) => {
    if (!d) return 'N/A';
    const parts = [];
    if (typeof d.dScore === 'number') parts.push(`D: ${d.dScore.toFixed(2)}`);
    if (typeof d.iatEffect === 'number') parts.push(`Δ: ${Math.round(d.iatEffect)}ms`);
    return parts.length > 0 ? parts.join(' | ') : 'N/A';
  },
  'eft': (d) => {
    if (!d) return 'N/A';
    const parts = [];
    if (typeof d.overallAccuracy === 'number') parts.push(`Acc: ${(d.overallAccuracy * 100).toFixed(0)}%`);
    if (typeof d.meanRT === 'number' && d.meanRT > 0) parts.push(`RT: ${Math.round(d.meanRT)}ms`);
    if (typeof d.flankerEffect === 'number') parts.push(`Δ: ${Math.round(d.flankerEffect)}ms`);
    return parts.length > 0 ? parts.join(' | ') : 'N/A';
  },
  'pcp': (d) => d.totalScore !== undefined ? `Score: ${d.totalScore}` : 'N/A',
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
