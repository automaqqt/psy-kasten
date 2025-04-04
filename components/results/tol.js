// components/results/tol/TOLResults.js
import React from 'react';
import Link from 'next/link';
import styles from '../../styles/TOLResults.module.css'; // Create this CSS file
import { TRIAL_SCORES } from '../tests/tol/tolData';

const TOLResults = ({ testData, totalScore, maxScore, onRestart }) => {

  // Optional: Function to export data (similar to Corsi one if you have it)
  const exportResultsToCSV = () => {
    const headers = [
        'Problem',
        'Min Moves',
        'Score Awarded',
        'Trial 1 Success', 'Trial 1 Moves',
        'Trial 2 Success', 'Trial 2 Moves',
        'Trial 3 Success', 'Trial 3 Moves'
    ];

    const rows = testData.map(result => {
        const row = [
            result.problemIndex + 1,
            result.minMoves,
            result.score,
        ];
        for (let i = 1; i <= 3; i++) {
            const attempt = result.attempts.find(a => a.trial === i);
            row.push(attempt ? (attempt.success ? 'Yes' : 'No') : '-');
            row.push(attempt ? attempt.moves : '-');
        }
        return row;
    });

    // Add summary row
    rows.push([]); // Spacer
    rows.push(['Total Score:', totalScore, `(Max: ${maxScore})`]);


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
          <span className={styles.metricLabel}>Total Score</span>
          <span className={styles.metricValue}>{totalScore} / {maxScore}</span>
        </div>
         {/* Add more summary metrics if needed, e.g., Avg Score per problem */}
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
              <th>Score</th>
              <th>Trial 1</th>
              <th>Trial 2</th>
              <th>Trial 3</th>
            </tr>
          </thead>
          <tbody>
            {testData.sort((a, b) => a.problemIndex - b.problemIndex).map(result => {
              const getTrialResult = (trialNum) => {
                const attempt = result.attempts.find(a => a.trial === trialNum);
                if (!attempt) return <span className={styles.noAttempt}>-</span>;
                return attempt.success
                  ? <span className={styles.success}>✓ ({attempt.moves}m)</span>
                  : <span className={styles.failure}>✕ ({attempt.moves}m)</span>;
              };

              return (
                <tr key={result.problemIndex}>
                  <td>{result.problemIndex + 1}</td>
                  <td>{result.minMoves}</td>
                  <td>{result.score} / {TRIAL_SCORES[0]}</td>
                  <td>{getTrialResult(1)}</td>
                  <td>{getTrialResult(2)}</td>
                  <td>{getTrialResult(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
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