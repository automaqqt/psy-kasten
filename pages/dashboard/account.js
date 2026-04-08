import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { fetchWithCsrf } from '../../lib/fetchWithCsrf';
import styles from '../../styles/DashboardPage.module.css';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'dashboard'])),
    },
  };
}

export default function AccountPage() {
  const { data: session } = useSession();
  const { t } = useTranslation('dashboard');
  const [confirmText, setConfirmText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (confirmText !== t('account_delete_keyword', 'DELETE')) return;

    setDeleting(true);
    setError('');

    try {
      const res = await fetchWithCsrf('/api/user/delete-account', {
        method: 'DELETE',
      });

      if (res.ok) {
        signOut({ callbackUrl: '/' });
      } else {
        const data = await res.json();
        setError(data.message || t('account_delete_error'));
        setDeleting(false);
      }
    } catch {
      setError(t('account_delete_error'));
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.pageHeader}>
        <h1>{t('account_title')}</h1>
      </div>

      <div style={{ maxWidth: 600, padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {t('account_info_title')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
          {session?.user?.name && (
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('account_name_label')}:</span>{' '}
              <span style={{ color: 'var(--text-primary)' }}>{session.user.name}</span>
            </div>
          )}
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('account_email_label')}:</span>{' '}
            <span style={{ color: 'var(--text-primary)' }}>{session?.user?.email}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('account_role_label')}:</span>{' '}
            <span style={{ color: 'var(--text-primary)' }}>{session?.user?.role || 'RESEARCHER'}</span>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#dc3545' }}>
          {t('account_danger_title')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          {t('account_delete_warning')}
        </p>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: 'transparent',
              color: '#dc3545',
              border: '1px solid #dc3545',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.target.style.backgroundColor = '#dc3545'; e.target.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#dc3545'; }}
          >
            {t('account_delete_btn')}
          </button>
        ) : (
          <div style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #dc3545', background: 'var(--bg-accent)' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 500 }}>
              {t('account_delete_confirm_text', { keyword: t('account_delete_keyword', 'DELETE') })}
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t('account_delete_keyword', 'DELETE')}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.9rem',
                marginBottom: '0.75rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
            {error && (
              <p style={{ color: '#dc3545', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleDelete}
                disabled={confirmText !== t('account_delete_keyword', 'DELETE') || deleting}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: confirmText === t('account_delete_keyword', 'DELETE') ? '#dc3545' : 'var(--border-color)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: confirmText === t('account_delete_keyword', 'DELETE') ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? t('deleting') : t('account_delete_confirm_btn')}
              </button>
              <button
                onClick={() => { setShowConfirm(false); setConfirmText(''); setError(''); }}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
