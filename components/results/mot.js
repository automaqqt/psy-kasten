// components/results/mot.js
import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/PVTResults.module.css';

export default function MotResults({ trials, settings, onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const translate = t || ((key) => key);

  // Compute summary statistics
  const totalTrials = trials.length;
  const totalCorrect = trials.reduce((s, t) => s + t.correctSelections, 0);
  const totalPossible = trials.reduce((s, t) => s + t.numTargets, 0);
  const meanAccuracy = totalPossible > 0 ? totalCorrect / totalPossible : 0;
  const totalIncorrect = trials.reduce((s, t) => s + t.incorrectSelections, 0);
  const totalMissed = trials.reduce((s, t) => s + t.missedTargets, 0);
  const meanRT = totalTrials > 0
    ? trials.reduce((s, t) => s + t.responseTime, 0) / totalTrials : 0;
  const accuracies = trials.map(t => t.accuracy);
  const perfectTrials = trials.filter(t => t.accuracy === 1).length;

  // Prepare chart data (accuracy over trials)
  useEffect(() => {
    if (trials.length === 0) return;

    setChartData({
      labels: trials.map(t => t.trialNumber),
      datasets: [
        {
          label: translate('results_accuracy_percent'),
          data: trials.map(t => Math.round(t.accuracy * 100)),
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
              tooltip: {
                callbacks: {
                  label: (context) =>
                    `${translate('results_accuracy_percent')}: ${context.parsed.y}%`
                }
              }
            },
            scales: {
              y: {
                min: 0,
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
  }, [selectedTab, chartData]);

  // Accuracy distribution
  const calculateDistribution = () => {
    if (trials.length === 0) return null;
    const bins = [
      { label: '0%', min: 0, max: 0.01 },
      { label: '25%', min: 0.01, max: 0.26 },
      { label: '50%', min: 0.26, max: 0.51 },
      { label: '75%', min: 0.51, max: 0.76 },
      { label: '100%', min: 0.76, max: 1.01 },
    ];
    return bins.map(bin => ({
      ...bin,
      count: trials.filter(t => t.accuracy >= bin.min && t.accuracy < bin.max).length,
    }));
  };

  const distribution = calculateDistribution();

  // CSV export
  const exportCSV = () => {
    const headers = [
      'Trial', 'Targets', 'Correct', 'Incorrect', 'Missed', 'Accuracy', 'ResponseTime_ms'
    ];
    const rows = trials.map(t => [
      t.trialNumber, t.numTargets, t.correctSelections,
      t.incorrectSelections, t.missedTargets,
      (t.accuracy * 100).toFixed(1), t.responseTime
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mot-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={styles.resultsContainer}>
      {/* Overview metrics */}
      <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#607d8b' }}>
            {(meanAccuracy * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>
            {translate('results_mean_accuracy')}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#43a047' }}>
            {totalCorrect}/{totalPossible}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>
            {translate('results_total_correct')}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#607d8b' }}>
            {perfectTrials}/{totalTrials}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>
            {translate('results_perfect_trials')}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#607d8b' }}>
            {(meanRT / 1000).toFixed(1)}s
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>
            {translate('results_mean_rt')}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button className={`${styles.tabButton} ${selectedTab === 'graph' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('graph')}>{translate('results_tab_graph')}</button>
        <button className={`${styles.tabButton} ${selectedTab === 'distribution' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('distribution')}>{translate('results_tab_distribution')}</button>
        <button className={`${styles.tabButton} ${selectedTab === 'data' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('data')}>{translate('results_tab_data')}</button>
      </div>

      <div className={styles.tabContent}>
        {selectedTab === 'graph' && (
          <div className={styles.graphContainer}>
            {trials.length > 0 ? (
              <canvas ref={chartRef} height="300" />
            ) : (
              <div className={styles.emptyState}><p>{translate('results_no_data')}</p></div>
            )}
          </div>
        )}

        {selectedTab === 'distribution' && (
          <div className={styles.distributionContainer}>
            {distribution ? (
              <div className={styles.histogramContainer}>
                <h3>{translate('results_distribution_title')}</h3>
                <div className={styles.histogram}>
                  {distribution.map((bin, i) => (
                    <div key={i} className={styles.histogramBar}
                      style={{ height: `${distribution.some(b => b.count > 0) ? (bin.count / Math.max(...distribution.map(b => b.count), 1)) * 100 : 0}%` }}>
                      <div className={styles.histogramTooltip}>{bin.label}: {bin.count} {translate('results_histogram_trials')}</div>
                    </div>
                  ))}
                </div>
                <div className={styles.histogramLabels}>
                  {distribution.map((bin, i) => (
                    <div key={i} className={styles.histogramLabel}>{bin.label}</div>
                  ))}
                </div>
                <div className={styles.histogramAxisLabel}>{translate('results_accuracy_percent')}</div>
              </div>
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
                  <th>{translate('results_trial_number')}</th>
                  <th>{translate('results_correct_col')}</th>
                  <th>{translate('results_incorrect_col')}</th>
                  <th>{translate('results_missed_col')}</th>
                  <th>{translate('results_accuracy_col')}</th>
                  <th>{translate('results_rt_col')}</th>
                </tr>
              </thead>
              <tbody>
                {trials.length > 0 ? trials.map((trial, i) => (
                  <tr key={i}>
                    <td>{trial.trialNumber}</td>
                    <td>{trial.correctSelections}</td>
                    <td>{trial.incorrectSelections}</td>
                    <td>{trial.missedTargets}</td>
                    <td>{(trial.accuracy * 100).toFixed(0)}%</td>
                    <td>{(trial.responseTime / 1000).toFixed(1)}s</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6">{translate('results_no_trials')}</td></tr>
                )}
              </tbody>
            </table>

            <div className={styles.dataExport}>
              <button className={styles.exportButton} onClick={exportCSV}>
                {translate('results_export_csv')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button onClick={onRestart}
          style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', backgroundColor: '#607d8b', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
          {translate('results_restart')}
        </button>
      </div>
    </div>
  );
}
