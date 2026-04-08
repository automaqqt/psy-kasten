import Link from 'next/link';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | psyKasten</title>
      </Head>
      <div style={styles.container}>
        <h1 style={styles.code}>404</h1>
        <h2 style={styles.title}>Page Not Found</h2>
        <p style={styles.description}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" style={styles.link}>
          Back to Home
        </Link>
      </div>
    </>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    textAlign: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  },
  code: {
    fontSize: '6rem',
    fontWeight: 700,
    margin: 0,
    color: '#333',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 500,
    margin: '0.5rem 0 1rem',
    color: '#555',
  },
  description: {
    fontSize: '1rem',
    color: '#777',
    marginBottom: '2rem',
    maxWidth: '400px',
  },
  link: {
    padding: '0.75rem 2rem',
    backgroundColor: '#0070f3',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: 500,
  },
};
