// components/results/bart.js
import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/PVTResults.module.css';
import { summarize } from '../tests/bart/test';

const COLOR_HEX = { blue: '#3b82f6', yellow: '#f5c518', orange: '#ff7a18' };

export default function BartResults({ trials, totalEarnedCents, onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const translate = t || ((key) => key);
  const summary = summarize(trials || []);
  const earned = typeof totalEarnedCents === 'number' ? totalEarnedCents : summary.totalEarnedCents;
  const formatMoney = (cents) => `$${(cents / 100).toFixed(2)}`;

  // Draw chart: pumps over trial number, color-coded by balloon type, with explosions marked.
  useEffect(() => {
    if (selectedTab !== 'graph' || !chartRef.current || !trials || trials.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const chartjs = await import('chart.js');
        const { Chart, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, BarElement, BarController, LineController } = chartjs;
        Chart.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, BarElement, BarController, LineController);

        if (cancelled || !chartRef.current) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const labels = trials.map(t => t.trialNumber);
        const dataPumps = trials.map(t => t.pumps);
        const backgroundColors = trials.map(t => COLOR_HEX[t.color] || '#999999');
        const borderColors = trials.map(t => t.exploded ? '#d32f2f' : COLOR_HEX[t.color] || '#999999');

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: translate('results_pumps_per_balloon'),
              data: dataPumps,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: translate('results_chart_title'),
                font: { size: 16 },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const trial = trials[ctx.dataIndex];
                    const colorLabel = translate(`balloon_color_${trial.color}`);
                    const status = trial.exploded ? translate('results_exploded') : translate('results_collected');
                    return `${colorLabel} — ${trial.pumps} ${translate('results_pumps')} (${status})`;
                  },
                },
              },
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: translate('results_pumps') } },
              x: { title: { display: true, text: translate('results_trial_number') } },
            },
          },
        });
      } catch (e) {
        console.error('Error loading Chart.js:', e);
      }
    })();

    return () => { cancelled = true; if (chartInstance.current) chartInstance.current.destroy(); };
  }, [selectedTab, trials, translate]);

  const handleExportCsv = () => {
    const headers = [
      translate('results_trial_number'),
      translate('results_color'),
      translate('results_pumps'),
      translate('results_break_point'),
      translate('results_outcome'),
      translate('results_earnings'),
    ];
    const rows = (trials || []).map(t => [
      t.trialNumber,
      t.color,
      t.pumps,
      t.breakPoint,
      t.exploded ? 'exploded' : 'collected',
      (t.earningsCents / 100).toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bart-results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!trials || trials.length === 0) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.emptyState}>
          <p>{translate('results_no_data')}</p>
        </div>
      </div>
    );
  }

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
            <canvas ref={chartRef} height="320" />
          </div>
        )}

        {selectedTab === 'summary' && (
          <div className={styles.distributionContainer}>
            <div className={styles.percentileTable}>
              <h3>{translate('results_summary_title')}</h3>
              <table>
                <thead>
                  <tr>
                    <th>{translate('results_total_earned')}</th>
                    <th>{translate('results_explosions')}</th>
                    <th>{translate('results_balloons')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{formatMoney(earned)}</td>
                    <td>{summary.explosions}</td>
                    <td>{summary.totalBalloons}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.percentileTable} style={{ marginTop: '1.5rem' }}>
              <h3>{translate('results_adj_pumps_title')}</h3>
              <table>
                <thead>
                  <tr>
                    <th>{translate('balloon_color_blue')}</th>
                    <th>{translate('balloon_color_yellow')}</th>
                    <th>{translate('balloon_color_orange')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{summary.adjBlue.toFixed(1)}</td>
                    <td>{summary.adjYellow.toFixed(1)}</td>
                    <td>{summary.adjOrange.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-secondary, #666)' }}>
                {translate('results_adj_pumps_note')}
              </p>
            </div>
          </div>
        )}

        {selectedTab === 'data' && (
          <div className={styles.dataTableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{translate('results_trial_number')}</th>
                  <th>{translate('results_color')}</th>
                  <th>{translate('results_pumps')}</th>
                  <th>{translate('results_break_point')}</th>
                  <th>{translate('results_outcome')}</th>
                  <th>{translate('results_earnings')}</th>
                </tr>
              </thead>
              <tbody>
                {trials.map((trial, idx) => (
                  <tr key={idx} className={trial.exploded ? styles.falseStartRow : ''}>
                    <td>{trial.trialNumber}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
                        backgroundColor: COLOR_HEX[trial.color], marginRight: 6, verticalAlign: 'middle'
                      }} />
                      {translate(`balloon_color_${trial.color}`)}
                    </td>
                    <td>{trial.pumps}</td>
                    <td>{trial.breakPoint}</td>
                    <td>{trial.exploded ? translate('results_exploded') : translate('results_collected')}</td>
                    <td>{formatMoney(trial.earningsCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.dataExport}>
              <button className={styles.exportButton} onClick={handleExportCsv}>
                {translate('results_export_csv')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
