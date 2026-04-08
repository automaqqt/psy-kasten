// components/results/wcst.js
import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/PVTResults.module.css';

export default function WcstResults({ trials, categoriesCompleted, settings, onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const translate = t || ((key) => key);

  // Calculate WCST-specific metrics
  const totalTrials = trials.length;
  const totalErrors = trials.filter(t => !t.correct).length;
  const totalCorrect = totalTrials - totalErrors;
  const perseverationErrors = trials.filter(t => t.isPerseveration).length;
  const nonPerseverationErrors = trials.filter(t => t.isNonPerseverationError).length;
  const tooSlowCount = trials.filter(t => t.tooSlow).length;
  const accuracy = totalTrials > 0 ? ((totalCorrect / totalTrials) * 100) : 0;
  const perseverationRate = totalTrials > 0 ? ((perseverationErrors / totalTrials) * 100) : 0;

  // Correct RTs
  const correctTrials = trials.filter(t => t.correct && !t.tooSlow);
  const correctRTs = correctTrials.map(t => t.reactionTime);
  const meanRT = correctRTs.length > 0 ? correctRTs.reduce((a, b) => a + b, 0) / correctRTs.length : 0;

  // Errors by category
  useEffect(() => {
    if (trials.length === 0) return;

    // Group trials by category
    const categories = {};
    trials.forEach(trial => {
      const cat = trial.categoryNumber;
      if (!categories[cat]) categories[cat] = { total: 0, errors: 0, perseverations: 0, label: `${trial.rule}` };
      categories[cat].total++;
      if (!trial.correct) categories[cat].errors++;
      if (trial.isPerseveration) categories[cat].perseverations++;
    });

    const catKeys = Object.keys(categories).sort((a, b) => Number(a) - Number(b));
    const labels = catKeys.map(k => `${translate('results_category')} ${k} (${categories[k].label})`);

    setChartData({
      labels,
      datasets: [
        {
          label: translate('results_errors'),
          data: catKeys.map(k => categories[k].errors),
          backgroundColor: '#e5393580',
          borderColor: '#e53935',
          borderWidth: 2,
        },
        {
          label: translate('results_perseveration_errors'),
          data: catKeys.map(k => categories[k].perseverations),
          backgroundColor: '#ff980080',
          borderColor: '#ff9800',
          borderWidth: 2,
        },
      ]
    });
  }, [trials]);

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

  const formatMs = (ms) => ms ? Math.round(ms) : 'N/A';

  return (
    <div className={styles.resultsContainer}>
      {/* Summary metrics */}
      <div className={styles.metricsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className={styles.metricCard} style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#d32f2f' }}>{categoriesCompleted}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_categories_completed')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#d32f2f' }}>{totalErrors}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_total_errors')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ff9800' }}>{perseverationErrors}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_perseveration_errors')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary, #333)' }}>{accuracy.toFixed(1)}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_accuracy')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary, #333)' }}>{formatMs(meanRT)} ms</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_mean_rt')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary, #333)' }}>{perseverationRate.toFixed(1)}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_perseveration_rate')}</div>
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
          className={`${styles.tabButton} ${selectedTab === 'distribution' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('distribution')}
        >
          {translate('results_tab_distribution')}
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
            {trials.length > 0 ? (
              <canvas ref={chartRef} height="300" />
            ) : (
              <div className={styles.emptyState}>
                <p>{translate('results_no_data')}</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'distribution' && (
          <div className={styles.distributionContainer}>
            {correctRTs.length > 0 ? (
              <>
                <div className={styles.percentileTable}>
                  <h3>{translate('results_percentiles_title')}</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>{translate('results_percentile_min')}</th>
                        <th>{translate('results_percentile_25')}</th>
                        <th>{translate('results_percentile_median')}</th>
                        <th>{translate('results_percentile_75')}</th>
                        <th>{translate('results_percentile_max')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {(() => {
                          const sorted = [...correctRTs].sort((a, b) => a - b);
                          const p = (pct) => sorted[Math.floor(sorted.length * pct / 100)] || 0;
                          return (
                            <>
                              <td>{formatMs(sorted[0])}</td>
                              <td>{formatMs(p(25))}</td>
                              <td>{formatMs(p(50))}</td>
                              <td>{formatMs(p(75))}</td>
                              <td>{formatMs(sorted[sorted.length - 1])}</td>
                            </>
                          );
                        })()}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className={styles.histogramContainer}>
                  <h3>{translate('results_distribution_title')}</h3>
                  <div className={styles.histogram}>
                    {(() => {
                      const sorted = [...correctRTs].sort((a, b) => a - b);
                      const min = Math.floor(sorted[0] / 200) * 200;
                      const max = Math.ceil(sorted[sorted.length - 1] / 200) * 200;
                      const binSize = Math.max(200, Math.ceil((max - min) / 10));
                      const bins = [];
                      for (let i = min; i < max; i += binSize) {
                        bins.push({
                          label: `${i}-${i + binSize}ms`,
                          count: sorted.filter(rt => rt >= i && rt < i + binSize).length,
                          start: i,
                          end: i + binSize
                        });
                      }
                      const maxCount = Math.max(...bins.map(b => b.count));
                      return bins.map((bin, index) => (
                        <div
                          key={index}
                          className={styles.histogramBar}
                          style={{ height: `${(bin.count / maxCount) * 100}%` }}
                        >
                          <div className={styles.histogramTooltip}>
                            {bin.label}: {bin.count} {translate('results_histogram_trials')}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </>
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
                  <th>{translate('results_trial_number')}</th>
                  <th>{translate('results_rule')}</th>
                  <th>{translate('results_category_num')}</th>
                  <th>{translate('results_stimulus')}</th>
                  <th>{translate('results_selected')}</th>
                  <th>{translate('results_correct_col')}</th>
                  <th>{translate('results_reaction_time_ms')}</th>
                  <th>{translate('results_error_type')}</th>
                </tr>
              </thead>
              <tbody>
                {trials.length > 0 ? (
                  trials.map((trial, index) => (
                    <tr key={index} className={!trial.correct ? styles.falseStartRow : ''}>
                      <td>{trial.trialNumber}</td>
                      <td>{trial.rule}</td>
                      <td>{trial.categoryNumber}</td>
                      <td>{trial.stimulus ? `${trial.stimulus.count}x ${trial.stimulus.colorName} ${trial.stimulus.shape}` : '-'}</td>
                      <td>{trial.selectedCard !== null ? trial.selectedCard + 1 : '-'}</td>
                      <td>{trial.correct ? '\u2713' : '\u2717'}</td>
                      <td>{trial.tooSlow ? translate('results_too_slow') : formatMs(trial.reactionTime)}</td>
                      <td>{trial.correct ? '-' : (trial.isPerseveration ? translate('results_perseveration') : (trial.tooSlow ? translate('results_timeout') : translate('results_non_perseveration')))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className={styles.emptyState}>{translate('results_no_trials')}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className={styles.dataExport}>
              <button
                className={styles.exportButton}
                onClick={() => {
                  const headers = [
                    'Trial', 'Rule', 'Category', 'Shape', 'Color', 'Count',
                    'Selected Card', 'Correct Card', 'Correct', 'RT (ms)',
                    'Error', 'Perseveration', 'Non-Perseveration', 'Too Slow'
                  ];
                  const csvContent = [
                    headers.join(','),
                    ...trials.map(trial => [
                      trial.trialNumber, trial.rule, trial.categoryNumber,
                      trial.stimulus?.shape || '', trial.stimulus?.colorName || '', trial.stimulus?.count || '',
                      trial.selectedCard !== null ? trial.selectedCard + 1 : '',
                      trial.correctCard + 1,
                      trial.correct ? 1 : 0,
                      trial.reactionTime || '',
                      trial.correct ? 0 : 1,
                      trial.isPerseveration ? 1 : 0,
                      trial.isNonPerseverationError ? 1 : 0,
                      trial.tooSlow ? 1 : 0
                    ].join(','))
                  ].join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `wcst-results-${new Date().toISOString().split('T')[0]}.csv`);
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
    </div>
  );
}
