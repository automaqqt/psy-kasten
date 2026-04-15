// components/results/pcp.js
import { useState, useEffect, useRef, useMemo } from 'react';
import styles from '../../styles/PVTResults.module.css';

export default function PcpResults({ trials, onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const translate = t || ((key) => key);

  const summary = useMemo(() => {
    const targetTrials = trials.filter(x => x.hasTarget);
    const valid = targetTrials.filter(x => x.validity === 'valid' && x.correct && x.reactionTime != null);
    const invalid = targetTrials.filter(x => x.validity === 'invalid' && x.correct && x.reactionTime != null);
    const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const meanRTValid = mean(valid.map(x => x.reactionTime));
    const meanRTInvalid = mean(invalid.map(x => x.reactionTime));
    const cueingEffect = meanRTInvalid - meanRTValid;

    const correctCount = targetTrials.filter(x => x.correct).length;
    const accuracy = targetTrials.length ? correctCount / targetTrials.length : 0;
    const anticipatory = trials.filter(x => x.anticipatory).length;
    const late = trials.filter(x => x.late).length;
    const timedOut = trials.filter(x => x.timedOut).length;
    const falseAlarms = trials.filter(x => !x.hasTarget && x.falseAlarm).length;

    // RT by CTI and validity
    const ctis = [...new Set(targetTrials.map(x => x.cti))].sort((a, b) => a - b);
    const rtByCti = ctis.map(cti => {
      const v = targetTrials.filter(x => x.cti === cti && x.validity === 'valid' && x.correct && x.reactionTime != null).map(x => x.reactionTime);
      const iv = targetTrials.filter(x => x.cti === cti && x.validity === 'invalid' && x.correct && x.reactionTime != null).map(x => x.reactionTime);
      return { cti, validRT: mean(v), invalidRT: mean(iv), validN: v.length, invalidN: iv.length };
    });

    return {
      meanRTValid, meanRTInvalid, cueingEffect, accuracy,
      anticipatory, late, timedOut, falseAlarms,
      rtByCti, ctis,
      totalTrials: trials.length,
      validTrialsN: valid.length,
      invalidTrialsN: invalid.length,
    };
  }, [trials]);

  // Draw chart: mean RT by CTI for valid vs invalid
  useEffect(() => {
    if (selectedTab !== 'graph' || !chartRef.current || summary.rtByCti.length === 0) return;

    const drawChart = async () => {
      try {
        const { Chart, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } = await import('chart.js');
        Chart.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: summary.rtByCti.map(r => `${r.cti} ms`),
            datasets: [
              {
                label: translate('results_label_valid'),
                data: summary.rtByCti.map(r => r.validRT ? Math.round(r.validRT) : null),
                borderColor: '#8e44ad',
                backgroundColor: '#8e44ad33',
                borderWidth: 2,
                pointRadius: 5,
                tension: 0.2,
              },
              {
                label: translate('results_label_invalid'),
                data: summary.rtByCti.map(r => r.invalidRT ? Math.round(r.invalidRT) : null),
                borderColor: '#e67e22',
                backgroundColor: '#e67e2233',
                borderWidth: 2,
                pointRadius: 5,
                borderDash: [6, 4],
                tension: 0.2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: translate('results_chart_title'), font: { size: 16 } },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} ms`,
                },
              },
            },
            scales: {
              y: { beginAtZero: false, title: { display: true, text: translate('results_chart_y_axis') } },
              x: { title: { display: true, text: translate('results_chart_x_axis') } },
            },
          },
        });
      } catch (error) {
        console.error('Error loading Chart.js:', error);
      }
    };

    drawChart();

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [selectedTab, summary]);

  const formatMs = (ms) => ms ? Math.round(ms) : '—';
  const formatPct = (p) => `${(p * 100).toFixed(1)}%`;

  const exportCSV = () => {
    const headers = [
      translate('results_trial_number'),
      'Cue Side',
      'Target Side',
      'Validity',
      'CTI (ms)',
      'Has Target',
      'RT (ms)',
      'Correct',
      'Anticipatory',
      'Late',
      'Timed Out',
      'False Alarm',
    ];
    const rows = trials.map(t => [
      t.trialNumber,
      t.cueSide,
      t.targetSide || '',
      t.validity,
      t.cti,
      t.hasTarget ? 1 : 0,
      t.reactionTime != null ? Math.round(t.reactionTime) : '',
      t.correct ? 1 : 0,
      t.anticipatory ? 1 : 0,
      t.late ? 1 : 0,
      t.timedOut ? 1 : 0,
      t.falseAlarm ? 1 : 0,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pcp-results-${new Date().toISOString().split('T')[0]}.csv`);
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
            {summary.rtByCti.length > 0 ? (
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
              <h3>{translate('results_main_metrics')}</h3>
              <table>
                <tbody>
                  <tr>
                    <td>{translate('results_mean_rt_valid')}</td>
                    <td>{formatMs(summary.meanRTValid)} ms ({summary.validTrialsN})</td>
                  </tr>
                  <tr>
                    <td>{translate('results_mean_rt_invalid')}</td>
                    <td>{formatMs(summary.meanRTInvalid)} ms ({summary.invalidTrialsN})</td>
                  </tr>
                  <tr>
                    <td><strong>{translate('results_cueing_effect')}</strong></td>
                    <td><strong>{formatMs(summary.cueingEffect)} ms</strong></td>
                  </tr>
                  <tr>
                    <td>{translate('results_accuracy')}</td>
                    <td>{formatPct(summary.accuracy)}</td>
                  </tr>
                  <tr>
                    <td>{translate('results_anticipatory')}</td>
                    <td>{summary.anticipatory}</td>
                  </tr>
                  <tr>
                    <td>{translate('results_late')}</td>
                    <td>{summary.late}</td>
                  </tr>
                  <tr>
                    <td>{translate('results_timed_out')}</td>
                    <td>{summary.timedOut}</td>
                  </tr>
                  <tr>
                    <td>{translate('results_false_alarms')}</td>
                    <td>{summary.falseAlarms}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.percentileTable} style={{ marginTop: '1.5rem' }}>
              <h3>{translate('results_rt_by_cti')}</h3>
              <table>
                <thead>
                  <tr>
                    <th>{translate('results_chart_x_axis')}</th>
                    <th>{translate('results_label_valid')}</th>
                    <th>{translate('results_label_invalid')}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.rtByCti.map(r => (
                    <tr key={r.cti}>
                      <td>{r.cti} ms</td>
                      <td>{formatMs(r.validRT)} ms (n={r.validN})</td>
                      <td>{formatMs(r.invalidRT)} ms (n={r.invalidN})</td>
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
                  <th>{translate('results_label_validity')}</th>
                  <th>{translate('results_label_cti')}</th>
                  <th>{translate('results_label_cue')}</th>
                  <th>{translate('results_label_target')}</th>
                  <th>{translate('results_reaction_time_ms')}</th>
                  <th>{translate('results_label_outcome')}</th>
                </tr>
              </thead>
              <tbody>
                {trials.length > 0 ? trials.map((trial, index) => (
                  <tr key={index} className={!trial.correct ? styles.falseStartRow : ''}>
                    <td>{trial.trialNumber}</td>
                    <td>{translate(`validity_${trial.validity}`)}</td>
                    <td>{trial.cti} ms</td>
                    <td>{trial.cueSide}</td>
                    <td>{trial.targetSide || '—'}</td>
                    <td>{trial.reactionTime != null ? formatMs(trial.reactionTime) : '—'}</td>
                    <td>
                      {trial.anticipatory ? translate('outcome_anticipatory')
                        : trial.late ? translate('outcome_late')
                        : trial.timedOut ? translate('outcome_timeout')
                        : trial.falseAlarm ? translate('outcome_false_alarm')
                        : trial.correct ? translate('outcome_correct')
                        : translate('outcome_incorrect')}
                    </td>
                  </tr>
                )) : (
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
