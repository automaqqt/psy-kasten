import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { fetchWithCsrf } from '../../../lib/fetchWithCsrf';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const ParticipantList = ({ participants, onDeleteParticipant, onEditParticipant, onEditMetadata, onAddParticipant, onRegenerateLink, onShareLink, testType, deletingParticipantId, regeneratingAssignmentId }) => {
    const [copiedLinkId, setCopiedLinkId] = React.useState(null);
    const { t } = useTranslation('dashboard');

    if (!participants || participants.length === 0) {
        return (
            <div className={styles.emptyState}>
                <h4>{t('no_participants_title')}</h4>
                <p>{t('no_participants_text')}</p>
                <button onClick={onAddParticipant} className={styles.addButton}>
                    {t('add_first_participant')}
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
                        <th>{t('col_identifier')}</th>
                        <th>{t('col_metadata')}</th>
                        <th>{t('col_status')}</th>
                        <th>{t('col_created')}</th>
                        <th>{t('col_actions')}</th>
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
                                        title={t('col_metadata')}
                                    >
                                        {t('metadata_fields', { count: metadataCount })}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onEditMetadata(p)}
                                        className={styles.metadataButtonEmpty}
                                        title={t('add_metadata')}
                                    >
                                        {t('add_metadata')}
                                    </button>
                                )}
                            </td>
                            <td>
                                <span className={`${styles.statusBadge} ${assignment?.completedAt ? styles.statusCompleted : (isExpired ? styles.statusExpired : styles.statusPending)}`}>
                                    {assignment?.completedAt ? t('status_completed') : (isExpired ? t('status_expired') : t('status_pending'))}
                                </span>
                            </td>
                            <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className={styles.actionsCell}>
                                {testLink && !isExpired && (
                                    <>
                                        <button
                                            onClick={() => onShareLink(testLink, p.identifier)}
                                            className={styles.actionButtonShare}
                                            title={t('share')}
                                            disabled={deletingParticipantId === p.id}
                                        >
                                            {t('share')}
                                        </button>
                                        <button onClick={() => handleOpenLink(testLink)} className={styles.actionButtonOpen} title={t('open')} disabled={deletingParticipantId === p.id}>
                                            {t('open')}
                                        </button>
                                        <button
                                            onClick={() => handleCopyLink(testLink, p.id)}
                                            className={`${styles.actionButtonCopy} ${isCopied ? styles.actionButtonCopied : ''}`}
                                            title={isCopied ? t('copied') : t('copy')}
                                            disabled={deletingParticipantId === p.id}
                                        >
                                            {isCopied ? t('copied') : t('copy')}
                                        </button>
                                    </>
                                )}
                                {isExpired && assignment && (
                                    <button
                                        onClick={() => onRegenerateLink(assignment.id)}
                                        className={styles.actionButtonRegenerate}
                                        title={t('regenerate')}
                                        disabled={regeneratingAssignmentId === assignment.id || deletingParticipantId === p.id}
                                    >
                                        {regeneratingAssignmentId === assignment.id ? t('regenerating') : t('regenerate')}
                                    </button>
                                )}
                                <button onClick={() => onEditParticipant(p)} className={styles.actionButtonEdit} title={t('edit')} disabled={deletingParticipantId === p.id}>
                                    {t('edit')}
                                </button>
                                <button onClick={() => onDeleteParticipant(p.id)} className={styles.actionButtonDelete} title={t('delete')} disabled={deletingParticipantId === p.id}>
                                    {deletingParticipantId === p.id ? t('deleting') : t('delete')}
                                </button>
                                <Link href={`/dashboard/results?participantId=${p.id}`}>
                                    <div className={styles.actionButtonView} title={t('results')}>{t('results')}</div>
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


export async function getServerSideProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'dashboard'])),
        },
    };
}

