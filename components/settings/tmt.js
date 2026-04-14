// components/settings/tmt.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/tmt/data';

const TmtSettings = ({ settings, setSettings, onClose, t }) => {
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
    const processed = type === 'range' || type === 'number' ? parseFloat(value) : value;
    setSettings(prev => ({ ...prev, [name]: processed }));
  };

  const resetToDefaults = () => setSettings(DEFAULT_SETTINGS);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.settingsPanel} ref={panelRef}>
        <div className={styles.panelHeader}>
          <h2 className={styles.settingsTitle}>
            TMT {translate('common:settings')}
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
          <div className={styles.settingGroup}>
            <label htmlFor="maxTimePartA">
              {translate('settings_max_time_a')}: {settings.maxTimePartA}s
            </label>
            <input
              type="range"
              id="maxTimePartA"
              name="maxTimePartA"
              min="30"
              max="300"
              step="10"
              value={settings.maxTimePartA}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>30s</span>
              <span>300s</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_max_time_a_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="maxTimePartB">
              {translate('settings_max_time_b')}: {settings.maxTimePartB}s
            </label>
            <input
              type="range"
              id="maxTimePartB"
              name="maxTimePartB"
              min="60"
              max="600"
              step="30"
              value={settings.maxTimePartB}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>60s</span>
              <span>600s</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_max_time_b_desc')}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="circleSize">
              {translate('settings_circle_size')}: {settings.circleSize}px
            </label>
            <input
              type="range"
              id="circleSize"
              name="circleSize"
              min="40"
              max="80"
              step="2"
              value={settings.circleSize}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>40px</span>
              <span>80px</span>
            </div>
            <div className={styles.settingDescription}>
              {translate('settings_circle_size_desc')}
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
            {translate('settings_save_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TmtSettings;
