// components/ui/MessageOverlay.js
import styles from '../../styles/TestTakePage.module.css';

/**
 * Feedback message overlay shown briefly during gameplay.
 *
 * Props:
 *  - show: boolean
 *  - message: string (already translated)
 *  - type: optional 'info' | 'success' | 'error' (adds CSS class)
 */
export default function MessageOverlay({ show, message, type }) {
  if (!show) return null;

  const messageClass = type
    ? `${styles.message} ${styles[type] || ''}`
    : styles.message;

  return (
    <div className={styles.messageOverlay}>
      <div className={messageClass}>{message}</div>
    </div>
  );
}
