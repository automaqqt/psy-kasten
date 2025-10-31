import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import ExportConfigModal from '../../../components/export/ExportConfigModal';
import styles from '../../../styles/ResultsPage.module.css'; // Create this CSS file

// Basic Results Table Component (Extract later)
const ResultTable = ({ results }) => {
     if (!results || results.length === 0) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', marginTop: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                <h3>No Results Found</h3>
                <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
                    No test results match your current filter criteria.
                </p>
                <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                    Make sure participants have completed their assigned tests, or adjust your filters.
                </p>
            </div>
        );
    }
     return (
         <table className={styles.resultsTable}>
             <thead>
                 <tr>
                     <th>Participant</th>
                     <th>Test Type</th>
                     <th>Completed On</th>
                     <th>Score / Main Metric</th> {/* Simple example */}
                     <th>Actions</th>
                 </tr>
             </thead>
             <tbody>
                 {results.map(res => {
                    // Extract a simple score - needs refinement per test type
                    let mainScore = 'N/A';
                    if (res.data?.totalScore !== undefined) {
                        mainScore = `${res.data.totalScore} / ${res.data.maxScore ?? '?'}`;
                    } else if (res.data?.stroopInterferenceRT_Cong !== undefined) {
                         mainScore = `Interference: ${res.data.stroopInterferenceRT_Cong?.toFixed(0)} ms`;
                    } else if (res.data?.meanGoRT !== undefined) {
                         mainScore = `Mean Go RT: ${res.data.meanGoRT?.toFixed(0)} ms`;
                    }
                     // Add more specific score extraction logic per test type


                     return (
                         <tr key={res.id}>
                             <td>{res.testAssignment?.participant?.identifier ?? 'N/A'}</td>
                             <td>{res.testAssignment?.testType ?? 'Unknown'}</td>
                             <td>{res.testAssignment?.completedAt ? new Date(res.testAssignment.completedAt).toLocaleString() : 'Incomplete'}</td>
                              <td>{mainScore}</td>
                             <td>
                                 <Link href={`/dashboard/results/${res.id}`}>
                                     <button className={styles.actionButtonView}>View Details</button>
                                 </Link>
                             </td>
                         </tr>
                     );
                 })}
             </tbody>
         </table>
     );
 };

export default function ResultsPage() {
    const router = useRouter();
    const [results, setResults] = useState([]);
    const [studies, setStudies] = useState([]); // For filtering
    const [participants, setParticipants] = useState([]); // For filtering
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Filter State
    const [selectedStudyId, setSelectedStudyId] = useState('');
    const [selectedParticipantId, setSelectedParticipantId] = useState('');
    // Add states for selectedTestType if needed

    // Read participantId from URL on mount
    useEffect(() => {
        if (router.isReady) {
            const participantIdFromUrl = router.query.participantId;
            if (participantIdFromUrl && typeof participantIdFromUrl === 'string') {
                setSelectedParticipantId(participantIdFromUrl);
            }
        }
    }, [router.isReady, router.query.participantId]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch studies for filter dropdown
            const studiesRes = await fetch('/api/studies');
            if (!studiesRes.ok) throw new Error('Failed to fetch studies');
            const studiesData = await studiesRes.json();
            setStudies(studiesData);

            // Build query string for results based on filters
            const queryParams = new URLSearchParams();
            if (selectedStudyId) queryParams.append('studyId', selectedStudyId);
            if (selectedParticipantId) queryParams.append('participantId', selectedParticipantId);
            // Add other filters...

            const resultsRes = await fetch(`/api/results?${queryParams.toString()}`);
            if (!resultsRes.ok) {
                const errData = await resultsRes.json();
                throw new Error(errData.message || 'Failed to fetch results');
            }
            const resultsData = await resultsRes.json();
            setResults(resultsData);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch initial data and refetch when filters change
    useEffect(() => {
        fetchData();
    }, [selectedStudyId, selectedParticipantId]); // Add other filter dependencies here

    const getStudyName = () => {
        if (selectedStudyId) {
            return studies.find(s => s.id === selectedStudyId)?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'study';
        }
        return 'all-studies';
    };

    return (
        <DashboardLayout>
            <div className={styles.pageHeader}>
                <h1>Test Results</h1>
                <button
                    onClick={() => setIsExportModalOpen(true)}
                    disabled={!results || results.length === 0}
                    className={styles.exportButton}
                    title="Export filtered results in various formats"
                >
                    📥 Export Results
                </button>
            </div>

            <div className={styles.filters}>
                 <label htmlFor="studyFilter">Filter by Study:</label>
                 <select
                    id="studyFilter"
                    value={selectedStudyId}
                    onChange={(e) => setSelectedStudyId(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="">All Studies</option>
                    {studies.map(study => (
                        <option key={study.id} value={study.id}>{study.name}</option>
                    ))}
                 </select>
                 {/* Add more filters for Participant, Test Type */}
            </div>


            {isLoading && <p className={styles.loadingText}>Loading results...</p>}
            {error && <p className={styles.errorText}>Error: {error}</p>}

            {!isLoading && !error && (
                <ResultTable results={results} />
            )}

            {/* Export Configuration Modal */}
            <ExportConfigModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                results={results}
                studyName={getStudyName()}
            />

        </DashboardLayout>
    );
}