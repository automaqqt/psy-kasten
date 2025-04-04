import Head from 'next/head';
import RPMTest from '../components/tests/rpm/test'; // Adjust path if needed

export default function RPMPage() {
  return (
    <>
      <Head>
        <title>Raven's Progressive Matrices (SPM)</title>
        <meta name="description" content="Web implementation of Raven's Standard Progressive Matrices test for non-verbal reasoning." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <RPMTest />
    </>
  );
}