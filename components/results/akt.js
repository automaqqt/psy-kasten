import React from 'react';
import styles from '../../styles/Results.module.css';

const AktResults = ({ results, t }) => {
  const { T, R, F, F1, F2, F3, Omissions, F_perc, G } = results;
  const translate = t || ((key) => key);

  const exportResultsToCSV = () => {
    const headers = [
      'Time_sec',
      'Correct_R',
      'Omissions',
      'Errors_F_Total',
      'Errors_F1_RightLeft',
      'Errors_F2_Position',
      'Errors_F3_Double',
      'Error_Percent_F_perc',
      'Total_Score_G'
    ];

    const row = [
      T,
      R,
      Omissions,
      F,
      F1,
      F2,
      F3,
      F_perc,
      G
    ];

    const csvContent = [
      headers.join(','),
      row.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `akt-results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.detailedResults}>
      <h2>{translate('results_title')}</h2>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <h3>{translate('gain_label')}</h3>
          <div className={styles.metricValue}>{G}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('time_label')}</h3>
          <div className={styles.metricValue}>{T.toFixed(2)}s</div>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('correct_targets_label')}</h3>
          <div className={styles.metricValue}>{R}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('false_alarms_label')}</h3>
          <div className={styles.metricValue}>{F}</div>
        </div>
      </div>

      <div className={styles.resultsTabs}>
        <h3>Detailed Analysis</h3>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>{translate('correct_targets_label')} (R):</div>
            <div className={styles.detailValue}>{R} out of 20</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>{translate('omissions_label')}:</div>
            <div className={styles.detailValue}>{Omissions}</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>{translate('false_alarms_label')} (F):</div>
            <div className={styles.detailValue}>{F}</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>{translate('error_f1_label')} (F1):</div>
            <div className={styles.detailValue}>{F1}</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>{translate('error_f2_label')} (F2):</div>
            <div className={styles.detailValue}>{F2}</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>{translate('error_f3_label')} (F3):</div>
            <div className={styles.detailValue}>{F3}</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>{translate('false_alarm_percentage_label')} (F%):</div>
            <div className={styles.detailValue}>{F_perc.toFixed(2)}%</div>
          </div>
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

export default AktResults;
