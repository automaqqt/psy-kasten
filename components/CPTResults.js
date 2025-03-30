// components/CPTResults.js
import React, { useState } from 'react';
import styles from '../styles/Results.module.css';

const CPTResults = ({ trials, stats, targetLetter }) => {
  const [currentTab, setCurrentTab] = useState('performance');
  const [sortBy, setSortBy] = useState('time');
  const [sortDirection, setSortDirection] = useState('asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Function to handle sort changes
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  // Function to sort trials
  const sortTrials = (trialsToSort) => {
    return [...trialsToSort].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'time':
          aValue = a.trialStartTime;
          bValue = b.trialStartTime;
          break;
        case 'stimulus':
          aValue = a.stimulus;
          bValue = b.stimulus;
          break;
        case 'response':
          aValue = a.responseType;
          bValue = b.responseType;
          break;
        case 'rt':
          // For trials without RT, put them at the end
          if (!a.responseTime) return sortDirection === 'asc' ? 1 : -1;
          if (!b.responseTime) return sortDirection === 'asc' ? -1 : 1;
          aValue = a.responseTime;
          bValue = b.responseTime;
          break;
        default:
          aValue = a.trialStartTime;
          bValue = b.trialStartTime;
      }
      
      // Perform the comparison
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };
  
  // Get sorted and paginated trials
  const sortedTrials = sortTrials(trials);
  const paginatedTrials = sortedTrials.slice(
    currentPage * pageSize, 
    (currentPage + 1) * pageSize
  );
  
  // Calculate max pages
  const maxPages = Math.ceil(trials.length / pageSize);
  
  // Format time in ms to seconds with 2 decimal places
  const formatTime = (ms) => {
    return (ms / 1000).toFixed(2) + 's';
  };
  
  // Format time since start in ms to mm:ss format
  const formatTimeSinceStart = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Get response type display text
  const getResponseTypeText = (responseType) => {
    switch (responseType) {
      case 'hit': return 'Correct Response';
      case 'miss': return 'Missed Response';
      case 'correctRejection': return 'Correct Inhibition';
      case 'falseAlarm': return 'False Alarm';
      default: return responseType;
    }
  };
  
  // Get response type class
  const getResponseTypeClass = (responseType) => {
    switch (responseType) {
      case 'hit': return styles.successText;
      case 'correctRejection': return styles.successText;
      case 'miss': return styles.failureText;
      case 'falseAlarm': return styles.failureText;
      default: return '';
    }
  };

  // Calculate data for performance over time chart
  const calculatePerformanceData = () => {
    // Skip if not enough trials
    if (trials.length < 5) return [];
    
    // Group trials into blocks of 20 or appropriate number
    const blockSize = Math.max(5, Math.floor(trials.length / 10));
    const blocks = [];
    
    for (let i = 0; i < trials.length; i += blockSize) {
      const blockTrials = trials.slice(i, i + blockSize);
      
      // Calculate metrics for this block
      const blockHits = blockTrials.filter(t => t.responseType === 'hit').length;
      const blockMisses = blockTrials.filter(t => t.responseType === 'miss').length;
      const blockCorrectRejections = blockTrials.filter(t => t.responseType === 'correctRejection').length;
      const blockFalseAlarms = blockTrials.filter(t => t.responseType === 'falseAlarm').length;
      
      // Calculate accuracy
      const blockAccuracy = blockTrials.length > 0 
        ? (blockHits + blockCorrectRejections) / blockTrials.length * 100 
        : 0;
      
      // Calculate mean RT for hits
      const hitTrials = blockTrials.filter(t => t.responseType === 'hit');
      const blockMeanRT = hitTrials.length > 0 
        ? hitTrials.reduce((sum, t) => sum + t.responseTime, 0) / hitTrials.length 
        : 0;
      
      blocks.push({
        blockNumber: blocks.length + 1,
        startTime: blockTrials[0]?.trialStartTime || 0,
        endTime: blockTrials[blockTrials.length - 1]?.trialStartTime || 0,
        accuracy: blockAccuracy,
        meanRT: blockMeanRT,
        hits: blockHits,
        misses: blockMisses,
        correctRejections: blockCorrectRejections,
        falseAlarms: blockFalseAlarms
      });
    }
    
    return blocks;
  };
  
  const performanceData = calculatePerformanceData();
  
  return (
    <div className={styles.detailedResults}>
      <div className={styles.resultsTabs}>
        <div className={styles.tabsHeader}>
          <button 
            className={`${styles.tabButton} ${currentTab === 'performance' ? styles.activeTab : ''}`}
            onClick={() => setCurrentTab('performance')}
          >
            Performance
          </button>
          <button 
            className={`${styles.tabButton} ${currentTab === 'trials' ? styles.activeTab : ''}`}
            onClick={() => setCurrentTab('trials')}
          >
            Trial Data
          </button>
          <button 
            className={`${styles.tabButton} ${currentTab === 'analysis' ? styles.activeTab : ''}`}
            onClick={() => setCurrentTab('analysis')}
          >
            Analysis
          </button>
        </div>
        
        {currentTab === 'performance' && (
          <div className={styles.tabContent}>
            <h3>Performance Over Time</h3>
            
            {performanceData.length > 0 ? (
              <div className={styles.performanceChart}>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: '#0070f3' }}></span>
                    <span>Accuracy (%)</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: '#ff6b6b' }}></span>
                    <span>Response Time (ms)</span>
                  </div>
                </div>
                
                <div className={styles.chartContainer}>
                  {/* Accuracy Bars */}
                  <div className={styles.chartBars}>
                    {performanceData.map((block, index) => (
                      <div key={`acc-${index}`} className={styles.chartBarGroup}>
                        <div 
                          className={styles.chartBar} 
                          style={{ 
                            height: `${block.accuracy}%`,
                            backgroundColor: '#0070f3'
                          }}
                          title={`Block ${block.blockNumber}: ${Math.round(block.accuracy)}% accuracy`}
                        ></div>
                        <div className={styles.chartBarLabel}>{block.blockNumber}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Response Time Line */}
                  <div className={styles.chartLines}>
                    {performanceData.map((block, index) => {
                      // Scale RT to fit in the chart (0-500ms at bottom, 1000ms+ at top)
                      const rtHeight = Math.min(100, Math.max(0, (block.meanRT / 10)));
                      
                      return (
                        <div key={`rt-${index}`} className={styles.chartPoint} style={{ 
                          left: `${(index / (performanceData.length - 1)) * 100}%`,
                          bottom: `${rtHeight}%`
                        }}>
                          <div 
                            className={styles.dataPoint}
                            style={{ backgroundColor: '#ff6b6b' }}
                            title={`Block ${block.blockNumber}: ${Math.round(block.meanRT)}ms mean RT`}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className={styles.blockDetails}>
                  <h4>Block Details</h4>
                  <div className={styles.blockTable}>
                    <div className={styles.blockTableHeader}>
                      <div>Block</div>
                      <div>Time</div>
                      <div>Accuracy</div>
                      <div>Mean RT</div>
                      <div>Errors</div>
                    </div>
                    {performanceData.map((block, index) => (
                      <div key={index} className={styles.blockTableRow}>
                        <div>#{block.blockNumber}</div>
                        <div>{formatTimeSinceStart(block.startTime)}</div>
                        <div>{Math.round(block.accuracy)}%</div>
                        <div>{Math.round(block.meanRT)}ms</div>
                        <div>{block.misses + block.falseAlarms}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className={styles.noDataMessage}>Not enough trials to show performance data</p>
            )}
          </div>
        )}
        
        {currentTab === 'trials' && (
          <div className={styles.tabContent}>
            <div className={styles.tableControls}>
              <div className={styles.sortControls}>
                <span>Sort by:</span>
                <button 
                  className={`${styles.sortButton} ${sortBy === 'time' ? styles.activeSort : ''}`}
                  onClick={() => handleSort('time')}
                >
                  Time {sortBy === 'time' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  className={`${styles.sortButton} ${sortBy === 'stimulus' ? styles.activeSort : ''}`}
                  onClick={() => handleSort('stimulus')}
                >
                  Stimulus {sortBy === 'stimulus' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  className={`${styles.sortButton} ${sortBy === 'response' ? styles.activeSort : ''}`}
                  onClick={() => handleSort('response')}
                >
                  Response {sortBy === 'response' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  className={`${styles.sortButton} ${sortBy === 'rt' ? styles.activeSort : ''}`}
                  onClick={() => handleSort('rt')}
                >
                  RT {sortBy === 'rt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </div>
              
              <div className={styles.paginationControls}>
                <select 
                  value={pageSize} 
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  className={styles.pageSizeSelect}
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
                
                <div className={styles.pagination}>
                  <button 
                    onClick={() => setCurrentPage(Math.min(maxPages - 1, currentPage + 1))}
                    disabled={currentPage >= maxPages - 1}
                    className={styles.pageButton}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
            
            <div className={styles.trialsTable}>
              <div className={styles.trialTableHeader}>
                <div>#</div>
                <div>Time</div>
                <div>Stimulus</div>
                <div>Expected</div>
                <div>Response</div>
                <div>RT</div>
              </div>
              
              {paginatedTrials.map((trial, index) => {
                const trialNumber = currentPage * pageSize + index + 1;
                
                return (
                  <div key={index} className={styles.trialTableRow}>
                    <div>{trialNumber}</div>
                    <div>{formatTimeSinceStart(trial.trialStartTime)}</div>
                    <div className={styles.stimulusCell}>
                      <span 
                        className={trial.isTarget ? styles.targetStimulus : styles.nonTargetStimulus}
                      >
                        {trial.stimulus}
                      </span>
                    </div>
                    <div>
                      {trial.isTarget ? "Don't respond" : "Respond"}
                    </div>
                    <div className={getResponseTypeClass(trial.responseType)}>
                      {getResponseTypeText(trial.responseType)}
                    </div>
                    <div>
                      {trial.responseTime ? `${Math.round(trial.responseTime)} ms` : '-'}
                    </div>
                  </div>
                );
              })}
              
              {paginatedTrials.length === 0 && (
                <div className={styles.noDataRow}>No trial data available</div>
              )}
            </div>
          </div>
        )}
        
        {currentTab === 'analysis' && (
          <div className={styles.tabContent}>
            <div className={styles.analysisGrid}>
              <div className={styles.analysisCard}>
                <h3>Accuracy Analysis</h3>
                <div className={styles.metricsGrid}>
                  <div className={styles.metricItem}>
                    <div className={styles.metricLabel}>Hits:</div>
                    <div className={styles.metricValue}>{stats.hits}</div>
                    <div className={styles.metricDescription}>
                      Correct responses to non-{targetLetter} letters
                    </div>
                  </div>
                  <div className={styles.metricItem}>
                    <div className={styles.metricLabel}>Correct Rejections:</div>
                    <div className={styles.metricValue}>{stats.correctRejections}</div>
                    <div className={styles.metricDescription}>
                      Correctly withheld response to {targetLetter}
                    </div>
                  </div>
                  <div className={styles.metricItem}>
                    <div className={styles.metricLabel}>Misses:</div>
                    <div className={styles.metricValue}>{stats.misses}</div>
                    <div className={styles.metricDescription}>
                      Failed to respond to non-{targetLetter} letters
                    </div>
                  </div>
                  <div className={styles.metricItem}>
                    <div className={styles.metricLabel}>False Alarms:</div>
                    <div className={styles.metricValue}>{stats.falseAlarms}</div>
                    <div className={styles.metricDescription}>
                      Incorrectly responded to {targetLetter}
                    </div>
                  </div>
                </div>
                
                <div className={styles.pieChartContainer}>
                  <div className={styles.pieChart}>
                    <div 
                      className={styles.pieSlice} 
                      style={{ 
                        backgroundColor: '#28a745',
                        transform: `rotate(0deg)`,
                        clipPath: `polygon(50% 50%, 50% 0%, ${stats.hits / stats.totalTrials * 360 + 50}% 0%)`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className={styles.analysisCard}>
                <h3>Response Time Distribution</h3>
                <p className={styles.analysisText}>
                  Mean response time: <strong>{Math.round(stats.meanRT)} ms</strong>
                </p>
                
                {trials.filter(t => t.responseTime).length > 0 ? (
                  <div className={styles.rtHistogram}>
                    {/* Create histogram bins for RTs */}
                    {(() => {
                      // Create bins from 100-1000ms in steps of 100ms
                      const bins = Array(10).fill().map((_, i) => ({ 
                        min: i * 100, 
                        max: (i + 1) * 100, 
                        count: 0 
                      }));
                      
                      // Count trials in each bin
                      trials.forEach(trial => {
                        if (trial.responseTime) {
                          const binIndex = Math.min(9, Math.floor(trial.responseTime / 100));
                          bins[binIndex].count++;
                        }
                      });
                      
                      // Find max count for scaling
                      const maxCount = Math.max(...bins.map(bin => bin.count));
                      
                      return bins.map((bin, index) => (
                        <div key={index} className={styles.histogramBar}>
                          <div 
                            className={styles.bar}
                            style={{ height: `${maxCount > 0 ? (bin.count / maxCount) * 100 : 0}%` }}
                          >
                            <span className={styles.barCount}>{bin.count}</span>
                          </div>
                          <div className={styles.barLabel}>
                            {bin.min}-{bin.max}ms
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p className={styles.noDataMessage}>No response time data available</p>
                )}
              </div>
            </div>
            
            <div className={styles.analysisCard}>
              <h3>Interpretation</h3>
              <div className={styles.interpretationGrid}>
                <div className={styles.interpretationItem}>
                  <h4>Sensitivity (d'): {stats.d_prime.toFixed(2)}</h4>
                  <p>
                    {stats.d_prime < 1 ? 'Low ability' : stats.d_prime < 2.5 ? 'Average ability' : 'High ability'} to 
                    distinguish between target and non-target stimuli. 
                    {stats.d_prime < 1 
                      ? ' This may indicate attention difficulties.' 
                      : stats.d_prime > 3 
                        ? ' This indicates excellent sustained attention.' 
                        : ''}
                  </p>
                </div>
                
                <div className={styles.interpretationItem}>
                  <h4>Accuracy: {Math.round(stats.accuracy)}%</h4>
                  <p>
                    {stats.accuracy < 70 
                      ? 'Below average accuracy. This may indicate attention or impulse control issues.' 
                      : stats.accuracy < 85 
                        ? 'Average accuracy. Some room for improvement in sustained attention or response control.' 
                        : 'Good to excellent accuracy, indicating strong sustained attention and response control.'}
                  </p>
                </div>
                
                <div className={styles.interpretationItem}>
                  <h4>Response Pattern</h4>
                  <p>
                    {stats.omissionErrors > stats.commissionErrors + 5
                      ? 'Higher omission errors suggest inattention or slow processing.'
                      : stats.commissionErrors > stats.omissionErrors + 5
                        ? 'Higher commission errors suggest impulsivity or poor inhibitory control.'
                        : 'Balanced error pattern suggests neither strong impulsivity nor inattention.'}
                  </p>
                </div>
                
                <div className={styles.interpretationItem}>
                  <h4>Response Time: {Math.round(stats.meanRT)} ms</h4>
                  <p>
                    {stats.meanRT < 300
                      ? 'Very fast responses may indicate impulsivity.'
                      : stats.meanRT > 600
                        ? 'Slower responses may indicate processing speed issues or cautious approach.'
                        : 'Response time within typical range.'}
                  </p>
                </div>
              </div>
              
              <div className={styles.disclaimer}>
                Note: This interpretation is for informational purposes only and should not be used for clinical diagnosis.
                Performance can be affected by many factors including fatigue, motivation, and distractions.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CPTResults