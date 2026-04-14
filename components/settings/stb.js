// components/settings/stb.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/stb/data';

const StbSettings = ({ settings, setSettings, onClose, t }) => {
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
    const { name, value, type, checked } = e.target;
    let processedValue = value;

    if (type === 'checkbox') {
      processedValue = checked;
    } else if (type === 'number' || type === 'range') {
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
            {translate('settings_title')}
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
          {/* Number of Trials */}
          <div className={styles.settingGroup}>
            <label htmlFor="totalTrials">
              {translate('settings_total_trials')}: {settings.totalTrials}
            </label>
            <input
              type="range"
              id="totalTrials"
              name="totalTrials"
              min="6"
              max="36"
              step="3"
              value={settings.totalTrials}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>6</span>
              <span>36</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_total_trials_desc')}
            </div>
          </div>

          {/* Fixation Duration */}
          <div className={styles.settingGroup}>
            <label htmlFor="fixationDuration">
              {translate('settings_fixation_duration')}: {(settings.fixationDuration / 1000).toFixed(1)}s
            </label>
            <input
              type="range"
              id="fixationDuration"
              name="fixationDuration"
              min="1000"
              max="10000"
              step="500"
              value={settings.fixationDuration}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>1s</span>
              <span>10s</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_fixation_duration_desc')}
            </div>
          </div>

          {/* Letter Duration */}
          <div className={styles.settingGroup}>
            <label htmlFor="letterDuration">
              {translate('settings_letter_duration')}: {settings.letterDuration}ms
            </label>
            <input
              type="range"
              id="letterDuration"
              name="letterDuration"
              min="500"
              max="3000"
              step="100"
              value={settings.letterDuration}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>500ms</span>
              <span>3000ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_letter_duration_desc')}
            </div>
          </div>

          {/* Maintenance Min */}
          <div className={styles.settingGroup}>
            <label htmlFor="maintenanceMin">
              {translate('settings_maintenance_min')}: {(settings.maintenanceMin / 1000).toFixed(1)}s
            </label>
            <input
              type="range"
              id="maintenanceMin"
              name="maintenanceMin"
              min="1000"
              max="5000"
              step="500"
              value={settings.maintenanceMin}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>1s</span>
              <span>5s</span>
            </div>
          </div>

          {/* Maintenance Max */}
          <div className={styles.settingGroup}>
            <label htmlFor="maintenanceMax">
              {translate('settings_maintenance_max')}: {(settings.maintenanceMax / 1000).toFixed(1)}s
            </label>
            <input
              type="range"
              id="maintenanceMax"
              name="maintenanceMax"
              min="2000"
              max="8000"
              step="500"
              value={settings.maintenanceMax}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>2s</span>
              <span>8s</span>
            </div>
          </div>

          {/* Response Window */}
          <div className={styles.settingGroup}>
            <label htmlFor="responseWindow">
              {translate('settings_response_window')}: {(settings.responseWindow / 1000).toFixed(1)}s
            </label>
            <input
              type="range"
              id="responseWindow"
              name="responseWindow"
              min="2000"
              max="10000"
              step="500"
              value={settings.responseWindow}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>2s</span>
              <span>10s</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_response_window_desc')}
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.defaultButton}`}
            onClick={resetToDefaults}
          >
            {translate('settings_reset')}
          </button>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={onClose}
          >
            {translate('settings_save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StbSettings;
