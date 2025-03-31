// pages/corsi.js
import Head from 'next/head';
import CorsiTest from '../components/tests/corsi';

export default function CorsiPage() {
  return (
    <>
      <Head>
        <title>Corsi Block-Tapping Test</title>
        <meta name="description" content="A digital implementation of the Corsi Block-Tapping Test for measuring visuo-spatial working memory" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <CorsiTest />
    </>
  );
}