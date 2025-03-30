// pages/corsi.js
import Head from 'next/head';
import PVTTest from '../components/PVTTest';

export default function PVTPage() {
  return (
    <>
      <Head>
        <title>PVT Test</title>
        <meta name="description" content="A digital implementation of the Corsi Block-Tapping Test for measuring visuo-spatial working memory" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <PVTTest />
    </>
  );
}