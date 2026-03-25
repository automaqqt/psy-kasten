import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import Link from 'next/link';
import styles from '../../../styles/DetailPage.module.css';
import  Modal  from '../../../components/ui/modal';
import BulkImportModal from '../../../components/ui/BulkImportModal';
import ShareLinkModal from '../../../components/ui/ShareLinkModal';
import MetadataEditorModal from '../../../components/ui/MetadataEditorModal';
import StudyAnalytics from '../../../components/analytics/StudyAnalytics';
import { TEST_TYPES } from '../../../lib/testConfig';

const ParticipantList = ({ participants, onDeleteParticipant, onEditParticipant, onEditMetadata, onAddParticipant, onRegenerateLink, onShareLink, testType, deletingParticipantId, regeneratingAssignmentId }) => {
    const [copiedLinkId, setCopiedLinkId] = React.useState(null);

    if (!participants || participants.length === 0) {
        return (
            <div className={styles.emptyState}>
                <h4>No Participants Yet</h4>
                <p>Add participants to start collecting test data for this study.</p>
                <button onClick={onAddParticipant} className={styles.addButton}>
                    + Add First Participant
                </button>
            </div>
        );
    }

    const handleCopyLink = (link, participantId) => {
        navigator.clipboard.writeText(link)
            .then(() => {
                setCopiedLinkId(participantId);
                setTimeout(() => setCopiedLinkId(null), 2000);
            })
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
                        <th>Metadata</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                {participants.map(p => {
                    const assignment = p.assignments?.[0];
                    const testLink = assignment?.testLink || null;
                    const isExpired = assignment?.expiresAt && new Date(assignment.expiresAt) < new Date();
                    const status = assignment?.completedAt ? 'Completed' : (isExpired ? 'Expired' : 'Pending');
                    const isCopied = copiedLinkId === p.id;

                    const hasMetadata = p.metadata && Object.keys(p.metadata).length > 0;
                    const metadataCount = hasMetadata ? Object.keys(p.metadata).length : 0;

                    return (
                        <tr key={p.id}>
                            <td>{p.identifier}</td>
                            <td>
                                {hasMetadata ? (
                                    <button
                                        onClick={() => onEditMetadata(p)}
                                        className={styles.metadataButton}
                                        title="View/edit metadata"
                                    >
                                        {metadataCount} field{metadataCount !== 1 ? 's' : ''}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onEditMetadata(p)}
                                        className={styles.metadataButtonEmpty}
                                        title="Add metadata"
                                    >
                                        + Add
                                    </button>
                                )}
                            </td>
                            <td>
                                <span className={`${styles.statusBadge} ${assignment?.completedAt ? styles.statusCompleted : (isExpired ? styles.statusExpired : styles.statusPending)}`}>
                                    {status}
                                </span>
                            </td>
                            <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className={styles.actionsCell}>
                                {testLink && !isExpired && (
                                    <>
                                        <button
                                            onClick={() => onShareLink(testLink, p.identifier)}
                                            className={styles.actionButtonShare}
                                            title="Share link (QR code, email, etc.)"
                                            disabled={deletingParticipantId === p.id}
                                        >
                                            Share
                                        </button>
                                        <button onClick={() => handleOpenLink(testLink)} className={styles.actionButtonOpen} title="Open in new tab" disabled={deletingParticipantId === p.id}>
                                            Open
                                        </button>
                                        <button
                                            onClick={() => handleCopyLink(testLink, p.id)}
                                            className={`${styles.actionButtonCopy} ${isCopied ? styles.actionButtonCopied : ''}`}
                                            title={isCopied ? "Copied!" : "Copy to clipboard"}
                                            disabled={deletingParticipantId === p.id}
                                        >
                                            {isCopied ? 'Copied' : 'Copy'}
                                        </button>
                                    </>
                                )}
                                {isExpired && assignment && (
                                    <button
                                        onClick={() => onRegenerateLink(assignment.id)}
                                        className={styles.actionButtonRegenerate}
                                        title="Generate new link"
                                        disabled={regeneratingAssignmentId === assignment.id || deletingParticipantId === p.id}
                                    >
                                        {regeneratingAssignmentId === assignment.id ? 'Regenerating...' : 'Regenerate'}
                                    </button>
                                )}
                                <button onClick={() => onEditParticipant(p)} className={styles.actionButtonEdit} title="Edit participant" disabled={deletingParticipantId === p.id}>
                                    Edit
                                </button>
                                <button onClick={() => onDeleteParticipant(p.id)} className={styles.actionButtonDelete} title="Delete participant" disabled={deletingParticipantId === p.id}>
                                    {deletingParticipantId === p.id ? 'Deleting...' : 'Delete'}
                                </button>
                                <Link href={`/dashboard/results?participantId=${p.id}`}>
                                    <div className={styles.actionButtonView} title="View results">Results</div>
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
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingParticipantId, setDeletingParticipantId] = useState(null);
  const [deletingStudy, setDeletingStudy] = useState(false);
  const [regeneratingAssignmentId, setRegeneratingAssignmentId] = useState(null);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Modal States
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareParticipantId, setShareParticipantId] = useState('');
  const [newParticipantIdentifier, setNewParticipantIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Participant Modal States
  const [isEditParticipantModalOpen, setIsEditParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editParticipantIdentifier, setEditParticipantIdentifier] = useState('');

  // Metadata Modal States
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [editingMetadataParticipant, setEditingMetadataParticipant] = useState(null);

  // Edit Study Modal States
  const [isEditStudyModalOpen, setIsEditStudyModalOpen] = useState(false);
  const [editStudyName, setEditStudyName] = useState('');
  const [editStudyDescription, setEditStudyDescription] = useState('');

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
      setParticipants(data.participants || []);
    } catch (err) {
      setError(err.message);
      setStudy(null);
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
           const data = await res.json();
          if (!res.ok) {
              throw new Error(data.message || 'Failed to add participant');
          }
          setIsAddParticipantModalOpen(false);
          setNewParticipantIdentifier('');
          fetchStudyData();
      } catch (err) {
          setError(err.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleShareLink = (link, participantIdentifier) => {
      setShareLink(link);
      setShareParticipantId(participantIdentifier);
      setIsShareLinkModalOpen(true);
  };

  const handleRegenerateLink = async (assignmentId) => {
      if (!window.confirm('Generate a new test link for this participant? The old link will no longer work.')) {
          return;
      }
      setRegeneratingAssignmentId(assignmentId);
      setError(null);
      try {
          const res = await fetch(`/api/assignments/${assignmentId}/regenerate`, { method: 'POST' });
          const data = await res.json();
          if (!res.ok) {
              throw new Error(data.message || 'Failed to regenerate link');
          }
          alert(`New link generated successfully! The old link is now invalid.`);
          fetchStudyData();
      } catch (err) {
          setError(err.message);
          alert(`Error: ${err.message}`);
      } finally {
          setRegeneratingAssignmentId(null);
      }
  };

  const handleDeleteParticipant = async (participantId) => {
      const participant = participants.find(p => p.id === participantId);
      const assignmentCount = participant?.assignments?.length || 0;
      const completedCount = participant?.assignments?.filter(a => a.completedAt).length || 0;

      const confirmMessage = `Delete participant "${participant?.identifier}"?\n\n` +
          `This will permanently delete:\n` +
          `- ${assignmentCount} test assignment(s)\n` +
          `- ${completedCount} completed result(s)\n\n` +
          `This action cannot be undone.`;

      if (!window.confirm(confirmMessage)) {
          return;
      }
       setError(null);
       setDeletingParticipantId(participantId);
       try {
          const res = await fetch(`/api/participants/${participantId}`, { method: 'DELETE' });
          if (!res.ok) {
               const errData = await res.json();
              throw new Error(errData.message || 'Failed to delete participant');
          }
          fetchStudyData();
       } catch (err) {
           setError(err.message);
           alert(`Error: ${err.message}`);
       } finally {
           setDeletingParticipantId(null);
       }
  };

  const handleEditParticipant = (participant) => {
      setEditingParticipant(participant);
      setEditParticipantIdentifier(participant.identifier);
      setIsEditParticipantModalOpen(true);
  };

  const handleEditMetadata = (participant) => {
      setEditingMetadataParticipant(participant);
      setIsMetadataModalOpen(true);
  };

  const handleSaveMetadata = async (participantId, metadata) => {
      setError(null);
      try {
          const participant = participants.find(p => p.id === participantId);
          const res = await fetch(`/api/participants/${participantId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  identifier: participant.identifier,
                  metadata: metadata
              }),
          });
          const data = await res.json();
          if (!res.ok) {
              throw new Error(data.message || 'Failed to save metadata');
          }
          fetchStudyData();
      } catch (err) {
          setError(err.message);
          throw err;
      }
  };

  const handleEditParticipantSubmit = async (e) => {
      e.preventDefault();
      if (!editParticipantIdentifier.trim() || !editingParticipant) return;
      setIsSubmitting(true);
      setError(null);
      try {
          const res = await fetch(`/api/participants/${editingParticipant.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier: editParticipantIdentifier }),
          });
          const data = await res.json();
          if (!res.ok) {
              throw new Error(data.message || 'Failed to update participant');
          }
          setIsEditParticipantModalOpen(false);
          setEditingParticipant(null);
          setEditParticipantIdentifier('');
          fetchStudyData();
      } catch (err) {
          setError(err.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- Study Handlers ---
  const handleEditStudy = () => {
      setEditStudyName(study.name);
      setEditStudyDescription(study.description || '');
      setIsEditStudyModalOpen(true);
  };

  const handleEditStudySubmit = async (e) => {
      e.preventDefault();
      if (!editStudyName.trim()) return;
      setIsSubmitting(true);
      setError(null);
      try {
          const res = await fetch(`/api/studies/${studyId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  name: editStudyName,
                  description: editStudyDescription
              }),
          });
          const data = await res.json();
          if (!res.ok) {
              throw new Error(data.message || 'Failed to update study');
          }
          setIsEditStudyModalOpen(false);
          setEditStudyName('');
          setEditStudyDescription('');
          fetchStudyData();
      } catch (err) {
          setError(err.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDuplicateStudy = async () => {
      const copyParticipants = window.confirm(
          `Duplicate study "${study.name}"?\n\n` +
          `Click OK to copy participants (without results), or Cancel to create an empty copy.`
      );

      setIsDuplicating(true);
      setError(null);
      try {
          const res = await fetch(`/api/studies/${studyId}/duplicate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ copyParticipants })
          });
          const data = await res.json();
          if (!res.ok) {
              throw new Error(data.message || 'Failed to duplicate study');
          }
          alert('Study duplicated successfully!');
          router.push(`/dashboard/studies/${data.study.id}`);
      } catch (err) {
          setError(err.message);
          alert(`Error: ${err.message}`);
          setIsDuplicating(false);
      }
  };

  const handleDeleteStudy = async () => {
      const participantCount = participants?.length || 0;
      const assignmentCount = study?._count?.testAssignments || 0;
      const completedCount = participants?.reduce((sum, p) => sum + (p.assignments?.filter(a => a.completedAt).length || 0), 0) || 0;

      const confirmMessage = `Delete Study "${study.name}"?\n\n` +
          `This will permanently delete:\n` +
          `- ${participantCount} participant(s)\n` +
          `- ${assignmentCount} test assignment(s)\n` +
          `- ${completedCount} completed result(s)\n\n` +
          `This action cannot be undone.\n\n` +
          `Type "DELETE" to confirm.`;

      const userInput = window.prompt(confirmMessage);
      if (userInput !== 'DELETE') {
          return;
      }
      setError(null);
      setDeletingStudy(true);
      try {
          const res = await fetch(`/api/studies/${studyId}`, { method: 'DELETE' });
          if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.message || 'Failed to delete study');
          }
          router.push('/dashboard');
      } catch (err) {
          setError(err.message);
          alert(`Error: ${err.message}`);
          setDeletingStudy(false);
      }
  };


  // --- Render ---
  if (isLoading) return <DashboardLayout><p className={styles.loadingText}>Loading study data...</p></DashboardLayout>;
  if (error && !study) return <DashboardLayout><p className={styles.errorTextPage}>Error: {error}</p></DashboardLayout>;
   if (!study) return <DashboardLayout><p>Study not found.</p></DashboardLayout>;


  return (
    <DashboardLayout>
      <div className={styles.pageHeader}>
        <h1>{study.name}</h1>
        <div className={styles.headerActions}>
          <button onClick={handleDuplicateStudy} className={styles.secondaryButton} title="Duplicate study" disabled={deletingStudy || isDuplicating}>
            {isDuplicating ? 'Duplicating...' : 'Duplicate'}
          </button>
          <button onClick={handleEditStudy} className={styles.editButton} title="Edit study" disabled={deletingStudy || isDuplicating}>
            Edit
          </button>
          <button onClick={handleDeleteStudy} className={styles.deleteButton} title="Delete study" disabled={deletingStudy || isDuplicating}>
            {deletingStudy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      {error && <p className={styles.errorTextPage}>{error}</p>}
      <p className={styles.studyDescription}>{study.description || 'No description provided.'}</p>

       {/* Analytics Section */}
       {participants.length > 0 && (
           <section className={styles.section}>
               <StudyAnalytics studyId={studyId} />
           </section>
       )}

       <section className={styles.section}>
           <div className={styles.sectionHeader}>
               <h2>Participants ({participants.length})</h2>
               <div className={styles.sectionHeaderActions}>
                   <button onClick={() => setIsAddParticipantModalOpen(true)} className={styles.addButton}>
                       + Add Participant
                   </button>
                   <button onClick={() => setIsBulkImportModalOpen(true)} className={styles.secondaryButton} title="Import multiple participants at once">
                       Bulk Import
                   </button>
               </div>
           </div>
           <ParticipantList
                participants={participants}
                onDeleteParticipant={handleDeleteParticipant}
                onEditParticipant={handleEditParticipant}
                onEditMetadata={handleEditMetadata}
                onAddParticipant={() => setIsAddParticipantModalOpen(true)}
                onRegenerateLink={handleRegenerateLink}
                onShareLink={handleShareLink}
                testType={study.testType}
                deletingParticipantId={deletingParticipantId}
                regeneratingAssignmentId={regeneratingAssignmentId}
            />
       </section>

       {/* Add Participant Modal */}
       <Modal isOpen={isAddParticipantModalOpen} onClose={() => { setIsAddParticipantModalOpen(false); setError(null); }} title="Add New Participant">
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

       {/* Edit Participant Modal */}
       <Modal isOpen={isEditParticipantModalOpen} onClose={() => { setIsEditParticipantModalOpen(false); setError(null); }} title="Edit Participant">
            <form onSubmit={handleEditParticipantSubmit}>
                 {error && <p className={styles.errorTextModal}>{error}</p>}
                 <div className={styles.formGroup}>
                     <label htmlFor="editParticipantIdentifier">Participant Identifier *</label>
                     <input
                         type="text"
                         id="editParticipantIdentifier"
                         value={editParticipantIdentifier}
                         onChange={(e) => setEditParticipantIdentifier(e.target.value)}
                         placeholder="e.g., Email, Subject ID, Code"
                         required
                         disabled={isSubmitting}
                     />
                      <small>Unique identifier for this participant within this study.</small>
                 </div>
                  <div className={styles.modalActions}>
                     <button type="button" onClick={() => setIsEditParticipantModalOpen(false)} disabled={isSubmitting} className={styles.secondaryButtonModal}>Cancel</button>
                     <button type="submit" disabled={isSubmitting || !editParticipantIdentifier.trim()} className={styles.primaryButtonModal}>
                        {isSubmitting ? 'Updating...' : 'Update Participant'}
                    </button>
                </div>
            </form>
       </Modal>

       {/* Edit Study Modal */}
       <Modal isOpen={isEditStudyModalOpen} onClose={() => { setIsEditStudyModalOpen(false); setError(null); }} title="Edit Study">
            <form onSubmit={handleEditStudySubmit}>
                 {error && <p className={styles.errorTextModal}>{error}</p>}
                 <div className={styles.formGroup}>
                     <label htmlFor="editStudyName">Study Name *</label>
                     <input
                         type="text"
                         id="editStudyName"
                         value={editStudyName}
                         onChange={(e) => setEditStudyName(e.target.value)}
                         required
                         disabled={isSubmitting}
                     />
                 </div>
                 <div className={styles.formGroup}>
                     <label htmlFor="editStudyDescription">Description (Optional)</label>
                     <textarea
                         id="editStudyDescription"
                         value={editStudyDescription}
                         onChange={(e) => setEditStudyDescription(e.target.value)}
                         rows={3}
                         disabled={isSubmitting}
                     />
                 </div>
                  <div className={styles.modalActions}>
                     <button type="button" onClick={() => setIsEditStudyModalOpen(false)} disabled={isSubmitting} className={styles.secondaryButtonModal}>Cancel</button>
                     <button type="submit" disabled={isSubmitting || !editStudyName.trim()} className={styles.primaryButtonModal}>
                        {isSubmitting ? 'Updating...' : 'Update Study'}
                    </button>
                </div>
            </form>
       </Modal>

       {/* Bulk Import Modal */}
       <BulkImportModal
           isOpen={isBulkImportModalOpen}
           onClose={() => setIsBulkImportModalOpen(false)}
           studyId={studyId}
           onImportComplete={fetchStudyData}
       />

       {/* Share Link Modal */}
       <ShareLinkModal
           isOpen={isShareLinkModalOpen}
           onClose={() => setIsShareLinkModalOpen(false)}
           testLink={shareLink}
           participantIdentifier={shareParticipantId}
       />

       {/* Metadata Editor Modal */}
       <MetadataEditorModal
           isOpen={isMetadataModalOpen}
           onClose={() => setIsMetadataModalOpen(false)}
           participant={editingMetadataParticipant}
           onSave={handleSaveMetadata}
       />

    </DashboardLayout>
  );
}
