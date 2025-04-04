import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/DashboardLayout.module.css'; // Create this CSS file

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle loading state
  if (status === 'loading') {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  // Handle unauthenticated state (middleware should ideally redirect, but this is a fallback)
  if (status === 'unauthenticated') {
    // Redirect to sign-in page
    // Using router.push client-side after initial render might cause flashes.
    // Middleware is the preferred way to handle this server-side.
    // router.push('/auth/signin'); // Uncomment if not using middleware strictly
    return <div className={styles.loading}>Redirecting to login...</div>; // Or a login prompt
  }

  // User is authenticated
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <Link href="/dashboard">
            <div>Research Dashboard</div>
          </Link>
        </div>
        <nav className={styles.nav}>
            <Link href="/dashboard"><div className={router.pathname === "/dashboard" ? styles.activeLink : ""}>Studies</div></Link>
            <Link href="/dashboard/results"><div className={router.pathname === "/dashboard/results" ? styles.activeLink : ""}>Results</div></Link>
            {/* Add more nav links as needed */}
        </nav>
        <div className={styles.userArea}>
          <span>{session.user?.name || session.user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.logoutButton}>
            Sign Out
          </button>
        </div>
      </header>
      <main className={styles.mainContent}>
        {children}
      </main>
      <footer className={styles.footer}>
        Cognitive Assessment Suite - Researcher Panel
      </footer>
    </div>
  );
}