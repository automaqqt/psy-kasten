// components/layout/Footer.js
import React from 'react';
import Link from 'next/link';
import styles from '../../styles/Footer.module.css'; // Create a new CSS Module for the footer

export default function Footer() {
  // Optional: Use translation if footer text needs it
  // const { t } = useTranslation('common');
  // const footerText = t('footer_text', 'Cognitive Assessment Suite • Built with Next.js');
  // const madeWithText = t('made_with_love', 'made with ❤️ by');

  return (
    <footer className={styles.footer}>
      {/* Use your desired text */}
      psyKasten - made with ❤️ by{' '}
      <Link href="https://vidsoft.net">
          {/* Apply link style via className */}
          <div className={styles.link} target="_blank" rel="noopener noreferrer">
              vidsoft
          </div>
      </Link>
      {/* Or use translated text: */}
      {/* {footerText} */}
    </footer>
  );
}