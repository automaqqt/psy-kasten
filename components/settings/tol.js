// components/settings/tol/TOLSettings.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css'; // Reuse existing settings styles

const TOLSettings = ({ settings, setSettings, onClose }) => {
  const panelRef = useRef(null);

  // Re-use useEffect for closing modal, focus trapping, escape key from your Corsi SettingsPanel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

     // Basic focus trap (enhance with full logic from your original file if needed)
     const handleTabKey = (e) => {
        if (e.key === 'Tab') {
           // Simplified: Keep focus within panel - add full first/last element logic
           const focusableElements = panelRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
           if (focusableElements && focusableElements.length > 0) {
              // Add full trapping logic here
           }
        }
     };
     document.addEventListener('keydown', handleTabKey);

     // Focus first element
     const firstFocusable = panelRef.current?.querySelector('button, input, select');
     firstFocusable?.focus();


    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);

    document.body.classList.add('modal-open');

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
       document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  // Add handleChange if you add actual settings controls
  // const handleChange = (e) => { ... };

  const resetToDefaults = () => {
    setSettings({
      // Define default TOL settings if any are added later
      // e.g., showTimer: false,
    });
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.settingsPanel} ref={panelRef}>
        <div className={styles.panelHeader}>
          <h2 className={styles.settingsTitle}>Tower of London Settings</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className={styles.panelContent}>
          {/* Add settings controls here if needed in the future */}
          <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
             Currently, no specific settings are available for the standard Tower of London procedure.
          </p>
           {/* Example of a future setting:
             <div className={styles.settingGroup}>
               <label htmlFor="showTimer">
                 <input
                   type="checkbox"
                   id="showTimer"
                   name="showTimer"
                   checked={settings.showTimer || false}
                   onChange={handleChange}
                 />
                 Display Timers (Optional)
               </label>
             </div>
           */}
        </div>

        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.defaultButton}`}
            onClick={resetToDefaults}
             disabled // Disable if no settings
          >
            Reset to Defaults
          </button>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TOLSettings;