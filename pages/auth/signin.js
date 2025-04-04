// pages/auth/signin.js
import { getProviders, signIn, getCsrfToken, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link'; // Import Link
import styles from '../../styles/signin.module.css'; // Import the CSS module

// Function to map NextAuth error codes to user-friendly messages
function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'CredentialsSignin':
            return 'Invalid email or password. Please try again.';
        case 'OAuthAccountNotLinked':
             return 'This email is already linked with another provider (e.g., Google). Please sign in using that method.';
        // Add more specific error cases as needed
        default:
             // Try to return the raw error code if not mapped, or a generic message
            return errorCode || 'An error occurred during sign-in. Please try again.';
    }
}


export default function SignIn({ providers, csrfToken }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Get error from query param OR from failed signin attempt
  const [error, setError] = useState(router.query.error ? getErrorMessage(router.query.error) : null);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    const result = await signIn('credentials', {
      redirect: false, // Handle redirect manually
      email: email,
      password: password,
      callbackUrl: router.query.callbackUrl || '/dashboard', // You can pass callbackUrl here too
    });
console.log(result)
    if (result.error) {
      setError(getErrorMessage(result.error)); // Use the error code from NextAuth
      console.error("Sign-in error:", result.error);
    } else if (result.ok) {
       // Redirect on successful login
       // Use the callbackUrl from the query if it exists, otherwise default to /dashboard
       const callbackUrl = '/dashboard';
       router.push(callbackUrl);
    } else {
       setError('An unexpected error occurred during sign-in.');
    }
  };

  return (
    <div className={styles.signInContainer} >
      <div className={styles.signInBox}>
        <h1>Sign In</h1>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSubmit}>
          {/* CSRF Token */}
          <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
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
            <label htmlFor="password">Password</label>
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
          <button type="submit" className={styles.submitButton}>Sign in with Email</button>
        </form>

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
                 {/* Basic Provider Icon Placeholder - Replace with actual icons */}
                 {/* <span className={styles.providerIcon} style={{backgroundImage: `url(/icons/${provider.id}.svg)`}}></span> */}
                Sign in with {provider.name}
              </button>
            </div>
          );
        })}

         {/* Optional: Link to Signup Page */}
         <div className={styles.signUpLink}>
             Don't have an account? <Link href="/auth/signup"><div>Sign Up</div></Link>
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
    },
  };
}