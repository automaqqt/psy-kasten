import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import ExportConfigModal from '../../../components/export/ExportConfigModal';
import { TEST_TYPES } from '../../../lib/testConfig';
import { getMainScore } from '../../../lib/mainScoreFormatters';
import styles from '../../../styles/ResultsPage.module.css';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const RESULTS_PER_PAGE = 25;

const getPageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
};

const ResultTable = ({ results, t }) => {
    if (!results || results.length === 0) {
        return (
            <div className={styles.emptyState}>
                <h3>{t('no_results_title')}</h3>
                <p>{t('no_results_text')}</p>
                <p>{t('no_results_hint')}</p>
            </div>
        );
    }
    return (
        <table className={styles.resultsTable}>
            <thead>
                <tr>
                    <th>{t('col_participant')}</th>
                    <th>{t('col_study')}</th>
                    <th>{t('col_test_type')}</th>
                    <th>{t('col_completed_on')}</th>
                    <th>{t('col_score')}</th>
                    <th>{t('col_actions')}</th>
                </tr>
            </thead>
            <tbody>
                {results.map(res => {
                    const testType = res.testAssignment?.testType;
                    const d = res.data || {};
                    const mainScore = getMainScore(testType, d);

                    return (
                        <tr key={res.id}>
                            <td>{res.testAssignment?.participant?.identifier ?? 'N/A'}</td>
                            <td>{res.testAssignment?.study?.name ?? 'N/A'}</td>
                            <td>{res.testAssignment?.testType ?? 'Unknown'}</td>
                            <td>{res.testAssignment?.completedAt ? new Date(res.testAssignment.completedAt).toLocaleString() : t('incomplete')}</td>
                            <td>{mainScore}</td>
                            <td>
                                <Link href={`/dashboard/results/${res.id}`}>
                                    <button className={styles.actionButtonView}>{t('view_details')}</button>
                                </Link>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export async function getServerSideProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'dashboard'])),
        },
    };
}

export default function ResultsPage() {
    const { t } = useTranslation('dashboard');
    const router = useRouter();
    const [results, setResults] = useState([]);
    const [studies, setStudies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Filter State
    const [selectedStudyId, setSelectedStudyId] = useState('');
    const [selectedParticipantId, setSelectedParticipantId] = useState('');
    const [selectedTestType, setSelectedTestType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

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
            const studiesRes = await fetch('/api/studies');
            if (!studiesRes.ok) throw new Error('Failed to fetch studies');
            const studiesData = await studiesRes.json();
            setStudies(studiesData);

            const queryParams = new URLSearchParams();
            if (selectedStudyId) queryParams.append('studyId', selectedStudyId);
            if (selectedParticipantId) queryParams.append('participantId', selectedParticipantId);
            if (selectedTestType) queryParams.append('testType', selectedTestType);

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

    useEffect(() => {
        fetchData();
    }, [selectedStudyId, selectedParticipantId, selectedTestType]);

    // Client-side date filtering
    const filteredResults = useMemo(() => {
        if (!dateFrom && !dateTo) return results;
        return results.filter(res => {
            const completedAt = res.testAssignment?.completedAt;
            if (!completedAt) return false;
            const date = new Date(completedAt);
            if (dateFrom && date < new Date(dateFrom)) return false;
            if (dateTo) {
                const toEnd = new Date(dateTo);
                toEnd.setHours(23, 59, 59, 999);
                if (date > toEnd) return false;
            }
            return true;
        });
    }, [results, dateFrom, dateTo]);

    // Pagination
    const totalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE);
    const paginatedResults = filteredResults.slice(
        (currentPage - 1) * RESULTS_PER_PAGE,
        currentPage * RESULTS_PER_PAGE
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStudyId, selectedParticipantId, selectedTestType, dateFrom, dateTo]);

    const hasActiveFilters = selectedStudyId || selectedParticipantId || selectedTestType || dateFrom || dateTo;

    const clearAllFilters = () => {
        setSelectedStudyId('');
        setSelectedParticipantId('');
        setSelectedTestType('');
        setDateFrom('');
        setDateTo('');
    };

    const getStudyName = () => {
        if (selectedStudyId) {
            return studies.find(s => s.id === selectedStudyId)?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'study';
        }
        return 'all-studies';
    };

    return (
        <DashboardLayout>
            <div className={styles.pageHeader}>
                <h1>{t('test_results')}</h1>
                <button
                    onClick={() => setIsExportModalOpen(true)}
                    disabled={!filteredResults || filteredResults.length === 0}
                    className={styles.exportButton}
                    title={t('export_results')}
                >
                    {t('export_results')}
                </button>
            </div>

            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label htmlFor="studyFilter">{t('filter_study')}</label>
                    <select
                        id="studyFilter"
                        value={selectedStudyId}
                        onChange={(e) => setSelectedStudyId(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">{t('all_studies')}</option>
                        {studies.map(study => (
                            <option key={study.id} value={study.id}>{study.name}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label htmlFor="testTypeFilter">{t('filter_test_type')}</label>
                    <select
                        id="testTypeFilter"
                        value={selectedTestType}
                        onChange={(e) => setSelectedTestType(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">{t('all_types')}</option>
                        {TEST_TYPES.map(tt => (
                            <option key={tt.id} value={tt.id}>{tt.id.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label htmlFor="dateFrom">{t('filter_from')}</label>
                    <input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className={styles.filterDate}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label htmlFor="dateTo">{t('filter_to')}</label>
                    <input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className={styles.filterDate}
                    />
                </div>

                {hasActiveFilters && (
                    <button onClick={clearAllFilters} className={styles.clearFilters}>
                        {t('clear_filters')}
                    </button>
                )}

                {!isLoading && (
                    <span className={styles.resultCount}>
                        {t('result_count', { count: filteredResults.length })}
                    </span>
                )}
            </div>

            {isLoading && <p className={styles.loadingText}>{t('loading_results')}</p>}
            {error && <p className={styles.errorText}>Error: {error}</p>}

            {!isLoading && !error && (
                <>
                    <ResultTable results={paginatedResults} t={t} />
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageButton}
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                {t('previous')}
                            </button>
                            {getPageNumbers(currentPage, totalPages).map((page, i) =>
                                page === '...' ? (
                                    <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>...</span>
                                ) : (
                                    <button
                                        key={page}
                                        className={page === currentPage ? styles.pageButtonActive : styles.pageButton}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                )
                            )}
                            <button
                                className={styles.pageButton}
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                {t('next')}
                            </button>
                        </div>
                    )}
                </>
            )}

            <ExportConfigModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                results={filteredResults}
                studyName={getStudyName()}
            />
        </DashboardLayout>
    );
}
