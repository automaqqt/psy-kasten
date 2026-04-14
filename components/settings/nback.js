// components/settings/nback.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/nback/data';

const NbackSettings = ({ settings, setSettings, onClose, t }) => {
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
            N-Back {translate('common:settings')}
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
          {/* N-Level */}
          <div className={styles.settingGroup}>
            <label htmlFor="nLevel">
              {translate('settings_n_level')}: {settings.nLevel}-Back
            </label>
            <input
              type="range"
              id="nLevel"
              name="nLevel"
              min="1"
              max="3"
              step="1"
              value={settings.nLevel}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>1-Back</span>
              <span>3-Back</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_n_level_desc')}
            </div>
          </div>

          {/* Trials Per Block */}
          <div className={styles.settingGroup}>
            <label htmlFor="trialsPerBlock">
              {translate('settings_trials')}: {settings.trialsPerBlock}
            </label>
            <input
              type="range"
              id="trialsPerBlock"
              name="trialsPerBlock"
              min="10"
              max="60"
              step="5"
              value={settings.trialsPerBlock}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>10</span>
              <span>60</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_trials_desc')}
            </div>
          </div>

          {/* Target Percentage */}
          <div className={styles.settingGroup}>
            <label htmlFor="targetPercentage">
              {translate('settings_target_pct')}: {Math.round(settings.targetPercentage * 100)}%
            </label>
            <input
              type="range"
              id="targetPercentage"
              name="targetPercentage"
              min="0.1"
              max="0.5"
              step="0.05"
              value={settings.targetPercentage}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>10%</span>
              <span>50%</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_target_pct_desc')}
            </div>
          </div>

          {/* Stimulus Duration */}
          <div className={styles.settingGroup}>
            <label htmlFor="stimulusDuration">
              {translate('settings_stimulus_duration')}: {settings.stimulusDuration} ms
            </label>
            <input
              type="range"
              id="stimulusDuration"
              name="stimulusDuration"
              min="200"
              max="2000"
              step="100"
              value={settings.stimulusDuration}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>200 ms</span>
              <span>2000 ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_stimulus_duration_desc')}
            </div>
          </div>

          {/* Inter-Stimulus Interval */}
          <div className={styles.settingGroup}>
            <label htmlFor="interStimulusInterval">
              {translate('settings_isi')}: {settings.interStimulusInterval} ms
            </label>
            <input
              type="range"
              id="interStimulusInterval"
              name="interStimulusInterval"
              min="500"
              max="3000"
              step="100"
              value={settings.interStimulusInterval}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>500 ms</span>
              <span>3000 ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_isi_desc')}
            </div>
          </div>

          {/* Response Window */}
          <div className={styles.settingGroup}>
            <label htmlFor="responseWindow">
              {translate('settings_response_window')}: {settings.responseWindow} ms
            </label>
            <input
              type="range"
              id="responseWindow"
              name="responseWindow"
              min="1000"
              max="5000"
              step="250"
              value={settings.responseWindow}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>1000 ms</span>
              <span>5000 ms</span>
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

export default NbackSettings;
