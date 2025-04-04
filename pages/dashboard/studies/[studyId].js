import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import Link from 'next/link';
import styles from '../../../styles/DetailPage.module.css'; // Create this CSS file
// Assuming Modal is extracted or redefined here/imported
import  Modal  from '../../../components/ui/modal'; // Example path
import { TEST_TYPES } from '../../../lib/testConfig'; // Define test types centrally

// Reusable List Component (Extract later if needed)
const ParticipantList = ({ participants, onAssignTestClick, onDeleteParticipant }) => {
    if (!participants || participants.length === 0) {
        return <p>No participants added to this study yet.</p>;
    }
    return (
        <table className={styles.participantTable}>
            <thead>
                <tr>
                    <th>Identifier</th>
                    <th>Assignments</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {participants.map(p => (
                    <tr key={p.id}>
                        <td>{p.identifier}</td>
                        <td>{p._count?.assignments ?? 0}</td>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button onClick={() => onAssignTestClick(p)} className={styles.actionButtonAssign}>Assign Test</button>
                            <button onClick={() => onDeleteParticipant(p.id)} className={styles.actionButtonDelete}>Delete</button>
                            {/* Add View Results button link */}
                             <Link href={`/dashboard/results?participantId=${p.id}`}>
                                 <div className={styles.actionButtonView}>View Results</div>
                             </Link>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
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
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedTestType, setSelectedTestType] = useState(TEST_TYPES[0]?.id || ''); // Default to first test type
  const [generatedLink, setGeneratedLink] = useState(null);
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


  // --- Assignment Handlers ---
   const openAssignModal = (participant) => {
       setSelectedParticipant(participant);
       setSelectedTestType(TEST_TYPES[0]?.id || ''); // Reset to default test type
       setGeneratedLink(null);
       setError(null); // Clear previous errors
       setIsAssignModalOpen(true);
   };

   const handleAssignTestSubmit = async (e) => {
      e.preventDefault();
      if (!selectedParticipant || !selectedTestType) return;
       setIsSubmitting(true);
       setError(null);
       setGeneratedLink(null);
       try {
           const res = await fetch('/api/assignments', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   participantId: selectedParticipant.id,
                   testType: selectedTestType,
                   studyId: studyId // Include studyId for potential linking/filtering
               }),
           });
            const data = await res.json();
           if (!res.ok) {
               throw new Error(data.message || 'Failed to create assignment');
           }
           setGeneratedLink(data.testLink); // Show the generated link
            // Optionally close modal after a delay or keep it open to show link
           // setIsAssignModalOpen(false);
           fetchStudyData(); // Refresh participant assignment counts etc.
       } catch (err) {
           setError(err.message);
       } finally {
           setIsSubmitting(false);
       }
   };

   const copyLink = () => {
       if (generatedLink) {
           navigator.clipboard.writeText(generatedLink)
               .then(() => alert("Link copied to clipboard!"))
               .catch(err => alert("Failed to copy link: " + err));
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
                onAssignTestClick={openAssignModal}
                onDeleteParticipant={handleDeleteParticipant}
            />
       </section>

        {/* Optional: Section to view assignments for the whole study */}
        {/* <section className={styles.section}>
            <h2>Test Assignments</h2>
            <AssignmentList assignments={assignments} />
        </section> */}


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

       {/* Assign Test Modal */}
        <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assign Test to ${selectedParticipant?.identifier}`}>
            <form onSubmit={handleAssignTestSubmit}>
                 {error && <p className={styles.errorTextModal}>{error}</p>}
                 <div className={styles.formGroup}>
                     <label htmlFor="testType">Select Test *</label>
                     <select
                        id="testType"
                        value={selectedTestType}
                        onChange={(e) => setSelectedTestType(e.target.value)}
                        required
                        disabled={isSubmitting || !!generatedLink} // Disable after generating link
                        className={styles.selectInput}
                    >
                         {TEST_TYPES.map(test => (
                             <option key={test.id} value={test.id}>{test.title}</option>
                         ))}
                     </select>
                 </div>

                 {generatedLink && (
                    <div className={styles.generatedLinkContainer}>
                        <label>Generated Test Link:</label>
                        <input type="text" readOnly value={generatedLink} className={styles.linkInput}/>
                        <button type="button" onClick={copyLink} className={styles.copyButton}>Copy Link</button>
                    </div>
                 )}

                  <div className={styles.modalActions}>
                     <button type="button" onClick={() => setIsAssignModalOpen(false)} disabled={isSubmitting} className={styles.secondaryButtonModal}>Close</button>
                     {!generatedLink && ( // Only show generate button if no link yet
                         <button type="submit" disabled={isSubmitting || !selectedTestType} className={styles.primaryButtonModal}>
                            {isSubmitting ? 'Generating...' : 'Generate Link'}
                        </button>
                     )}
                </div>
            </form>
       </Modal>

    </DashboardLayout>
  );
}