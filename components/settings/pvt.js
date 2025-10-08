// components/settings/pvt.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/pvt/data';

const PVTSettings = ({ settings, setSettings, onClose, t }) => {
  const panelRef = useRef(null);
  const translate = t || ((key) => key);

  // Handle click outside and escape key
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

    // Focus first input
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
            PVT {translate('common:settings')}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className={styles.panelContent}>
          {/* Test Duration */}
          <div className={styles.settingGroup}>
            <label htmlFor="testDuration">
              Test Duration (seconds): {settings.testDuration}
            </label>
            <input
              type="range"
              id="testDuration"
              name="testDuration"
              min="60"
              max="600"
              step="30"
              value={settings.testDuration}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>1 min</span>
              <span>10 min</span>
            </div>
            <div className={styles.settingDescription}>
              Duration of the test in seconds (1-10 minutes)
            </div>
          </div>

          {/* Minimum Interval */}
          <div className={styles.settingGroup}>
            <label htmlFor="minInterval">
              Minimum Interval (ms): {settings.minInterval}
            </label>
            <input
              type="range"
              id="minInterval"
              name="minInterval"
              min="1000"
              max="5000"
              step="100"
              value={settings.minInterval}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>1s</span>
              <span>5s</span>
            </div>
            <div className={styles.settingDescription}>
              Minimum time between stimuli
            </div>
          </div>

          {/* Maximum Interval */}
          <div className={styles.settingGroup}>
            <label htmlFor="maxInterval">
              Maximum Interval (ms): {settings.maxInterval}
            </label>
            <input
              type="range"
              id="maxInterval"
              name="maxInterval"
              min="5000"
              max="15000"
              step="500"
              value={settings.maxInterval}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>5s</span>
              <span>15s</span>
            </div>
            <div className={styles.settingDescription}>
              Maximum time between stimuli
            </div>
          </div>

          {/* Countdown Timer */}
          <div className={styles.settingGroup}>
            <label htmlFor="countdownTimer">
              Countdown Duration (seconds): {settings.countdownTimer}
            </label>
            <input
              type="range"
              id="countdownTimer"
              name="countdownTimer"
              min="0"
              max="10"
              step="1"
              value={settings.countdownTimer}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>0s</span>
              <span>10s</span>
            </div>
            <div className={styles.settingDescription}>
              Countdown before test starts
            </div>
          </div>

          {/* Stimulus Color */}
          <div className={styles.settingGroup}>
            <label htmlFor="stimulusColor">
              Stimulus Color:
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="color"
                id="stimulusColor"
                name="stimulusColor"
                value={settings.stimulusColor}
                onChange={handleChange}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <span>{settings.stimulusColor}</span>
            </div>
            <div className={styles.settingDescription}>
              Color of the stimulus when it appears
            </div>
          </div>

          {/* Background Color */}
          <div className={styles.settingGroup}>
            <label htmlFor="backgroundColor">
              Background Color:
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="color"
                id="backgroundColor"
                name="backgroundColor"
                value={settings.backgroundColor}
                onChange={handleChange}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <span>{settings.backgroundColor}</span>
            </div>
            <div className={styles.settingDescription}>
              Color when waiting for stimulus
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
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PVTSettings;
