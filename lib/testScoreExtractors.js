/**
 * Test-specific score extractors.
 * Each extractor takes raw result data and returns { score, label, unit }.
 * Reused by analytics API and export config.
 */

function reconstructArray(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    const numericKeys = Object.keys(data).filter(k => !isNaN(k));
    if (numericKeys.length === 0) return [];
    return numericKeys.sort((a, b) => Number(a) - Number(b)).map(k => data[k]);
}

const extractors = {
    corsi: {
        label: 'UBS',
        unit: '',
        extract(d) {
            return d?.ubs ?? d?.corsiSpan ?? null;
        }
    },
    pvt: {
        label: 'Mean RT',
        unit: 'ms',
        extract(d) {
            if (!d) return null;
            const trials = d.trials || reconstructArray(d);
            const rts = trials
                .filter(t => t.reactionTime && !t.falseStart)
                .map(t => t.reactionTime);
            if (rts.length === 0) return null;
            return Math.round(rts.reduce((a, b) => a + b, 0) / rts.length);
        }
    },
    'gng-sst': {
        label: 'Accuracy',
        unit: '%',
        extract(d) {
            if (!d) return null;
            const trials = Array.isArray(d) ? d : (d.trials || reconstructArray(d));
            if (trials.length === 0) return null;
            const correct = trials.filter(r =>
                r.outcome === 'correctGo' || r.outcome === 'correctNogo' || r.outcome === 'correctStop'
            ).length;
            return Math.round(correct / trials.length * 1000) / 10;
        }
    },
    rpm: {
        label: 'Score',
        unit: '',
        extract(d) {
            if (!d) return null;
            return d.correctCount ?? d.totalScore ?? null;
        }
    },
    tol: {
        label: 'Score',
        unit: '',
        extract(d) {
            if (!d) return null;
            return d.totalScore ?? null;
        }
    },
    vm: {
        label: 'Span',
        unit: '',
        extract(d) {
            if (!d) return null;
            const roundData = d.roundData || [];
            const successLevels = roundData.filter(r => r.success).map(r => r.level);
            return successLevels.length ? Math.max(...successLevels) : null;
        }
    },
    akt: {
        label: 'G Score',
        unit: '',
        extract(d) {
            if (!d) return null;
            return d.G ?? null;
        }
    },
    wtb: {
        label: 'Total Score',
        unit: '',
        extract(d) {
            if (!d) return null;
            return d.totalScore ?? null;
        }
    },
    igt: {
        label: 'Net Score',
        unit: '',
        extract(d) {
            if (!d) return null;
            return d.netScore ?? null;
        }
    }
};

/**
 * Get the primary score from a test result.
 * @param {string} testType - e.g. 'corsi', 'pvt', 'gng-sst'
 * @param {object} data - the raw result data
 * @returns {number|null}
 */
export function extractScore(testType, data) {
    const extractor = extractors[testType];
    if (!extractor) {
        return data?.totalScore ?? null;
    }
    return extractor.extract(data);
}

/**
 * Get label and unit for a test type's primary metric.
 * @param {string} testType
 * @returns {{ label: string, unit: string }}
 */
export function getScoreMetric(testType) {
    const extractor = extractors[testType];
    if (!extractor) return { label: 'Score', unit: '' };
    return { label: extractor.label, unit: extractor.unit };
}

export { reconstructArray };
