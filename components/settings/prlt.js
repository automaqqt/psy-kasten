// components/settings/prlt.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/prlt/data';

const PrltSettings = ({ settings, setSettings, onClose, t }) => {
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
            PRLT {translate('common:settings')}
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
          {/* Total Trials */}
          <div className={styles.settingGroup}>
            <label htmlFor="totalTrials">
              {translate('settings_total_trials')}: {settings.totalTrials}
            </label>
            <input
              type="range"
              id="totalTrials"
              name="totalTrials"
              min="40"
              max="250"
              step="10"
              value={settings.totalTrials}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>40</span>
              <span>250</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_total_trials_desc')}
            </div>
          </div>

          {/* High Probability */}
          <div className={styles.settingGroup}>
            <label htmlFor="highProbability">
              {translate('settings_high_prob')}: {(settings.highProbability * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              id="highProbability"
              name="highProbability"
              min="0.6"
              max="1.0"
              step="0.05"
              value={settings.highProbability}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>60%</span>
              <span>100%</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_high_prob_desc')}
            </div>
          </div>

          {/* Low Probability */}
          <div className={styles.settingGroup}>
            <label htmlFor="lowProbability">
              {translate('settings_low_prob')}: {(settings.lowProbability * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              id="lowProbability"
              name="lowProbability"
              min="0"
              max="0.4"
              step="0.05"
              value={settings.lowProbability}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>0%</span>
              <span>40%</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_low_prob_desc')}
            </div>
          </div>

          {/* Reversal Criterion */}
          <div className={styles.settingGroup}>
            <label htmlFor="reversalCriterion">
              {translate('settings_reversal_criterion')}: {settings.reversalCriterion}/{settings.reversalWindow}
            </label>
            <input
              type="range"
              id="reversalCriterion"
              name="reversalCriterion"
              min="6"
              max="20"
              step="1"
              value={settings.reversalCriterion}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>6</span>
              <span>20</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_reversal_criterion_desc')}
            </div>
          </div>

          {/* Reversal Window */}
          <div className={styles.settingGroup}>
            <label htmlFor="reversalWindow">
              {translate('settings_reversal_window')}: {settings.reversalWindow}
            </label>
            <input
              type="range"
              id="reversalWindow"
              name="reversalWindow"
              min="8"
              max="25"
              step="1"
              value={settings.reversalWindow}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>8</span>
              <span>25</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_reversal_window_desc')}
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

          {/* Feedback Duration */}
          <div className={styles.settingGroup}>
            <label htmlFor="feedbackDuration">
              {translate('settings_feedback_duration')}: {settings.feedbackDuration}ms
            </label>
            <input
              type="range"
              id="feedbackDuration"
              name="feedbackDuration"
              min="500"
              max="2000"
              step="100"
              value={settings.feedbackDuration}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>500ms</span>
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

export default PrltSettings;
