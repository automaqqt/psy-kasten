// pages/auth/signup.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/signup.module.css'; // Import the CSS module

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // --- Client-side Validation ---
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address.");
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

      setSuccess(data.message || 'Signup successful! Redirecting to sign in...');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        router.push('/auth/signin?message=signup_success');
      }, 2000);

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupBox}>
          <h1>Create Account</h1>
          <p>Sign up to manage your research studies.</p>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Name (Optional)</label>
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
              <label htmlFor="email-signup">Email</label>
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
              <label htmlFor="password-signup">Password (min. 8 characters)</label>
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
              <label htmlFor="confirmPassword">Confirm Password</label>
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
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className={styles.signInLink}>
            Already have an account? <Link href="/auth/signin"><div>Sign In</div></Link>
          </div>
      </div>
    </div>
  );
}