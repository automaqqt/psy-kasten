import React from 'react';
import styles from '../../styles/Results.module.css';

const WtbResults = ({ roundData, maxLevel, isStandalone, t }) => {
  const translate = t || ((key) => key);

  // Calculate statistics
  const totalRounds = roundData.length;
  const successfulRounds = roundData.filter(r => r.success).length;
  const accuracy = totalRounds > 0 ? ((successfulRounds / totalRounds) * 100).toFixed(1) : 0;

  const exportResultsToCSV = () => {
    const headers = [
      'Round',
      'Level',
      'Success',
      'Target_Sequence',
      'User_Sequence',
      'User_Input',
      'Timestamp'
    ];

    const rows = roundData.map((round, index) => [
      index + 1,
      round.level,
      round.success ? 'Yes' : 'No',
      round.sequence.join(' '),
      round.userSequence.join(' '),
      round.userInput,
      round.timestamp
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wtb-results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.detailedResults}>
      <h2>{translate('results_title')}</h2>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <h3>{translate('max_level_label')}</h3>
          <div className={styles.metricValue}>{maxLevel}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('accuracy_label')}</h3>
          <div className={styles.metricValue}>{accuracy}%</div>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('total_rounds_label')}</h3>
          <div className={styles.metricValue}>{totalRounds}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('successful_rounds_label')}</h3>
          <div className={styles.metricValue}>{successfulRounds}</div>
        </div>
      </div>

      <div className={styles.resultsTabs}>
        <h3>{translate('round_analysis_title')}</h3>
        <div className={styles.roundsList}>
          {roundData.map((round, index) => (
            <div key={index} className={`${styles.roundItem} ${round.success ? styles.successRound : styles.failRound}`}>
              <div className={styles.roundHeader}>
                <span className={styles.roundNumber}>{translate('round')} {index + 1}</span>
                <span className={styles.roundLevel}>{translate('level')} {round.level}</span>
                <span className={`${styles.roundStatus} ${round.success ? styles.success : styles.fail}`}>
                  {round.success ? '✓' : '✗'}
                </span>
              </div>
              <div className={styles.roundDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>{translate('target')}:</span>
                  <span className={styles.detailValue}>{round.sequence.join(' - ')}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>{translate('user_response')}:</span>
                  <span className={styles.detailValue}>{round.userSequence.join(' - ') || translate('no_response')}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>{translate('transcription')}:</span>
                  <span className={styles.detailValue}>"{round.userInput}"</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.exportContainer}>
        <button
          className={styles.exportButton}
          onClick={exportResultsToCSV}
        >
          {translate('export_results')}
        </button>
      </div>
    </div>
  );
};

export default WtbResults;