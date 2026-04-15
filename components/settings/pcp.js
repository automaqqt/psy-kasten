// components/settings/pcp.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/pcp/data';

const PcpSettings = ({ settings, setSettings, onClose, t }) => {
  const panelRef = useRef(null);
  const translate = t || ((key) => key);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleEscape = (event) => { if (event.key === 'Escape') onClose(); };
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
    if (type === 'checkbox') processedValue = checked;
    else if (type === 'number' || type === 'range') processedValue = parseFloat(value);
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
          <button className={styles.closeButton} onClick={onClose} aria-label="Close settings">
            &times;
          </button>
        </div>

        <div className={styles.panelContent}>
          <div className={styles.settingGroup}>
            <label htmlFor="totalTrials">
              {translate('settings_total_trials')}: {settings.totalTrials}
            </label>
            <input
              type="range"
              id="totalTrials"
              name="totalTrials"
              min="20"
              max="240"
              step="4"
              value={settings.totalTrials}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>20</span>
              <span>240</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_total_trials_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="fixationDuration">
              {translate('settings_fixation_duration')}: {settings.fixationDuration} ms
            </label>
            <input
              type="range"
              id="fixationDuration"
              name="fixationDuration"
              min="300"
              max="1500"
              step="50"
              value={settings.fixationDuration}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>300ms</span>
              <span>1500ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_fixation_duration_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="cueDuration">
              {translate('settings_cue_duration')}: {settings.cueDuration} ms
            </label>
            <input
              type="range"
              id="cueDuration"
              name="cueDuration"
              min="40"
              max="200"
              step="10"
              value={settings.cueDuration}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>40ms</span>
              <span>200ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_cue_duration_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="targetTimeout">
              {translate('settings_target_timeout')}: {settings.targetTimeout} ms
            </label>
            <input
              type="range"
              id="targetTimeout"
              name="targetTimeout"
              min="1000"
              max="3000"
              step="100"
              value={settings.targetTimeout}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>1000ms</span>
              <span>3000ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_target_timeout_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="intertrialInterval">
              {translate('settings_iti')}: {settings.intertrialInterval} ms
            </label>
            <input
              type="range"
              id="intertrialInterval"
              name="intertrialInterval"
              min="300"
              max="1500"
              step="50"
              value={settings.intertrialInterval}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>300ms</span>
              <span>1500ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_iti_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="validityRatio">
              {translate('settings_validity_ratio')}: {(settings.validityRatio * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              id="validityRatio"
              name="validityRatio"
              min="0.3"
              max="0.8"
              step="0.05"
              value={settings.validityRatio}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>30%</span>
              <span>80%</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_validity_ratio_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="noTargetRatio">
              {translate('settings_no_target_ratio')}: {(settings.noTargetRatio * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              id="noTargetRatio"
              name="noTargetRatio"
              min="0"
              max="0.25"
              step="0.01"
              value={settings.noTargetRatio}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>0%</span>
              <span>25%</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_no_target_ratio_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="countdownTimer">
              {translate('settings_countdown')}: {settings.countdownTimer} s
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
              {translate('settings_countdown_desc')}
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button className={`${styles.button} ${styles.defaultButton}`} onClick={resetToDefaults}>
            {translate('settings_reset')}
          </button>
          <button className={`${styles.button} ${styles.primaryButton}`} onClick={onClose}>
            {translate('settings_save_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PcpSettings;
