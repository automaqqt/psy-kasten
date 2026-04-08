import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import styles from '../../styles/StudyAnalytics.module.css';

const TEST_TYPE_LABELS = {
    'corsi': 'Corsi',
    'pvt': 'PVT',
    'gng-sst': 'GNG-SST',
    'rpm': 'RPM',
    'tol': 'TOL',
    'vm': 'VM',
    'akt': 'AKT',
    'wtb': 'WTB',
    'cpt': 'CPT'
};

function TestTypeSection({ testType, data, t }) {
    const label = TEST_TYPE_LABELS[testType] || testType.toUpperCase();
    const { metric, completed, total, completionRate, scores, recentCompletions } = data;
    const metricLabel = metric.unit ? `${metric.label} (${metric.unit})` : metric.label;

    return (
        <div className={styles.testTypeSection}>
            <h3 className={styles.testTypeHeading}>{label}</h3>

            <div className={styles.testTypeSummary}>
                <div className={styles.miniStat}>
                    <span className={styles.miniStatLabel}>{t('stat_completion_rate')}</span>
                    <span className={`${styles.miniStatValue} ${completionRate >= 80 ? styles.textGreen : styles.textAmber}`}>
                        {completionRate}%
                    </span>
                    <span className={styles.miniStatSub}>{completed}/{total}</span>
                </div>

                {scores.average !== null && (
                    <div className={styles.miniStat}>
                        <span className={styles.miniStatLabel}>{metricLabel}</span>
                        <span className={styles.miniStatValue}>
                            {scores.average}{metric.unit ? ` ${metric.unit}` : ''}
                        </span>
                        <span className={styles.miniStatSub}>
                            n={scores.count}
                        </span>
                    </div>
                )}
            </div>

            {/* Score Distribution */}
            {scores.distribution && scores.distribution.length > 0 && scores.count > 0 && (
                <div className={styles.miniChart}>
                    <div className={styles.miniChartLabel}>{metricLabel}</div>
                    <div className={styles.chartContainer}>
                        {scores.distribution.map((bucket, index) => {
                            const maxCount = Math.max(...scores.distribution.map(b => b.count));
                            const height = maxCount > 0 ? (bucket.count / maxCount * 120) : 0;

                            return (
                                <div key={index} className={styles.chartBar}>
                                    <div className={styles.chartBarCount}>
                                        {bucket.count}
                                    </div>
                                    <div
                                        className={styles.chartBarFill}
                                        style={{ height: `${height}px` }}
                                    />
                                    <div className={styles.chartBarLabel}>
                                        {bucket.range}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Completions */}
            {recentCompletions && recentCompletions.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.completionsTable}>
                        <thead>
                            <tr>
                                <th>{t('col_participant')}</th>
                                <th>{t('col_completed_on')}</th>
                                <th>{metricLabel}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentCompletions.map((completion, index) => (
                                <tr key={index}>
                                    <td>{completion.participantId}</td>
                                    <td>
                                        {new Date(completion.completedAt).toLocaleString()}
                                    </td>
                                    <td>
                                        {completion.score !== null ? completion.score : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function StudyAnalytics({ studyId }) {
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { t } = useTranslation('dashboard');

    useEffect(() => {
        if (!studyId) return;

        const fetchAnalytics = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/studies/${studyId}/analytics`);
                if (!res.ok) {
                    throw new Error('Failed to fetch analytics');
                }
                const data = await res.json();
                setAnalytics(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [studyId]);

    if (isLoading) {
        return (
            <div className={styles.loadingState}>
                <p>{t('analytics_loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorState}>
                <p>{t('analytics_error')} {error}</p>
            </div>
        );
    }

    if (!analytics) return null;

    const { summary, testTypeAnalytics, completionTrend } = analytics;
    const testTypes = Object.keys(testTypeAnalytics || {});

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>{t('study_analytics')}</h2>

            {/* Overall Summary Cards */}
            <div className={styles.summaryCards}>
                <div className={`${styles.summaryCard} ${styles.cardBlue}`}>
                    <div className={styles.label}>{t('stat_total_participants')}</div>
                    <div className={styles.value}>{summary.totalParticipants}</div>
                </div>

                <div className={`${styles.summaryCard} ${summary.completionRate >= 80 ? styles.cardGreen : styles.cardAmber}`}>
                    <div className={styles.label}>{t('stat_completion_rate')}</div>
                    <div className={styles.value}>{summary.completionRate}%</div>
                    <div className={styles.subtext}>
                        {t('stat_completed_of', { completed: summary.completedAssignments, total: summary.totalAssignments })}
                    </div>
                </div>

                <div className={`${styles.summaryCard} ${styles.cardAmber}`}>
                    <div className={styles.label}>{t('stat_pending_tests')}</div>
                    <div className={styles.value}>{summary.pendingAssignments}</div>
                </div>
            </div>

            {/* Per-Test-Type Sections */}
            {testTypes.length > 0 && (
                <div className={styles.testTypeSections}>
                    {testTypes.map(testType => (
                        <div key={testType} className={styles.panel}>
                            <TestTypeSection
                                testType={testType}
                                data={testTypeAnalytics[testType]}
                                t={t}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Completion Trend */}
            {completionTrend && completionTrend.length > 0 && (
                <div className={styles.panel}>
                    <h3>{t('completion_trend')}</h3>
                    <div className={styles.trendSubtext}>
                        {t('days_with_completions', { count: completionTrend.length })}
                    </div>
                    <div className={styles.trendContainer}>
                        {completionTrend.map((day, index) => {
                            const maxCount = Math.max(...completionTrend.map(d => d.count));
                            const height = (day.count / maxCount * 80);

                            return (
                                <div
                                    key={index}
                                    className={styles.trendBar}
                                    style={{ height: `${height}px` }}
                                    title={t('completions_on_date', { date: day.date, count: day.count })}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
