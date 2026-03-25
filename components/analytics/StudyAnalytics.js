import React, { useState, useEffect } from 'react';
import styles from '../../styles/StudyAnalytics.module.css';

export default function StudyAnalytics({ studyId }) {
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorState}>
                <p>Error loading analytics: {error}</p>
            </div>
        );
    }

    if (!analytics) return null;

    const { summary, scores, recentCompletions, completionTrend } = analytics;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Study Analytics</h2>

            {/* Summary Cards */}
            <div className={styles.summaryCards}>
                <div className={`${styles.summaryCard} ${styles.cardBlue}`}>
                    <div className={styles.label}>Total Participants</div>
                    <div className={styles.value}>{summary.totalParticipants}</div>
                </div>

                <div className={`${styles.summaryCard} ${summary.completionRate >= 80 ? styles.cardGreen : styles.cardAmber}`}>
                    <div className={styles.label}>Completion Rate</div>
                    <div className={styles.value}>{summary.completionRate}%</div>
                    <div className={styles.subtext}>
                        {summary.completedAssignments} / {summary.totalAssignments} completed
                    </div>
                </div>

                <div className={`${styles.summaryCard} ${styles.cardAmber}`}>
                    <div className={styles.label}>Pending Tests</div>
                    <div className={styles.value}>{summary.pendingAssignments}</div>
                </div>

                {scores.average !== null && (
                    <div className={`${styles.summaryCard} ${styles.cardGreen}`}>
                        <div className={styles.label}>Average Score</div>
                        <div className={styles.value}>{scores.average}</div>
                        <div className={styles.subtext}>
                            Based on {scores.count} result(s)
                        </div>
                    </div>
                )}
            </div>

            {/* Score Distribution */}
            {scores.distribution && scores.distribution.length > 0 && scores.count > 0 && (
                <div className={styles.panel}>
                    <h3>Score Distribution</h3>
                    <div className={styles.chartContainer}>
                        {scores.distribution.map((bucket, index) => {
                            const maxCount = Math.max(...scores.distribution.map(b => b.count));
                            const height = maxCount > 0 ? (bucket.count / maxCount * 180) : 0;

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
                <div className={styles.panel}>
                    <h3>Recent Completions</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.completionsTable}>
                            <thead>
                                <tr>
                                    <th>Participant</th>
                                    <th>Completed At</th>
                                    {recentCompletions.some(c => c.score !== null) && (
                                        <th>Score</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {recentCompletions.map((completion, index) => (
                                    <tr key={index}>
                                        <td>{completion.participantId}</td>
                                        <td>
                                            {new Date(completion.completedAt).toLocaleString()}
                                        </td>
                                        {recentCompletions.some(c => c.score !== null) && (
                                            <td>
                                                {completion.score !== null ? completion.score : 'N/A'}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Completion Trend */}
            {completionTrend && completionTrend.length > 0 && (
                <div className={styles.panel}>
                    <h3>Completion Trend (Last 30 Days)</h3>
                    <div className={styles.trendSubtext}>
                        {completionTrend.length} day(s) with completions
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
                                    title={`${day.date}: ${day.count} completion(s)`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
