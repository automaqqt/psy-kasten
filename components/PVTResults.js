// components/PVTResults.js
import React, { useState } from 'react';
import styles from '../styles/Results.module.css';

const PVTResults = ({ trials, falseStarts }) => {
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
  
  // Filter valid trials (not false starts)
  const validTrials = trials.filter(t => !t.falseStart);
  
  // Function to sort trials
  const sortTrials = (trialsToSort) => {
    return [...trialsToSort].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'time':
          aValue = a.startTime;
          bValue = b.startTime;
          break;
        case 'rt':
          // For trials without RT, put them at the end
          if (!a.reactionTime) return sortDirection === 'asc' ? 1 : -1;
          if (!b.reactionTime) return sortDirection === 'asc' ? -1 : 1;
          aValue = a.reactionTime;
          bValue = b.reactionTime;
          break;
        case 'interval':
          aValue = a.intervalTime || 0;
          bValue = b.intervalTime || 0;
          break;
        default:
          aValue = a.startTime;
          bValue = b.startTime;
      }
      
      // Perform the comparison
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };
  
  // Get sorted and paginated trials
  const sortedTrials = sortTrials(validTrials);
  const paginatedTrials = sortedTrials.slice(
    currentPage * pageSize, 
    (currentPage + 1) * pageSize
  );
  
  // Calculate max pages
  const maxPages = Math.ceil(validTrials.length / pageSize);
  
  // Format time in ms to seconds with 2 decimal places
  const formatTime = (ms) => {
    return (ms / 1000).toFixed(3) + 's';
  };
  
  // Format time since start in ms to mm:ss format
  const formatTimeSinceStart = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Calculate summary statistics
  const calculateStats = () => {
    if (validTrials.length === 0) {
      return {
        meanRT: 0,
        medianRT: 0,
        minRT: 0,
        maxRT: 0,
        stdDevRT: 0,
        totalTrials: 0,
        lapses: 0, // RT > 500ms
        falseStarts: falseStarts
      };
    }
    
    const reactionTimes = validTrials.map(t => t.reactionTime).filter(rt => rt !== null && rt !== undefined);
    
    if (reactionTimes.length === 0) {
      return {
        meanRT: 0,
        medianRT: 0,
        minRT: 0,
        maxRT: 0,
        stdDevRT: 0,
        totalTrials: validTrials.length,
        lapses: 0,
        falseStarts: falseStarts
      };
    }
    
    // Calculate basic statistics
    const meanRT = reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length;
    const sortedRTs = [...reactionTimes].sort((a, b) => a - b);
    const medianRT = sortedRTs[Math.floor(sortedRTs.length / 2)];
    const minRT = sortedRTs[0];
    const maxRT = sortedRTs[sortedRTs.length - 1];
    
    // Calculate standard deviation
    const variance = reactionTimes.reduce((sum, rt) => sum + Math.pow(rt - meanRT, 2), 0) / reactionTimes.length;
    const stdDevRT = Math.sqrt(variance);
    
    // Count lapses (RT > 500ms)
    const lapses = reactionTimes.filter(rt => rt > 500).length;
    
    return {
      meanRT,
      medianRT,
      minRT,
      maxRT,
      stdDevRT,
      totalTrials: validTrials.length,
      lapses,
      falseStarts
    };
  };
  
  const stats = calculateStats();
  
  // Calculate performance over time
  const calculatePerformanceData = () => {
    // Skip if not enough trials
    if (validTrials.length < 5) return [];
    
    // Group trials into blocks of appropriate size
    const blockSize = Math.max(5, Math.floor(validTrials.length / 10));
    const blocks = [];
    
    for (let i = 0; i < validTrials.length; i += blockSize) {
      const blockTrials = validTrials.slice(i, i + blockSize);
      if (blockTrials.length < 3) continue; // Skip blocks that are too small
      
      const blockRTs = blockTrials.map(t => t.reactionTime).filter(rt => rt !== null && rt !== undefined);
      if (blockRTs.length === 0) continue;
      
      const blockMeanRT = blockRTs.reduce((sum, rt) => sum + rt, 0) / blockRTs.length;
      const blockLapses = blockRTs.filter(rt => rt > 500).length;
      
      blocks.push({
        blockNumber: blocks.length + 1,
        startTime: blockTrials[0]?.startTime || 0,
        endTime: blockTrials[blockTrials.length - 1]?.startTime || 0,
        meanRT: blockMeanRT,
        lapses: blockLapses,
        trialCount: blockTrials.length
      });
    }
    
    return blocks;
  };
  
  const performanceData = calculatePerformanceData();
  
  // Calculate percentiles for response time distribution
  const calculatePercentiles = () => {
    const reactionTimes = validTrials.map(t => t.reactionTime).filter(rt => rt !== null && rt !== undefined);
    if (reactionTimes.length === 0) return [];
    
    const sortedRTs = [...reactionTimes].sort((a, b) => a - b);
    
    return [
      { label: '10th', value: sortedRTs[Math.floor(sortedRTs.length * 0.1)] },
      { label: '25th', value: sortedRTs[Math.floor(sortedRTs.length * 0.25)] },
      { label: '50th', value: sortedRTs[Math.floor(sortedRTs.length * 0.5)] },
      { label: '75th', value: sortedRTs[Math.floor(sortedRTs.length * 0.75)] },
      { label: '90th', value: sortedRTs[Math.floor(sortedRTs.length * 0.9)] }
    ];
  };
  
  const percentiles = calculatePercentiles();
  
  // Create buckets for RT histogram
  const createRTHistogram = () => {
    const reactionTimes = validTrials.map(t => t.reactionTime).filter(rt => rt !== null && rt !== undefined);
    if (reactionTimes.length === 0) return [];
    
    // Create bins from 100-1000ms in steps of 50ms
    const bins = Array(18).fill().map((_, i) => ({ 
      min: i * 50 + 100, 
      max: (i + 1) * 50 + 100, 
      count: 0 
    }));
    
    // Count RTs in each bin
    reactionTimes.forEach(rt => {
      const binIndex = Math.min(17, Math.max(0, Math.floor((rt - 100) / 50)));
      bins[binIndex].count++;
    });
    
    return bins;
  };
  
  const histogramData = createRTHistogram();
  
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
            className={`${styles.tabButton} ${currentTab === 'distribution' ? styles.activeTab : ''}`}
            onClick={() => setCurrentTab('distribution')}
          >
            RT Distribution
          </button>
          <button 
            className={`${styles.tabButton} ${currentTab === 'trials' ? styles.activeTab : ''}`}
            onClick={() => setCurrentTab('trials')}
          >
            Trial Data
          </button>
        </div>
        
        {currentTab === 'performance' && (
          <div className={styles.tabContent}>
            <h3>Vigilance Over Time</h3>
            
            {performanceData.length > 0 ? (
              <div className={styles.performanceChart}>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: '#0070f3' }}></span>
                    <span>Mean Reaction Time (ms)</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: '#ff6b6b' }}></span>
                    <span>Lapses (RT 500ms)</span>
                  </div>
                </div>
                
                <div className={styles.chartContainer}>
                  {/* RT Bars */}
                  <div className={styles.chartBars}>
                    {performanceData.map((block, index) => {
                      // Scale RT to fit in the chart (150-500ms)
                      const rtHeight = Math.min(100, Math.max(0, (block.meanRT - 150) / 3.5));
                      
                      return (
                        <div key={`rt-${index}`} className={styles.chartBarGroup}>
                          <div 
                            className={styles.chartBar} 
                            style={{ 
                              height: `${rtHeight}%`,
                              backgroundColor: '#0070f3'
                            }}
                            title={`Block ${block.blockNumber}: ${Math.round(block.meanRT)}ms mean RT`}
                          ></div>
                          <div className={styles.chartBarLabel}>{block.blockNumber}</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Lapses Line */}
                  <div className={styles.chartLines}>
                    {performanceData.map((block, index) => {
                      // Scale lapses to fit in chart (0-5 lapses)
                      const lapseHeight = Math.min(100, Math.max(0, (block.lapses / block.trialCount) * 100));
                      
                      return (
                        <div key={`lapse-${index}`} className={styles.chartPoint} style={{ 
                          left: `${(index / (performanceData.length - 1)) * 100}%`,
                          bottom: `${lapseHeight}%`
                        }}>
                          <div 
                            className={styles.dataPoint}
                            style={{ backgroundColor: '#ff6b6b' }}
                            title={`Block ${block.blockNumber}: ${block.lapses} lapses`}
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
                      <div>Mean RT</div>
                      <div>Lapses</div>
                      <div>Trials</div>
                    </div>
                    {performanceData.map((block, index) => (
                      <div key={index} className={styles.blockTableRow}>
                        <div>#{block.blockNumber}</div>
                        <div>{formatTimeSinceStart(block.startTime)}</div>
                        <div>{Math.round(block.meanRT)}ms</div>
                        <div>{block.lapses}</div>
                        <div>{block.trialCount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className={styles.noDataMessage}>Not enough trials to show performance data</p>
            )}
            
            <div className={styles.interpretationCard}>
              <h4>Performance Interpretation</h4>
              <div className={styles.interpretationGrid}>
                <div className={styles.interpretationItem}>
                  <h4>Mean Reaction Time: {Math.round(stats.meanRT)}ms</h4>
                  <p>
                    {stats.meanRT < 200
                      ? 'Very fast responses, indicating excellent alertness.'
                      : stats.meanRT < 300
                        ? 'Good reaction time, indicating normal alertness.'
                        : stats.meanRT < 400
                          ? 'Moderate reaction time, indicating some fatigue or decreased vigilance.'
                          : 'Slow reaction time, indicating significant fatigue or low vigilance.'}
                  </p>
                </div>
                
                <div className={styles.interpretationItem}>
                  <h4>Lapses: {stats.lapses} ({stats.totalTrials > 0 ? Math.round((stats.lapses / stats.totalTrials) * 100) : 0}%)</h4>
                  <p>
                    {stats.lapses === 0
                      ? 'No lapses in attention detected.'
                      : stats.lapses < 3
                        ? 'Minimal lapses in attention, indicating good sustained vigilance.'
                        : stats.lapses < 10
                          ? 'Moderate number of lapses, indicating some difficulty maintaining vigilance.'
                          : 'High number of lapses, indicating significant difficulty maintaining vigilance.'}
                  </p>
                </div>
                
                <div className={styles.interpretationItem}>
                  <h4>False Starts: {stats.falseStarts}</h4>
                  <p>
                    {stats.falseStarts === 0
                      ? 'No false starts, indicating good inhibitory control.'
                      : stats.falseStarts < 3
                        ? 'Few false starts, indicating normal inhibitory control.'
                        : 'Multiple false starts, indicating possible impulsivity or decreased inhibitory control.'}
                  </p>
                </div>
                
                <div className={styles.interpretationItem}>
                  <h4>Variability: {Math.round(stats.stdDevRT)}ms</h4>
                  <p>
                    {stats.stdDevRT < 50
                      ? 'Very consistent reaction times, indicating stable attention.'
                      : stats.stdDevRT < 100
                        ? 'Normal variability in reaction times.'
                        : 'High variability in reaction times, indicating fluctuating attention levels.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {currentTab === 'distribution' && (
          <div className={styles.tabContent}>
            <div className={styles.distributionGrid}>
              <div className={styles.histogramCard}>
                <h3>Reaction Time Distribution</h3>
                
                {histogramData.length > 0 ? (
                  <div className={styles.rtHistogram}>
                    {histogramData.map((bin, index) => {
                      const maxCount = Math.max(...histogramData.map(b => b.count));
                      const height = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={index} className={styles.histogramBar}>
                          <div 
                            className={styles.bar}
                            style={{ height: `${height}%` }}
                          >
                            <span className={styles.barCount}>{bin.count}</span>
                          </div>
                          <div className={styles.barLabel}>
                            {bin.min}-{bin.max}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.noDataMessage}>Not enough data to display histogram</p>
                )}
              </div>
              
              <div className={styles.percentileCard}>
                <h3>Reaction Time Percentiles</h3>
                
                {percentiles.length > 0 ? (
                  <div className={styles.percentilesChart}>
                    <div className={styles.percentileLine}>
                      <div className={styles.percentileStart}>{Math.round(stats.minRT)}ms</div>
                      <div className={styles.percentileEnd}>{Math.round(stats.maxRT)}ms</div>
                    </div>
                    
                    <div className={styles.percentileMarkers}>
                      {percentiles.map((percentile, index) => {
                        // Calculate position along the line
                        const position = (percentile.value - stats.minRT) / (stats.maxRT - stats.minRT) * 100;
                        
                        return (
                          <div 
                            key={index} 
                            className={styles.percentileMarker}
                            style={{ left: `${position}%` }}
                          >
                            <div className={styles.markerLine}></div>
                            <div className={styles.markerLabel}>
                              <div className={styles.markerValue}>{Math.round(percentile.value)}ms</div>
                              <div className={styles.markerPercentile}>{percentile.label}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className={styles.noDataMessage}>Not enough data to calculate percentiles</p>
                )}
                
                <div className={styles.keyMetrics}>
                  <div className={styles.keyMetric}>
                    <div className={styles.metricLabel}>Fastest 10%</div>
                    <div className={styles.metricValue}>{percentiles[0] ? Math.round(percentiles[0].value) : 0}ms</div>
                  </div>
                  <div className={styles.keyMetric}>
                    <div className={styles.metricLabel}>Median</div>
                    <div className={styles.metricValue}>{percentiles[2] ? Math.round(percentiles[2].value) : 0}ms</div>
                  </div>
                  <div className={styles.keyMetric}>
                    <div className={styles.metricLabel}>Slowest 10%</div>
                    <div className={styles.metricValue}>{percentiles[4] ? Math.round(percentiles[4].value) : 0}ms</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.summaryStats}>
              <h3>Summary Statistics</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Mean RT</div>
                  <div className={styles.statValue}>{Math.round(stats.meanRT)}ms</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Median RT</div>
                  <div className={styles.statValue}>{Math.round(stats.medianRT)}ms</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Minimum RT</div>
                  <div className={styles.statValue}>{Math.round(stats.minRT)}ms</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Maximum RT</div>
                  <div className={styles.statValue}>{Math.round(stats.maxRT)}ms</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Standard Deviation</div>
                  <div className={styles.statValue}>{Math.round(stats.stdDevRT)}ms</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Lapses (500ms)</div>
                  <div className={styles.statValue}>{stats.lapses}</div>
                </div>
              </div>
            </div>
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
                  className={`${styles.sortButton} ${sortBy === 'rt' ? styles.activeSort : ''}`}
                  onClick={() => handleSort('rt')}
                >
                  RT {sortBy === 'rt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  className={`${styles.sortButton} ${sortBy === 'interval' ? styles.activeSort : ''}`}
                  onClick={() => handleSort('interval')}
                >
                  Interval {sortBy === 'interval' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className={styles.pageButton}
                  >
                    &lt;
                  </button>
                  <span className={styles.pageInfo}>
                    Page {currentPage + 1} of {Math.max(1, maxPages)}
                  </span>
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
                <div>Wait Interval</div>
                <div>Reaction Time</div>
                <div>Status</div>
              </div>
              
              {paginatedTrials.map((trial, index) => {
                const trialNumber = currentPage * pageSize + index + 1;
                let statusClass = '';
                let statusText = 'Normal';
                
                if (trial.reactionTime > 500) {
                  statusClass = styles.failureText;
                  statusText = 'Lapse';
                } else if (trial.reactionTime < 150) {
                  statusClass = styles.warningText;
                  statusText = 'Anticipatory';
                }
                
                return (
                  <div key={index} className={styles.trialTableRow}>
                    <div>{trialNumber}</div>
                    <div>{formatTimeSinceStart(trial.startTime)}</div>
                    <div>{trial.intervalTime ? `${(trial.intervalTime / 1000).toFixed(1)}s` : '-'}</div>
                    <div>{trial.reactionTime ? `${Math.round(trial.reactionTime)}ms` : '-'}</div>
                    <div className={statusClass}>{statusText}</div>
                  </div>
                );
              })}
              
              {paginatedTrials.length === 0 && (
                <div className={styles.noDataRow}>No trial data available</div>
              )}
            </div>
            
            {falseStarts > 0 && (
              <div className={styles.falseStartsInfo}>
                <h4>False Starts: {falseStarts}</h4>
                <p>There were {falseStarts} occasions when you responded before the stimulus appeared.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PVTResults;