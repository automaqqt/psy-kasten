// components/results/iat.js
import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/PVTResults.module.css';

function meanRT(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function sdRT(arr) {
  if (arr.length < 2) return 0;
  const m = meanRT(arr);
  const v = arr.reduce((acc, x) => acc + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(v);
}

function computeSummary(trials) {
  const testTrials = trials.filter(t => !t.practice);
  const combined = testTrials.filter(t => t.kind === 'combined');
  const compat = combined.filter(t => t.compat === true);
  const incompat = combined.filter(t => t.compat === false);
  const compatCorrect = compat.filter(t => t.correct).map(t => t.reactionTime);
  const incompatCorrect = incompat.filter(t => t.correct).map(t => t.reactionTime);

  const meanRtCompat = meanRT(compatCorrect);
  const meanRtIncompat = meanRT(incompatCorrect);
  const iatEffect = meanRtIncompat - meanRtCompat;

  const compatPenalty = meanRtCompat + 600;
  const incompatPenalty = meanRtIncompat + 600;
  const compatAdj = compat.map(t => t.correct ? t.reactionTime : compatPenalty);
  const incompatAdj = incompat.map(t => t.correct ? t.reactionTime : incompatPenalty);
  const pooledSD = sdRT([...compatAdj, ...incompatAdj]);
  const dScore = pooledSD > 0 ? (meanRT(incompatAdj) - meanRT(compatAdj)) / pooledSD : 0;

  const correctCount = testTrials.filter(t => t.correct).length;
  const accuracy = testTrials.length ? (correctCount / testTrials.length) * 100 : 0;

  return {
    iatEffect, dScore, meanRtCompat, meanRtIncompat, accuracy,
    totalTrials: testTrials.length,
    compatTrials: compat.length,
    incompatTrials: incompat.length,
  };
}

function describeDScore(d, t) {
  const abs = Math.abs(d);
  let strength;
  if (abs < 0.15) strength = t('dscore_strength_none');
  else if (abs < 0.35) strength = t('dscore_strength_slight');
  else if (abs < 0.65) strength = t('dscore_strength_moderate');
  else strength = t('dscore_strength_strong');

  if (abs < 0.15) return t('dscore_interp_none');
  const dirKey = d > 0 ? 'dscore_dir_compat' : 'dscore_dir_incompat';
  return `${strength} — ${t(dirKey)}`;
}

export default function IatResults({ trials, onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const translate = t || ((k) => k);
  const summary = computeSummary(trials || []);

  // Per-block mean RT data for chart
  const blockRTs = (() => {
    const blockIndices = [...new Set(trials.filter(t => !t.practice).map(t => t.blockIndex))].sort();
    return blockIndices.map(bi => {
      const bt = trials.filter(t => t.blockIndex === bi && !t.practice && t.correct);
      const rts = bt.map(t => t.reactionTime);
      const sampleKind = trials.find(t => t.blockIndex === bi)?.kind || '';
      const compat = trials.find(t => t.blockIndex === bi)?.compat;
      return { blockIndex: bi, meanRT: meanRT(rts), kind: sampleKind, compat };
    });
  })();

  useEffect(() => {
    if (selectedTab !== 'chart' || !chartRef.current || blockRTs.length === 0) return;
    const drawChart = async () => {
      try {
        const { Chart, BarElement, LinearScale, CategoryScale, Title, Tooltip, Legend } = await import('chart.js');
        Chart.register(BarElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: blockRTs.map(b => translate('block_label', { n: b.blockIndex + 1 })),
            datasets: [{
              label: translate('results_chart_y_axis'),
              data: blockRTs.map(b => Math.round(b.meanRT)),
              backgroundColor: blockRTs.map(b =>
                b.compat === true ? '#43a047' :
                b.compat === false ? '#e53935' : '#78909c'
              ),
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: true, text: translate('results_chart_title'), font: { size: 16 } },
              tooltip: {
                callbacks: { label: (ctx) => `${ctx.parsed.y} ms` },
              },
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: translate('results_chart_y_axis') } },
              x: { title: { display: true, text: translate('results_chart_x_axis') } },
            },
          },
        });
      } catch (err) {
        console.error('Chart load error:', err);
      }
    };
    drawChart();
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [selectedTab, trials]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (n, digits = 0) => typeof n === 'number' && isFinite(n) ? n.toFixed(digits) : '—';

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${selectedTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          {translate('results_tab_overview')}
        </button>
        <button
          className={`${styles.tabButton} ${selectedTab === 'chart' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('chart')}
        >
          {translate('results_tab_graph')}
        </button>
        <button
          className={`${styles.tabButton} ${selectedTab === 'data' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('data')}
        >
          {translate('results_tab_data')}
        </button>
      </div>

      <div className={styles.tabContent}>
        {selectedTab === 'overview' && (
          <div style={{ padding: '1.5rem' }}>
            {summary.totalTrials === 0 ? (
              <div className={styles.emptyState}><p>{translate('results_no_data')}</p></div>
            ) : (
              <>
                <div className={styles.percentileTable}>
                  <h3>{translate('results_main_metrics')}</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>{translate('results_metric_dscore')}</th>
                        <th>{translate('results_metric_iat_effect')}</th>
                        <th>{translate('results_metric_rt_compat')}</th>
                        <th>{translate('results_metric_rt_incompat')}</th>
                        <th>{translate('results_metric_accuracy')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>{fmt(summary.dScore, 2)}</strong></td>
                        <td>{fmt(summary.iatEffect)} ms</td>
                        <td>{fmt(summary.meanRtCompat)} ms</td>
                        <td>{fmt(summary.meanRtIncompat)} ms</td>
                        <td>{fmt(summary.accuracy, 1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-accent, #f5f5f5)', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0 }}>{translate('results_interpretation')}</h3>
                  <p>{describeDScore(summary.dScore, translate)}</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #666)' }}>
                    {translate('results_dscore_hint')}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {selectedTab === 'chart' && (
          <div className={styles.graphContainer}>
            {blockRTs.length > 0 ? (
              <canvas ref={chartRef} height="320" />
            ) : (
              <div className={styles.emptyState}><p>{translate('results_no_data')}</p></div>
            )}
          </div>
        )}

        {selectedTab === 'data' && (
          <div className={styles.dataTableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{translate('results_col_block')}</th>
                  <th>{translate('results_col_trial')}</th>
                  <th>{translate('results_col_word')}</th>
                  <th>{translate('results_col_category')}</th>
                  <th>{translate('results_col_correct_side')}</th>
                  <th>{translate('results_col_response_side')}</th>
                  <th>{translate('results_col_rt')}</th>
                  <th>{translate('results_col_correct')}</th>
                </tr>
              </thead>
              <tbody>
                {(trials || []).length === 0 ? (
                  <tr><td colSpan="8" className={styles.emptyState}>{translate('results_no_trials')}</td></tr>
                ) : trials.map((tr, i) => (
                  <tr key={i} className={!tr.correct ? styles.falseStartRow : ''}>
                    <td>{tr.blockIndex + 1}</td>
                    <td>{tr.trialInBlock}</td>
                    <td>{translate(`word_${tr.word}`)}</td>
                    <td>{translate(`cat_${tr.category}`)}</td>
                    <td>{tr.correctSide}</td>
                    <td>{tr.responseSide}</td>
                    <td>{Math.round(tr.reactionTime)}</td>
                    <td>{tr.correct ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.dataExport}>
              <button
                className={styles.exportButton}
                onClick={() => {
                  const headers = ['block', 'kind', 'compat', 'practice', 'trialInBlock', 'word', 'category', 'correctSide', 'responseSide', 'reactionTime_ms', 'correct'];
                  const rows = (trials || []).map(tr => [
                    tr.blockIndex + 1, tr.kind, tr.compat === null ? '' : tr.compat ? 1 : 0,
                    tr.practice ? 1 : 0, tr.trialInBlock, tr.word, tr.category,
                    tr.correctSide, tr.responseSide, Math.round(tr.reactionTime), tr.correct ? 1 : 0,
                  ]);
                  rows.push([]);
                  rows.push(['SUMMARY']);
                  rows.push(['D-score', summary.dScore.toFixed(3)]);
                  rows.push(['IAT effect (ms)', Math.round(summary.iatEffect)]);
                  rows.push(['Mean RT compatible (ms)', Math.round(summary.meanRtCompat)]);
                  rows.push(['Mean RT incompatible (ms)', Math.round(summary.meanRtIncompat)]);
                  rows.push(['Accuracy (%)', summary.accuracy.toFixed(1)]);

                  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `iat-results-${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                {translate('results_export_csv')}
              </button>
              {onRestart && (
                <button
                  className={styles.exportButton}
                  style={{ marginLeft: '0.5rem' }}
                  onClick={onRestart}
                >
                  {translate('restart_test')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
