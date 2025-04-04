// components/results/gng/GNGResults.js
import React from 'react';
import Link from 'next/link';
import styles from '../../styles/GNGResults.module.css'; // Create this CSS file

const calculateMean = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
};

const calculateSD = (arr, mean) => {
    if (!arr || arr.length < 2) return 0;
    const sqDiffs = arr.map(value => Math.pow(value - mean, 2));
    const avgSqDiff = calculateMean(sqDiffs);
    return Math.sqrt(avgSqDiff);
};

const calculateMedian = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const sortedArr = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sortedArr.length / 2);
    return sortedArr.length % 2 !== 0 ? sortedArr[mid] : (sortedArr[mid - 1] + sortedArr[mid]) / 2;
};

// Function to estimate SSRT using the mean method (simplified)
const estimateSSRTMean = (goRTs, stopSuccessRate, meanSSD) => {
    // Requires stopSuccessRate to be meaningful (ideally near 0.5)
    // And meanSSD derived from trials around that success rate
    if (!goRTs || goRTs.length === 0 || meanSSD === null || meanSSD === undefined) {
        return null; // Cannot calculate
    }
    const meanGoRT = calculateMean(goRTs);
    // Simple Mean Method: SSRT ≈ Mean Go RT - Mean SSD
    // This is a rough estimate, especially if inhibition rate is far from 50%
    // Or if meanSSD doesn't represent the 50% inhibition point well.
    const ssrt = meanGoRT - meanSSD;
    return Math.max(0, ssrt); // SSRT cannot be negative
};

const GNGResults = ({ results, settings, onRestart }) => {

    // --- Calculate Metrics ---
    const goTrials = results.filter(r => r.type === 'go');
    const nogoTrials = results.filter(r => r.type === 'nogo');
    const stopTrials = results.filter(r => r.type === 'stop');

    const correctGoResponses = results.filter(r => r.outcome === 'correctGo');
    const omissionErrors = results.filter(r => r.outcome === 'omission');
    const commissionErrorsNoGo = results.filter(r => r.type === 'nogo' && r.outcome === 'commission');
    const commissionErrorsStop = results.filter(r => r.type === 'stop' && r.outcome === 'commission');
    const correctInhibitsNoGo = results.filter(r => r.type === 'nogo' && r.outcome === 'correctInhibit');
    const correctInhibitsStop = results.filter(r => r.type === 'stop' && r.outcome === 'correctInhibit');

    const correctGoRTs = correctGoResponses.map(r => r.responseTime).filter(rt => rt !== null);
    const meanGoRT = calculateMean(correctGoRTs);
    const medianGoRT = calculateMedian(correctGoRTs);
    const sdGoRT = calculateSD(correctGoRTs, meanGoRT);

    const totalCommissionErrors = commissionErrorsNoGo.length + commissionErrorsStop.length;
    const totalInhibitoryTrials = nogoTrials.length + stopTrials.length;
    const commissionErrorRate = totalInhibitoryTrials > 0 ? totalCommissionErrors / totalInhibitoryTrials : 0;

    const omissionErrorRate = goTrials.length > 0 ? omissionErrors.length / goTrials.length : 0;

    // Stop Signal Specific Metrics
    const stopSuccessRate = stopTrials.length > 0 ? correctInhibitsStop.length / stopTrials.length : null;
    // For SSRT, we ideally use SSDs from trials around the 50% success point.
    // Simple approach: use the average SSD across *all* stop trials. Less accurate.
    const allSSDs = stopTrials.map(r => r.ssd).filter(ssd => ssd !== null);
    const meanSSD = calculateMean(allSSDs);

    const estimatedSSRT = estimateSSRTMean(correctGoRTs, stopSuccessRate, meanSSD);

     // Optional: Export Function
      const exportResultsToCSV = () => {
        const headers = [
            'TrialNum', 'TrialType', 'Stimulus', 'StopSignalTriggered', 'SSD_Used_ms',
            'ResponseKey', 'ResponseTime_ms', 'Outcome'
        ];
        const rows = results.map(r => [
            r.trialNum, r.type, JSON.stringify(r.stimulus), r.stopSignal, r.ssd ?? '',
            r.responseKey ?? '', r.responseTime?.toFixed(2) ?? '', r.outcome
        ]);

         // Add summary rows
         rows.push([]); // Spacer
         rows.push(['--- Summary ---']);
         rows.push(['Total Trials', results.length]);
         rows.push(['Correct Go RT Mean (ms)', meanGoRT.toFixed(2)]);
         rows.push(['Correct Go RT Median (ms)', medianGoRT.toFixed(2)]);
         rows.push(['Correct Go RT SD (ms)', sdGoRT.toFixed(2)]);
         rows.push(['Omission Errors (%)', (omissionErrorRate * 100).toFixed(1) + '%', `(${omissionErrors.length}/${goTrials.length})`]);
         rows.push(['Commission Errors (NoGo) (%)', nogoTrials.length > 0 ? (commissionErrorsNoGo.length / nogoTrials.length * 100).toFixed(1) + '%' : 'N/A', `(${commissionErrorsNoGo.length}/${nogoTrials.length})`]);
         if (stopTrials.length > 0) {
             rows.push(['Commission Errors (Stop) (%)', stopTrials.length > 0 ? (commissionErrorsStop.length / stopTrials.length * 100).toFixed(1) + '%' : 'N/A', `(${commissionErrorsStop.length}/${stopTrials.length})`]);
             rows.push(['Stop Success Rate (%)', stopSuccessRate !== null ? (stopSuccessRate * 100).toFixed(1) + '%' : 'N/A']);
             rows.push(['Mean SSD Used (ms)', meanSSD !== null ? meanSSD.toFixed(2) : 'N/A']);
             rows.push(['Estimated SSRT (Mean Method, ms)', estimatedSSRT !== null ? estimatedSSRT.toFixed(2) : 'N/A', estimatedSSRT === null ? '(Insufficient data or Go RTs)' : '']);
         }


        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `gng-sst-results-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };


    return (
        <div className={styles.resultsCard}>
            <h2>Test Results</h2>

            <div className={styles.metricsGrid}>
                {/* Go Metrics */}
                <div className={styles.metricCard}>
                    <h3>Go Performance</h3>
                    <div>Mean RT: {meanGoRT.toFixed(0)} ms</div>
                    <div>Median RT: {medianGoRT.toFixed(0)} ms</div>
                    <div>SD RT: {sdGoRT.toFixed(0)} ms</div>
                    <div>Omissions: {(omissionErrorRate * 100).toFixed(1)}% ({omissionErrors.length}/{goTrials.length})</div>
                </div>

                {/* Inhibitory Metrics */}
                <div className={styles.metricCard}>
                    <h3>Inhibition Performance</h3>
                    <div>Commission Errors (NoGo): {nogoTrials.length > 0 ? `${(commissionErrorsNoGo.length / nogoTrials.length * 100).toFixed(1)}% (${commissionErrorsNoGo.length}/${nogoTrials.length})` : 'N/A'}</div>
                     {settings.stopSignalProbability > 0 && stopTrials.length > 0 && (
                         <>
                            <div>Commission Errors (Stop): {`${(commissionErrorsStop.length / stopTrials.length * 100).toFixed(1)}% (${commissionErrorsStop.length}/${stopTrials.length})`}</div>
                            <div>Stop Success Rate: {(stopSuccessRate * 100).toFixed(1)}%</div>
                         </>
                     )}
                      {settings.stopSignalProbability === 0 && (
                          <div>Correct NoGo: {nogoTrials.length > 0 ? `${(correctInhibitsNoGo.length / nogoTrials.length * 100).toFixed(1)}% (${correctInhibitsNoGo.length}/${nogoTrials.length})` : 'N/A'}</div>
                      )}
                </div>

                 {/* Stop Signal Specific */}
                  {settings.stopSignalProbability > 0 && stopTrials.length > 0 && (
                     <div className={styles.metricCard}>
                         <h3>Stop Signal Metrics</h3>
                         <div>Mean SSD: {meanSSD ? meanSSD.toFixed(0) + ' ms' : 'N/A'}</div>
                         <div>Estimated SSRT: {estimatedSSRT ? estimatedSSRT.toFixed(0) + ' ms' : 'N/A'}</div>
                         <div className={styles.note}>(SSRT via Mean Method - approximation)</div>
                     </div>
                  )}
            </div>

             <div className={styles.exportContainer}>
                 <button className={styles.exportButton} onClick={exportResultsToCSV}>Export Detailed Results (CSV)</button>
             </div>

             {/* Maybe add a small table/chart of RT distribution or SSD changes */}

            <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={onRestart}>Restart Test</button>
                <Link href="/"><div className={styles.secondaryButton}>Back to Home</div></Link>
            </div>
        </div>
    );
};

export default GNGResults;