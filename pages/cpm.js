// pages/corsi.js
import Head from 'next/head';
import PatternMatrixTest from '../components/PatternMatrixTest';

export default function CorsiPage() {
  return (
    <>
      <Head>
        <title>Colored Progressive Matrices</title>
        <meta name="description" content="A digital implementation of the Colored Progressive Matrices for measuring nonverbal intelligence" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <PatternMatrixTest />
    </>
  );
}