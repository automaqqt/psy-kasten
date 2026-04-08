import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Footer from '../../components/ui/footer';
import { ThemeToggle } from '../ui/themeToggle';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import styles from '../../styles/DashboardLayout.module.css'; // Create this CSS file

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation('dashboard');

  // Handle loading state
  if (status === 'loading') {
    return <div className={styles.loading}>{t('loading_dashboard')}</div>;
  }

  // Handle unauthenticated state (middleware should ideally redirect, but this is a fallback)
  if (status === 'unauthenticated') {
    return <div className={styles.loading}>{t('redirecting')}</div>;
  }

  // User is authenticated
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
        <Link href="/" passHref>
                          <div className={styles.logoLink}> {/* Link wrapping the image */}
                                <Image
                                    src="/logo.png" // Path relative to the public folder
                                    alt={'psyKasten Logo'}
                                    width={50}     // Specify width (adjust as needed)
                                    height={50}    // Specify height (adjust aspect ratio)
                                />
                            </div>
                        </Link>
        </div>
        <nav className={styles.nav}>
            <Link href="/dashboard"><div className={router.pathname === "/dashboard" ? styles.activeLink : ""}>{t('nav_studies')}</div></Link>
            <Link href="/dashboard/results"><div className={router.pathname === "/dashboard/results" ? styles.activeLink : ""}>{t('nav_results')}</div></Link>
            <Link href="/dashboard/proposals/new"><div className={router.pathname === "/dashboard/proposals/new" ? styles.activeLink : ""}>{t('nav_propose')}</div></Link>
            <Link href="/dashboard/account"><div className={router.pathname === "/dashboard/account" ? styles.activeLink : ""}>{t('nav_account')}</div></Link>
            {session.user?.role === 'ADMIN' && (
                <Link href="/admin"><div className={router.pathname.startsWith("/admin") ? styles.activeLink : ""}>Admin</div></Link>
            )}
        </nav>
        <div className={styles.userArea}>
          <ThemeToggle />
          <span className={styles.userName}>{session.user?.name || session.user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.logoutButton}>
            {t('sign_out')}
          </button>
        </div>
      </header>
      <main className={styles.mainContent}>
        {children}
      </main>
      <Footer />
    </div>
  );
}