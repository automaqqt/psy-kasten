// components/DetailedResults.js
import React, { useState } from 'react';
import styles from '../styles/Results.module.css';

const DetailedResults = ({ roundData, calculateCorsiSpan }) => {
  const [selectedRound, setSelectedRound] = useState(null);
  
  // Calculate average response times per level
  const averageResponseTimesByLevel = {};
  roundData.forEach(round => {
    if (!averageResponseTimesByLevel[round.level]) {
      averageResponseTimesByLevel[round.level] = {
        totalTime: 0,
        count: 0
      };
    }
    averageResponseTimesByLevel[round.level].totalTime += round.totalResponseTime;
    averageResponseTimesByLevel[round.level].count += 1;
  });
  
  Object.keys(averageResponseTimesByLevel).forEach(level => {
    const data = averageResponseTimesByLevel[level];
    data.average = data.totalTime / data.count;
  });
  
  // Get the last attempted level
  const lastLevel = roundData.length > 0 ? roundData[roundData.length - 1].level : 0;
  
  // Format milliseconds to seconds with 2 decimal places
  const formatTime = (ms) => (ms / 1000).toFixed(2) + 's';
  
  // Handle round selection for detailed view
  const viewRoundDetails = (index) => {
    setSelectedRound(index);
  };
  
  // Calculate performance metrics
  const successRounds = roundData.filter(round => round.success);
  const failureRounds = roundData.filter(round => !round.success);
  
  const averageResponseTime = roundData.length > 0 
    ? roundData.reduce((sum, round) => sum + round.totalResponseTime, 0) / roundData.length 
    : 0;
    
  const averageClickInterval = roundData.length > 0 
    ? roundData.reduce((sum, round) => sum + round.avgClickInterval, 0) / roundData.length 
    : 0;
  
  return (
    <div className={styles.detailedResults}>
      <h2 className={styles.resultsTitle}>Detailed Performance Analysis</h2>
      
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <h3>Corsi Span</h3>
          <div className={styles.metricValue}>{calculateCorsiSpan()}</div>
          <div className={styles.metricSubtext}>blocks</div>
        </div>
        
        <div className={styles.metricCard}>
          <h3>Highest Level</h3>
          <div className={styles.metricValue}>{lastLevel}</div>
          <div className={styles.metricSubtext}>attempted</div>
        </div>
        
        <div className={styles.metricCard}>
          <h3>Average Response Time</h3>
          <div className={styles.metricValue}>{formatTime(averageResponseTime)}</div>
          <div className={styles.metricSubtext}>per sequence</div>
        </div>
        
        <div className={styles.metricCard}>
          <h3>Average Click Interval</h3>
          <div className={styles.metricValue}>{formatTime(averageClickInterval)}</div>
          <div className={styles.metricSubtext}>between clicks</div>
        </div>
      </div>
      
      <div className={styles.resultsTabs}>
        <h3>Round by Round Analysis</h3>
        
        <div className={styles.roundsList}>
          {roundData.map((round, index) => (
            <div 
              key={index}
              className={`${styles.roundItem} ${selectedRound === index ? styles.selected : ''} ${round.success ? styles.success : styles.failure}`}
              onClick={() => viewRoundDetails(index)}
            >
              <div>Level {round.level}</div>
              <div>{round.success ? 'Success' : 'Failed'}</div>
              <div>{formatTime(round.totalResponseTime)}</div>
            </div>
          ))}
        </div>
        
        {selectedRound !== null && (
          <div className={styles.roundDetails}>
            <h4>Level {roundData[selectedRound].level} Details</h4>
            
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Status:</div>
                <div className={`${styles.detailValue} ${roundData[selectedRound].success ? styles.successText : styles.failureText}`}>
                  {roundData[selectedRound].success ? 'Success' : 'Failed'}
                </div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Total Response Time:</div>
                <div className={styles.detailValue}>
                  {formatTime(roundData[selectedRound].totalResponseTime)}
                </div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Avg. Click Interval:</div>
                <div className={styles.detailValue}>
                  {formatTime(roundData[selectedRound].avgClickInterval)}
                </div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Sequence Length:</div>
                <div className={styles.detailValue}>
                  {roundData[selectedRound].sequence.length} blocks
                </div>
              </div>
            </div>
            
            <h5>Click Timing Analysis:</h5>
            <div className={styles.timingTable}>
              <div className={styles.timingHeader}>
                <div>Position</div>
                <div>Time from Start</div>
                <div>Interval</div>
              </div>
              
              {roundData[selectedRound].clickTimes.map((click, i) => (
                <div key={i} className={styles.timingRow}>
                  <div>Click {i + 1}</div>
                  <div>{formatTime(click.timeFromStart)}</div>
                  <div>
                    {i === 0 ? '-' : formatTime(click.time - roundData[selectedRound].clickTimes[i-1].time)}
                  </div>
                </div>
              ))}
            </div>
            
            <h5>Sequence Comparison:</h5>
            <div className={styles.sequenceComparison}>
              <div>
                <div className={styles.sequenceLabel}>Target:</div>
                <div className={styles.sequenceDots}>
                  {roundData[selectedRound].sequence.map((blockId, i) => (
                    <div key={i} className={styles.sequenceDot}>
                      {blockId + 1}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className={styles.sequenceLabel}>Your input:</div>
                <div className={styles.sequenceDots}>
                  {roundData[selectedRound].userSequence.map((blockId, i) => {
                    const isCorrect = roundData[selectedRound].success ? 
                      true : 
                      blockId === roundData[selectedRound].sequence[i];
                    
                    return (
                      <div 
                        key={i} 
                        className={`${styles.sequenceDot} ${!isCorrect ? styles.wrongDot : ''}`}
                      >
                        {blockId + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedResults;