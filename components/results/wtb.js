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

  // Process round data to create level summary
  const createLevelSummary = () => {
    const levelSummary = {};

    // Process all rounds and group by level
    roundData.forEach(round => {
      const level = round.level;

      if (!levelSummary[level]) {
        levelSummary[level] = {
          level: level,
          attempted: true,
          solved: false,
          solvedOnFirstTry: false
        };
      }

      // If this round was successful
      if (round.success) {
        levelSummary[level].solved = true;

        // Check if it was solved on first try (level 2 does not get first-try bonus)
        if (level >= 3 && round.attemptNumber === 1) {
          levelSummary[level].solvedOnFirstTry = true;
        }
      }
    });

    // Convert to array and sort by level
    return Object.values(levelSummary).sort((a, b) => a.level - b.level);
  };

  const levelSummary = createLevelSummary();

  // Calculate new metrics
  const total_points_success = levelSummary.filter(l => l.solved).length;
  const point_first_try = levelSummary.filter(l => l.solvedOnFirstTry).length;

  // Calculate statistics
  const totalRounds = roundData.length;
  const successfulRounds = roundData.filter(r => r.success).length;
  const accuracy = totalRounds > 0 ? ((successfulRounds / totalRounds) * 100).toFixed(1) : 0;

  // Calculate points breakdown
  const calculatePoints = (round) => {
    if (!round.success) return 0;
    const levelPoints = 1;
    // Level 2 (UT3_1) does not get first-try bonus
    const bonusPoints = (round.level >= 3 && round.attemptNumber === 1) ? 1 : 0;
    return levelPoints + bonusPoints;
  };

  const exportResultsToCSV = () => {
    const headers = [
      'Round',
      'Level',
      'Success',
      'Attempt_Number',
      'Points_Level_Solved',
      'Points_First_Try_Bonus',
      'Points_Total',
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
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Calculate time difference from previous round
      let timeDiff = '';
      if (index > 0) {
        const prevTimestamp = new Date(roundData[index - 1].timestamp);
        timeDiff = timestamp - prevTimestamp;
      }

      // Calculate point breakdown
      const levelSolvedPoints = round.success ? 1 : 0;
      const firstTryBonusPoints = (round.success && round.level >= 3 && round.attemptNumber === 1) ? 1 : 0;
      const totalPoints = levelSolvedPoints + firstTryBonusPoints;

      return [
        index + 1,
        mapLevelToUT3(round.level),
        round.success ? 'Yes' : 'No',
        round.attemptNumber || 0,
        levelSolvedPoints,
        firstTryBonusPoints,
        totalPoints,
        round.sequence.join(' '),
        round.userSequence.join(' '),
        germanTime,
        timeDiff
      ];
    });

    // Calculate totals
    const totalLevelSolvedPoints = rows.reduce((sum, row) => sum + row[4], 0);
    const totalFirstTryBonusPoints = rows.reduce((sum, row) => sum + row[5], 0);
    const grandTotal = rows.reduce((sum, row) => sum + row[6], 0);

    // Add summary rows
    const summaryRows = [
      ['', '', '', '', '', '', '', '', '', '', ''], // Empty row
      ['TOTALS', '', '', '', totalLevelSolvedPoints, totalFirstTryBonusPoints, grandTotal, '', '', '', '']
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      ...summaryRows.map(row => row.join(','))
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
          <h3>{translate('total_points_success')}</h3>
          <div className={styles.metricValue}>{total_points_success}</div>
          <p className={styles.metricDescription}>{translate('levels_solved')}</p>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('point_first_try')}</h3>
          <div className={styles.metricValue}>{point_first_try}</div>
          <p className={styles.metricDescription}>{translate('first_try_bonuses')}</p>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('total_score_label')}</h3>
          <div className={styles.metricValue}>{totalScore || 0}</div>
          <p className={styles.metricDescription}>{translate('combined_score')}</p>
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
      </div>

      <div className={styles.levelSummarySection}>
        <h3>{translate('level_summary_title')}</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.levelSummaryTable}>
            <thead>
              <tr>
                <th>{translate('level_column')}</th>
                <th>{translate('solved_column')}</th>
                <th>{translate('first_try_column')}</th>
              </tr>
            </thead>
            <tbody>
              {levelSummary.map((levelData) => (
                <tr key={levelData.level}>
                  <td className={styles.levelCell}>{mapLevelToUT3(levelData.level)}</td>
                  <td className={styles.statusCell}>
                    {levelData.solved ? (
                      <span className={styles.successIcon}>✓</span>
                    ) : (
                      <span className={styles.failIcon}>✗</span>
                    )}
                  </td>
                  <td className={styles.statusCell}>
                    {levelData.solvedOnFirstTry ? (
                      <span className={styles.successIcon}>✓</span>
                    ) : (
                      <span className={styles.failIcon}>✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                      {round.level >= 3 && round.attemptNumber === 1 && <span className={styles.bonusBadge}> (+1 {translate('first_try_bonus')})</span>}
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