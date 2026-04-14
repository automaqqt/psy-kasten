// components/results/stb.js
import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/PVTResults.module.css';

export default function StbResults({ trials, onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const translate = t || ((key) => key);

  // Calculate summary stats
  const stats = (() => {
    if (!trials || trials.length === 0) return null;

    const validTrials = trials.filter(r => r.reactionTime !== null);
    const correctTrials = trials.filter(r => r.correct);
    const accuracy = ((correctTrials.length / trials.length) * 100).toFixed(1);
    const rts = validTrials.filter(r => r.correct).map(r => r.reactionTime);
    const meanRT = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
    const timeouts = trials.filter(r => r.response === 'timeout').length;

    // By set size (memorize count: 3, 5, 7)
    const setSizes = [3, 5, 7];
    const bySetSize = setSizes.map(size => {
      const sizeTrials = trials.filter(r => r.setSize === size);
      const sizeCorrect = sizeTrials.filter(r => r.correct);
      const sizeRTs = sizeTrials.filter(r => r.correct && r.reactionTime !== null).map(r => r.reactionTime);
      return {
        setSize: size,
        total: sizeTrials.length,
        correct: sizeCorrect.length,
        accuracy: sizeTrials.length > 0 ? ((sizeCorrect.length / sizeTrials.length) * 100).toFixed(1) : 0,
        meanRT: sizeRTs.length > 0 ? Math.round(sizeRTs.reduce((a, b) => a + b, 0) / sizeRTs.length) : 0,
      };
    });

    // Hit rate & false alarm rate
    const inSetTrials = trials.filter(r => r.probeInSet);
    const notInSetTrials = trials.filter(r => !r.probeInSet);
    const hits = inSetTrials.filter(r => r.response === 'in').length;
    const hitRate = inSetTrials.length > 0 ? ((hits / inSetTrials.length) * 100).toFixed(1) : 0;
    const falseAlarms = notInSetTrials.filter(r => r.response === 'in').length;
    const falseAlarmRate = notInSetTrials.length > 0 ? ((falseAlarms / notInSetTrials.length) * 100).toFixed(1) : 0;

    return {
      totalTrials: trials.length,
      accuracy,
      meanRT,
      timeouts,
      hitRate,
      falseAlarmRate,
      bySetSize,
    };
  })();

  // Chart: RT by set size (bar chart)
  useEffect(() => {
    if (!stats || !stats.bySetSize) return;

    setChartData({
      labels: stats.bySetSize.map(s => `${translate('results_set_size')} ${s.setSize}`),
      datasets: [
        {
          label: translate('results_mean_rt_ms'),
          data: stats.bySetSize.map(s => s.meanRT),
          backgroundColor: ['#607d8b99', '#607d8bcc', '#607d8b'],
          borderColor: '#607d8b',
          borderWidth: 2,
        }
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

        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: translate('results_chart_title'),
                font: { size: 16 }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.parsed.y} ms`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
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

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [selectedTab, chartData]);

  const formatMs = (ms) => ms ? Math.round(ms) : 'N/A';

  return (
    <div className={styles.resultsContainer}>
      {/* Summary metrics */}
      {stats && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{stats.accuracy}%</div>
            <div className={styles.metricLabel}>{translate('results_accuracy')}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{stats.meanRT} ms</div>
            <div className={styles.metricLabel}>{translate('results_mean_rt')}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{stats.hitRate}%</div>
            <div className={styles.metricLabel}>{translate('results_hit_rate')}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{stats.falseAlarmRate}%</div>
            <div className={styles.metricLabel}>{translate('results_false_alarm_rate')}</div>
          </div>
        </div>
      )}

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
          {translate('results_tab_by_set_size')}
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
            {stats && stats.bySetSize.some(s => s.meanRT > 0) ? (
              <canvas ref={chartRef} height="300" />
            ) : (
              <div className={styles.emptyState}>
                <p>{translate('results_no_data')}</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'distribution' && stats && (
          <div className={styles.distributionContainer}>
            <div className={styles.percentileTable}>
              <h3>{translate('results_set_size_breakdown')}</h3>
              <table>
                <thead>
                  <tr>
                    <th>{translate('results_set_size')}</th>
                    <th>{translate('results_trials')}</th>
                    <th>{translate('results_accuracy')}</th>
                    <th>{translate('results_mean_rt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.bySetSize.map((row, i) => (
                    <tr key={i}>
                      <td>{row.setSize} {translate('results_letters')}</td>
                      <td>{row.correct}/{row.total}</td>
                      <td>{row.accuracy}%</td>
                      <td>{row.meanRT} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'data' && (
          <div className={styles.dataTableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{translate('results_trial_number')}</th>
                  <th>{translate('results_set_size')}</th>
                  <th>{translate('results_probe')}</th>
                  <th>{translate('results_probe_in_set')}</th>
                  <th>{translate('results_response')}</th>
                  <th>{translate('results_correct')}</th>
                  <th>{translate('results_reaction_time_ms')}</th>
                </tr>
              </thead>
              <tbody>
                {trials.length > 0 ? (
                  trials.map((trial, index) => (
                    <tr key={index} className={!trial.correct ? styles.falseStartRow : ''}>
                      <td>{trial.trialNumber}</td>
                      <td>{trial.setSize}</td>
                      <td>{trial.probeLetter}</td>
                      <td>{trial.probeInSet ? translate('results_yes') : translate('results_no')}</td>
                      <td>{trial.response}</td>
                      <td>{trial.correct ? translate('results_yes') : translate('results_no')}</td>
                      <td>{trial.reactionTime !== null ? formatMs(trial.reactionTime) : '-'}</td>
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
                    'Trial', 'Set Size', 'Ignore Count', 'Memorize Letters', 'Probe',
                    'Probe In Set', 'Response', 'Correct', 'RT (ms)', 'Maintenance (ms)'
                  ];
                  const csvContent = [
                    headers.join(','),
                    ...trials.map(trial => [
                      trial.trialNumber,
                      trial.setSize,
                      trial.ignoreCount,
                      `"${trial.memorizeLetters.join(' ')}"`,
                      trial.probeLetter,
                      trial.probeInSet,
                      trial.response,
                      trial.correct,
                      trial.reactionTime || '',
                      trial.maintenanceDuration
                    ].join(','))
                  ].join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `stb-results-${new Date().toISOString().split('T')[0]}.csv`);
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
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className={styles.exportButton} onClick={onRestart}>
            {translate('restart_test')}
          </button>
        </div>
      )}
    </div>
  );
}
