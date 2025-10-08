import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import Link from 'next/link';
import styles from '../../../styles/DetailPage.module.css'; // Create this CSS file
// Assuming Modal is extracted or redefined here/imported
import  Modal  from '../../../components/ui/modal'; // Example path
import { TEST_TYPES } from '../../../lib/testConfig'; // Define test types centrally

// Reusable List Component (Extract later if needed)
const ParticipantList = ({ participants, onDeleteParticipant, testType }) => {
    if (!participants || participants.length === 0) {
        return <p>No participants added to this study yet.</p>;
    }

    const handleCopyLink = (link) => {
        navigator.clipboard.writeText(link)
            .then(() => alert("Link copied to clipboard!"))
            .catch(err => alert("Failed to copy link: " + err));
    };

    const handleOpenLink = (link) => {
        window.open(link, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.participantTable}>
                <thead>
                    <tr>
                        <th>Identifier</th>
                        <th>Status</th>
                        <th>Test Link</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                {participants.map(p => {
                    const assignment = p.assignments?.[0]; // Get first assignment (should only be one)
                    const testLink = assignment ? `${window.location.origin}/${testType}?assignmentId=${assignment.accessKey}` : null;
                    const status = assignment?.completedAt ? 'Completed' : 'Pending';

                    return (
                        <tr key={p.id}>
                            <td>{p.identifier}</td>
                            <td>
                                <span className={`${styles.statusBadge} ${assignment?.completedAt ? styles.statusCompleted : styles.statusPending}`}>
                                    {status}
                                </span>
                            </td>
                            <td className={styles.linkCell}>
                                {testLink ? (
                                    <div className={styles.linkWrapper}>
                                        <code className={styles.testLink} title={testLink}>
                                            {testLink.length > 50 ? `${testLink.substring(0, 47)}...` : testLink}
                                        </code>
                                    </div>
                                ) : (
                                    <span className={styles.noLink}>No link</span>
                                )}
                            </td>
                            <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className={styles.actionsCell}>
                                {testLink && (
                                    <>
                                        <button onClick={() => handleOpenLink(testLink)} className={styles.actionButtonOpen} title="Open in new tab">
                                            🔗 Open
                                        </button>
                                        <button onClick={() => handleCopyLink(testLink)} className={styles.actionButtonCopy} title="Copy to clipboard">
                                            📋 Copy
                                        </button>
                                    </>
                                )}
                                <button onClick={() => onDeleteParticipant(p.id)} className={styles.actionButtonDelete} title="Delete participant">
                                    🗑️ Delete
                                </button>
                                <Link href={`/dashboard/results?participantId=${p.id}`}>
                                    <div className={styles.actionButtonView} title="View results">📊 Results</div>
                                </Link>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
        </div>
    );
};


export default function StudyDetailPage() {
  const router = useRouter();
  const { studyId } = router.query;
  const [study, setStudy] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [assignments, setAssignments] = useState([]); // State to hold assignments if fetched separately
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [newParticipantIdentifier, setNewParticipantIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudyData = useCallback(async () => {
    if (!studyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/studies/${studyId}`);
      if (!res.ok) {
         if (res.status === 404) throw new Error(`Study not found.`);
         if (res.status === 403) throw new Error(`Forbidden: You don't have access to this study.`);
        throw new Error(`Failed to fetch study: ${res.statusText}`);
      }
      const data = await res.json();
      setStudy(data);
      setParticipants(data.participants || []); // Assuming participants are included
      // Fetch assignments separately if needed, e.g., /api/assignments?studyId=...
    } catch (err) {
      setError(err.message);
      setStudy(null); // Clear study data on error
    } finally {
      setIsLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    fetchStudyData();
  }, [fetchStudyData]);


  // --- Participant Handlers ---
  const handleAddParticipantSubmit = async (e) => {
      e.preventDefault();
      if (!newParticipantIdentifier.trim()) return;
      setIsSubmitting(true);
      setError(null);
       try {
          const res = await fetch('/api/participants', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studyId: studyId, identifier: newParticipantIdentifier }),
          });
           const data = await res.json(); // Read body even for errors
          if (!res.ok) {
              throw new Error(data.message || 'Failed to add participant');
          }
          setIsAddParticipantModalOpen(false);
          setNewParticipantIdentifier('');
          fetchStudyData(); // Refresh data
      } catch (err) {
          setError(err.message); // Display error in the modal
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteParticipant = async (participantId) => {
      if (!window.confirm("Are you sure you want to delete this participant and all their associated data? This cannot be undone.")) {
          return;
      }
       setError(null);
       try {
          const res = await fetch(`/api/participants/${participantId}`, { method: 'DELETE' });
          if (!res.ok) {
               const errData = await res.json();
              throw new Error(errData.message || 'Failed to delete participant');
          }
          fetchStudyData(); // Refresh list
       } catch (err) {
           setError(err.message); // Show error on the page
           alert(`Error: ${err.message}`); // Also alert for visibility
       }
  };


  // --- Render ---
  if (isLoading) return <DashboardLayout><p className={styles.loadingText}>Loading study data...</p></DashboardLayout>;
  if (error && !study) return <DashboardLayout><p className={styles.errorText}>Error: {error}</p></DashboardLayout>; // Show error prominently if study fetch failed
   if (!study) return <DashboardLayout><p>Study not found.</p></DashboardLayout>;


  return (
    <DashboardLayout>
      <div className={styles.pageHeader}>
        <h1>Study: {study.name}</h1>
         {/* Add Edit/Delete Study buttons here if needed */}
      </div>
      {error && <p className={styles.errorTextPage}>{error}</p>} {/* Show non-fatal errors */}
      <p className={styles.studyDescription}>{study.description || 'No description provided.'}</p>

       <section className={styles.section}>
           <h2>Participants ({participants.length})</h2>
            <button onClick={() => setIsAddParticipantModalOpen(true)} className={styles.addButton}>
                + Add Participant
            </button>
           <ParticipantList
                participants={participants}
                onDeleteParticipant={handleDeleteParticipant}
                testType={study.testType}
            />
       </section>

       {/* Add Participant Modal */}
       <Modal isOpen={isAddParticipantModalOpen} onClose={() => setIsAddParticipantModalOpen(false)} title="Add New Participant">
            <form onSubmit={handleAddParticipantSubmit}>
                 {error && <p className={styles.errorTextModal}>{error}</p>}
                 <div className={styles.formGroup}>
                     <label htmlFor="participantIdentifier">Participant Identifier *</label>
                     <input
                         type="text"
                         id="participantIdentifier"
                         value={newParticipantIdentifier}
                         onChange={(e) => setNewParticipantIdentifier(e.target.value)}
                         placeholder="e.g., Email, Subject ID, Code"
                         required
                         disabled={isSubmitting}
                     />
                      <small>Unique identifier for this participant within this study.</small>
                 </div>
                  <div className={styles.modalActions}>
                     <button type="button" onClick={() => setIsAddParticipantModalOpen(false)} disabled={isSubmitting} className={styles.secondaryButtonModal}>Cancel</button>
                     <button type="submit" disabled={isSubmitting || !newParticipantIdentifier.trim()} className={styles.primaryButtonModal}>
                        {isSubmitting ? 'Adding...' : 'Add Participant'}
                    </button>
                </div>
            </form>
       </Modal>

    </DashboardLayout>
  );
}