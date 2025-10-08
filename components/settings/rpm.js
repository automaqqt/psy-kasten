// components/settings/rpm.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';

const RPMSettings = ({ settings, setSettings, onClose, t }) => {
  const panelRef = useRef(null);
  const translate = t || ((key) => key);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Trap focus inside modal
    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        const focusableElements = panelRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        } else if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);

    // Focus first element on mount
    const firstFocusable = panelRef.current.querySelector('button, [href], input, select');
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Handle escape key
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    // Add body class to prevent scrolling
    document.body.classList.add('modal-open');

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const resetToDefaults = () => {
    setSettings({
      isTimed: false,
      testDurationMinutes: 40,
    });
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.settingsPanel} ref={panelRef}>
        <div className={styles.panelHeader}>
          <h2 className={styles.settingsTitle}>{translate('common:settings')}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close settings">×</button>
        </div>

        <div className={styles.panelContent}>
          <div className={styles.settingGroup}>
            <label htmlFor="isTimed">
              <input
                type="checkbox"
                id="isTimed"
                name="isTimed"
                checked={settings.isTimed}
                onChange={handleChange}
                style={{ marginRight: '8px' }}
              />
              Enable Timer (for efficiency testing)
            </label>
          </div>

          {settings.isTimed && (
            <div className={styles.settingGroup}>
              <label htmlFor="testDurationMinutes">
                Test Duration (minutes): {settings.testDurationMinutes}
              </label>
              <input
                type="range"
                id="testDurationMinutes"
                name="testDurationMinutes"
                min="10"
                max="60"
                step="5"
                value={settings.testDurationMinutes}
                onChange={handleChange}
                className={styles.slider}
              />
               <div className={styles.rangeLabels}>
                 <span>10 min</span>
                 <span>60 min</span>
               </div>
              <div className={styles.settingDescription}>
                 Standard timed administrations are often 20 or 40 minutes.
              </div>
            </div>
          )}
           {!settings.isTimed && (
              <p style={{ color: '#666', textAlign: 'center', marginTop: '1rem' }}>
                 Untimed administration assesses maximum capacity.
              </p>
           )}
        </div>

        <div className={styles.buttonGroup}>
          <button className={`${styles.button} ${styles.defaultButton}`} onClick={resetToDefaults}>
            Reset to Defaults
          </button>
          <button className={`${styles.button} ${styles.primaryButton}`} onClick={onClose}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RPMSettings;