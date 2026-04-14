// components/results/tmt.js
import { useState } from 'react';
import styles from '../../styles/PVTResults.module.css';

export default function TmtResults({ segmentResults = [], onRestart, t }) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const translate = t || ((key) => key);

  // Only show "real" (non-practice) segments in the primary display.
  const realSegments = segmentResults.filter(r => !r.practice);
  const partA = realSegments.find(r => r.part === 'A');
  const partB = realSegments.find(r => r.part === 'B');
  const bMinusA = (partA && partB && !partA.aborted && !partB.aborted)
    ? Math.max(0, partB.timeSec - partA.timeSec)
    : null;

  const formatSec = (s) => s == null ? '—' : `${s.toFixed(1)} s`;

  const exportCSV = () => {
    const headers = [
      translate('results_part'),
      translate('results_click_number'),
      translate('results_label'),
      translate('results_correct'),
      translate('results_elapsed_ms'),
    ];
    const rows = [];
    realSegments.forEach(seg => {
      seg.clicks?.forEach((c, i) => {
        rows.push([
          seg.part,
          i + 1,
          c.label,
          c.correct ? '1' : '0',
          c.elapsedMs,
        ]);
      });
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tmt-results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cardStyle = {
    backgroundColor: '#00897b0d',
    border: '2px solid #00897b33',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    textAlign: 'center',
  };
  const cardLabelStyle = { fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const cardValueStyle = { fontSize: '1.8rem', fontWeight: 700, color: '#00897b' };
  const cardSubStyle = { fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' };

  const renderSegmentCard = (seg, label) => {
    if (!seg) {
      return (
        <div style={cardStyle}>
          <div style={cardLabelStyle}>{label}</div>
          <div style={cardValueStyle}>—</div>
        </div>
      );
    }
    return (
      <div style={cardStyle}>
        <div style={cardLabelStyle}>{label}</div>
        <div style={cardValueStyle}>
          {seg.aborted ? translate('aborted') : formatSec(seg.timeSec)}
        </div>
        <div style={cardSubStyle}>
          {translate('errors_label')}: {seg.errors}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${selectedTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          {translate('results_tab_overview')}
        </button>
        <button
          className={`${styles.tabButton} ${selectedTab === 'data' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('data')}
        >
          {translate('results_tab_data')}
        </button>
      </div>

      <div className={styles.tabContent}>
        {selectedTab === 'overview' && (
          <div>
            <h3 style={{ marginTop: 0 }}>{translate('results_title')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {renderSegmentCard(partA, translate('results_part_a'))}
              {renderSegmentCard(partB, translate('results_part_b'))}
              <div style={cardStyle}>
                <div style={cardLabelStyle}>{translate('results_b_minus_a')}</div>
                <div style={cardValueStyle}>
                  {bMinusA == null ? '—' : formatSec(bMinusA)}
                </div>
                <div style={cardSubStyle}>
                  {translate('results_b_minus_a_hint')}
                </div>
              </div>
            </div>

            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              {translate('results_interpretation')}
            </p>

            <div style={{ marginTop: '1.5rem' }}>
              <button className={styles.exportButton} onClick={exportCSV}>
                {translate('results_export_csv')}
              </button>
              {onRestart && (
                <button
                  className={styles.exportButton}
                  onClick={onRestart}
                  style={{ marginLeft: '0.5rem' }}
                >
                  {translate('restart_test')}
                </button>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'data' && (
          <div className={styles.dataTableContainer}>
            {realSegments.length === 0 ? (
              <p className={styles.emptyState}>{translate('results_no_trials')}</p>
            ) : (
              realSegments.map(seg => (
                <div key={seg.key} style={{ marginBottom: '1.5rem' }}>
                  <h4>{translate(seg.part === 'A' ? 'results_part_a' : 'results_part_b')}</h4>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{translate('results_label')}</th>
                        <th>{translate('results_correct')}</th>
                        <th>{translate('results_elapsed_ms')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seg.clicks?.map((c, i) => (
                        <tr key={i} className={c.correct ? '' : styles.falseStartRow}>
                          <td>{i + 1}</td>
                          <td>{c.label}</td>
                          <td>{c.correct ? '✓' : '✗'}</td>
                          <td>{Math.round(c.elapsedMs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}

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
