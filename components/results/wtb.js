import React from 'react';
import styles from '../../styles/Results.module.css';

const WtbResults = ({ roundData, maxLevel, totalScore, isStandalone, t }) => {
  const translate = t || ((key) => key);

  // Map level numbers to UT3 naming scheme
  const mapLevelToUT3 = (level) => {
    const mapping = {
      2: 'UT3_1',
      3: 'UT3_2',
      4: 'UT3_3',
      5: 'UT3_4',
      6: 'UT3_5',
      7: 'UT3_6',
      8: 'UT3_7',
      9: 'UT3_8'
    };
    return mapping[level] || `Level ${level}`;
  };

  // Calculate statistics
  const totalRounds = roundData.length;
  const successfulRounds = roundData.filter(r => r.success).length;
  const accuracy = totalRounds > 0 ? ((successfulRounds / totalRounds) * 100).toFixed(1) : 0;

  // Calculate points breakdown
  const calculatePoints = (round) => {
    if (!round.success) return 0;
    const levelPoints = round.level;
    const bonusPoints = round.attemptNumber === 1 ? 1 : 0;
    return levelPoints + bonusPoints;
  };

  const exportResultsToCSV = () => {
    const headers = [
      'Round',
      'Level',
      'Success',
      'Attempt_Number',
      'Points',
      'Target_Sequence',
      'User_Sequence',
      'Timestamp_DE',
      'Time_Diff_MS'
    ];

    const rows = roundData.map((round, index) => {
      // Convert timestamp to German local time
      const timestamp = new Date(round.timestamp);
      const germanTime = timestamp.toLocaleString('de-DE', {
        timeZone: 'Europe/Berlin',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });

      // Calculate time difference from previous round
      let timeDiff = '';
      if (index > 0) {
        const prevTimestamp = new Date(roundData[index - 1].timestamp);
        timeDiff = timestamp - prevTimestamp;
      }

      return [
        index + 1,
        mapLevelToUT3(round.level),
        round.success ? 'Yes' : 'No',
        round.attemptNumber || 0,
        calculatePoints(round),
        round.sequence.join(' '),
        round.userSequence.join(' '),
        germanTime,
        timeDiff
      ];
    });

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
          <h3>{translate('total_score_label')}</h3>
          <div className={styles.metricValue}>{totalScore || 0}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('max_level_label')}</h3>
          <div className={styles.metricValue}>{mapLevelToUT3(maxLevel)}</div>
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
                <span className={styles.roundLevel}>{translate('level')} {mapLevelToUT3(round.level)}</span>
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
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>{translate('attempt_number')}:</span>
                  <span className={styles.detailValue}>{round.attemptNumber || 0}</span>
                </div>
                {round.success && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>{translate('points_earned')}:</span>
                    <span className={styles.detailValue}>
                      {calculatePoints(round)}
                      {round.attemptNumber === 1 && <span className={styles.bonusBadge}> (+1 {translate('first_try_bonus')})</span>}
                    </span>
                  </div>
                )}
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