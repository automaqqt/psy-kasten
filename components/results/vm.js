import React, { useState } from 'react';
import styles from '../../styles/Results.module.css';

const VmResults = ({ roundData }) => {
  const [selectedRound, setSelectedRound] = useState(null);

  const calculateVisualMemorySpan = () => {
    const successfulLevels = roundData.filter(r => r.success).map(r => r.level);
    return successfulLevels.length ? Math.max(...successfulLevels) : 0;
  };

  const totalHits = roundData.reduce((sum, round) => sum + round.hits, 0);
  const totalFalseAlarms = roundData.reduce((sum, round) => sum + round.falseAlarms, 0);
  const averageRecognitionTime = roundData.length > 0
    ? roundData.reduce((sum, round) => sum + round.responseTime, 0) / roundData.length
    : 0;

  const exportResultsToCSV = () => {
    const headers = [
      'Round',
      'Level',
      'Trial',
      'Success',
      'RecognitionTime_ms',
      'Hits',
      'Misses_Omissions',
      'False_Alarms',
      'Target_Sequence',
      'User_Selection'
    ];

    const rows = roundData.map((round, index) => [
      index + 1,
      round.level,
      round.trialIndex + 1,
      round.success ? 'Success' : 'Failure',
      Math.round(round.responseTime),
      round.hits,
      round.misses,
      round.falseAlarms,
      round.targetSequence.join('-'),
      round.userSelection.join('-')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vm-results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.detailedResults}>
      <h2>Visual Memory Test Results</h2>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <h3>Visual Memory Span</h3>
          <div className={styles.metricValue}>{calculateVisualMemorySpan()}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Total Correct Hits</h3>
          <div className={styles.metricValue}>{totalHits}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Total False Alarms</h3>
          <div className={styles.metricValue}>{totalFalseAlarms}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Average Recognition Time</h3>
          <div className={styles.metricValue}>{(averageRecognitionTime / 1000).toFixed(2)}s</div>
        </div>
      </div>

      <div className={styles.exportContainer}>
        <button
          className={styles.exportButton}
          onClick={exportResultsToCSV}
          disabled={roundData.length === 0}
        >
          Export Results to CSV
        </button>
      </div>

      <div className={styles.resultsTabs}>
        <h3>Round-by-Round Analysis</h3>
        <div className={styles.roundsList}>
          {roundData.map((round, index) => (
            <div
              key={index}
              className={`${styles.roundItem} ${selectedRound === index ? styles.selected : ''} ${round.success ? styles.success : styles.failure}`}
              onClick={() => setSelectedRound(index)}
            >
              <div>Level {round.level} - Trial {round.trialIndex + 1}</div>
              <div>{round.success ? 'Success' : 'Failed'}</div>
            </div>
          ))}
        </div>

        {selectedRound !== null && (
          <div className={styles.roundDetails}>
            <h4>Level {roundData[selectedRound].level} - Trial {roundData[selectedRound].trialIndex + 1} Details</h4>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <div>Status: {roundData[selectedRound].success ? 'Success' : 'Failed'}</div>
              </div>
              <div className={styles.detailItem}>
                <div>Hits: {roundData[selectedRound].hits}</div>
              </div>
              <div className={styles.detailItem}>
                <div>Misses: {roundData[selectedRound].misses}</div>
              </div>
              <div className={styles.detailItem}>
                <div>False Alarms: {roundData[selectedRound].falseAlarms}</div>
              </div>
            </div>
            <h5>Sequence Comparison:</h5>
            <div className={styles.sequenceComparison}>
              <div>
                <div>Target:</div>
                <div>{roundData[selectedRound].targetSequence.join(', ')}</div>
              </div>
              <div>
                <div>Your Selection:</div>
                <div>{roundData[selectedRound].userSelection.join(', ')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VmResults;
