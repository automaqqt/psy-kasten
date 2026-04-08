// pages/auth/signup.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from '../../styles/signup.module.css';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}

export default function SignUp() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // --- Client-side Validation ---
    if (password !== confirmPassword) {
      setError(t('auth_signup_error_passwords_mismatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth_signup_error_password_length'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError(t('auth_signup_error_invalid_email'));
        return;
    }
    if (!acceptedTerms) {
      setError(t('auth_signup_error_accept_terms'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || undefined, email, password }), // Send name only if not empty
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Error: ${res.status}`);
      }

      setSuccess(data.message || t('auth_signup_success_verify'));
      setName('');
      setPassword('');
      setConfirmPassword('');
      // Keep email visible so user knows where to check

    } catch (err) {
      setError(err.message || t('auth_signup_error_default'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupBox}>
          <h1>{t('auth_signup_title')}</h1>
          <p>{t('auth_signup_subtitle')}</p>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">{t('auth_signup_name_label')}</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email-signup">{t('auth_signup_email_label')}</label>
              <input
                id="email-signup"
                name="email"
                type="email"
                autoComplete='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password-signup">{t('auth_signup_password_label')}</label>
              <input
                id="password-signup"
                name="password"
                type="password"
                autoComplete='new-password'
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
             <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">{t('auth_signup_confirm_password_label')}</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete='new-password'
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  disabled={loading}
                />
                <span>
                  {t('auth_signup_agree_prefix')}{' '}
                  <Link href="/datenschutz" target="_blank" className={styles.legalLink}>{t('footer_privacy')}</Link>
                  {' '}{t('auth_signup_agree_and')}{' '}
                  <Link href="/nutzungsbedingungen" target="_blank" className={styles.legalLink}>{t('footer_terms')}</Link>
                </span>
              </label>
            </div>
            <button type="submit" disabled={loading || !acceptedTerms} className={styles.submitButton}>
              {loading ? t('auth_signup_submitting') : t('auth_signup_submit')}
            </button>
          </form>

          <div className={styles.signInLink}>
            {t('auth_signup_has_account')} <Link href="/auth/signin"><div>{t('auth_signup_signin_link')}</div></Link>
          </div>
      </div>
    </div>
  );
}