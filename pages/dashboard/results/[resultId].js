import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import styles from '../../../styles/ResultDetailPage.module.css';

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
                if (!res.ok) {
                    throw new Error('Failed to fetch result');
                }
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

    if (isLoading) {
        return (
            <DashboardLayout>
                <p>Loading result details...</p>
            </DashboardLayout>
        );
    }

    if (error || !result) {
        return (
            <DashboardLayout>
                <div style={{ padding: '2rem' }}>
                    <h2>Error</h2>
                    <p>{error || 'Result not found'}</p>
                    <Link href="/dashboard/results">
                        <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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
        ? new Date(result.testAssignment.completedAt).toLocaleString()
        : 'N/A';

    return (
        <DashboardLayout>
            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <Link href="/dashboard/results">
                            <button style={{ marginBottom: '1rem', padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                ← Back to Results
                            </button>
                        </Link>
                        <h1 style={{ marginBottom: '0.5rem' }}>Test Result Details</h1>
                        <p style={{ color: '#6c757d' }}>
                            Participant: <strong>{participantId}</strong> | Test: <strong>{testType.toUpperCase()}</strong>
                        </p>
                    </div>
                    <button
                        onClick={downloadResultJSON}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        📥 Download JSON
                    </button>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>Completed At</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{completedAt}</div>
                    </div>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>Test Type</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{testType.toUpperCase()}</div>
                    </div>
                    {result.data?.totalScore !== undefined && (
                        <div style={{ backgroundColor: '#d4edda', padding: '1.5rem', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
                            <div style={{ fontSize: '0.875rem', color: '#155724', marginBottom: '0.5rem' }}>Score</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                                {result.data.totalScore} / {result.data.maxScore || '?'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Test-Specific Data */}
                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '2rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Test Data</h2>

                    {/* Display key metrics */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: '#495057' }}>Key Metrics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                            {Object.entries(result.data).map(([key, value]) => {
                                // Skip complex objects and arrays for the summary
                                if (typeof value !== 'object' || value === null) {
                                    return (
                                        <div key={key} style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                            <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </div>
                                            <div style={{ fontWeight: '500' }}>
                                                {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>

                    {/* Raw Data Section */}
                    <details style={{ marginTop: '2rem' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem', color: '#495057' }}>
                            View Full Raw Data
                        </summary>
                        <pre style={{
                            backgroundColor: '#f8f9fa',
                            padding: '1rem',
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '500px',
                            fontSize: '0.875rem',
                            border: '1px solid #dee2e6'
                        }}>
                            {JSON.stringify(result.data, null, 2)}
                        </pre>
                    </details>
                </div>

                {/* Trial Data Table (if available) */}
                {result.data?.trials && Array.isArray(result.data.trials) && result.data.trials.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Trial-by-Trial Data</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Trial</th>
                                        {Object.keys(result.data.trials[0]).map(key => (
                                            <th key={key} style={{ padding: '0.75rem', textAlign: 'left' }}>
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.data.trials.map((trial, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <td style={{ padding: '0.75rem' }}>{index + 1}</td>
                                            {Object.values(trial).map((value, idx) => (
                                                <td key={idx} style={{ padding: '0.75rem' }}>
                                                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
