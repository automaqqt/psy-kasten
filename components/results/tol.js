// components/results/tol/TOLResults.js
import React from 'react';
import Link from 'next/link';
import styles from '../../styles/TOLResults.module.css'; // Create this CSS file

const TOLResults = ({ testData, onRestart }) => {

  // Helper function to calculate planning time averages per difficulty level
  const calculatePlanningTimeAverages = () => {
    const levelGroups = {};

    testData.forEach(result => {
      const minMoves = result.minMoves;
      if (!levelGroups[minMoves]) {
        levelGroups[minMoves] = { times: [], count: 0 };
      }

      // Get the first successful attempt or the first attempt
      const firstAttempt = result.attempts[0];
      if (firstAttempt && firstAttempt.planningTime > 0) {
        levelGroups[minMoves].times.push(firstAttempt.planningTime);
        levelGroups[minMoves].count++;
      }
    });

    // Calculate averages
    const averages = {};
    Object.keys(levelGroups).forEach(level => {
      const group = levelGroups[level];
      if (group.count > 0) {
        averages[level] = group.times.reduce((sum, time) => sum + time, 0) / group.count;
      }
    });

    return averages;
  };

  // Helper function to calculate total average planning time across all levels
  const calculateTotalAveragePlanningTime = () => {
    let totalTime = 0;
    let count = 0;

    testData.forEach(result => {
      const firstAttempt = result.attempts[0];
      if (firstAttempt && firstAttempt.planningTime > 0) {
        totalTime += firstAttempt.planningTime;
        count++;
      }
    });

    return count > 0 ? totalTime / count : 0;
  };

  // Optional: Function to export data
  const exportResultsToCSV = () => {
    const headers = [
        'Problem',
        'Min Moves',
        'Status',
        'Moves Used',
        'Planning Time (ms)',
        'Execution Time (ms)',
        'Pauses (ms)',
        'Skipped'
    ];

    const rows = testData.map(result => {
        // Get the first attempt (trial 1)
        const attempt = result.attempts[0];

        // Determine status
        let status = '-';
        if (attempt) {
          if (attempt.skipped) {
            status = 'Skipped';
          } else if (attempt.success) {
            if (attempt.moves <= result.minMoves) {
              status = 'Solved Successfully';
            } else {
              status = 'Solved (Too Many Moves)';
            }
          } else {
            status = 'Failed';
          }
        }

        const row = [
            result.problemIndex + 1,
            result.minMoves,
            status,
            attempt ? attempt.moves : '-',
            attempt ? attempt.planningTime : '-',
            attempt ? attempt.executionTime : '-',
            attempt && attempt.pauses ? attempt.pauses.join(' ') : '-',
            attempt && attempt.skipped ? 'Yes' : 'No'
        ];
        return row;
    });

    // Add summary rows
    rows.push([]); // Spacer
    rows.push(['Total Average Planning Time:', `${calculateTotalAveragePlanningTime().toFixed(2)} ms`]);
    rows.push([]);
    rows.push(['Planning Time Averages by Difficulty Level:']);

    const planningAverages = calculatePlanningTimeAverages();
    Object.keys(planningAverages).sort((a, b) => Number(a) - Number(b)).forEach(level => {
      rows.push([`${level}-Move Problems:`, `${planningAverages[level].toFixed(2)} ms`]);
    });


    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tol-results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className={styles.resultsCard}>
      <h2>Tower of London Results</h2>

      <div className={styles.summaryMetrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Avg Planning Time</span>
          <span className={styles.metricValue}>{(calculateTotalAveragePlanningTime() / 1000).toFixed(2)}s</span>
        </div>
      </div>

       <div className={styles.exportContainer}>
         <button
           className={styles.exportButton}
           onClick={exportResultsToCSV}
           disabled={!testData || testData.length === 0}
         >
           Export Results (CSV)
         </button>
       </div>

      <h3>Detailed Problem Results</h3>
      <div className={styles.resultsTableContainer}>
        <table className={styles.resultsTable}>
          <thead>
            <tr>
              <th>Problem</th>
              <th>Min Moves</th>
              <th>Status</th>
              <th>Moves Used</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {testData.sort((a, b) => a.problemIndex - b.problemIndex).map(result => {
              // Get the first attempt
              const attempt = result.attempts[0];

              // Determine status
              let statusText = '-';
              let statusClass = styles.noAttempt;
              if (attempt) {
                if (attempt.skipped) {
                  statusText = 'Skipped';
                  statusClass = styles.failure;
                } else if (attempt.success) {
                  if (attempt.moves <= result.minMoves) {
                    statusText = 'Solved Successfully';
                    statusClass = styles.successPerfect;
                  } else {
                    statusText = 'Solved (Too Many)';
                    statusClass = styles.success;
                  }
                } else {
                  statusText = 'Failed';
                  statusClass = styles.failure;
                }
              }

              const getDetails = () => {
                if (!attempt) return null;
                return (
                  <div className={styles.trialDetails}>
                    <div>Planning: {(attempt.planningTime / 1000).toFixed(2)}s</div>
                    <div>Execution: {(attempt.executionTime / 1000).toFixed(2)}s</div>
                    {attempt.pauses && attempt.pauses.length > 0 && (
                      <div>Pauses: {attempt.pauses.join(', ')}ms</div>
                    )}
                  </div>
                );
              };

              return (
                <tr key={result.problemIndex}>
                  <td>{result.problemIndex + 1}</td>
                  <td>{result.minMoves}</td>
                  <td><span className={statusClass}>{statusText}</span></td>
                  <td>{attempt ? `${attempt.moves}` : '-'}</td>
                  <td>{getDetails()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Display planning time averages */}
      <div className={styles.averagesSection}>
        <h3>Planning Time Averages by Difficulty</h3>
        <div className={styles.averagesGrid}>
          {Object.entries(calculatePlanningTimeAverages())
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([level, avgTime]) => (
              <div key={level} className={styles.averageItem}>
                <span className={styles.averageLabel}>{level}-Move Problems:</span>
                <span className={styles.averageValue}>{(avgTime / 1000).toFixed(2)}s</span>
              </div>
            ))}
        </div>
      </div>


      <div className={styles.buttonContainer}>
        <button className={styles.primaryButton} onClick={onRestart}>
          Try Again
        </button>
        <Link href="/">
          <div className={styles.secondaryButton}>Back to Home</div>
        </Link>
      </div>
    </div>
  );
};

export default TOLResults;