export default function StudyDetailPage() {
  const router = useRouter();
  const { studyId } = router.query;
  const { t } = useTranslation('dashboard');
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

  // Public Link State
  const [isTogglingPublicLink, setIsTogglingPublicLink] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  // Search, Filter & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [participantPage, setParticipantPage] = useState(1);
  const PARTICIPANTS_PER_PAGE = 20;

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
          const res = await fetchWithCsrf('/api/participants', {
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
      if (!window.confirm(t('confirm_regenerate'))) {
          return;
      }
      setRegeneratingAssignmentId(assignmentId);
      setError(null);
      try {
          const res = await fetchWithCsrf(`/api/assignments/${assignmentId}/regenerate`, { method: 'POST' });
          const data = await res.json();
          if (!res.ok) {
              throw new Error(data.message || 'Failed to regenerate link');
          }
          alert(t('regenerate_success'));
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

      const confirmMessage = t('confirm_delete_participant', {
          identifier: participant?.identifier,
          assignments: assignmentCount,
          results: completedCount,
      });

      if (!window.confirm(confirmMessage)) {
          return;
      }
       setError(null);
       setDeletingParticipantId(participantId);
       try {
          const res = await fetchWithCsrf(`/api/participants/${participantId}`, { method: 'DELETE' });
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
          const res = await fetchWithCsrf(`/api/participants/${participantId}`, {
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
          const res = await fetchWithCsrf(`/api/participants/${editingParticipant.id}`, {
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
          const res = await fetchWithCsrf(`/api/studies/${studyId}`, {
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
          t('confirm_duplicate_study', { name: study.name })
      );

      setIsDuplicating(true);
      setError(null);
      try {
          const res = await fetchWithCsrf(`/api/studies/${studyId}/duplicate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ copyParticipants })
          });
          const data = await res.json();
          if (!res.ok) {
              throw new Error(data.message || 'Failed to duplicate study');
          }
          alert(t('duplicate_success'));
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

      const confirmMessage = t('confirm_delete_study_detail', {
          name: study.name,
          participants: participantCount,
          assignments: assignmentCount,
          results: completedCount,
      });

      const userInput = window.prompt(confirmMessage);
      if (userInput !== t('confirm_delete_keyword')) {
          return;
      }
      setError(null);
      setDeletingStudy(true);
      try {
          const res = await fetchWithCsrf(`/api/studies/${studyId}`, { method: 'DELETE' });
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


  // --- Public Link Handlers ---
  const publicJoinUrl = study?.publicAccessKey
      ? `${window.location.origin}/join/${study.publicAccessKey}`
      : null;

  const handleTogglePublicLink = async (enable) => {
      setIsTogglingPublicLink(true);
      setError(null);
      try {
          const res = await fetchWithCsrf(`/api/studies/${studyId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  name: study.name,
                  description: study.description || '',
                  publicLinkEnabled: enable,
              }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to update public link');
          fetchStudyData();
      } catch (err) {
          setError(err.message);
      } finally {
          setIsTogglingPublicLink(false);
      }
  };

  const handleChangeNamingMode = async (mode) => {
      setError(null);
      try {
          const res = await fetchWithCsrf(`/api/studies/${studyId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  name: study.name,
                  description: study.description || '',
                  participantNaming: mode,
              }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to update naming mode');
          fetchStudyData();
      } catch (err) {
          setError(err.message);
      }
  };

  const handleCopyPublicLink = () => {
      if (!publicJoinUrl) return;
      navigator.clipboard.writeText(publicJoinUrl).then(() => {
          setCopiedPublicLink(true);
          setTimeout(() => setCopiedPublicLink(false), 2000);
      });
  };

  // --- Search, Filter & Pagination ---
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesId = p.identifier.toLowerCase().includes(q);
        const matchesMeta = p.metadata && JSON.stringify(p.metadata).toLowerCase().includes(q);
        if (!matchesId && !matchesMeta) return false;
      }
      if (statusFilter) {
        const assignment = p.assignments?.[0];
        const isExpired = assignment?.expiresAt && new Date(assignment.expiresAt) < new Date();
        const status = assignment?.completedAt ? 'completed' : (isExpired ? 'expired' : 'pending');
        if (status !== statusFilter) return false;
      }
      return true;
    });
  }, [participants, searchQuery, statusFilter]);

  const totalParticipantPages = Math.ceil(filteredParticipants.length / PARTICIPANTS_PER_PAGE);
  const paginatedParticipants = filteredParticipants.slice(
    (participantPage - 1) * PARTICIPANTS_PER_PAGE,
    participantPage * PARTICIPANTS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setParticipantPage(1);
  }, [searchQuery, statusFilter]);

  const getPageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // --- Render ---
  if (isLoading) return <DashboardLayout><p className={styles.loadingText}>{t('loading_study')}</p></DashboardLayout>;
  if (error && !study) return <DashboardLayout><p className={styles.errorTextPage}>Error: {error}</p></DashboardLayout>;
   if (!study) return <DashboardLayout><p>{t('result_not_found')}</p></DashboardLayout>;


  return (
    <DashboardLayout>
      <div className={styles.pageHeader}>
        <h1>{study.name}</h1>
        <div className={styles.headerActions}>
          <button onClick={handleDuplicateStudy} className={styles.secondaryButton} title={t('duplicate')} disabled={deletingStudy || isDuplicating}>
            {isDuplicating ? t('duplicating') : t('duplicate')}
          </button>
          <button onClick={handleEditStudy} className={styles.editButton} title={t('edit')} disabled={deletingStudy || isDuplicating}>
            {t('edit')}
          </button>
          <button onClick={handleDeleteStudy} className={styles.deleteButton} title={t('delete')} disabled={deletingStudy || isDuplicating}>
            {deletingStudy ? t('deleting') : t('delete')}
          </button>
        </div>
      </div>
      {error && <p className={styles.errorTextPage}>{error}</p>}
      <p className={styles.studyDescription}>{study.description || t('no_description_provided')}</p>

       {/* Analytics Section */}
       {participants.length > 0 && (
           <section className={styles.section}>
               <StudyAnalytics studyId={studyId} />
           </section>
       )}

       {/* Public Participation Link */}
       <section className={styles.section}>
           <div className={styles.sectionHeader}>
               <h2>{t('public_link_title')}</h2>
           </div>

           {study.publicAccessKey ? (
               <div className={styles.publicLinkContainer}>
                   <div className={styles.publicLinkRow}>
                       <input
                           type="text"
                           value={publicJoinUrl || ''}
                           readOnly
                           className={styles.publicLinkInput}
                       />
                       <button
                           onClick={handleCopyPublicLink}
                           className={styles.actionButtonCopy}
                       >
                           {copiedPublicLink ? t('copied') : t('copy')}
                       </button>
                       <button
                           onClick={() => handleTogglePublicLink(false)}
                           className={styles.actionButtonDelete}
                           disabled={isTogglingPublicLink}
                       >
                           {t('public_link_disable')}
                       </button>
                   </div>

                   <div className={styles.publicLinkOptions}>
                       <label className={styles.publicLinkLabel}>{t('public_link_naming_label')}</label>
                       <select
                           value={study.participantNaming || 'self'}
                           onChange={(e) => handleChangeNamingMode(e.target.value)}
                           className={styles.filterSelect}
                       >
                           <option value="self">{t('public_link_naming_self')}</option>
                           <option value="random">{t('public_link_naming_random')}</option>
                       </select>
                   </div>
               </div>
           ) : (
               <div className={styles.publicLinkContainer}>
                   <p className={styles.publicLinkDescription}>
                       {t('public_link_description')}
                   </p>
                   <button
                       onClick={() => handleTogglePublicLink(true)}
                       className={styles.addButton}
                       disabled={isTogglingPublicLink}
                   >
                       {isTogglingPublicLink ? t('public_link_enabling') : t('public_link_enable')}
                   </button>
               </div>
           )}
       </section>

       <section className={styles.section}>
           <div className={styles.sectionHeader}>
               <h2>{t('participants_section', { count: participants.length })}</h2>
               <div className={styles.sectionHeaderActions}>
                   <button onClick={() => setIsAddParticipantModalOpen(true)} className={styles.addButton}>
                       {t('add_participant')}
                   </button>
                   <button onClick={() => setIsBulkImportModalOpen(true)} className={styles.secondaryButton} title={t('bulk_import_title')}>
                       {t('bulk_import')}
                   </button>
               </div>
           </div>

           {participants.length > 0 && (
               <div className={styles.searchFilterBar}>
                   <input
                       type="text"
                       placeholder={t('search_participants')}
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className={styles.searchInput}
                   />
                   <select
                       value={statusFilter}
                       onChange={(e) => setStatusFilter(e.target.value)}
                       className={styles.filterSelect}
                   >
                       <option value="">{t('all_statuses')}</option>
                       <option value="completed">{t('status_completed')}</option>
                       <option value="pending">{t('status_pending')}</option>
                       <option value="expired">{t('status_expired')}</option>
                   </select>
                   {filteredParticipants.length !== participants.length && (
                       <span className={styles.filterCount}>
                           {t('filter_count', { filtered: filteredParticipants.length, total: participants.length })}
                       </span>
                   )}
               </div>
           )}

           {participants.length === 0 ? (
               <ParticipantList
                   participants={[]}
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
           ) : filteredParticipants.length === 0 ? (
               <div className={styles.emptyFilterState}>
                   {t('no_participants_match')}
               </div>
           ) : (
               <>
                   <ParticipantList
                       participants={paginatedParticipants}
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
                   {totalParticipantPages > 1 && (
                       <div className={styles.pagination}>
                           <button
                               className={styles.pageButton}
                               disabled={participantPage === 1}
                               onClick={() => setParticipantPage(p => p - 1)}
                           >
                               {t('previous')}
                           </button>
                           {getPageNumbers(participantPage, totalParticipantPages).map((page, i) =>
                               page === '...' ? (
                                   <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>...</span>
                               ) : (
                                   <button
                                       key={page}
                                       className={page === participantPage ? styles.pageButtonActive : styles.pageButton}
                                       onClick={() => setParticipantPage(page)}
                                   >
                                       {page}
                                   </button>
                               )
                           )}
                           <button
                               className={styles.pageButton}
                               disabled={participantPage === totalParticipantPages}
                               onClick={() => setParticipantPage(p => p + 1)}
                           >
                               {t('next')}
                           </button>
                       </div>
                   )}
               </>
           )}
       </section>

       {/* Add Participant Modal */}
       <Modal isOpen={isAddParticipantModalOpen} onClose={() => { setIsAddParticipantModalOpen(false); setError(null); }} title={t('add_participant_modal_title')}>
            <form onSubmit={handleAddParticipantSubmit}>
                 {error && <p className={styles.errorTextModal}>{error}</p>}
                 <div className={styles.formGroup}>
                     <label htmlFor="participantIdentifier">{t('participant_identifier_label')}</label>
                     <input
                         type="text"
                         id="participantIdentifier"
                         value={newParticipantIdentifier}
                         onChange={(e) => setNewParticipantIdentifier(e.target.value)}
                         placeholder={t('participant_identifier_placeholder')}
                         required
                         disabled={isSubmitting}
                     />
                      <small>{t('participant_identifier_help')}</small>
                 </div>
                  <div className={styles.modalActions}>
                     <button type="button" onClick={() => setIsAddParticipantModalOpen(false)} disabled={isSubmitting} className={styles.secondaryButtonModal}>{t('cancel')}</button>
                     <button type="submit" disabled={isSubmitting || !newParticipantIdentifier.trim()} className={styles.primaryButtonModal}>
                        {isSubmitting ? t('adding') : t('add_participant_btn')}
                    </button>
                </div>
            </form>
       </Modal>

       {/* Edit Participant Modal */}
       <Modal isOpen={isEditParticipantModalOpen} onClose={() => { setIsEditParticipantModalOpen(false); setError(null); }} title={t('edit_participant_modal_title')}>
            <form onSubmit={handleEditParticipantSubmit}>
                 {error && <p className={styles.errorTextModal}>{error}</p>}
                 <div className={styles.formGroup}>
                     <label htmlFor="editParticipantIdentifier">{t('participant_identifier_label')}</label>
                     <input
                         type="text"
                         id="editParticipantIdentifier"
                         value={editParticipantIdentifier}
                         onChange={(e) => setEditParticipantIdentifier(e.target.value)}
                         placeholder={t('participant_identifier_placeholder')}
                         required
                         disabled={isSubmitting}
                     />
                      <small>{t('participant_identifier_help')}</small>
                 </div>
                  <div className={styles.modalActions}>
                     <button type="button" onClick={() => setIsEditParticipantModalOpen(false)} disabled={isSubmitting} className={styles.secondaryButtonModal}>{t('cancel')}</button>
                     <button type="submit" disabled={isSubmitting || !editParticipantIdentifier.trim()} className={styles.primaryButtonModal}>
                        {isSubmitting ? t('updating') : t('update_participant_btn')}
                    </button>
                </div>
            </form>
       </Modal>

       {/* Edit Study Modal */}
       <Modal isOpen={isEditStudyModalOpen} onClose={() => { setIsEditStudyModalOpen(false); setError(null); }} title={t('edit_study_title')}>
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
                     <button type="button" onClick={() => setIsEditStudyModalOpen(false)} disabled={isSubmitting} className={styles.secondaryButtonModal}>{t('cancel')}</button>
                     <button type="submit" disabled={isSubmitting || !editStudyName.trim()} className={styles.primaryButtonModal}>
                        {isSubmitting ? t('updating') : t('update_study_btn')}
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
