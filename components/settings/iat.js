// components/settings/iat.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/iat/data';

const IatSettings = ({ settings, setSettings, onClose, t }) => {
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
            IAT {translate('common:settings')}
          </h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close settings">
            &times;
          </button>
        </div>

        <div className={styles.panelContent}>
          <div className={styles.settingGroup}>
            <label htmlFor="trialMultiplier">
              {translate('settings_trial_multiplier')}: {settings.trialMultiplier.toFixed(1)}×
            </label>
            <input
              type="range" id="trialMultiplier" name="trialMultiplier"
              min="0.5" max="2" step="0.1"
              value={settings.trialMultiplier}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>0.5×</span>
              <span>2.0×</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_trial_multiplier_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="iti">
              {translate('settings_iti')}: {settings.iti} ms
            </label>
            <input
              type="range" id="iti" name="iti"
              min="0" max="1000" step="50"
              value={settings.iti}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>0 ms</span>
              <span>1000 ms</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_iti_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="fontSize">
              {translate('settings_font_size')}: {settings.fontSize} px
            </label>
            <input
              type="range" id="fontSize" name="fontSize"
              min="20" max="72" step="2"
              value={settings.fontSize}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>20 px</span>
              <span>72 px</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_font_size_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="errorPenalty" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox" id="errorPenalty" name="errorPenalty"
                checked={settings.errorPenalty}
                onChange={handleChange}
              />
              {translate('settings_error_penalty')}
            </label>
            <div className={styles.settingDescription}>
              {translate('settings_error_penalty_desc')}
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button className={`${styles.button} ${styles.defaultButton}`} onClick={resetToDefaults}>
            {translate('settings_reset_defaults')}
          </button>
          <button className={`${styles.button} ${styles.primaryButton}`} onClick={onClose}>
            {translate('settings_save_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IatSettings;
