// components/PVTResults.js
import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/PVTResults.module.css';

export default function PVTResults({ trials, falseStarts, t }) {
  const [selectedTab, setSelectedTab] = useState('graph');
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Translation function with fallback
  const translate = t || ((key) => key);
  
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
          label: translate('results_reaction_time_ms'),
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
                text: translate('results_chart_title'),
                font: {
                  size: 16
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return translate('results_chart_tooltip_rt') + `: ${context.parsed.y} ms`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: translate('results_chart_y_axis')
                }
              },
              x: {
                title: {
                  display: true,
                  text: translate('results_chart_x_axis')
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
          {translate('results_tab_graph')}
        </button>
        <button
          className={`${styles.tabButton} ${selectedTab === 'distribution' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('distribution')}
        >
          {translate('results_tab_distribution')}
        </button>
        <button
          className={`${styles.tabButton} ${selectedTab === 'data' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('data')}
        >
          {translate('results_tab_data')}
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {selectedTab === 'graph' && (
          <div className={styles.graphContainer}>
            {trials.filter(t => t.reactionTime && !t.falseStart).length > 0 ? (
              <canvas ref={chartRef} height="300" />
            ) : (
              <div className={styles.emptyState}>
                <p>{translate('results_no_data')}</p>
              </div>
            )}
          </div>
        )}
        
        {selectedTab === 'distribution' && (
          <div className={styles.distributionContainer}>
            {trials.filter(t => t.reactionTime && !t.falseStart).length > 0 ? (
              <>
                <div className={styles.percentileTable}>
                  <h3>{translate('results_percentiles_title')}</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>{translate('results_percentile_min')}</th>
                        <th>{translate('results_percentile_25')}</th>
                        <th>{translate('results_percentile_median')}</th>
                        <th>{translate('results_percentile_75')}</th>
                        <th>{translate('results_percentile_max')}</th>
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
                  <h3>{translate('results_distribution_title')}</h3>
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
                          {bin.label}: {bin.count} {translate('results_histogram_trials')}
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
                  <div className={styles.histogramAxisLabel}>{translate('results_chart_y_axis')}</div>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>{translate('results_no_data')}</p>
              </div>
            )}
          </div>
        )}
        
        {selectedTab === 'data' && (
          <div className={styles.dataTableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{translate('results_trial_number')}</th>
                  <th>{translate('results_type')}</th>
                  <th>{translate('results_reaction_time_ms')}</th>
                  <th>{translate('results_interval_ms')}</th>
                </tr>
              </thead>
              <tbody>
                {trials.length > 0 ? (
                  trials.map((trial, index) => (
                    <tr key={index} className={trial.falseStart ? styles.falseStartRow : ''}>
                      <td>{trial.trialNumber}</td>
                      <td>{trial.falseStart ? translate('results_type_false_start') : translate('results_type_valid')}</td>
                      <td>{trial.reactionTime ? formatMs(trial.reactionTime) : '-'}</td>
                      <td>{trial.intervalTime || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className={styles.emptyState}>{translate('results_no_trials')}</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div className={styles.dataExport}>
              <button
                className={styles.exportButton}
                onClick={() => {
                  // Generate CSV data
                  const headers = [
                    translate('results_trial_number'),
                    translate('results_type'),
                    translate('results_reaction_time_ms'),
                    translate('results_interval_ms')
                  ];
                  const csvContent = [
                    headers.join(','),
                    ...trials.map(trial => [
                      trial.trialNumber,
                      trial.falseStart ? translate('results_type_false_start') : translate('results_type_valid'),
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
                {translate('results_export_csv')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}