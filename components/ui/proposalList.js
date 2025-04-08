import React, { useState, useEffect } from 'react';
import styles from '../../styles/AdminProposalList.module.css'; // Create this CSS file

export default function ProposalList() {
    const [proposals, setProposals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterReviewed, setFilterReviewed] = useState(false); // Show pending by default

    const fetchProposals = async (reviewed) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/proposals?reviewed=${reviewed}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to fetch proposals');
            }
            const data = await res.json();
            setProposals(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProposals(filterReviewed);
    }, [filterReviewed]); // Refetch when filter changes

    const handleMarkReviewed = async (proposalId) => {
        // Optional: Add confirmation
        // if (!window.confirm("Mark this proposal as reviewed?")) return;

        // Find the proposal to potentially update notes later
        // const proposal = proposals.find(p => p.id === proposalId);
        // TODO: Implement way to add admin notes before marking reviewed, perhaps a modal

        try {
            const res = await fetch(`/api/admin/proposals`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposalId: proposalId, adminNotes: null }), // Pass notes if collected
            });
            if (!res.ok) {
                 const errData = await res.json();
                throw new Error(errData.message || 'Failed to update status');
            }
             // Refresh the list to remove the item (or move it to 'reviewed')
             fetchProposals(filterReviewed);
             alert('Proposal marked as reviewed.');

        } catch (err) {
             setError(`Error marking proposal ${proposalId} as reviewed: ${err.message}`);
             alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className={styles.listContainer}>
            <h2>Test Proposals</h2>

            <div className={styles.filterToggle}>
                <button
                    onClick={() => setFilterReviewed(false)}
                    className={!filterReviewed ? styles.activeFilter : ''}
                >
                    Pending ({!filterReviewed ? proposals.length : '...'})
                </button>
                <button
                    onClick={() => setFilterReviewed(true)}
                    className={filterReviewed ? styles.activeFilter : ''}
                >
                     Reviewed ({filterReviewed ? proposals.length : '...'})
                </button>
            </div>

            {isLoading && <p>Loading proposals...</p>}
            {error && <p className={styles.errorText}>{error}</p>}

            {!isLoading && !error && proposals.length === 0 && (
                <p>No {filterReviewed ? 'reviewed' : 'pending'} proposals found.</p>
            )}

            {!isLoading && !error && proposals.length > 0 && (
                <table className={styles.proposalTable}>
                    <thead>
                        <tr>
                            <th>Submitted By</th>
                            <th>Filename</th>
                            <th>Notes</th>
                            <th>Submitted On</th>
                            <th>Size (MB)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proposals.map(p => (
                            <tr key={p.id}>
                                <td>{p.researcher?.name || p.researcher?.email || 'N/A'}</td>
                                <td>{p.originalFilename}</td>
                                <td className={styles.notesCell}>{p.notes || '-'}</td>
                                <td>{new Date(p.createdAt).toLocaleString()}</td>
                                <td>{(p.fileSize / 1024 / 1024).toFixed(2)}</td>
                                <td className={styles.actionsCell}>
                                    <a
                                        href={`/api/admin/proposals/download/${p.id}`}
                                        target="_blank" // Open download in new tab
                                        rel="noopener noreferrer"
                                        className={styles.actionButtonDownload}
                                        // Download attribute might not always work depending on headers
                                        // download={p.originalFilename}
                                    >
                                        Download PDF
                                    </a>
                                    {!p.isReviewed && (
                                        <button
                                            onClick={() => handleMarkReviewed(p.id)}
                                            className={styles.actionButtonReview}
                                        >
                                            Mark Reviewed
                                        </button>
                                    )}
                                     {/* Add Admin Notes Button here if needed */}
                                     {/* Add Delete button here if needed */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}