// components/results/pal.js
import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/PVTResults.module.css';

export default function PalResults({ responses, levels, maxAttempts, onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const translate = t || ((key) => key);

  // Scoring
  const totalResponses = responses ? responses.length : 0;
  const totalCorrect = responses ? responses.filter(r => r.correct).length : 0;
  const totalErrors = totalResponses - totalCorrect;
  const accuracy = totalResponses > 0 ? ((totalCorrect / totalResponses) * 100) : 0;

  // First Attempt Memory Score (FAMS)
  const fams = responses ? responses.filter(r => r.attempt === 0 && r.correct).length : 0;

  // Total Errors Adjusted
  const levelsAttempted = responses ? new Set(responses.map(r => r.levelIndex)).size : 0;
  const levelsNotReached = (levels ? levels.length : 0) - levelsAttempted;
  const adjustedPenalty = levelsNotReached > 0
    ? levelsNotReached * (maxAttempts || 4) * (levels ? levels[levels.length - 1] : 8)
    : 0;
  const totalErrorsAdjusted = totalErrors + adjustedPenalty;

  // Levels completed (passed on any attempt)
  const levelsCompleted = (() => {
    if (!responses || !levels) return 0;
    let completed = 0;
    for (let li = 0; li < levels.length; li++) {
      const attempts = new Set(responses.filter(r => r.levelIndex === li).map(r => r.attempt));
      let passed = false;
      for (const att of attempts) {
        const attResponses = responses.filter(r => r.levelIndex === li && r.attempt === att);
        if (attResponses.length === levels[li] && attResponses.every(r => r.correct)) {
          passed = true;
          break;
        }
      }
      if (passed) completed++;
      else break;
    }
    return completed;
  })();

  // Per-level errors for chart
  useEffect(() => {
    if (!responses || responses.length === 0 || !levels) return;

    const labels = levels.map((n, i) => `${translate('results_level')} ${i + 1} (${n})`)
      .slice(0, Math.max(levelsAttempted, 1));

    const errorsPerLevel = [];
    const firstAttemptCorrectPerLevel = [];

    for (let li = 0; li < Math.max(levelsAttempted, 1); li++) {
      const levelResponses = responses.filter(r => r.levelIndex === li);
      errorsPerLevel.push(levelResponses.filter(r => !r.correct).length);
      firstAttemptCorrectPerLevel.push(levelResponses.filter(r => r.attempt === 0 && r.correct).length);
    }

    setChartData({
      labels,
      datasets: [
        {
          label: translate('results_errors_per_level'),
          data: errorsPerLevel,
          backgroundColor: '#e5393580',
          borderColor: '#e53935',
          borderWidth: 2,
        },
        {
          label: translate('results_first_attempt_correct'),
          data: firstAttemptCorrectPerLevel,
          backgroundColor: '#43a04780',
          borderColor: '#43a047',
          borderWidth: 2,
        },
      ]
    });
  }, [responses, levels]);

  // Draw chart
  useEffect(() => {
    if (selectedTab !== 'graph' || !chartRef.current || chartData.labels.length === 0) return;

    const drawChart = async () => {
      try {
        const { Chart, BarElement, LinearScale, Title, CategoryScale, Tooltip, Legend } = await import('chart.js');
        Chart.register(BarElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              title: {
                display: true,
                text: translate('results_chart_title'),
                font: { size: 16 }
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: translate('results_chart_y_axis') },
                ticks: { stepSize: 1 },
              },
              x: {
                title: { display: true, text: translate('results_chart_x_axis') }
              }
            }
          }
        });
      } catch (error) {
        console.error('Error loading Chart.js:', error);
      }
    };

    drawChart();
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [selectedTab, chartData]);

  return (
    <div className={styles.resultsContainer}>
      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8e44ad' }}>{fams}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_fams')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#e53935' }}>{totalErrorsAdjusted}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_tea')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#43a047' }}>{levelsCompleted}/{levels ? levels.length : 0}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_levels_completed')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary, #333)' }}>{accuracy.toFixed(1)}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_accuracy')}</div>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${selectedTab === 'graph' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('graph')}
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
        {selectedTab === 'graph' && (
          <div className={styles.graphContainer}>
            {responses && responses.length > 0 ? (
              <canvas ref={chartRef} height="300" />
            ) : (
              <div className={styles.emptyState}>
                <p>{translate('results_no_data')}</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'data' && (
          <div className={styles.dataTableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{translate('results_col_level')}</th>
                  <th>{translate('results_col_patterns')}</th>
                  <th>{translate('results_col_attempt')}</th>
                  <th>{translate('results_col_correct')}</th>
                  <th>{translate('results_col_selected_box')}</th>
                  <th>{translate('results_col_correct_box')}</th>
                </tr>
              </thead>
              <tbody>
                {responses && responses.length > 0 ? (
                  responses.map((r, index) => (
                    <tr key={index} className={!r.correct ? styles.falseStartRow : ''}>
                      <td>{index + 1}</td>
                      <td>{r.levelIndex + 1}</td>
                      <td>{r.numPatterns}</td>
                      <td>{r.attempt + 1}</td>
                      <td>{r.correct ? '\u2713' : '\u2717'}</td>
                      <td>{r.selectedBoxIndex + 1}</td>
                      <td>{r.correctBoxIndex + 1}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className={styles.emptyState}>{translate('results_no_trials')}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className={styles.dataExport}>
              <button
                className={styles.exportButton}
                onClick={() => {
                  const headers = ['Response', 'Level', 'Patterns', 'Attempt', 'Correct', 'Selected Box', 'Correct Box', 'Pattern Index'];
                  const csvContent = [
                    headers.join(','),
                    ...responses.map((r, i) => [
                      i + 1, r.levelIndex + 1, r.numPatterns, r.attempt + 1,
                      r.correct ? 1 : 0, r.selectedBoxIndex + 1, r.correctBoxIndex + 1, r.patternIndex
                    ].join(','))
                  ].join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `pal-results-${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                {translate('results_export_csv')}
              </button>
            </div>
          </div>
        )}
      </div>

      {onRestart && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button
            className={styles.exportButton}
            onClick={onRestart}
            style={{ backgroundColor: '#8e44ad', color: 'white' }}
          >
            {translate('results_restart')}
          </button>
        </div>
      )}
    </div>
  );
}
