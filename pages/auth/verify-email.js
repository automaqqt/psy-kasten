import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
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

export default function VerifyEmail() {
    const router = useRouter();
    const { t } = useTranslation('common');
    const { token } = router.query;

    const [status, setStatus] = useState('loading'); // loading, verified, already_verified, expired, invalid, error

    useEffect(() => {
        if (!token) return;

        const verify = async () => {
            try {
                const res = await fetch(`/api/auth/verify-email?token=${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus(data.message); // 'verified' or 'already_verified'
                } else {
                    setStatus(data.message || 'error'); // 'expired', 'invalid'
                }
            } catch {
                setStatus('error');
            }
        };

        verify();
    }, [token]);

    if (!token && router.isReady) {
        return (
            <div className={styles.signInContainer}>
                <div className={styles.signInBox}>
                    <h1>{t('auth_verify_check_email_title')}</h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {t('auth_verify_check_email_text')}
                    </p>
                    <div className={styles.signUpLink}>
                        <Link href="/auth/signin"><div>{t('auth_verify_go_to_signin')}</div></Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.signInContainer}>
            <div className={styles.signInBox}>
                {status === 'loading' && (
                    <>
                        <h1>{t('auth_verify_loading_title')}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('auth_verify_loading_text')}</p>
                    </>
                )}

                {status === 'verified' && (
                    <>
                        <h1>{t('auth_verify_verified_title')}</h1>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            {t('auth_verify_verified_text')}
                        </p>
                        <button
                            onClick={() => router.push('/auth/signin')}
                            className={styles.submitButton}
                        >
                            {t('auth_signin_title')}
                        </button>
                    </>
                )}

                {status === 'already_verified' && (
                    <>
                        <h1>{t('auth_verify_already_title')}</h1>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            {t('auth_verify_already_text')}
                        </p>
                        <button
                            onClick={() => router.push('/auth/signin')}
                            className={styles.submitButton}
                        >
                            {t('auth_signin_title')}
                        </button>
                    </>
                )}

                {status === 'expired' && (
                    <>
                        <h1>{t('auth_verify_expired_title')}</h1>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            {t('auth_verify_expired_text')}
                        </p>
                        <button
                            onClick={() => router.push('/auth/signup')}
                            className={styles.submitButton}
                        >
                            {t('auth_verify_signup_again')}
                        </button>
                    </>
                )}

                {status === 'invalid' && (
                    <>
                        <h1>{t('auth_verify_invalid_title')}</h1>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            {t('auth_verify_invalid_text')}
                        </p>
                        <button
                            onClick={() => router.push('/auth/signup')}
                            className={styles.submitButton}
                        >
                            {t('auth_signup_submit')}
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h1>{t('auth_verify_error_title')}</h1>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            {t('auth_verify_error_text')}
                        </p>
                        <div className={styles.signUpLink}>
                            <Link href="/auth/signin"><div>{t('auth_verify_go_to_signin')}</div></Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
