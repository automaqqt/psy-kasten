// components/settings/igt.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/igt/data';

const IgtSettings = ({ settings, setSettings, onClose, t }) => {
  const panelRef = useRef(null);
  const translate = t || ((key) => key);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
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
    const processedValue = (type === 'number' || type === 'range') ? parseFloat(value) : value;
    setSettings(prev => ({ ...prev, [name]: processedValue }));
  };

  const resetToDefaults = () => setSettings(DEFAULT_SETTINGS);

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
            aria-label={translate('common:close')}
          >
            &times;
          </button>
        </div>

        <div className={styles.panelContent}>
          {/* Total trials */}
          <div className={styles.settingGroup}>
            <label htmlFor="totalTrials">
              {translate('settings_total_trials_label')}: {settings.totalTrials}
            </label>
            <input
              type="range"
              id="totalTrials"
              name="totalTrials"
              min="20"
              max="200"
              step="10"
              value={settings.totalTrials}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>20</span>
              <span>200</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_total_trials_desc')}
            </div>
          </div>

          {/* Starting balance */}
          <div className={styles.settingGroup}>
            <label htmlFor="startingBalance">
              {translate('settings_starting_balance_label')}: ${settings.startingBalance}
            </label>
            <input
              type="range"
              id="startingBalance"
              name="startingBalance"
              min="0"
              max="5000"
              step="500"
              value={settings.startingBalance}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>$0</span>
              <span>$5000</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_starting_balance_desc')}
            </div>
          </div>

          {/* Feedback duration */}
          <div className={styles.settingGroup}>
            <label htmlFor="feedbackDuration">
              {translate('settings_feedback_duration_label')}: {settings.feedbackDuration} ms
            </label>
            <input
              type="range"
              id="feedbackDuration"
              name="feedbackDuration"
              min="500"
              max="3000"
              step="100"
              value={settings.feedbackDuration}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>500 ms</span>
              <span>3000 ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_feedback_duration_desc')}
            </div>
          </div>

          {/* ITI duration */}
          <div className={styles.settingGroup}>
            <label htmlFor="itiDuration">
              {translate('settings_iti_duration_label')}: {settings.itiDuration} ms
            </label>
            <input
              type="range"
              id="itiDuration"
              name="itiDuration"
              min="0"
              max="2000"
              step="100"
              value={settings.itiDuration}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>0 ms</span>
              <span>2000 ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_iti_duration_desc')}
            </div>
          </div>

          {/* Countdown */}
          <div className={styles.settingGroup}>
            <label htmlFor="countdownTimer">
              {translate('settings_countdown_label')}: {settings.countdownTimer} s
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
              <span>0 s</span>
              <span>10 s</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_countdown_desc')}
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.defaultButton}`}
            onClick={resetToDefaults}
          >
            {translate('settings_reset_defaults')}
          </button>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={onClose}
          >
            {translate('settings_save_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IgtSettings;
