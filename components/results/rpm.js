// components/results/rpm/RPMResults.js
import React from 'react';
import Link from 'next/link';
import styles from '../../styles/RPMResults.module.css'; // Create this CSS file
import { RPM_SETS } from '../tests/rpm/data';

const RPMResults = ({ userAnswers, problems, startTime, endTime, settings, onRestart }) => {

  // Calculate Score
  let totalScore = 0;
  const resultsByItem = problems.map(problem => {
    const userAnswerId = userAnswers[problem.id];
    const isCorrect = userAnswerId === problem.correctOptionId;
    if (isCorrect) {
      totalScore++;
    }
    return {
      id: problem.id,
      set: problem.set,
      userAnswerId: userAnswerId ?? '-', // Show '-' if unanswered
      correctAnswerId: problem.correctOptionId,
      isCorrect: isCorrect,
    };
  });

  // Calculate scores per set
  const scoresBySet = RPM_SETS.reduce((acc, set) => {
      acc[set] = resultsByItem
          .filter(r => r.set === set && r.isCorrect)
          .length;
      return acc;
  }, {});


  // Calculate time taken if available
  const timeTakenSeconds = startTime && endTime ? Math.round((endTime - startTime) / 1000) : null;
  const formatTime = (seconds) => {
    if (seconds === null) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Optional: Export Function
  const exportResultsToCSV = () => {
    const headers = ['Item', 'Set', 'User Answer', 'Correct Answer', 'Result'];
    const rows = resultsByItem.map(r => [
      r.id,
      r.set,
      r.userAnswerId,
      r.correctAnswerId,
      r.isCorrect ? 'Correct' : 'Incorrect',
    ]);

    // Add summary rows
    rows.push([]); // Spacer
    RPM_SETS.forEach(set => {
      rows.push([`Set ${set} Score:`, scoresBySet[set]]);
    });
    rows.push([`Total Score:`, totalScore, `(Max: ${problems.length})`]);
    if (timeTakenSeconds !== null) {
        rows.push([`Time Taken:`, formatTime(timeTakenSeconds)]);
    }
     if (settings.isTimed) {
        rows.push([`Timed Session:`, `${settings.testDurationMinutes} min`]);
     }


    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rpm-results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.resultsCard}>
      <h2>Test Results</h2>

      <div className={styles.summaryMetrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Total Score</span>
          <span className={styles.metricValue}>{totalScore} / {problems.length}</span>
        </div>
        {timeTakenSeconds !== null && (
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Time Taken</span>
            <span className={styles.metricValue}>{formatTime(timeTakenSeconds)}</span>
          </div>
        )}
         {/* Display scores per set */}
         <div className={styles.setScores}>
           {RPM_SETS.map(set => (
              <span key={set}>Set {set}: {scoresBySet[set]}/12</span>
           ))}
         </div>
      </div>

       <div className={styles.exportContainer}>
         <button
           className={styles.exportButton}
           onClick={exportResultsToCSV}
           disabled={resultsByItem.length === 0}
         >
           Export Results (CSV)
         </button>
       </div>

      <h3>Detailed Results</h3>
      <div className={styles.resultsTableContainer}>
        <table className={styles.resultsTable}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Your Answer</th>
              <th>Correct Answer</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {resultsByItem.map(result => (
              <tr key={result.id} className={result.isCorrect ? styles.correctRow : styles.incorrectRow}>
                <td>{result.id}</td>
                <td>{result.userAnswerId}</td>
                <td>{result.correctAnswerId}</td>
                <td>{result.isCorrect ? '✓' : '✕'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

       <p className={styles.interpretationNote}>
         Note: Score interpretation requires comparison with appropriate age-based norms and clinical expertise.
       </p>

      <div className={styles.buttonContainer}>
        <button className={styles.primaryButton} onClick={onRestart}>
          Restart Test
        </button>
        <Link href="/">
          <div className={styles.secondaryButton}>Back to Home</div>
        </Link>
      </div>
       <p className={styles.copyrightNoticeResults}>
         ** Reminder: Raven's Progressive Matrices require licensed materials for use. **
       </p>
    </div>
  );
};

export default RPMResults;