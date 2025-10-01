import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';

const AktSettings = ({ settings, setSettings, onClose, t }) => {
  const panelRef = useRef(null);
  const translate = t || ((key) => key);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

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

    const firstFocusable = panelRef.current.querySelector('button, input, select');
    if (firstFocusable) {
      firstFocusable.focus();
    }

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

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const resetToDefaults = () => {
    setSettings({
      gridRows: 5,
      gridCols: 11,
      numTargets: 20,
      countdownDuration: 3,
    });
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.settingsPanel} ref={panelRef}>
        <div className={styles.panelHeader}>
          <h2 className={styles.settingsTitle}>{translate('settings_title')}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label={translate('close_settings')}
          >
            ×
          </button>
        </div>

        <div className={styles.panelContent}>
          <div className={styles.settingGroup}>
            <label htmlFor="gridRows">{translate('grid_rows')}: {settings.gridRows}</label>
            <input
              type="range"
              id="gridRows"
              name="gridRows"
              min="3"
              max="10"
              step="1"
              value={settings.gridRows}
              onChange={handleChange}
              className={styles.slider}
            />
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="gridCols">{translate('grid_cols')}: {settings.gridCols}</label>
            <input
              type="range"
              id="gridCols"
              name="gridCols"
              min="5"
              max="20"
              step="1"
              value={settings.gridCols}
              onChange={handleChange}
              className={styles.slider}
            />
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="numTargets">{translate('num_targets')}: {settings.numTargets}</label>
            <input
              type="range"
              id="numTargets"
              name="numTargets"
              min="5"
              max="50"
              step="1"
              value={settings.numTargets}
              onChange={handleChange}
              className={styles.slider}
            />
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="countdownDuration">{translate('countdown_duration')}: {settings.countdownDuration}</label>
            <input
              type="range"
              id="countdownDuration"
              name="countdownDuration"
              min="1"
              max="10"
              step="1"
              value={settings.countdownDuration}
              onChange={handleChange}
              className={styles.slider}
            />
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.defaultButton}`}
            onClick={resetToDefaults}
          >
            {translate('reset_to_defaults')}
          </button>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={onClose}
          >
            {translate('save_and_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AktSettings;
