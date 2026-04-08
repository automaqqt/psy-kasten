import { useState } from 'react';
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

export default function ForgotPassword() {
    const { t } = useTranslation('common');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null); // null, 'sending', 'sent', 'error'
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setStatus('sending');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok && res.status === 429) {
                setError(t('auth_forgot_error_rate_limit'));
                setStatus(null);
                return;
            }

            setStatus('sent');
        } catch {
            setError(t('auth_forgot_error_default'));
            setStatus(null);
        }
    };

    return (
        <div className={styles.signInContainer}>
            <div className={styles.signInBox}>
                <h1>{t('auth_forgot_title')}</h1>

                {status === 'sent' ? (
                    <>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            {t('auth_forgot_sent_text')}
                        </p>
                        <div className={styles.signUpLink}>
                            <Link href="/auth/signin"><div>{t('auth_verify_go_to_signin')}</div></Link>
                        </div>
                    </>
                ) : (
                    <>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                            {t('auth_forgot_description')}
                        </p>

                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label htmlFor="email">{t('auth_signin_email_label')}</label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === 'sending'}
                                />
                            </div>
                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={status === 'sending'}
                            >
                                {status === 'sending' ? t('auth_forgot_sending') : t('auth_forgot_submit')}
                            </button>
                        </form>

                        <div className={styles.signUpLink}>
                            <Link href="/auth/signin"><div>{t('auth_forgot_back_to_signin')}</div></Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
