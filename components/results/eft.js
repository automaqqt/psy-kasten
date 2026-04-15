// components/results/eft.js
import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/PVTResults.module.css';

export default function EftResults({ trials, onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const translate = t || ((key) => key);

  const validTrials = trials.filter(tr => tr.reactionTime != null && !tr.timedOut);
  const correctTrials = validTrials.filter(tr => tr.correctResponse);

  const meanOf = (arr) => arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;
  const rtByCondition = (cond) => correctTrials.filter(tr => tr.condition === cond).map(tr => tr.reactionTime);

  const rtCong = rtByCondition('congruent');
  const rtIncong = rtByCondition('incongruent');
  const rtNeutral = rtByCondition('neutral');

  const meanCong = meanOf(rtCong);
  const meanIncong = meanOf(rtIncong);
  const meanNeutral = meanOf(rtNeutral);
  const flankerEffect = meanIncong - meanCong;

  const accuracyOf = (cond) => {
    const condTrials = trials.filter(tr => tr.condition === cond);
    if (condTrials.length === 0) return 0;
    return condTrials.filter(tr => tr.correctResponse).length / condTrials.length * 100;
  };

  const overallAccuracy = trials.length ? correctTrials.length / trials.length * 100 : 0;
  const meanRTOverall = meanOf(correctTrials.map(tr => tr.reactionTime));

  // ── Bar chart: mean RT by condition ───────────────────
  useEffect(() => {
    if (selectedTab !== 'graph' || !chartRef.current) return;

    const drawChart = async () => {
      try {
        const { Chart, BarElement, BarController, LinearScale, CategoryScale, Tooltip, Legend, Title } = await import('chart.js');
        Chart.register(BarElement, BarController, LinearScale, CategoryScale, Tooltip, Legend, Title);

        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: [
              translate('condition_congruent'),
              translate('condition_incongruent'),
              translate('condition_neutral'),
            ],
            datasets: [{
              label: translate('results_reaction_time_ms'),
              data: [meanCong, meanIncong, meanNeutral],
              backgroundColor: ['#4caf50aa', '#f4433699', '#ff980099'],
              borderColor: ['#4caf50', '#f44336', '#ff9800'],
              borderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: true, text: translate('results_chart_title'), font: { size: 16 } },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${translate('results_chart_tooltip_rt')}: ${ctx.parsed.y.toFixed(0)} ms`,
                },
              },
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: translate('results_chart_y_axis') } },
              x: { title: { display: true, text: translate('results_chart_x_axis') } },
            },
          },
        });
      } catch (e) {
        console.error('Chart.js error:', e);
      }
    };

    drawChart();
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [selectedTab, meanCong, meanIncong, meanNeutral, translate]);

  const formatMs = (ms) => ms == null ? '—' : Math.round(ms);

  const conditionLabel = (cond) => {
    if (cond === 'congruent') return translate('condition_congruent');
    if (cond === 'incongruent') return translate('condition_incongruent');
    if (cond === 'neutral') return translate('condition_neutral');
    return cond;
  };

  const exportCSV = () => {
    const headers = [
      translate('results_trial_number'),
      translate('results_condition'),
      translate('results_target'),
      translate('results_flanker'),
      translate('results_expected_response'),
      translate('results_given_response'),
      translate('results_correct'),
      translate('results_reaction_time_ms'),
      translate('results_timed_out'),
    ];
    const rows = trials.map(tr => [
      tr.trialNumber,
      conditionLabel(tr.condition),
      tr.target,
      tr.flanker,
      tr.correct || '',
      tr.response || '',
      tr.correctResponse ? 'yes' : 'no',
      tr.reactionTime != null ? tr.reactionTime : '',
      tr.timedOut ? 'yes' : 'no',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `eft-results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${selectedTab === 'graph' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('graph')}
        >
          {translate('results_tab_graph')}
        </button>
        <button
          className={`${styles.tabButton} ${selectedTab === 'summary' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('summary')}
        >
          {translate('results_tab_summary')}
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
            {correctTrials.length > 0 ? (
              <canvas ref={chartRef} height="300" />
            ) : (
              <div className={styles.emptyState}>
                <p>{translate('results_no_data')}</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'summary' && (
          <div className={styles.distributionContainer}>
            <div className={styles.percentileTable}>
              <h3>{translate('results_summary_title')}</h3>
              <table>
                <thead>
                  <tr>
                    <th>{translate('results_metric')}</th>
                    <th>{translate('results_value')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{translate('results_overall_accuracy')}</td>
                    <td>{overallAccuracy.toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td>{translate('results_mean_rt')}</td>
                    <td>{formatMs(meanRTOverall)} ms</td>
                  </tr>
                  <tr>
                    <td>{translate('results_flanker_effect')}</td>
                    <td>{formatMs(flankerEffect)} ms</td>
                  </tr>
                  <tr>
                    <td>{translate('results_mean_rt_congruent')}</td>
                    <td>{formatMs(meanCong)} ms ({rtCong.length})</td>
                  </tr>
                  <tr>
                    <td>{translate('results_mean_rt_incongruent')}</td>
                    <td>{formatMs(meanIncong)} ms ({rtIncong.length})</td>
                  </tr>
                  <tr>
                    <td>{translate('results_mean_rt_neutral')}</td>
                    <td>{formatMs(meanNeutral)} ms ({rtNeutral.length})</td>
                  </tr>
                  <tr>
                    <td>{translate('results_accuracy_congruent')}</td>
                    <td>{accuracyOf('congruent').toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td>{translate('results_accuracy_incongruent')}</td>
                    <td>{accuracyOf('incongruent').toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td>{translate('results_accuracy_neutral')}</td>
                    <td>{accuracyOf('neutral').toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td>{translate('results_timeouts')}</td>
                    <td>{trials.filter(tr => tr.timedOut).length}</td>
                  </tr>
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
                  <th>{translate('results_condition')}</th>
                  <th>{translate('results_target')}</th>
                  <th>{translate('results_flanker')}</th>
                  <th>{translate('results_given_response')}</th>
                  <th>{translate('results_correct')}</th>
                  <th>{translate('results_reaction_time_ms')}</th>
                </tr>
              </thead>
              <tbody>
                {trials.length > 0 ? (
                  trials.map((tr, idx) => (
                    <tr key={idx} className={tr.timedOut ? styles.falseStartRow : ''}>
                      <td>{tr.trialNumber}</td>
                      <td>{conditionLabel(tr.condition)}</td>
                      <td>{tr.target}</td>
                      <td>{tr.flanker}</td>
                      <td>{tr.response || '—'}</td>
                      <td>{tr.timedOut ? translate('results_timed_out') : (tr.correctResponse ? '✓' : '✗')}</td>
                      <td>{tr.reactionTime != null ? formatMs(tr.reactionTime) : '—'}</td>
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
              <button className={styles.exportButton} onClick={exportCSV}>
                {translate('results_export_csv')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
