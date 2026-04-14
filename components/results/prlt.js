// components/results/prlt.js
import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/PVTResults.module.css';

export default function PrltResults({ trials, reversalsCompleted, settings, onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const translate = t || ((key) => key);

  // Calculate PRLT-specific metrics
  const validTrials = trials.filter(t => !t.tooSlow);
  const totalTrials = trials.length;
  const timeouts = trials.filter(t => t.tooSlow).length;
  const correctChoices = validTrials.filter(t => t.choseHighProb).length;
  const accuracy = validTrials.length > 0 ? ((correctChoices / validTrials.length) * 100) : 0;

  // Win-stay rate
  const winStayTrials = trials.filter(t => t.isWinStay !== null);
  const winStayCount = winStayTrials.filter(t => t.isWinStay).length;
  const winStayRate = winStayTrials.length > 0 ? ((winStayCount / winStayTrials.length) * 100) : 0;

  // Lose-shift rate
  const loseShiftTrials = trials.filter(t => t.isLoseShift !== null);
  const loseShiftCount = loseShiftTrials.filter(t => t.isLoseShift).length;
  const loseShiftRate = loseShiftTrials.length > 0 ? ((loseShiftCount / loseShiftTrials.length) * 100) : 0;

  // Mean RT
  const validRTs = validTrials.map(t => t.reactionTime);
  const meanRT = validRTs.length > 0 ? validRTs.reduce((a, b) => a + b, 0) / validRTs.length : 0;

  // Chart: accuracy over blocks of 10 trials
  useEffect(() => {
    if (trials.length === 0) return;

    const blockSize = 10;
    const labels = [];
    const accuracyData = [];
    const highProbData = [];

    for (let i = 0; i < trials.length; i += blockSize) {
      const block = trials.slice(i, i + blockSize);
      const valid = block.filter(t => !t.tooSlow);
      const correct = valid.filter(t => t.choseHighProb).length;
      const acc = valid.length > 0 ? (correct / valid.length) * 100 : 0;

      labels.push(`${i + 1}-${Math.min(i + blockSize, trials.length)}`);
      accuracyData.push(acc);
    }

    setChartData({
      labels,
      datasets: [
        {
          label: translate('results_accuracy_label'),
          data: accuracyData,
          borderColor: '#607d8b',
          backgroundColor: '#607d8b33',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#607d8b',
          tension: 0.3,
          fill: true,
        },
      ]
    });
  }, [trials]);

  // Draw chart
  useEffect(() => {
    if (selectedTab !== 'graph' || !chartRef.current || chartData.labels.length === 0) return;

    const drawChart = async () => {
      try {
        const { Chart, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, Filler } = await import('chart.js');
        Chart.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, Filler);

        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'line',
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
                max: 100,
                title: { display: true, text: translate('results_chart_y_axis') },
                ticks: { callback: (val) => `${val}%` },
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

  // RT distribution
  const calculateDistribution = () => {
    if (validRTs.length === 0) return {};
    const sorted = [...validRTs].sort((a, b) => a - b);
    const p = (pct) => sorted[Math.floor(sorted.length * pct / 100)] || 0;

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

    return {
      percentiles: { min: sorted[0], p25: p(25), median: p(50), p75: p(75), max: sorted[sorted.length - 1] },
      histogram: bins
    };
  };

  const distribution = calculateDistribution();

  return (
    <div className={styles.resultsContainer}>
      {/* Summary metrics */}
      <div className={styles.metricsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#607d8b' }}>{reversalsCompleted}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_reversals')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#607d8b' }}>{accuracy.toFixed(1)}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_accuracy')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#4caf50' }}>{winStayRate.toFixed(1)}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_win_stay')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ff9800' }}>{loseShiftRate.toFixed(1)}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_lose_shift')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary, #333)' }}>{formatMs(meanRT)} ms</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_mean_rt')}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary, #333)' }}>{totalTrials}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_total_trials')}</div>
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
            {distribution.percentiles ? (
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
                        <td>{formatMs(distribution.percentiles.min)}</td>
                        <td>{formatMs(distribution.percentiles.p25)}</td>
                        <td>{formatMs(distribution.percentiles.median)}</td>
                        <td>{formatMs(distribution.percentiles.p75)}</td>
                        <td>{formatMs(distribution.percentiles.max)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className={styles.histogramContainer}>
                  <h3>{translate('results_distribution_title')}</h3>
                  <div className={styles.histogram}>
                    {distribution.histogram?.map((bin, index) => {
                      const maxCount = Math.max(...distribution.histogram.map(b => b.count));
                      return (
                        <div
                          key={index}
                          className={styles.histogramBar}
                          style={{ height: `${(bin.count / maxCount) * 100}%` }}
                        >
                          <div className={styles.histogramTooltip}>
                            {bin.label}: {bin.count} {translate('results_histogram_trials')}
                          </div>
                        </div>
                      );
                    })}
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
                  <th>{translate('results_high_prob_side')}</th>
                  <th>{translate('results_chosen_side')}</th>
                  <th>{translate('results_correct_col')}</th>
                  <th>{translate('results_rewarded')}</th>
                  <th>{translate('results_reaction_time_ms')}</th>
                  <th>{translate('results_reversal_num')}</th>
                </tr>
              </thead>
              <tbody>
                {trials.length > 0 ? (
                  trials.map((trial, index) => (
                    <tr key={index} className={!trial.choseHighProb ? styles.falseStartRow : ''}>
                      <td>{trial.trialNumber}</td>
                      <td>{trial.highProbSide === 'left' ? 'A' : 'B'}</td>
                      <td>{trial.tooSlow ? '-' : (trial.chosenSide === 'left' ? 'A' : 'B')}</td>
                      <td>{trial.tooSlow ? '-' : (trial.choseHighProb ? '\u2713' : '\u2717')}</td>
                      <td>{trial.rewarded ? '\u2713' : '\u2717'}</td>
                      <td>{trial.tooSlow ? translate('results_too_slow') : formatMs(trial.reactionTime)}</td>
                      <td>{trial.reversalNumber}</td>
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
                  const headers = [
                    'Trial', 'High Prob Side', 'Chosen Side', 'Chose High Prob',
                    'Rewarded', 'RT (ms)', 'Reversal #', 'Win-Stay', 'Lose-Shift', 'Timeout'
                  ];
                  const csvContent = [
                    headers.join(','),
                    ...trials.map(trial => [
                      trial.trialNumber,
                      trial.highProbSide,
                      trial.chosenSide || '',
                      trial.choseHighProb ? 1 : 0,
                      trial.rewarded ? 1 : 0,
                      trial.reactionTime || '',
                      trial.reversalNumber,
                      trial.isWinStay === null ? '' : (trial.isWinStay ? 1 : 0),
                      trial.isLoseShift === null ? '' : (trial.isLoseShift ? 1 : 0),
                      trial.tooSlow ? 1 : 0
                    ].join(','))
                  ].join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `prlt-results-${new Date().toISOString().split('T')[0]}.csv`);
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
