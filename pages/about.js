// pages/about.js
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function About() {
  return (
    <div className={styles.container}>
      <Head>
        <title>About the Corsi Block-Tapping Test</title>
        <meta name="description" content="Information about the Corsi block-tapping test and its uses" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          About the Corsi Block-Tapping Test
        </h1>
        
        <div className={styles.card} style={{ maxWidth: '800px', margin: '2rem auto' }}>
          <section>
            <h2>History</h2>
            <p>
              The Corsi block-tapping task originated in the early 1970s by Philip M. Corsi as a set of 9 identical wooden blocks positioned on a board. The task was based on the digit span task but required the use of visuo-spatial memory rather than verbal memory.
            </p>
          </section>
          
          <section style={{ marginTop: '2rem' }}>
            <h2>How It Works</h2>
            <p>
              In the traditional test, the examiner taps a sequence of blocks, and the subject must repeat the same sequence. The test starts with simple sequences (usually 2 blocks) and progressively gets more complex until the subject's performance suffers.
            </p>
            <p>
              The longest sequence a person can correctly remember is known as their "Corsi Span." The average span for typical adults is about 5-6 blocks.
            </p>
          </section>
          
          <section style={{ marginTop: '2rem' }}>
            <h2>Cognitive Processes</h2>
            <p>
              fMRI studies have shown that while sequence length increases during the task, general brain activity remains relatively constant. This suggests that performance difficulties are not related to overall brain activation.
            </p>
            <p>
              The ventrolateral prefrontal cortex is highly involved during the task, regardless of performance level. The Corsi blocks task requires support from the visuospatial sketch pad, but not from the phonological loop. When sequences exceed 3-4 items, central executive resources become engaged.
            </p>
          </section>
          
          <section style={{ marginTop: '2rem' }}>
            <h2>Forward vs. Backward</h2>
            <p>
              Unlike the digit span task, where the backward version is significantly more difficult than the forward version, research has found no significant difference in difficulty between forward and backward Corsi block-tapping tasks for typical adults.
            </p>
            <p>
              However, studies with visuospatial learning disabled (VSLD) children have found that they specifically struggle with the backward Corsi task compared to the forward version, indicating that the backward task uses specific spatial processes.
            </p>
          </section>
          
          <section style={{ marginTop: '2rem' }}>
            <h2>Applications</h2>
            <p>
              The Corsi block-tapping test is used to assess:
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '2rem' }}>
              <li>Visuospatial short-term working memory</li>
              <li>Memory loss</li>
              <li>Spatial cognition in brain-damaged patients</li>
              <li>Nonverbal working memory</li>
              <li>Cognitive development in children</li>
            </ul>
          </section>
          
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <Link href="/">
              <a className={styles.button} style={{ maxWidth: '300px' }}>
                Try the Test
              </a>
            </Link>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          Source: <a href="https://en.wikipedia.org/wiki/Corsi_block-tapping_test" target="_blank" rel="noopener noreferrer" className={styles.link}>Wikipedia - Corsi block-tapping test</a>
        </p>
      </footer>
    </div>
  );
}