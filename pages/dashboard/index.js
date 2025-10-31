import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Link from 'next/link';
import styles from '../../styles/DashboardPage.module.css'; // Create this CSS file
import Modal from '../../components/ui/modal';
import { TEST_TYPES } from '../../lib/testConfig';

// Basic Modal Component (can be extracted to its own file)



export default function DashboardHome() {
  const [studies, setStudies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStudyName, setNewStudyName] = useState('');
  const [newStudyDescription, setNewStudyDescription] = useState('');
  const [selectedTestTypes, setSelectedTestTypes] = useState([TEST_TYPES[0]?.id || 'corsi']); // Array of selected test types
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingStudyId, setDeletingStudyId] = useState(null); // Track which study is being deleted

  // Edit Study Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState(null);
  const [editStudyName, setEditStudyName] = useState('');
  const [editStudyDescription, setEditStudyDescription] = useState('');

  const fetchStudies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/studies');
      if (!res.ok) {
        throw new Error(`Failed to fetch studies: ${res.statusText}`);
      }
      const data = await res.json();
      setStudies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate dashboard stats
  const calculateStats = () => {
    if (!studies || studies.length === 0) return null;

    const totalParticipants = studies.reduce((sum, study) => sum + (study._count?.participants || 0), 0);
    const totalAssignments = studies.reduce((sum, study) => sum + (study._count?.testAssignments || 0), 0);

    return {
      totalStudies: studies.length,
      totalParticipants,
      totalAssignments,
    };
  };

  const stats = calculateStats();

  // Fetch studies on component mount
  useEffect(() => {
    fetchStudies();
  }, []);

  const handleCreateStudySubmit = async (e) => {
      e.preventDefault();
      if (!newStudyName.trim()) {
          setError('Study name cannot be empty.');
          return;
      }
      if (!selectedTestTypes || selectedTestTypes.length === 0) {
          setError('Please select at least one test type.');
          return;
      }
      setIsSubmitting(true);
      setError(null);
      try {
          const res = await fetch('/api/studies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: newStudyName,
                description: newStudyDescription,
                testTypes: selectedTestTypes
              }),
          });
          if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.message || 'Failed to create study');
          }
          // const createdStudy = await res.json(); // Use if needed
          // Add to list optimistically or refetch
          setIsCreateModalOpen(false);
          setNewStudyName('');
          setNewStudyDescription('');
          setSelectedTestTypes([TEST_TYPES[0]?.id || 'corsi']);
          await fetchStudies(); // Refetch the list
      } catch (err) {
          setError(err.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleEditStudy = (study) => {
      setEditingStudy(study);
      setEditStudyName(study.name);
      setEditStudyDescription(study.description || '');
      setIsEditModalOpen(true);
  };

  const handleEditStudySubmit = async (e) => {
      e.preventDefault();
      if (!editStudyName.trim() || !editingStudy) return;
      setIsSubmitting(true);
      setError(null);
      try {
          const res = await fetch(`/api/studies/${editingStudy.id}`, {
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
          setIsEditModalOpen(false);
          setEditingStudy(null);
          setEditStudyName('');
          setEditStudyDescription('');
          await fetchStudies(); // Refresh list
      } catch (err) {
          setError(err.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteStudy = async (studyId, studyName) => {
      const study = studies.find(s => s.id === studyId);
      const participantCount = study?._count?.participants || 0;
      const assignmentCount = study?._count?.testAssignments || 0;

      const confirmMessage = `⚠️ WARNING: Delete Study "${studyName}"?\n\n` +
          `This will permanently delete:\n` +
          `• ${participantCount} participant(s)\n` +
          `• ${assignmentCount} test assignment(s)\n` +
          `• All associated results\n\n` +
          `This action CANNOT be undone!\n\n` +
          `Type "DELETE" to confirm.`;

      const userInput = window.prompt(confirmMessage);
      if (userInput !== 'DELETE') {
          return; // User canceled or didn't type DELETE
      }
      setError(null);
      setDeletingStudyId(studyId); // Set loading state
      try {
          const res = await fetch(`/api/studies/${studyId}`, { method: 'DELETE' });
          if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.message || 'Failed to delete study');
          }
          await fetchStudies(); // Refresh list
      } catch (err) {
          setError(err.message);
          alert(`Error: ${err.message}`);
      } finally {
          setDeletingStudyId(null); // Clear loading state
      }
  };

  return (
    <DashboardLayout>
      <div className={styles.pageHeader}>
        <h1>My Studies</h1>
        <button onClick={() => setIsCreateModalOpen(true)} className={styles.primaryButton}>
           + Create New Study
        </button>
      </div>

      {/* Dashboard Stats Widgets */}
      {!isLoading && !error && stats && (
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
            <div style={{ fontSize: '0.875rem', color: '#004085', marginBottom: '0.5rem' }}>Total Studies</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#004085' }}>
              {stats.totalStudies}
            </div>
          </div>

          <div style={{
            backgroundColor: '#d4edda',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #c3e6cb'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#155724', marginBottom: '0.5rem' }}>Total Participants</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#155724' }}>
              {stats.totalParticipants}
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff3cd',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#856404', marginBottom: '0.5rem' }}>Total Assignments</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#856404' }}>
              {stats.totalAssignments}
            </div>
          </div>
        </div>
      )}

      {isLoading && <p className={styles.loadingText}>Loading studies...</p>}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!isLoading && !error && studies.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📚</div>
          <h3>No Studies Yet</h3>
          <p>Create your first study to start collecting cognitive test data.</p>
          <button onClick={() => setIsCreateModalOpen(true)} className={styles.primaryButton}>
            + Create Your First Study
          </button>
          <div className={styles.emptyStateHelp}>
            <p><strong>Quick Start:</strong></p>
            <ol>
              <li>Create a study and select a test type</li>
              <li>Add participants to your study</li>
              <li>Share test links with participants</li>
              <li>View and export results</li>
            </ol>
          </div>
        </div>
      )}

      {!isLoading && !error && studies.length > 0 && (
        <div className={styles.listContainer}>
          {studies.map(study => {
            // Support both testTypes (array) and testType (legacy single)
            const types = study.testTypes && Array.isArray(study.testTypes) && study.testTypes.length > 0
              ? study.testTypes
              : (study.testType ? [study.testType] : []);
            const testConfigs = types.map(id => TEST_TYPES.find(t => t.id === id)).filter(Boolean);

            return (
              <div key={study.id} className={styles.listItem}>
                <Link href={`/dashboard/studies/${study.id}`}>
                  <div className={styles.listItemLink}>
                      <div className={styles.studyHeader}>
                        <h3>{study.name}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {testConfigs.map(testConfig => (
                            <span key={testConfig.id} className={styles.testBadge} style={{ backgroundColor: testConfig.color }}>
                              {testConfig.icon} {testConfig.titleKey.replace('_title', '').toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p>{study.description || 'No description'}</p>
                      <div className={styles.listItemMeta}>
                          <span>Participants: {study._count?.participants ?? 0}</span>
                          <span>Assignments: {study._count?.testAssignments ?? 0}</span>
                          <span>Created: {new Date(study.createdAt).toLocaleDateString()}</span>
                      </div>
                  </div>
                </Link>
                <div className={styles.listItemActions}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditStudy(study); }}
                    className={styles.editButton}
                    title="Edit study"
                    disabled={deletingStudyId === study.id}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteStudy(study.id, study.name); }}
                    className={styles.deleteButton}
                    title="Delete study"
                    disabled={deletingStudyId === study.id}
                  >
                    {deletingStudyId === study.id ? '⏳ Deleting...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

       {/* Create Study Modal */}
       <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setError(null); }} title="Create New Study">
            <form onSubmit={handleCreateStudySubmit}>
                 {error && <p className={styles.errorTextModal}>{error}</p>}
                <div className={styles.formGroup}>
                    <label htmlFor="studyName">Study Name *</label>
                    <input
                        type="text"
                        id="studyName"
                        value={newStudyName}
                        onChange={(e) => setNewStudyName(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="studyDescription">Description (Optional)</label>
                    <textarea
                        id="studyDescription"
                        value={newStudyDescription}
                        onChange={(e) => setNewStudyDescription(e.target.value)}
                        rows={3}
                        disabled={isSubmitting}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Select Tests * (one or more)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {TEST_TYPES.map(test => (
                            <label key={test.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedTestTypes.includes(test.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedTestTypes([...selectedTestTypes, test.id]);
                                        } else {
                                            setSelectedTestTypes(selectedTestTypes.filter(t => t !== test.id));
                                        }
                                    }}
                                    disabled={isSubmitting}
                                />
                                <span style={{ fontSize: '1.1rem' }}>{test.icon}</span>
                                <span>{test.titleKey.replace('_title', '').toUpperCase().replace('_', ' ')}</span>
                            </label>
                        ))}
                    </div>
                    <small>Selected tests will be automatically assigned to all participants in this study.</small>
                </div>
                 <div className={styles.modalActions}>
                     <button type="button" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting} className={styles.secondaryButtonModal}>Cancel</button>
                     <button type="submit" disabled={isSubmitting || !newStudyName.trim()} className={styles.primaryButtonModal}>
                        {isSubmitting ? 'Creating...' : 'Create Study'}
                    </button>
                </div>
            </form>
       </Modal>

       {/* Edit Study Modal */}
       <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setError(null); }} title="Edit Study">
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
                     <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting} className={styles.secondaryButtonModal}>Cancel</button>
                     <button type="submit" disabled={isSubmitting || !editStudyName.trim()} className={styles.primaryButtonModal}>
                        {isSubmitting ? 'Updating...' : 'Update Study'}
                    </button>
                </div>
            </form>
       </Modal>

    </DashboardLayout>
  );
}