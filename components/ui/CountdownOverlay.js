// components/ui/CountdownOverlay.js
import styles from '../../styles/TestTakePage.module.css';

/**
 * 3-2-1-GO! countdown overlay used before practice/test rounds.
 *
 * Props:
 *  - countdown: number (3, 2, 1, 0)
 *  - translate: i18n function
 *  - subtitle: optional instruction text key (default: 'countdown_instruction')
 */
export default function CountdownOverlay({ countdown, translate, subtitle = 'countdown_instruction' }) {
  return (
    <div className={styles.countdownOverlay}>
      <div className={styles.countdownContent}>
        <h2>{translate('get_ready')}</h2>
        <div className={styles.countdownNumber}>{countdown > 0 ? countdown : 'GO!'}</div>
        {subtitle && <p>{translate(subtitle)}</p>}
      </div>
    </div>
  );
}
