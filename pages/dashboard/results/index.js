import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import styles from '../../../styles/ResultsPage.module.css'; // Create this CSS file

// Basic Results Table Component (Extract later)
const ResultTable = ({ results }) => {
     if (!results || results.length === 0) {
        return <p>No results found matching your criteria.</p>;
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
                                 <button className={styles.actionButtonView}>View Details</button> {/* TODO: Implement Detail View */}
                             </td>
                         </tr>
                     );
                 })}
             </tbody>
         </table>
     );
 };

export default function ResultsPage() {
    const [results, setResults] = useState([]);
    const [studies, setStudies] = useState([]); // For filtering
    const [participants, setParticipants] = useState([]); // For filtering
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter State
    const [selectedStudyId, setSelectedStudyId] = useState('');
    // Add states for selectedParticipantId, selectedTestType if needed

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
    }, [selectedStudyId]); // Add other filter dependencies here

    return (
        <DashboardLayout>
            <div className={styles.pageHeader}>
                <h1>Test Results</h1>
                {/* Add export button for filtered results? */}
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

        </DashboardLayout>
    );
}