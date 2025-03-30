// components/PVTResults.js
import { useState, useEffect, useRef } from 'react';
import styles from '../styles/PVTResults.module.css';

export default function PVTResults({ trials, falseStarts }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Prepare data for visualization
  useEffect(() => {
    const validTrials = trials.filter(t => t.reactionTime && !t.falseStart);
    
    if (validTrials.length === 0) return;
    
    // Create chart data
    const labels = validTrials.map(t => t.trialNumber);
    const reactionTimes = validTrials.map(t => t.reactionTime);
    
    setChartData({
      labels,
      datasets: [
        {
          label: 'Reaction Time (ms)',
          data: reactionTimes,
          borderColor: '#4a6fdc',
          backgroundColor: 'rgba(74, 111, 220, 0.2)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#4a6fdc',
          tension: 0.2
        }
      ]
    });
  }, [trials]);
  
  // Draw chart when data or tab changes
  useEffect(() => {
    if (selectedTab !== 'graph' || !chartRef.current || chartData.labels.length === 0) return;
    
    const drawChart = async () => {
      try {
        // Dynamic import for client-side only
        const { Chart, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } = await import('chart.js');
        Chart.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);
        
        // Clear previous chart if it exists
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
        
        // Create new chart
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Reaction Times by Trial',
                font: {
                  size: 16
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `RT: ${context.parsed.y} ms`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: 'Reaction Time (ms)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Trial Number'
                }
              }
            }
          }
        });
      } catch (error) {
        console.error('Error loading Chart.js:', error);
      }
    };
    
    drawChart();
    
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [selectedTab, chartData]);
  
  // Calculate distribution data
  const calculateDistribution = () => {
    const validTrials = trials.filter(t => t.reactionTime && !t.falseStart);
    if (validTrials.length === 0) return [];
    
    // Sort reaction times
    const sortedRTs = validTrials.map(t => t.reactionTime).sort((a, b) => a - b);
    
    // Calculate percentiles
    const getPercentile = (arr, p) => {
      const index = Math.floor(arr.length * (p / 100));
      return arr[index];
    };
    
    // Create bins for histogram (10 bins)
    const min = Math.floor(sortedRTs[0] / 50) * 50; // Round to nearest 50ms below
    const max = Math.ceil(sortedRTs[sortedRTs.length - 1] / 50) * 50; // Round to nearest 50ms above
    const range = max - min;
    const binSize = Math.max(Math.ceil(range / 10), 50); // At least 50ms bins
    
    const bins = [];
    for (let i = min; i < max; i += binSize) {
      bins.push({
        label: `${i}-${i + binSize}ms`,
        count: sortedRTs.filter(rt => rt >= i && rt < i + binSize).length,
        start: i,
        end: i + binSize
      });
    }
    
    return {
      percentiles: {
        min: sortedRTs[0],
        p25: getPercentile(sortedRTs, 25),
        median: getPercentile(sortedRTs, 50),
        p75: getPercentile(sortedRTs, 75),
        max: sortedRTs[sortedRTs.length - 1]
      },
      histogram: bins
    };
  };
  
  // Format milliseconds with appropriate precision
  const formatMs = (ms) => {
    return ms ? Math.round(ms) : 'N/A';
  };
  
  const distribution = calculateDistribution();
  
  return (
    <div className={styles.resultsContainer}>
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${selectedTab === 'graph' ? styles.activeTab : ''}`} 
          onClick={() => setSelectedTab('graph')}
        >
          Reaction Time Graph
        </button>
        <button 
          className={`${styles.tabButton} ${selectedTab === 'distribution' ? styles.activeTab : ''}`} 
          onClick={() => setSelectedTab('distribution')}
        >
          RT Distribution
        </button>
        <button 
          className={`${styles.tabButton} ${selectedTab === 'data' ? styles.activeTab : ''}`} 
          onClick={() => setSelectedTab('data')}
        >
          Raw Data
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {selectedTab === 'graph' && (
          <div className={styles.graphContainer}>
            {trials.filter(t => t.reactionTime && !t.falseStart).length > 0 ? (
              <canvas ref={chartRef} height="300" />
            ) : (
              <div className={styles.emptyState}>
                <p>No reaction time data available</p>
              </div>
            )}
          </div>
        )}
        
        {selectedTab === 'distribution' && (
          <div className={styles.distributionContainer}>
            {trials.filter(t => t.reactionTime && !t.falseStart).length > 0 ? (
              <>
                <div className={styles.percentileTable}>
                  <h3>Reaction Time Percentiles (ms)</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Min</th>
                        <th>25%</th>
                        <th>Median</th>
                        <th>75%</th>
                        <th>Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{formatMs(distribution.percentiles?.min)}</td>
                        <td>{formatMs(distribution.percentiles?.p25)}</td>
                        <td>{formatMs(distribution.percentiles?.median)}</td>
                        <td>{formatMs(distribution.percentiles?.p75)}</td>
                        <td>{formatMs(distribution.percentiles?.max)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className={styles.histogramContainer}>
                  <h3>Reaction Time Distribution</h3>
                  <div className={styles.histogram}>
                    {distribution.histogram?.map((bin, index) => (
                      <div 
                        key={index} 
                        className={styles.histogramBar}
                        style={{ 
                          height: `${(bin.count / Math.max(...distribution.histogram.map(b => b.count))) * 100}%`,
                        }}
                      >
                        <div className={styles.histogramTooltip}>
                          {bin.label}: {bin.count} trials
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.histogramLabels}>
                    {distribution.histogram?.map((bin, index) => (
                      <div key={index} className={styles.histogramLabel}>
                        {bin.start}
                      </div>
                    ))}
                    <div className={styles.histogramLabel}>
                      {distribution.histogram[distribution.histogram.length - 1]?.end}
                    </div>
                  </div>
                  <div className={styles.histogramAxisLabel}>Reaction Time (ms)</div>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>No reaction time data available</p>
              </div>
            )}
          </div>
        )}
        
        {selectedTab === 'data' && (
          <div className={styles.dataTableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Trial #</th>
                  <th>Type</th>
                  <th>Reaction Time (ms)</th>
                  <th>Interval (ms)</th>
                </tr>
              </thead>
              <tbody>
                {trials.length > 0 ? (
                  trials.map((trial, index) => (
                    <tr key={index} className={trial.falseStart ? styles.falseStartRow : ''}>
                      <td>{trial.trialNumber}</td>
                      <td>{trial.falseStart ? 'False Start' : 'Valid'}</td>
                      <td>{trial.reactionTime ? formatMs(trial.reactionTime) : '-'}</td>
                      <td>{trial.intervalTime || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className={styles.emptyState}>No trials recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div className={styles.dataExport}>
              <button 
                className={styles.exportButton}
                onClick={() => {
                  // Generate CSV data
                  const headers = ['Trial Number', 'Type', 'Reaction Time (ms)', 'Interval (ms)'];
                  const csvContent = [
                    headers.join(','),
                    ...trials.map(trial => [
                      trial.trialNumber,
                      trial.falseStart ? 'False Start' : 'Valid',
                      trial.reactionTime || '',
                      trial.intervalTime || ''
                    ].join(','))
                  ].join('\n');
                  
                  // Create download link
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `pvt-results-${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Export Data (CSV)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}