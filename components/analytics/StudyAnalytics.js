import React, { useState, useEffect } from 'react';

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
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', backgroundColor: '#f8d7da', borderRadius: '8px' }}>
                <p style={{ color: '#721c24' }}>Error loading analytics: {error}</p>
            </div>
        );
    }

    if (!analytics) return null;

    const { summary, scores, recentCompletions, completionTrend } = analytics;

    return (
        <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Study Analytics</h2>

            {/* Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    backgroundColor: '#e7f3ff',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #b3d9ff'
                }}>
                    <div style={{ fontSize: '0.875rem', color: '#004085', marginBottom: '0.5rem' }}>Total Participants</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#004085' }}>
                        {summary.totalParticipants}
                    </div>
                </div>

                <div style={{
                    backgroundColor: summary.completionRate >= 80 ? '#d4edda' : '#fff3cd',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: `1px solid ${summary.completionRate >= 80 ? '#c3e6cb' : '#ffeaa7'}`
                }}>
                    <div style={{
                        fontSize: '0.875rem',
                        color: summary.completionRate >= 80 ? '#155724' : '#856404',
                        marginBottom: '0.5rem'
                    }}>
                        Completion Rate
                    </div>
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: summary.completionRate >= 80 ? '#155724' : '#856404'
                    }}>
                        {summary.completionRate}%
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {summary.completedAssignments} / {summary.totalAssignments} completed
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#fff3cd',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #ffeaa7'
                }}>
                    <div style={{ fontSize: '0.875rem', color: '#856404', marginBottom: '0.5rem' }}>Pending Tests</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#856404' }}>
                        {summary.pendingAssignments}
                    </div>
                </div>

                {scores.average !== null && (
                    <div style={{
                        backgroundColor: '#d4edda',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '1px solid #c3e6cb'
                    }}>
                        <div style={{ fontSize: '0.875rem', color: '#155724', marginBottom: '0.5rem' }}>Average Score</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#155724' }}>
                            {scores.average}
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            Based on {scores.count} result(s)
                        </div>
                    </div>
                )}
            </div>

            {/* Score Distribution */}
            {scores.distribution && scores.distribution.length > 0 && scores.count > 0 && (
                <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Score Distribution</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '200px' }}>
                        {scores.distribution.map((bucket, index) => {
                            const maxCount = Math.max(...scores.distribution.map(b => b.count));
                            const height = maxCount > 0 ? (bucket.count / maxCount * 180) : 0;

                            return (
                                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                        {bucket.count}
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: `${height}px`,
                                        backgroundColor: '#007bff',
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'height 0.3s ease'
                                    }} />
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6c757d' }}>
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
                <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Recent Completions</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Participant</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Completed At</th>
                                    {recentCompletions.some(c => c.score !== null) && (
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Score</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {recentCompletions.map((completion, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '0.75rem' }}>{completion.participantId}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {new Date(completion.completedAt).toLocaleString()}
                                        </td>
                                        {recentCompletions.some(c => c.score !== null) && (
                                            <td style={{ padding: '0.75rem' }}>
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
                <div style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>
                        Completion Trend (Last 30 Days)
                    </h3>
                    <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1rem' }}>
                        {completionTrend.length} day(s) with completions
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100px' }}>
                        {completionTrend.map((day, index) => {
                            const maxCount = Math.max(...completionTrend.map(d => d.count));
                            const height = (day.count / maxCount * 80);

                            return (
                                <div
                                    key={index}
                                    style={{
                                        flex: 1,
                                        height: `${height}px`,
                                        backgroundColor: '#28a745',
                                        borderRadius: '2px',
                                        minWidth: '8px',
                                        position: 'relative',
                                        cursor: 'pointer'
                                    }}
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
