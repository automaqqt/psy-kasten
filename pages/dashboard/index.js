import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Link from 'next/link';
import styles from '../../styles/DashboardPage.module.css'; // Create this CSS file
import Modal from '../../components/ui/modal';
import { TEST_TYPES } from '../../lib/testConfig';
import { fetchWithCsrf } from '../../lib/fetchWithCsrf';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Basic Modal Component (can be extracted to its own file)



export async function getServerSideProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'dashboard'])),
        },
    };
}

export default function DashboardHome() {
  const { t } = useTranslation('dashboard');
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
          setError(t('error_study_name_empty'));
          return;
      }
      if (!selectedTestTypes || selectedTestTypes.length === 0) {
          setError(t('error_select_test'));
          return;
      }
      setIsSubmitting(true);
      setError(null);
      try {
          const res = await fetchWithCsrf('/api/studies', {
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
          const res = await fetchWithCsrf(`/api/studies/${editingStudy.id}`, {
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

      const confirmMessage = t('confirm_delete_study', {
          name: studyName,
          participants: participantCount,
          assignments: assignmentCount,
      });

      const userInput = window.prompt(confirmMessage);
      if (userInput !== t('confirm_delete_keyword')) {
          return;
      }
      setError(null);
      setDeletingStudyId(studyId); // Set loading state
      try {
          const res = await fetchWithCsrf(`/api/studies/${studyId}`, { method: 'DELETE' });
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
        <h1>{t('my_studies')}</h1>
        <button onClick={() => setIsCreateModalOpen(true)} className={styles.primaryButton}>
           {t('create_new_study')}
        </button>
      </div>

      {/* Dashboard Stats */}
      {!isLoading && !error && stats && (
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statBlue}`}>
            <div className={styles.statLabel}>{t('stat_total_studies')}</div>
            <div className={styles.statValue}>{stats.totalStudies}</div>
          </div>
          <div className={`${styles.statCard} ${styles.statGreen}`}>
            <div className={styles.statLabel}>{t('stat_total_participants')}</div>
            <div className={styles.statValue}>{stats.totalParticipants}</div>
          </div>
          <div className={`${styles.statCard} ${styles.statAmber}`}>
            <div className={styles.statLabel}>{t('stat_total_assignments')}</div>
            <div className={styles.statValue}>{stats.totalAssignments}</div>
          </div>
        </div>
      )}

      {isLoading && <p className={styles.loadingText}>{t('loading_studies')}</p>}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!isLoading && !error && studies.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}></div>
          <h3>{t('no_studies_title')}</h3>
          <p>{t('no_studies_text')}</p>
          <button onClick={() => setIsCreateModalOpen(true)} className={styles.primaryButton}>
            {t('create_first_study')}
          </button>
          <div className={styles.emptyStateHelp}>
            <p><strong>{t('quick_start_title')}</strong></p>
            <ol>
              <li>{t('quick_start_1')}</li>
              <li>{t('quick_start_2')}</li>
              <li>{t('quick_start_3')}</li>
              <li>{t('quick_start_4')}</li>
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
                        <div className={styles.badgeGroup}>
                          {testConfigs.map(testConfig => (
                            <span key={testConfig.id} className={styles.testBadge} style={{ backgroundColor: testConfig.color }}>
                              {testConfig.icon} {testConfig.titleKey.replace('_title', '').toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p>{study.description || t('no_description')}</p>
                      <div className={styles.listItemMeta}>
                          <span>{t('participants_meta')} {study._count?.participants ?? 0}</span>
                          <span>{t('assignments_meta')} {study._count?.testAssignments ?? 0}</span>
                          <span>{t('created_meta')} {new Date(study.createdAt).toLocaleDateString()}</span>
                      </div>
                  </div>
                </Link>
                <div className={styles.listItemActions}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditStudy(study); }}
                    className={styles.editButton}
                    title={t('edit')}
                    disabled={deletingStudyId === study.id}
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteStudy(study.id, study.name); }}
                    className={styles.deleteButton}
                    title={t('delete')}
                    disabled={deletingStudyId === study.id}
                  >
                    {deletingStudyId === study.id ? t('deleting') : t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Researcher Guide Banner */}
      <Link href="/info" className={styles.guideBanner}>
        <span className={styles.guideBannerText}>
          {t('dashboard_guide_text', 'New here? Check out the researcher guide for tips on studies, exports, and more.')}
        </span>
        <span className={styles.guideBannerArrow}>&rarr;</span>
      </Link>

       {/* Create Study Modal */}
       <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setError(null); }} title={t('create_study_title')}>
            <form onSubmit={handleCreateStudySubmit}>
                 {error && <p className={styles.errorTextModal}>{error}</p>}
                <div className={styles.formGroup}>
                    <label htmlFor="studyName">{t('study_name_label')}</label>
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
                    <label htmlFor="studyDescription">{t('description_optional_label')}</label>
                    <textarea
                        id="studyDescription"
                        value={newStudyDescription}
                        onChange={(e) => setNewStudyDescription(e.target.value)}
                        rows={3}
                        disabled={isSubmitting}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>{t('select_tests_label')}</label>
                    <div className={styles.checkboxGroup}>
                        {TEST_TYPES.map(test => (
                            <label key={test.id} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={selectedTestTypes.includes(test.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedTestTypes([...selectedTestTypes, test.id]);
                                        } else {
                                            setSelectedTestTypes(selectedTestTypes.filter(type => type !== test.id));
                                        }
                                    }}
                                    disabled={isSubmitting}
                                />
                                <span className={styles.testBadge} style={{ backgroundColor: test.color }}>
                                    {test.icon} {test.titleKey.replace('_title', '').toUpperCase().replace('_', ' ')}
                                </span>
                            </label>
                        ))}
                    </div>
                    <small>{t('select_tests_help')}</small>
                </div>
                 <div className={styles.modalActions}>
                     <button type="button" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting} className={styles.secondaryButtonModal}>{t('cancel')}</button>
                     <button type="submit" disabled={isSubmitting || !newStudyName.trim()} className={styles.primaryButtonModal}>
                        {isSubmitting ? t('creating') : t('create_study_btn')}
                    </button>
                </div>
            </form>
       </Modal>

       {/* Edit Study Modal */}
       <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setError(null); }} title={t('edit_study_title')}>
            <form onSubmit={handleEditStudySubmit}>
                 {error && <p className={styles.errorTextModal}>{error}</p>}
                <div className={styles.formGroup}>
                    <label htmlFor="editStudyName">{t('study_name_label')}</label>
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
                    <label htmlFor="editStudyDescription">{t('description_optional_label')}</label>
                    <textarea
                        id="editStudyDescription"
                        value={editStudyDescription}
                        onChange={(e) => setEditStudyDescription(e.target.value)}
                        rows={3}
                        disabled={isSubmitting}
                    />
                </div>
                 <div className={styles.modalActions}>
                     <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting} className={styles.secondaryButtonModal}>{t('cancel')}</button>
                     <button type="submit" disabled={isSubmitting || !editStudyName.trim()} className={styles.primaryButtonModal}>
                        {isSubmitting ? t('updating') : t('update_study_btn')}
                    </button>
                </div>
            </form>
       </Modal>

    </DashboardLayout>
  );
}