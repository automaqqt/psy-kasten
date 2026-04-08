// components/ui/footer.js
import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import styles from '../../styles/Footer.module.css';

export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className={styles.footer}>
      <Link href="/about" className={styles.link}>
        {t('footer_about', 'About')}
      </Link>
      <span className={styles.separator}>|</span>
      <Link href="/info" className={styles.link}>
        {t('footer_researchers', 'For Researchers')}
      </Link>
      <span className={styles.separator}>|</span>
      <a href="mailto:kontakt@psykasten.de" className={styles.link}>
        {t('footer_contact', 'Contact')}
      </a>
      <span className={styles.separator}>|</span>
      <Link href="/datenschutz" className={styles.link}>
        {t('footer_privacy', 'Privacy Policy')}
      </Link>
      <span className={styles.separator}>|</span>
      <Link href="/nutzungsbedingungen" className={styles.link}>
        {t('footer_terms', 'Terms of Use')}
      </Link>
      <span className={styles.separator}>|</span>
      <Link href="/impressum" className={styles.link}>
        {t('footer_impressum', 'Impressum')}
      </Link>
    </footer>
  );
}
