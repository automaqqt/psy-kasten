// pages/tol.js
import Head from 'next/head';
import TOLTest from '../components/tests/tol/test'; // Adjust path if needed

export default function TOLPage() {
  return (
    <>
      <Head>
        <title>Tower of London Test (TOL)</title>
        <meta name="description" content="Web-based implementation of the Tower of London test for planning ability." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <TOLTest />
    </>
  );
}