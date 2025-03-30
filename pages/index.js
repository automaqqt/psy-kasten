// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Landing.module.css';

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const cognitiveTests = [
    {
      id: 'corsi',
      title: 'Corsi Block-Tapping Test',
      description: 'Measures your visuo-spatial short-term working memory. Remember and repeat sequences of blocks.',
      route: '/corsi',
      color: '#4a6fa5',
      icon: '🧩',
      tags: ['Memory', 'Visual-Spatial', 'Sequential']
    },
    {
      id: 'pvt',
      title: 'Psychomotor Vigilance Test',
      description: 'Measures reaction time and vigilance. Respond as quickly as possible to visual stimuli.',
      route: '/pvt',
      color: '#e91e63',
      icon: '⏱️',
      tags: ['Reaction Time', 'Alertness', 'Vigilance']
    },
    {
      id: 'cpm',
      title: 'Colored Progressive Matrices',
      description: 'Measures your nonverbal intelligence. Try to match Matrices.',
      route: '/cpm',
      color: '#228B22',
      icon: '🔤',
      tags: ['Inteligence', 'Non-Verbal', 'Sequential']
    }/* ,
    {
      id: 'corsi-backward',
      title: 'Backward Corsi Block Test',
      description: 'Tests your ability to manipulate spatial information in working memory by repeating sequences in reverse order.',
      route: '/backward',
      color: '#3b5998',
      icon: '🔄',
      tags: ['Memory', 'Visual-Spatial', 'Executive Function']
    },
    {
      id: 'cpt',
      title: 'Continuous Performance Test',
      description: 'Assesses sustained attention and response inhibition. Respond to non-target letters while inhibiting responses to target letters.',
      route: '/cpt',
      color: '#9c27b0',
      icon: '🔤',
      tags: ['Attention', 'Inhibition', 'Vigilance']
    } */
  ];

  const handleCardHover = (id) => {
    if (hoveredCard === id) return;
    setHoveredCard(id);
  };

  const handleCardLeave = () => {
    setHoveredCard(null);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Cognitive Assessment Suite</title>
        <meta name="description" content="A suite of cognitive assessment tools for measuring attention, memory, and processing speed" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Cognitive Assessment Suite</h1>
          <p className={styles.description}>
            A collection of standardized neuropsychological tests for measuring cognitive abilities
          </p>
        </div>

        <section className={styles.testsGrid}>
          {cognitiveTests.map((test) => (
            <Link href={test.route} key={test.id}>
              <a className={styles.testLink}>
                <div 
                  className={`${styles.testCard} ${hoveredCard === test.id ? styles.wiggle : ''}`}
                  style={{ 
                    '--card-color': test.color,
                    '--card-color-light': `${test.color}22`,
                  }}
                  onMouseEnter={() => handleCardHover(test.id)}
                  onMouseLeave={handleCardLeave}
                >
                  <div className={styles.cardIconContainer}>
                    <span className={styles.cardIcon}>{test.icon}</span>
                  </div>
                  <h2 className={styles.cardTitle}>{test.title}</h2>
                  <p className={styles.cardDescription}>{test.description}</p>
                  <div className={styles.cardTags}>
                    {test.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.startTest}>Start Test</span>
                    <span className={styles.arrowIcon}>→</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </section>

        <section className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>About These Tests</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h3>Research-Based</h3>
              <p>These tests are based on established neuropsychological assessments used in clinical and research settings.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Measure Different Abilities</h3>
              <p>From short-term memory to sustained attention, these tests evaluate distinct cognitive domains.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Detailed Analysis</h3>
              <p>Get comprehensive performance metrics and visualizations to understand your cognitive strengths.</p>
            </div>
          </div>
          <div className={styles.disclaimer}>
            <p>Note: These tests are for educational and informational purposes only and are not meant for clinical diagnosis.</p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>Cognitive Assessment Suite • Built with Next.js</p>
      </footer>
    </div>
  );
}