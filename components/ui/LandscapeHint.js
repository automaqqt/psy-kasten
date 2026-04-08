import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import styles from '../../styles/LandscapeHint.module.css';

export default function LandscapeHint() {
  const { t } = useTranslation('common');
  const [showHint, setShowHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isNarrow = window.innerWidth < 1024;
      setShowHint(isPortrait && isNarrow);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, [dismissed]);

  if (dismissed || !showHint) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <path d="M12 18h.01" />
          </svg>
          <svg className={styles.arrow} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <svg className={styles.rotated} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M18 12h.01" />
          </svg>
        </div>
        <p className={styles.text}>{t('landscape_hint')}</p>
        <button className={styles.dismissButton} onClick={() => setDismissed(true)}>
          {t('landscape_hint_dismiss')}
        </button>
      </div>
    </div>
  );
}
