// components/settings/rpm/RPMSettings.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css'; // Reuse existing settings styles

const RPMSettings = ({ settings, setSettings, onClose }) => {
  const panelRef = useRef(null);

  // Re-use useEffect for closing modal, focus trapping, escape key from your previous SettingsPanel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Add focus trap logic here...
    // Add escape key logic here...
     const firstFocusable = panelRef.current?.querySelector('input, button');
     firstFocusable?.focus();
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Remove other listeners...
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
          <h2 className={styles.settingsTitle}>RPM Settings</h2>
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