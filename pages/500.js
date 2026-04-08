import Link from 'next/link';
import Head from 'next/head';

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - Server Error | psyKasten</title>
      </Head>
      <div style={styles.container}>
        <h1 style={styles.code}>500</h1>
        <h2 style={styles.title}>Something went wrong</h2>
        <p style={styles.description}>
          An unexpected error occurred. Please try again later.
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
