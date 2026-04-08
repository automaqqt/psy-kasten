import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import styles from '../../../styles/ResultDetailPage.module.css';
import { getAdaptedProps } from '../../../lib/resultAdapters';
import { getCSVExporter } from '../../../lib/csvExporters';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { getResultComponent } from '../../../lib/resultComponents';

export async function getServerSideProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'dashboard'])),
        },
    };
}

export default function ResultDetailPage() {
    const { t } = useTranslation('dashboard');
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
                <p className={styles.loadingText}>{t('loading_result')}</p>
            </DashboardLayout>
        );
    }

    if (error || !result) {
        return (
            <DashboardLayout>
                <div className={styles.errorText}>
                    <h2>{t('result_not_found')}</h2>
                    <p>{error || t('result_not_found')}</p>
                    <Link href="/dashboard/results">
                        <button className={styles.downloadButton} style={{ marginTop: '1rem' }}>
                            {t('back_to_results')}
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
    const ResultComponent = getResultComponent(testType);
    const hasCSVExporter = !!getCSVExporter(testType);

    return (
        <DashboardLayout>
            <div className={styles.pageContainer}>
                {/* Header */}
                <div className={styles.pageHeader}>
                    <div>
                        <Link href="/dashboard/results" className={styles.backLink}>
                            {t('back_to_results')}
                        </Link>
                        <h1>{t('result_details_title')}</h1>
                        <p className={styles.subtitle}>
                            {t('label_participant')} <strong>{participantId}</strong> | {t('label_test')} <strong>{testType.toUpperCase()}</strong>
                            {studyName && <> | {t('label_study')} <strong>{studyName}</strong></>}
                        </p>
                    </div>
                    <div className={styles.actionButtons}>
                        {hasCSVExporter && (
                            <button onClick={downloadResultCSV} className={styles.downloadButton}>
                                {t('download_csv')}
                            </button>
                        )}
                        <button onClick={downloadResultJSON} className={styles.downloadButton}>
                            {t('download_json')}
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className={styles.summaryCards}>
                    <div className={styles.summaryCard}>
                        <h3>{t('card_completed_at')}</h3>
                        <p>{completedAt}</p>
                    </div>
                    <div className={styles.summaryCard}>
                        <h3>{t('card_test_type')}</h3>
                        <p>{testType.toUpperCase()}</p>
                    </div>
                    {result.data?.totalScore !== undefined && (
                        <div className={`${styles.summaryCard} ${styles.success}`}>
                            <h3>{t('card_score')}</h3>
                            <p>{result.data.totalScore}{result.data.maxScore ? ` / ${result.data.maxScore}` : ''}</p>
                        </div>
                    )}
                    {result.data?.ubs !== undefined && (
                        <div className={`${styles.summaryCard} ${styles.primary}`}>
                            <h3>{t('card_corsi_span')}</h3>
                            <p>{result.data.ubs}</p>
                        </div>
                    )}
                    {result.data?.accuracy !== undefined && (
                        <div className={`${styles.summaryCard} ${styles.primary}`}>
                            <h3>{t('card_accuracy')}</h3>
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
                        <h2>{t('test_data_fallback')}</h2>
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
                        <summary className={styles.rawDataSummary}>{t('view_raw_data')}</summary>
                        <div className={styles.jsonContainer}>
                            <pre>{JSON.stringify(result.data, null, 2)}</pre>
                        </div>
                    </details>
                </div>
            </div>
        </DashboardLayout>
    );
}
