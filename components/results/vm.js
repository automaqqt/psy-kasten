// components/results/vm.js
import React, { useState } from 'react';
import Image from 'next/image';
import styles from '../../styles/Results.module.css'; // Reusing the same styles as Corsi

const DetailedResults = ({ roundData, vmSpan, isStandalone, t, onReset }) => {
  const [selectedRound, setSelectedRound] = useState(null);
  const translate = t || ((key) => key);
  
  // Calculate level-specific statistics
  const levelStats = {};
  roundData.forEach(round => {
    if (!levelStats[round.level]) {
      levelStats[round.level] = {
        attempts: 0,
        successes: 0,
        totalViewingTime: 0,
        totalRecallTime: 0
      };
    }
    
    levelStats[round.level].attempts += 1;
    if (round.success) levelStats[round.level].successes += 1;
    levelStats[round.level].totalViewingTime += round.viewingTime;
    levelStats[round.level].totalRecallTime += round.recallTime;
  });
  
  // Calculate averages for each level
  Object.keys(levelStats).forEach(level => {
    const stats = levelStats[level];
    stats.avgViewingTime = stats.totalViewingTime / stats.attempts;
    stats.avgRecallTime = stats.totalRecallTime / stats.attempts;
    stats.successRate = (stats.successes / stats.attempts) * 100;
  });
  // components/results/vm.js (continued)
  
  // Calculate overall stats
  const totalRounds = roundData.length;
  const successfulRounds = roundData.filter(round => round.success).length;
  const successRate = totalRounds > 0 ? (successfulRounds / totalRounds) * 100 : 0;
  
  const averageViewingTime = totalRounds > 0 
    ? roundData.reduce((sum, round) => sum + round.viewingTime, 0) / totalRounds 
    : 0;
    
  const averageRecallTime = totalRounds > 0 
    ? roundData.reduce((sum, round) => sum + round.recallTime, 0) / totalRounds 
    : 0;
  
  // Format milliseconds to seconds with 2 decimal places
  const formatTime = (ms) => (ms / 1000).toFixed(2) + 's';
  
  // Handle round selection for detailed view
  const viewRoundDetails = (index) => {
    setSelectedRound(index);
  };
  
  // Generate and download CSV of results
  const exportResultsToCSV = () => {
    // Create headers for the CSV
    const headers = [
      'Round',
      'Level',
      'Trial',
      'Success',
      'Viewing Time (ms)',
      'Recall Time (ms)',
      'Correct Selections',
      'Incorrect Selections',
      'Missed Images',
      'Timestamp'
    ];
    
    // Create row data
    const rows = roundData.map((round, index) => [
      index + 1,
      round.level,
      round.trial,
      round.success ? 'Success' : 'Failure',
      Math.round(round.viewingTime),
      Math.round(round.recallTime),
      round.correctSelections,
      round.incorrectSelections,
      round.missedImages,
      round.timestamp
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and trigger download
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
      <h2>{translate('vm:results_title')}{isStandalone ? translate('vm:results_title_standalone_suffix', ' (Standalone)') : ''}</h2>
      {!isStandalone && <p className={styles.submissionInfo}>{translate('common:results_submitted')}</p>}
      {isStandalone && <p className={styles.submissionInfo}>{translate('common:results_not_saved_standalone')}</p>}

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <h3>{translate('vm:vm_span')}</h3>
          <div className={styles.metricValue}>{vmSpan}</div>
          <div className={styles.metricSubtext}>{translate('vm:images')}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('vm:success_rate')}</h3>
          <div className={styles.metricValue}>{successRate.toFixed(1)}%</div>
          <div className={styles.metricSubtext}>{translate('vm:success_rate_desc')}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('vm:avg_viewing_time')}</h3>
          <div className={styles.metricValue}>{formatTime(averageViewingTime)}</div>
          <div className={styles.metricSubtext}>{translate('vm:per_round')}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>{translate('vm:avg_recall_time')}</h3>
          <div className={styles.metricValue}>{formatTime(averageRecallTime)}</div>
          <div className={styles.metricSubtext}>{translate('vm:per_round')}</div>
        </div>
      </div>
      
      <div className={styles.exportContainer}>
        <button 
          className={styles.exportButton} 
          onClick={exportResultsToCSV}
          disabled={roundData.length === 0}
        >
          {translate('vm:export_results')}
        </button>
        
        {isStandalone && (
          <button 
            className={styles.resetButton} 
            onClick={onReset}
          >
            {translate('vm:try_again')}
          </button>
        )}
      </div>
      
      <div className={styles.resultsTabs}>
        <h3>{translate('vm:round_analysis_title')}</h3>
        
        <div className={styles.roundsList}>
          {roundData.map((round, index) => (
            <div 
              key={index}
              className={`${styles.roundItem} ${selectedRound === index ? styles.selected : ''} ${round.success ? styles.success : styles.failure}`}
              onClick={() => viewRoundDetails(index)}
            >
              <div>Level {round.level}</div>
              <div>Trial {round.trial}</div>
              <div>{round.success ? 'Success' : 'Failed'}</div>
              <div>{formatTime(round.recallTime)}</div>
            </div>
          ))}
        </div>
        
        {selectedRound !== null && roundData[selectedRound] && (
          <div className={styles.roundDetails}>
            <h4>Level {roundData[selectedRound].level}, Trial {roundData[selectedRound].trial} Details</h4>
            
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Status:</div>
                <div className={`${styles.detailValue} ${roundData[selectedRound].success ? styles.successText : styles.failureText}`}>
                  {roundData[selectedRound].success ? 'Success' : 'Failed'}
                </div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Viewing Time:</div>
                <div className={styles.detailValue}>
                  {formatTime(roundData[selectedRound].viewingTime)}
                </div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Recall Time:</div>
                <div className={styles.detailValue}>
                  {formatTime(roundData[selectedRound].recallTime)}
                </div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Target Images:</div>
                <div className={styles.detailValue}>
                  {roundData[selectedRound].targetImages.length} images
                </div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Correct Selections:</div>
                <div className={styles.detailValue}>
                  {roundData[selectedRound].correctSelections} of {roundData[selectedRound].targetImages.length}
                </div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Incorrect Selections:</div>
                <div className={styles.detailValue}>
                  {roundData[selectedRound].incorrectSelections}
                </div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Missed Images:</div>
                <div className={styles.detailValue}>
                  {roundData[selectedRound].missedImages}
                </div>
              </div>
            </div>
            
            <h5>Image Comparison:</h5>
            <div className={styles.imageComparison}>
              <div className={styles.imageSection}>
                <h6>Target Images:</h6>
                <div className={styles.imageContainer}>
                  {roundData[selectedRound].targetImages.map((image, i) => (
                    <div key={`target-${i}`} className={styles.imageItem}>
                      {image.src ? (
                        <Image 
                          src={image.src} 
                          alt={image.name || `Image ${i+1}`}
                          width={60} 
                          height={60} 
                        />
                      ) : (
                        <div className={styles.placeholderImage}>Image {i+1}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.imageSection}>
                <h6>Selected Images:</h6>
                <div className={styles.imageContainer}>
                  {roundData[selectedRound].selectedImages.map((image, i) => {
                    const isCorrect = roundData[selectedRound].targetImages.some(
                      target => target.id === image.id
                    );
                    
                    return (
                      <div 
                        key={`selected-${i}`} 
                        className={`${styles.imageItem} ${isCorrect ? styles.correctSelection : styles.incorrectSelection}`}
                      >
                        {image.src ? (
                          <Image 
                            src={image.src} 
                            alt={image.name || `Image ${i+1}`}
                            width={60} 
                            height={60} 
                          />
                        ) : (
                          <div className={styles.placeholderImage}>Image {i+1}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {roundData[selectedRound].missedImages > 0 && (
              <div className={styles.imageSection}>
                <h6>Missed Images:</h6>
                <div className={styles.imageContainer}>
                  {roundData[selectedRound].targetImages
                    .filter(target => !roundData[selectedRound].selectedImages
                      .some(selected => selected.id === target.id))
                    .map((image, i) => (
                      <div key={`missed-${i}`} className={`${styles.imageItem} ${styles.missedImage}`}>
                        {image.src ? (
                          <Image 
                            src={image.src} 
                            alt={image.name || `Missed Image ${i+1}`}
                            width={60} 
                            height={60} 
                          />
                        ) : (
                          <div className={styles.placeholderImage}>Missed {i+1}</div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedResults;