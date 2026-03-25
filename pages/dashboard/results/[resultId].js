import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import styles from '../../../styles/ResultDetailPage.module.css';
import { getAdaptedProps } from '../../../lib/resultAdapters';
import { getCSVExporter } from '../../../lib/csvExporters';

// Import all result components
import CorsiResults from '../../../components/results/corsi';
import PVTResults from '../../../components/results/pvt';
import GNGResults from '../../../components/results/gng';
import RPMResults from '../../../components/results/rpm';
import TOLResults from '../../../components/results/tol';
import VmResults from '../../../components/results/vm';
import AktResults from '../../../components/results/akt';
import WtbResults from '../../../components/results/wtb';
import CPTResults from '../../../components/results/cpt';

const COMPONENT_MAP = {
    'corsi': CorsiResults,
    'pvt': PVTResults,
    'gng-sst': GNGResults,
    'rpm': RPMResults,
    'tol': TOLResults,
    'vm': VmResults,
    'akt': AktResults,
    'wtb': WtbResults,
    'cpt': CPTResults,
};

export default function ResultDetailPage() {
    const router = useRouter();
    const { resultId } = router.query;
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!resultId) return;

        const fetchResult = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/results/${resultId}`);
                if (!res.ok) throw new Error('Failed to fetch result');
                const data = await res.json();
                setResult(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResult();
    }, [resultId]);

    const downloadResultJSON = () => {
        if (!result) return;
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `result-${resultId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadResultCSV = () => {
        if (!result) return;
        const testType = result.testAssignment?.testType;
        const exporter = getCSVExporter(testType);
        if (exporter) {
            exporter(result.data);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <p className={styles.loadingText}>Loading result details...</p>
            </DashboardLayout>
        );
    }

    if (error || !result) {
        return (
            <DashboardLayout>
                <div className={styles.errorText}>
                    <h2>Error</h2>
                    <p>{error || 'Result not found'}</p>
                    <Link href="/dashboard/results">
                        <button className={styles.downloadButton} style={{ marginTop: '1rem' }}>
                            Back to Results
                        </button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const testType = result.testAssignment?.testType || 'Unknown';
    const participantId = result.testAssignment?.participant?.identifier || 'N/A';
    const completedAt = result.testAssignment?.completedAt
        ? new Date(result.testAssignment.completedAt).toLocaleString('de-DE', {
            timeZone: 'Europe/Berlin',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        })
        : 'N/A';
    const studyName = result.testAssignment?.study?.name || '';

    // Try to get adapted props for test-specific rendering
    const adaptedProps = getAdaptedProps(testType, result.data);
    const ResultComponent = COMPONENT_MAP[testType];
    const hasCSVExporter = !!getCSVExporter(testType);

    return (
        <DashboardLayout>
            <div className={styles.pageContainer}>
                {/* Header */}
                <div className={styles.pageHeader}>
                    <div>
                        <Link href="/dashboard/results" className={styles.backLink}>
                            ← Back to Results
                        </Link>
                        <h1>Test Result Details</h1>
                        <p className={styles.subtitle}>
                            Participant: <strong>{participantId}</strong> | Test: <strong>{testType.toUpperCase()}</strong>
                            {studyName && <> | Study: <strong>{studyName}</strong></>}
                        </p>
                    </div>
                    <div className={styles.actionButtons}>
                        {hasCSVExporter && (
                            <button onClick={downloadResultCSV} className={styles.downloadButton}>
                                Download CSV
                            </button>
                        )}
                        <button onClick={downloadResultJSON} className={styles.downloadButton}>
                            Download JSON
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className={styles.summaryCards}>
                    <div className={styles.summaryCard}>
                        <h3>Completed At</h3>
                        <p>{completedAt}</p>
                    </div>
                    <div className={styles.summaryCard}>
                        <h3>Test Type</h3>
                        <p>{testType.toUpperCase()}</p>
                    </div>
                    {result.data?.totalScore !== undefined && (
                        <div className={`${styles.summaryCard} ${styles.success}`}>
                            <h3>Score</h3>
                            <p>{result.data.totalScore}{result.data.maxScore ? ` / ${result.data.maxScore}` : ''}</p>
                        </div>
                    )}
                    {result.data?.ubs !== undefined && (
                        <div className={`${styles.summaryCard} ${styles.primary}`}>
                            <h3>Corsi Span (UBS)</h3>
                            <p>{result.data.ubs}</p>
                        </div>
                    )}
                    {result.data?.accuracy !== undefined && (
                        <div className={`${styles.summaryCard} ${styles.primary}`}>
                            <h3>Accuracy</h3>
                            <p>{typeof result.data.accuracy === 'number' ? result.data.accuracy.toFixed(1) + '%' : result.data.accuracy}</p>
                        </div>
                    )}
                </div>

                {/* Test-Specific Results */}
                {ResultComponent && adaptedProps ? (
                    <div className={styles.testResultsSection}>
                        <ResultComponent {...adaptedProps} t={null} />
                    </div>
                ) : (
                    /* Fallback: Generic view for unknown test types */
                    <div className={styles.metricsSection}>
                        <h2>Test Data</h2>
                        <div className={styles.metricsGrid}>
                            {Object.entries(result.data).map(([key, value]) => {
                                if (typeof value !== 'object' || value === null) {
                                    return (
                                        <div key={key} className={styles.metricCard}>
                                            <h4>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                                            <p>{typeof value === 'number' ? value.toFixed(2) : String(value)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}

                {/* Raw JSON Section */}
                <div className={styles.rawDataSection}>
                    <details>
                        <summary className={styles.rawDataSummary}>View Full Raw Data</summary>
                        <div className={styles.jsonContainer}>
                            <pre>{JSON.stringify(result.data, null, 2)}</pre>
                        </div>
                    </details>
                </div>
            </div>
        </DashboardLayout>
    );
}
