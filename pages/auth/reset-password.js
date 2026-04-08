import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from '../../styles/signin.module.css';

export async function getServerSideProps({ locale }) {
    return {
        props: {
            ...(await serverSideTranslations(locale ?? 'en', ['common'])),
        },
    };
}

export default function ResetPassword() {
    const router = useRouter();
    const { t } = useTranslation('common');
    const { token } = router.query;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState(null); // null, 'submitting', 'success', 'expired', 'invalid', 'error'
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError(t('auth_signup_error_passwords_mismatch'));
            return;
        }
        if (password.length < 8) {
            setError(t('auth_signup_error_password_length'));
            return;
        }

        setStatus('submitting');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
            } else {
                setStatus(data.message === 'expired' ? 'expired' : data.message === 'invalid' ? 'invalid' : 'error');
            }
        } catch {
            setStatus('error');
        }
    };

    if (!token && router.isReady) {
        return (
            <div className={styles.signInContainer}>
                <div className={styles.signInBox}>
                    <h1>{t('auth_reset_invalid_title')}</h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        {t('auth_reset_invalid_text')}
                    </p>
                    <div className={styles.signUpLink}>
                        <Link href="/auth/forgot-password"><div>{t('auth_reset_request_new')}</div></Link>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className={styles.signInContainer}>
                <div className={styles.signInBox}>
                    <h1>{t('auth_reset_success_title')}</h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        {t('auth_reset_success_text')}
                    </p>
                    <button
                        onClick={() => router.push('/auth/signin')}
                        className={styles.submitButton}
                    >
                        {t('auth_signin_title')}
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'expired') {
        return (
            <div className={styles.signInContainer}>
                <div className={styles.signInBox}>
                    <h1>{t('auth_reset_expired_title')}</h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        {t('auth_reset_expired_text')}
                    </p>
                    <button
                        onClick={() => router.push('/auth/forgot-password')}
                        className={styles.submitButton}
                    >
                        {t('auth_reset_request_new')}
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className={styles.signInContainer}>
                <div className={styles.signInBox}>
                    <h1>{t('auth_reset_invalid_title')}</h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        {t('auth_reset_invalid_text')}
                    </p>
                    <div className={styles.signUpLink}>
                        <Link href="/auth/forgot-password"><div>{t('auth_reset_request_new')}</div></Link>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={styles.signInContainer}>
                <div className={styles.signInBox}>
                    <h1>{t('auth_verify_error_title')}</h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        {t('auth_reset_error_text')}
                    </p>
                    <div className={styles.signUpLink}>
                        <Link href="/auth/forgot-password"><div>{t('auth_reset_request_new')}</div></Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.signInContainer}>
            <div className={styles.signInBox}>
                <h1>{t('auth_reset_title')}</h1>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    {t('auth_reset_description')}
                </p>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="password">{t('auth_reset_new_password_label')}</label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={status === 'submitting'}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword">{t('auth_signup_confirm_password_label')}</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={status === 'submitting'}
                        />
                    </div>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={status === 'submitting'}
                    >
                        {status === 'submitting' ? t('auth_reset_submitting') : t('auth_reset_submit')}
                    </button>
                </form>
            </div>
        </div>
    );
}
