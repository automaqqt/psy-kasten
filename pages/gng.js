// pages/tol.js
import Head from 'next/head';
import GNGTest from '../components/tests/gng/test'; // Adjust path if needed

export default function GNGPage() {
  return (
    <>
      <Head>
        <title>Go NoGo Test</title>
        <meta name="description" content="Web-based implementation of the Go NoGo Test." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <GNGTest />
    </>
  );
}