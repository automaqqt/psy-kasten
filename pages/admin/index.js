import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Link from 'next/link';
import { getSession, useSession } from 'next-auth/react';
import { fetchWithCsrf } from '../../lib/fetchWithCsrf';
import prisma from '../../lib/prisma';
import { UserRole } from '@prisma/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from '../../styles/AdminDashboard.module.css';

export async function getServerSideProps(context) {
    const session = await getSession(context);
    if (!session) {
        return {
            redirect: { destination: `/auth/signin?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`, permanent: false },
        };
    }

    let userRole = null;
    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });
        userRole = user?.role;
    } catch {
        return { redirect: { destination: '/500', permanent: false } };
    }

    if (userRole !== UserRole.ADMIN) {
        return { notFound: true };
    }

    return {
        props: {
            ...(await serverSideTranslations(context.locale ?? 'en', ['common'])),
        },
    };
}

function StatCard({ label, value, color, sub }) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statLabel}>{label}</div>
            <div className={`${styles.statValue} ${styles[color] || ''}`}>{value}</div>
            {sub && <div className={styles.statSub}>{sub}</div>}
        </div>
    );
}

function DataTable({ type, activeType, searchQuery, currentUserId }) {
    const [data, setData] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [togglingRole, setTogglingRole] = useState(null);

    const fetchData = useCallback(async () => {
        if (type !== activeType) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ type, page: String(page) });
            if (searchQuery) params.set('q', searchQuery);
            const res = await fetch(`/api/admin/search?${params}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [type, activeType, page, searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, activeType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleRole = async (userId, currentRole, email) => {
        const newRole = currentRole === 'ADMIN' ? 'RESEARCHER' : 'ADMIN';

        if (newRole === 'ADMIN') {
            const input = window.prompt(`This will grant full admin access to "${email}".\n\nType ADMIN to confirm:`);
            if (input !== 'ADMIN') return;
        } else {
            if (!window.confirm(`Remove admin privileges from "${email}"?`)) return;
        }

        setTogglingRole(userId);
        try {
            const res = await fetchWithCsrf(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                fetchData();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to update role');
            }
        } catch {
            alert('Failed to update role');
        } finally {
            setTogglingRole(null);
        }
    };

    const [deletingUser, setDeletingUser] = useState(null);

    const handleDeleteUser = async (userId, email) => {
        const input = window.prompt(`This will permanently delete "${email}" and all their studies, participants, and results.\n\nType DELETE to confirm:`);
        if (input !== 'DELETE') return;

        setDeletingUser(userId);
        try {
            const res = await fetchWithCsrf(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchData();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to delete user');
            }
        } catch {
            alert('Failed to delete user');
        } finally {
            setDeletingUser(null);
        }
    };

    if (type !== activeType || !data) return null;

    const totalPages = Math.ceil(data.total / data.pageSize);

    return (
        <div>
            <div className={styles.tableInfo}>
                {data.total} result{data.total !== 1 ? 's' : ''}
                {totalPages > 1 && ` — Page ${data.page} of ${totalPages}`}
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {type === 'users' && (
                                <>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Verified</th>
                                    <th>Studies</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </>
                            )}
                            {type === 'studies' && (
                                <>
                                    <th>Name</th>
                                    <th>Researcher</th>
                                    <th>Tests</th>
                                    <th>Participants</th>
                                    <th>Assignments</th>
                                    <th>Created</th>
                                </>
                            )}
                            {type === 'proposals' && (
                                <>
                                    <th>File</th>
                                    <th>Researcher</th>
                                    <th>Notes</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className={styles.tableLoading}>Loading...</td></tr>
                        ) : data.items.length === 0 ? (
                            <tr><td colSpan={6} className={styles.tableEmpty}>No results found</td></tr>
                        ) : (
                            <>
                                {type === 'users' && data.items.map(u => (
                                    <tr key={u.id}>
                                        <td className={styles.cellPrimary}>{u.name || '—'}</td>
                                        <td>{u.email}</td>
                                        <td><span className={`${styles.badge} ${u.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeResearcher}`}>{u.role}</span></td>
                                        <td>{u.emailVerified ? <span className={styles.textGreen}>Yes</span> : <span className={styles.textAmber}>No</span>}</td>
                                        <td>{u._count?.studies || 0}</td>
                                        <td className={styles.cellDate}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {u.id === currentUserId ? (
                                                <span className={styles.cellMuted}>You</span>
                                            ) : (
                                                <div className={styles.actionBtns}>
                                                    <button
                                                        className={u.role === 'ADMIN' ? styles.demoteBtn : styles.promoteBtn}
                                                        onClick={() => handleToggleRole(u.id, u.role, u.email)}
                                                        disabled={togglingRole === u.id || deletingUser === u.id}
                                                    >
                                                        {togglingRole === u.id ? '...' : u.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                                                    </button>
                                                    <button
                                                        className={styles.deleteBtn}
                                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                                        disabled={togglingRole === u.id || deletingUser === u.id}
                                                    >
                                                        {deletingUser === u.id ? '...' : 'Delete'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {type === 'studies' && data.items.map(s => (
                                    <tr key={s.id}>
                                        <td className={styles.cellPrimary}>
                                            <Link href={`/dashboard/studies/${s.id}`}>{s.name}</Link>
                                        </td>
                                        <td>{s.researcher?.name || s.researcher?.email || '—'}</td>
                                        <td>
                                            <div className={styles.testBadges}>
                                                {(Array.isArray(s.testTypes) ? s.testTypes : []).map(t => (
                                                    <span key={t} className={styles.testBadge}>{t}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>{s._count?.participants || 0}</td>
                                        <td>{s._count?.testAssignments || 0}</td>
                                        <td className={styles.cellDate}>{new Date(s.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {type === 'proposals' && data.items.map(p => (
                                    <tr key={p.id}>
                                        <td className={styles.cellPrimary}>{p.originalFilename}</td>
                                        <td>{p.researcher?.name || p.researcher?.email || '—'}</td>
                                        <td className={styles.cellTruncate}>{p.notes || '—'}</td>
                                        <td>
                                            <span className={`${styles.badge} ${p.isReviewed ? styles.badgeReviewed : styles.badgePending}`}>
                                                {p.isReviewed ? 'Reviewed' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className={styles.cellDate}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                        className={styles.pageBtn}
                    >
                        Previous
                    </button>
                    <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className={styles.pageBtn}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setStats(data); })
            .finally(() => setLoading(false));
    }, []);

    const tabs = [
        { id: 'users', label: 'Users' },
        { id: 'studies', label: 'Studies' },
        { id: 'proposals', label: 'Proposals' },
    ];

    return (
        <DashboardLayout>
            <div className={styles.pageHeader}>
                <h1>Admin Dashboard</h1>
                <Link href="/admin/proposals" className={styles.secondaryLink}>
                    Manage Proposals
                </Link>
            </div>

            {loading ? (
                <p className={styles.loadingText}>Loading stats...</p>
            ) : stats && (
                <>
                    <div className={styles.statsGrid}>
                        <StatCard label="Total Users" value={stats.stats.totalUsers} color="blue"
                            sub={`${stats.stats.verifiedUsers} verified`} />
                        <StatCard label="Studies" value={stats.stats.totalStudies} color="green" />
                        <StatCard label="Participants" value={stats.stats.totalParticipants} color="teal" />
                        <StatCard label="Assignments" value={stats.stats.totalAssignments} color="amber"
                            sub={`${stats.stats.completionRate}% completed`} />
                        <StatCard label="Results" value={stats.stats.totalResults} color="purple" />
                        <StatCard label="Proposals" value={stats.stats.totalProposals} color="rose"
                            sub={stats.stats.pendingProposals > 0 ? `${stats.stats.pendingProposals} pending` : 'All reviewed'} />
                    </div>

                    <div className={styles.lookupSection}>
                        <h2>Lookup</h2>
                        <div className={styles.tabBar}>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                                    onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className={styles.searchRow}>
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                        <DataTable type="users" activeType={activeTab} searchQuery={debouncedQuery} currentUserId={session?.user?.id} />
                        <DataTable type="studies" activeType={activeTab} searchQuery={debouncedQuery} currentUserId={session?.user?.id} />
                        <DataTable type="proposals" activeType={activeTab} searchQuery={debouncedQuery} currentUserId={session?.user?.id} />
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
