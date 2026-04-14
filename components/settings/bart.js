// components/settings/bart.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/bart/data';

const BartSettings = ({ settings, setSettings, onClose, t }) => {
  const panelRef = useRef(null);
  const translate = t || ((key) => key);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) onClose();
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
          <h2 className={styles.settingsTitle}>BART {translate('common:settings')}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close settings">&times;</button>
        </div>

        <div className={styles.panelContent}>
          {/* Total balloons */}
          <div className={styles.settingGroup}>
            <label htmlFor="totalBalloons">
              {translate('settings_total_balloons')}: {settings.totalBalloons}
            </label>
            <input
              type="range"
              id="totalBalloons"
              name="totalBalloons"
              min="6"
              max="90"
              step="3"
              value={settings.totalBalloons}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>6</span>
              <span>90</span>
            </div>
            <div className={styles.settingDescription}>{translate('settings_total_balloons_desc')}</div>
          </div>

          {/* Mixed trials */}
          <div className={styles.settingGroup}>
            <label htmlFor="mixedTrials">
              {translate('settings_mixed_trials')}: {settings.mixedTrials}
            </label>
            <input
              type="range"
              id="mixedTrials"
              name="mixedTrials"
              min="0"
              max={settings.totalBalloons}
              step="3"
              value={settings.mixedTrials}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>0</span>
              <span>{settings.totalBalloons}</span>
            </div>
            <div className={styles.settingDescription}>{translate('settings_mixed_trials_desc')}</div>
          </div>

          {/* Pump value */}
          <div className={styles.settingGroup}>
            <label htmlFor="pumpValueCents">
              {translate('settings_pump_value')}: {settings.pumpValueCents}¢
            </label>
            <input
              type="range"
              id="pumpValueCents"
              name="pumpValueCents"
              min="1"
              max="10"
              step="1"
              value={settings.pumpValueCents}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>1¢</span>
              <span>10¢</span>
            </div>
            <div className={styles.settingDescription}>{translate('settings_pump_value_desc')}</div>
          </div>

          {/* Show earnings */}
          <div className={styles.settingGroup}>
            <label htmlFor="showEarnings">
              <input
                type="checkbox"
                id="showEarnings"
                name="showEarnings"
                checked={settings.showEarnings}
                onChange={handleChange}
                style={{ marginRight: '0.5rem' }}
              />
              {translate('settings_show_earnings')}
            </label>
            <div className={styles.settingDescription}>{translate('settings_show_earnings_desc')}</div>
          </div>

          {/* Sounds */}
          <div className={styles.settingGroup}>
            <label htmlFor="enableSounds">
              <input
                type="checkbox"
                id="enableSounds"
                name="enableSounds"
                checked={settings.enableSounds}
                onChange={handleChange}
                style={{ marginRight: '0.5rem' }}
              />
              {translate('settings_enable_sounds')}
            </label>
            <div className={styles.settingDescription}>{translate('settings_enable_sounds_desc')}</div>
          </div>

          {/* Countdown */}
          <div className={styles.settingGroup}>
            <label htmlFor="countdownTimer">
              {translate('settings_countdown')}: {settings.countdownTimer}s
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
            <div className={styles.settingDescription}>{translate('settings_countdown_desc')}</div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button className={`${styles.button} ${styles.defaultButton}`} onClick={resetToDefaults}>
            {translate('common:reset_defaults') !== 'common:reset_defaults' ? translate('common:reset_defaults') : 'Reset Defaults'}
          </button>
          <button className={`${styles.button} ${styles.primaryButton}`} onClick={onClose}>
            {translate('common:save_close') !== 'common:save_close' ? translate('common:save_close') : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BartSettings;
