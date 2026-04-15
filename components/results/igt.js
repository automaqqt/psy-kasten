// components/results/igt.js
import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/PVTResults.module.css';

const DECK_COLORS = {
  A: '#e53935', // bad, frequent losses
  B: '#ef6c00', // bad, infrequent losses
  C: '#43a047', // good, frequent losses
  D: '#1e88e5', // good, infrequent losses
};

export default function IgtResults({ trials, startingBalance, finalBalance, onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const translate = t || ((key) => key);

  const safeTrials = Array.isArray(trials) ? trials : [];
  const totalTrials = safeTrials.length;

  const deckCounts = { A: 0, B: 0, C: 0, D: 0 };
  safeTrials.forEach(tr => { if (deckCounts[tr.deck] !== undefined) deckCounts[tr.deck]++; });

  const goodChoices = deckCounts.C + deckCounts.D;
  const badChoices = deckCounts.A + deckCounts.B;
  const netScore = goodChoices - badChoices;
  const goodPct = totalTrials > 0 ? (goodChoices / totalTrials) * 100 : 0;
  const badPct = totalTrials > 0 ? (badChoices / totalTrials) * 100 : 0;

  const validRTs = safeTrials.map(tr => tr.reactionTime).filter(Boolean);
  const meanRT = validRTs.length > 0 ? validRTs.reduce((a, b) => a + b, 0) / validRTs.length : 0;

  const endBalance = finalBalance !== undefined ? finalBalance
    : (totalTrials > 0 ? safeTrials[totalTrials - 1].balanceAfter : startingBalance);

  // Block-wise good-vs-bad proportions (blocks of 20 trials, as in Bechara 1994)
  useEffect(() => {
    if (selectedTab !== 'graph' || !chartRef.current || safeTrials.length === 0) return;

    const blockSize = 20;
    const nBlocks = Math.max(1, Math.ceil(safeTrials.length / blockSize));
    const labels = [];
    const goodData = [];
    const badData = [];
    for (let i = 0; i < nBlocks; i++) {
      const start = i * blockSize;
      const block = safeTrials.slice(start, start + blockSize);
      const good = block.filter(tr => tr.deck === 'C' || tr.deck === 'D').length;
      const bad = block.filter(tr => tr.deck === 'A' || tr.deck === 'B').length;
      labels.push(`${start + 1}-${Math.min(start + blockSize, safeTrials.length)}`);
      goodData.push(block.length > 0 ? (good / block.length) * 100 : 0);
      badData.push(block.length > 0 ? (bad / block.length) * 100 : 0);
    }

    const drawChart = async () => {
      try {
        const { Chart, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, Filler } = await import('chart.js');
        Chart.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, Filler);

        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: translate('results_good_decks'),
                data: goodData,
                borderColor: '#43a047',
                backgroundColor: '#43a04733',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#43a047',
                tension: 0.3,
                fill: false,
              },
              {
                label: translate('results_bad_decks'),
                data: badData,
                borderColor: '#e53935',
                backgroundColor: '#e5393533',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#e53935',
                tension: 0.3,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              title: {
                display: true,
                text: translate('results_chart_title'),
                font: { size: 16 },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: translate('results_chart_y_axis') },
                ticks: { callback: (v) => `${v}%` },
              },
              x: {
                title: { display: true, text: translate('results_chart_x_axis') },
              },
            },
          },
        });
      } catch (error) {
        console.error('Error loading Chart.js:', error);
      }
    };

    drawChart();
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [selectedTab, safeTrials]);

  const maxDeckCount = Math.max(1, ...Object.values(deckCounts));

  const exportCSV = () => {
    const headers = [
      translate('results_trial_number'),
      translate('results_deck'),
      translate('results_reward'),
      translate('results_loss'),
      translate('results_net'),
      translate('results_balance'),
      translate('results_reaction_time_ms'),
    ];
    const rows = safeTrials.map(tr => [
      tr.trialNumber,
      tr.deck,
      tr.reward,
      tr.loss,
      tr.net,
      tr.balanceAfter,
      tr.reactionTime || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `igt-results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metric = (value, label, color) => (
    <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-accent, #f5f5f5)', borderRadius: '10px' }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>{label}</div>
    </div>
  );

  return (
    <div className={styles.resultsContainer}>
      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {metric(`$${endBalance}`, translate('results_final_balance'), netScore >= 0 ? '#43a047' : '#e53935')}
        {metric(netScore >= 0 ? `+${netScore}` : netScore, translate('results_net_score'), netScore >= 0 ? '#43a047' : '#e53935')}
        {metric(goodChoices, translate('results_good_decks'), '#43a047')}
        {metric(badChoices, translate('results_bad_decks'), '#e53935')}
        {metric(`${goodPct.toFixed(1)}%`, translate('results_good_pct'), '#43a047')}
        {metric(`${meanRT > 0 ? Math.round(meanRT) : 0} ms`, translate('results_mean_rt'), 'var(--text-primary, #333)')}
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
            {safeTrials.length > 0 ? (
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
            <h3>{translate('results_deck_distribution_title')}</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', height: '260px', padding: '1rem', justifyContent: 'center' }}>
              {['A', 'B', 'C', 'D'].map(deck => {
                const count = deckCounts[deck];
                const pct = totalTrials > 0 ? (count / totalTrials) * 100 : 0;
                const height = maxDeckCount > 0 ? (count / maxDeckCount) * 100 : 0;
                return (
                  <div key={deck} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '120px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #666)', marginBottom: '0.4rem' }}>
                      {count} ({pct.toFixed(1)}%)
                    </div>
                    <div style={{
                      width: '100%',
                      height: `${Math.max(height, 2)}%`,
                      backgroundColor: DECK_COLORS[deck],
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.4s ease',
                      minHeight: '4px',
                    }} />
                    <div style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--text-primary, #333)' }}>
                      {translate('deck_label')} {deck}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #666)', textAlign: 'center' }}>
                      {translate(`deck_${deck.toLowerCase()}_desc`)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedTab === 'data' && (
          <div className={styles.dataTableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{translate('results_trial_number')}</th>
                  <th>{translate('results_deck')}</th>
                  <th>{translate('results_reward')}</th>
                  <th>{translate('results_loss')}</th>
                  <th>{translate('results_net')}</th>
                  <th>{translate('results_balance')}</th>
                  <th>{translate('results_reaction_time_ms')}</th>
                </tr>
              </thead>
              <tbody>
                {safeTrials.length > 0 ? (
                  safeTrials.map((tr, i) => (
                    <tr key={i} className={tr.loss > 0 ? styles.falseStartRow : ''}>
                      <td>{tr.trialNumber}</td>
                      <td>{tr.deck}</td>
                      <td>+${tr.reward}</td>
                      <td>{tr.loss > 0 ? `-$${tr.loss}` : '-'}</td>
                      <td>{tr.net >= 0 ? `+$${tr.net}` : `-$${Math.abs(tr.net)}`}</td>
                      <td>${tr.balanceAfter}</td>
                      <td>{tr.reactionTime ? Math.round(tr.reactionTime) : '-'}</td>
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
