// components/settings/wcst.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/wcst/data';

const WcstSettings = ({ settings, setSettings, onClose, t }) => {
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
            WCST {translate('common:settings')}
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
          {/* Trials per Category */}
          <div className={styles.settingGroup}>
            <label htmlFor="trialsPerCategory">
              {translate('settings_trials_per_category')}: {settings.trialsPerCategory}
            </label>
            <input
              type="range"
              id="trialsPerCategory"
              name="trialsPerCategory"
              min="5"
              max="20"
              step="1"
              value={settings.trialsPerCategory}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>5</span>
              <span>20</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_trials_per_category_desc')}
            </div>
          </div>

          {/* Total Categories */}
          <div className={styles.settingGroup}>
            <label htmlFor="totalCategories">
              {translate('settings_total_categories')}: {settings.totalCategories}
            </label>
            <input
              type="range"
              id="totalCategories"
              name="totalCategories"
              min="2"
              max="12"
              step="1"
              value={settings.totalCategories}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>2</span>
              <span>12</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_total_categories_desc')}
            </div>
          </div>

          {/* Max Trials */}
          <div className={styles.settingGroup}>
            <label htmlFor="maxTrials">
              {translate('settings_max_trials')}: {settings.maxTrials}
            </label>
            <input
              type="range"
              id="maxTrials"
              name="maxTrials"
              min="30"
              max="256"
              step="1"
              value={settings.maxTrials}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>30</span>
              <span>256</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_max_trials_desc')}
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
              min="3000"
              max="20000"
              step="1000"
              value={settings.responseWindow}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>3s</span>
              <span>20s</span>
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

export default WcstSettings;
