// pages/auth/signin.js
import { getProviders, signIn, getCsrfToken, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from '../../styles/signin.module.css';

function getErrorMessage(errorCode, t) {
    switch (errorCode) {
        case 'CredentialsSignin':
            return t('auth_signin_error_credentials');
        case 'OAuthAccountNotLinked':
            return t('auth_signin_error_oauth_linked');
        case 'EmailNotVerified':
            return t('auth_signin_error_email_not_verified');
        default:
            if (errorCode === 'Error: EmailNotVerified' || errorCode?.includes?.('EmailNotVerified')) {
                return t('auth_signin_error_email_not_verified');
            }
            return errorCode || t('auth_signin_error_default');
    }
}


export default function SignIn({ providers, csrfToken }) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(router.query.error ? getErrorMessage(router.query.error, t) : null);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    const result = await signIn('credentials', {
      redirect: false, // Handle redirect manually
      email: email,
      password: password,
      callbackUrl: router.query.callbackUrl || '/dashboard', // You can pass callbackUrl here too
    });

    if (result.error) {
      setError(getErrorMessage(result.error, t));
    } else if (result.ok) {
       // Redirect on successful login
       // Use the callbackUrl from the query if it exists, otherwise default to /dashboard
       const callbackUrl = '/dashboard';
       router.push(callbackUrl);
    } else {
       setError(t('auth_signin_error_default'));
    }
  };

  return (
    <div className={styles.signInContainer} >
      <div className={styles.signInBox}>
      <Link href="/" passHref>
                          <div className={styles.logoLink}> {/* Link wrapping the image */}
                                <Image
                                    src="/logo.png" // Path relative to the public folder
                                    alt={'psyKasten Logo'}
                                    width={160}     // Specify width (adjust as needed)
                                    height={160}    // Specify height (adjust aspect ratio)
                                />
                            </div>
                        </Link>
        <h1>{t('auth_signin_title')}</h1>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSubmit}>
          {/* CSRF Token */}
          <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

          <div className={styles.formGroup}>
            <label htmlFor="email">{t('auth_signin_email_label')}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete='email' // Help browser autofill
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.inputField} // Added a common class if needed
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">{t('auth_signin_password_label')}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete='current-password' // Help browser autofill
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.inputField} // Added a common class if needed
            />
          </div>
          <button type="submit" className={styles.submitButton}>{t('auth_signin_submit_email')}</button>
        </form>

        <div className={styles.forgotPasswordLink}>
            <Link href="/auth/forgot-password">{t('auth_signin_forgot_password')}</Link>
        </div>

        {(providers && Object.values(providers).some(p => p.id !== 'credentials')) && (
            <hr className={styles.separator} /> // Show separator only if OAuth providers exist
        )}


        {/* OAuth Providers */}
        {providers && Object.values(providers).map((provider) => {
          if (provider.id === 'credentials') return null; // Skip credentials provider button

          return (
            <div key={provider.name}>
              <button
                 onClick={() => signIn(provider.id, { callbackUrl: router.query.callbackUrl || '/dashboard' })}
                 className={styles.providerButton}
              >
                 {provider.id === 'google' && (
                   <Image src="/icons/google.svg" alt="" width={20} height={20} className={styles.providerIcon} />
                 )}
                {t('auth_signin_provider', { provider: provider.name })}
              </button>
            </div>
          );
        })}

         {/* Optional: Link to Signup Page */}
         <div className={styles.signUpLink}>
             {t('auth_signin_no_account')} <Link href="/auth/signup"><div>{t('auth_signin_signup_link')}</div></Link>
         </div>

      </div>
    </div>
  );
}

// getServerSideProps remains the same
export async function getServerSideProps(context) {
   const session = await getSession(context);
   // If already logged in, redirect away from signin page
   if (session) {
     return {
       redirect: {
         destination: context.query.callbackUrl || '/dashboard',
         permanent: false,
       },
     };
   }

  const providers = await getProviders();
  const csrfToken = await getCsrfToken(context);
  return {
    props: {
      providers: providers ?? null,
      csrfToken: csrfToken ?? null,
      ...(await serverSideTranslations(context.locale ?? 'en', ['common'])),
    },
  };
}