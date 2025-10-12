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
  const [selectedTestType, setSelectedTestType] = useState(TEST_TYPES[0]?.id || 'corsi');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setIsSubmitting(true);
      setError(null);
      try {
          const res = await fetch('/api/studies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: newStudyName,
                description: newStudyDescription,
                testType: selectedTestType
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
          setSelectedTestType(TEST_TYPES[0]?.id || 'corsi');
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
      if (!window.confirm(`Are you sure you want to delete the study "${studyName}"? This will permanently delete all participants, assignments, and results associated with this study. This cannot be undone.`)) {
          return;
      }
      setError(null);
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

      {isLoading && <p className={styles.loadingText}>Loading studies...</p>}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!isLoading && !error && studies.length === 0 && (
        <p>You haven't created any studies yet.</p>
      )}

      {!isLoading && !error && studies.length > 0 && (
        <div className={styles.listContainer}>
          {studies.map(study => {
            const testConfig = TEST_TYPES.find(t => t.id === study.testType);
            return (
              <div key={study.id} className={styles.listItem}>
                <Link href={`/dashboard/studies/${study.id}`}>
                  <div className={styles.listItemLink}>
                      <div className={styles.studyHeader}>
                        <h3>{study.name}</h3>
                        {testConfig && (
                          <span className={styles.testBadge} style={{ backgroundColor: testConfig.color }}>
                            {testConfig.icon} {testConfig.titleKey.replace('_title', '').toUpperCase()}
                          </span>
                        )}
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
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteStudy(study.id, study.name); }}
                    className={styles.deleteButton}
                    title="Delete study"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

       {/* Create Study Modal */}
       <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Study">
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
                    <label htmlFor="testType">Select Test *</label>
                    <select
                        id="testType"
                        value={selectedTestType}
                        onChange={(e) => setSelectedTestType(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className={styles.selectInput}
                    >
                        {TEST_TYPES.map(test => (
                            <option key={test.id} value={test.id}>
                                {test.icon} {test.titleKey.replace('_title', '').toUpperCase().replace('_', ' ')}
                            </option>
                        ))}
                    </select>
                    <small>This test will be automatically assigned to all participants in this study.</small>
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
       <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Study">
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