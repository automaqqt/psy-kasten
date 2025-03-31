// pages/corsi.js
import Head from 'next/head';
import PVTTest from '../components/tests/pvt';

export default function PVTPage() {
  return (
    <>
      <Head>
        <title>PVT Test</title>
        <meta name="description" content="A digital implementation of the The Psychomotor Vigilance Test to measure sustained attention and reaction time." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <PVTTest />
    </>
  );
}