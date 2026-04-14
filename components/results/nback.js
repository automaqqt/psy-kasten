// components/results/nback.js
import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/PVTResults.module.css';

export default function NbackResults({ trials, nLevel, onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const translate = t || ((key) => key);

  const scorableTrials = trials.filter(t => t.isScorable);
  const hits = scorableTrials.filter(t => t.outcomeType === 'hit').length;
  const misses = scorableTrials.filter(t => t.outcomeType === 'miss').length;
  const falseAlarms = scorableTrials.filter(t => t.outcomeType === 'falseAlarm').length;
  const correctRejections = scorableTrials.filter(t => t.outcomeType === 'correctRejection').length;
  const totalTargets = scorableTrials.filter(t => t.isTarget).length;
  const totalNonTargets = scorableTrials.filter(t => !t.isTarget).length;
  const correctCount = scorableTrials.filter(t => t.correct).length;
  const accuracy = scorableTrials.length > 0 ? (correctCount / scorableTrials.length * 100).toFixed(1) : 0;
  const validRTs = scorableTrials.filter(t => t.reactionTime !== null).map(t => t.reactionTime);
  const meanRT = validRTs.length > 0 ? Math.round(validRTs.reduce((a, b) => a + b, 0) / validRTs.length) : 0;
  const hitRate = totalTargets > 0 ? (hits / totalTargets * 100).toFixed(1) : 0;
  const faRate = totalNonTargets > 0 ? (falseAlarms / totalNonTargets * 100).toFixed(1) : 0;

  // d-prime
  let dPrime = 0;
  if (totalTargets > 0 && totalNonTargets > 0) {
    let hr = hits / totalTargets;
    let fr = falseAlarms / totalNonTargets;
    if (hr === 0) hr = 0.5 / totalTargets;
    if (hr === 1) hr = 1 - 0.5 / totalTargets;
    if (fr === 0) fr = 0.5 / totalNonTargets;
    if (fr === 1) fr = 1 - 0.5 / totalNonTargets;
    dPrime = (normInv(hr) - normInv(fr)).toFixed(2);
  }

  // Chart: accuracy over trial blocks (groups of 5)
  useEffect(() => {
    if (scorableTrials.length === 0) return;

    const blockSize = 5;
    const blocks = [];
    for (let i = 0; i < scorableTrials.length; i += blockSize) {
      const block = scorableTrials.slice(i, i + blockSize);
      const blockCorrect = block.filter(t => t.correct).length;
      const blockAcc = (blockCorrect / block.length * 100);
      blocks.push({ label: `${i + 1}-${Math.min(i + blockSize, scorableTrials.length)}`, accuracy: blockAcc });
    }

    setChartData({
      labels: blocks.map(b => b.label),
      datasets: [
        {
          label: translate('results_accuracy_pct'),
          data: blocks.map(b => b.accuracy),
          borderColor: '#607d8b',
          backgroundColor: '#607d8b33',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#607d8b',
          tension: 0.2,
          fill: true,
        }
      ]
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
                title: { display: true, text: translate('results_chart_y_axis') }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, chartData]);

  // RT distribution
  const calculateDistribution = () => {
    if (validRTs.length === 0) return {};

    const sortedRTs = [...validRTs].sort((a, b) => a - b);
    const getPercentile = (arr, p) => arr[Math.floor(arr.length * (p / 100))];

    const min = Math.floor(sortedRTs[0] / 50) * 50;
    const max = Math.ceil(sortedRTs[sortedRTs.length - 1] / 50) * 50;
    const range = max - min;
    const binSize = Math.max(Math.ceil(range / 10), 50);

    const bins = [];
    for (let i = min; i < max; i += binSize) {
      bins.push({
        label: `${i}-${i + binSize}ms`,
        count: sortedRTs.filter(rt => rt >= i && rt < i + binSize).length,
        start: i,
        end: i + binSize
      });
    }

    return {
      percentiles: {
        min: sortedRTs[0],
        p25: getPercentile(sortedRTs, 25),
        median: getPercentile(sortedRTs, 50),
        p75: getPercentile(sortedRTs, 75),
        max: sortedRTs[sortedRTs.length - 1]
      },
      histogram: bins
    };
  };

  const distribution = calculateDistribution();
  const formatMs = (ms) => ms ? Math.round(ms) : 'N/A';

  return (
    <div className={styles.resultsContainer}>
      {/* Overview metrics */}
      <div className={styles.metricsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className={styles.metricCard} style={{ background: '#607d8b0d', borderRadius: '10px', padding: '1rem', textAlign: 'center', border: '2px solid #607d8b33' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_accuracy')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#607d8b' }}>{accuracy}%</div>
        </div>
        <div className={styles.metricCard} style={{ background: '#607d8b0d', borderRadius: '10px', padding: '1rem', textAlign: 'center', border: '2px solid #607d8b33' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_mean_rt')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#607d8b' }}>{meanRT} ms</div>
        </div>
        <div className={styles.metricCard} style={{ background: '#607d8b0d', borderRadius: '10px', padding: '1rem', textAlign: 'center', border: '2px solid #607d8b33' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>d&apos;</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#607d8b' }}>{dPrime}</div>
        </div>
        <div className={styles.metricCard} style={{ background: '#607d8b0d', borderRadius: '10px', padding: '1rem', textAlign: 'center', border: '2px solid #607d8b33' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_hit_rate')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#607d8b' }}>{hitRate}%</div>
        </div>
        <div className={styles.metricCard} style={{ background: '#607d8b0d', borderRadius: '10px', padding: '1rem', textAlign: 'center', border: '2px solid #607d8b33' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_fa_rate')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#607d8b' }}>{faRate}%</div>
        </div>
        <div className={styles.metricCard} style={{ background: '#607d8b0d', borderRadius: '10px', padding: '1rem', textAlign: 'center', border: '2px solid #607d8b33' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{translate('results_n_level')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#607d8b' }}>{nLevel}-Back</div>
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
            {scorableTrials.length > 0 ? (
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
                        <td>{formatMs(distribution.percentiles?.min)}</td>
                        <td>{formatMs(distribution.percentiles?.p25)}</td>
                        <td>{formatMs(distribution.percentiles?.median)}</td>
                        <td>{formatMs(distribution.percentiles?.p75)}</td>
                        <td>{formatMs(distribution.percentiles?.max)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className={styles.histogramContainer}>
                  <h3>{translate('results_distribution_title')}</h3>
                  <div className={styles.histogram}>
                    {distribution.histogram?.map((bin, index) => (
                      <div
                        key={index}
                        className={styles.histogramBar}
                        style={{
                          height: `${(bin.count / Math.max(...distribution.histogram.map(b => b.count))) * 100}%`,
                        }}
                      >
                        <div className={styles.histogramTooltip}>
                          {bin.label}: {bin.count} {translate('results_histogram_trials')}
                        </div>
                      </div>
                    ))}
                  </div>
                  {distribution.histogram && distribution.histogram.length > 0 && (
                    <div className={styles.histogramLabels}>
                      {distribution.histogram.map((bin, index) => (
                        <div key={index} className={styles.histogramLabel}>
                          {bin.start}
                        </div>
                      ))}
                      <div className={styles.histogramLabel}>
                        {distribution.histogram[distribution.histogram.length - 1]?.end}
                      </div>
                    </div>
                  )}
                  <div className={styles.histogramAxisLabel}>{translate('results_chart_rt_axis')}</div>
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
                  <th>{translate('results_letter')}</th>
                  <th>{translate('results_is_target')}</th>
                  <th>{translate('results_response')}</th>
                  <th>{translate('results_outcome')}</th>
                  <th>{translate('results_reaction_time_ms')}</th>
                </tr>
              </thead>
              <tbody>
                {trials.length > 0 ? (
                  trials.filter(tr => tr.isScorable).map((trial, index) => (
                    <tr key={index} className={trial.correct === false ? styles.falseStartRow : ''}>
                      <td>{trial.trialNumber}</td>
                      <td>{trial.letter}</td>
                      <td>{trial.isTarget ? translate('results_yes') : translate('results_no')}</td>
                      <td>{trial.response === 'match' ? 'F' : trial.response === 'nonMatch' ? 'J' : '-'}</td>
                      <td>{trial.outcomeType ? translate(`results_outcome_${trial.outcomeType}`) : '-'}</td>
                      <td>{trial.reactionTime ? formatMs(trial.reactionTime) : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.emptyState}>{translate('results_no_trials')}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className={styles.dataExport}>
              <button
                className={styles.exportButton}
                onClick={() => {
                  const headers = ['Trial', 'Letter', 'Is Target', 'Is Lure', 'Response', 'Correct', 'Outcome', 'RT (ms)', 'N-Level'];
                  const csvContent = [
                    headers.join(','),
                    ...trials.filter(tr => tr.isScorable).map(trial => [
                      trial.trialNumber,
                      trial.letter,
                      trial.isTarget,
                      trial.isLure,
                      trial.response || '',
                      trial.correct,
                      trial.outcomeType || '',
                      trial.reactionTime || '',
                      trial.nLevel
                    ].join(','))
                  ].join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `nback-results-${new Date().toISOString().split('T')[0]}.csv`);
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

function normInv(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q, r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5; r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}
