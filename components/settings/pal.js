// components/settings/pal.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/pal/data';

const PalSettings = ({ settings, setSettings, onClose, t }) => {
  const panelRef = useRef(null);
  const translate = t || ((key) => key);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.body.classList.add('modal-open');

    panelRef.current?.querySelector('input, select, button')?.focus();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;

    if (type === 'number' || type === 'range') {
      processedValue = parseFloat(value);
    }

    setSettings(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.settingsPanel} ref={panelRef}>
        <div className={styles.panelHeader}>
          <h2 className={styles.settingsTitle}>
            PAL {translate('common:settings')}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            &times;
          </button>
        </div>

        <div className={styles.panelContent}>
          {/* Max Attempts */}
          <div className={styles.settingGroup}>
            <label htmlFor="maxAttempts">
              {translate('settings_max_attempts')}: {settings.maxAttempts}
            </label>
            <input
              type="range"
              id="maxAttempts"
              name="maxAttempts"
              min="1"
              max="10"
              step="1"
              value={settings.maxAttempts}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>1</span>
              <span>10</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_max_attempts_desc')}
            </div>
          </div>

          {/* Box Open Duration */}
          <div className={styles.settingGroup}>
            <label htmlFor="boxOpenDuration">
              {translate('settings_box_open_duration')}: {(settings.boxOpenDuration / 1000).toFixed(1)}s
            </label>
            <input
              type="range"
              id="boxOpenDuration"
              name="boxOpenDuration"
              min="1000"
              max="5000"
              step="250"
              value={settings.boxOpenDuration}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>1s</span>
              <span>5s</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_box_open_duration_desc')}
            </div>
          </div>

          {/* Inter-Box Delay */}
          <div className={styles.settingGroup}>
            <label htmlFor="interBoxDelay">
              {translate('settings_inter_box_delay')}: {settings.interBoxDelay}ms
            </label>
            <input
              type="range"
              id="interBoxDelay"
              name="interBoxDelay"
              min="200"
              max="1500"
              step="100"
              value={settings.interBoxDelay}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>200ms</span>
              <span>1500ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_inter_box_delay_desc')}
            </div>
          </div>

          {/* Feedback Duration */}
          <div className={styles.settingGroup}>
            <label htmlFor="feedbackDuration">
              {translate('settings_feedback_duration')}: {settings.feedbackDuration}ms
            </label>
            <input
              type="range"
              id="feedbackDuration"
              name="feedbackDuration"
              min="300"
              max="2000"
              step="100"
              value={settings.feedbackDuration}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>300ms</span>
              <span>2000ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_feedback_duration_desc')}
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.defaultButton}`}
            onClick={resetToDefaults}
          >
            Reset Defaults
          </button>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={onClose}
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PalSettings;
