// components/settings/mot.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';
import { DEFAULT_SETTINGS } from '../tests/mot/data';

const MotSettings = ({ settings, setSettings, onClose, t }) => {
  const panelRef = useRef(null);
  const translate = t || ((key) => key);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) onClose();
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
    let processedValue = type === 'checkbox' ? checked : parseFloat(value);
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
          {/* Total Trials */}
          <div className={styles.settingGroup}>
            <label htmlFor="totalTrials">
              {translate('settings_total_trials')}: {settings.totalTrials}
            </label>
            <input type="range" id="totalTrials" name="totalTrials"
              min="5" max="60" step="5"
              value={settings.totalTrials} onChange={handleChange}
              className={styles.slider} />
            <div className={styles.rangeLabels}><span>5</span><span>60</span></div>
            <div className={styles.settingDescription}>{translate('settings_total_trials_desc')}</div>
          </div>

          {/* Number of Objects */}
          <div className={styles.settingGroup}>
            <label htmlFor="numObjects">
              {translate('settings_num_objects')}: {settings.numObjects}
            </label>
            <input type="range" id="numObjects" name="numObjects"
              min="4" max="12" step="1"
              value={settings.numObjects} onChange={handleChange}
              className={styles.slider} />
            <div className={styles.rangeLabels}><span>4</span><span>12</span></div>
            <div className={styles.settingDescription}>{translate('settings_num_objects_desc')}</div>
          </div>

          {/* Number of Targets */}
          <div className={styles.settingGroup}>
            <label htmlFor="numTargets">
              {translate('settings_num_targets')}: {settings.numTargets}
            </label>
            <input type="range" id="numTargets" name="numTargets"
              min="1" max={Math.floor(settings.numObjects / 2)} step="1"
              value={Math.min(settings.numTargets, Math.floor(settings.numObjects / 2))}
              onChange={handleChange}
              className={styles.slider} />
            <div className={styles.rangeLabels}><span>1</span><span>{Math.floor(settings.numObjects / 2)}</span></div>
            <div className={styles.settingDescription}>{translate('settings_num_targets_desc')}</div>
          </div>

          {/* Identification Duration */}
          <div className={styles.settingGroup}>
            <label htmlFor="identificationDuration">
              {translate('settings_identification_duration')}: {(settings.identificationDuration / 1000).toFixed(1)}s
            </label>
            <input type="range" id="identificationDuration" name="identificationDuration"
              min="1000" max="5000" step="200"
              value={settings.identificationDuration} onChange={handleChange}
              className={styles.slider} />
            <div className={styles.rangeLabels}><span>1s</span><span>5s</span></div>
            <div className={styles.settingDescription}>{translate('settings_identification_duration_desc')}</div>
          </div>

          {/* Tracking Duration */}
          <div className={styles.settingGroup}>
            <label htmlFor="trackingDuration">
              {translate('settings_tracking_duration')}: {(settings.trackingDuration / 1000).toFixed(0)}s
            </label>
            <input type="range" id="trackingDuration" name="trackingDuration"
              min="3000" max="20000" step="1000"
              value={settings.trackingDuration} onChange={handleChange}
              className={styles.slider} />
            <div className={styles.rangeLabels}><span>3s</span><span>20s</span></div>
            <div className={styles.settingDescription}>{translate('settings_tracking_duration_desc')}</div>
          </div>

          {/* Movement Speed */}
          <div className={styles.settingGroup}>
            <label htmlFor="movementSpeed">
              {translate('settings_movement_speed')}: {settings.movementSpeed}
            </label>
            <input type="range" id="movementSpeed" name="movementSpeed"
              min="1" max="6" step="0.5"
              value={settings.movementSpeed} onChange={handleChange}
              className={styles.slider} />
            <div className={styles.rangeLabels}><span>{translate('settings_slow')}</span><span>{translate('settings_fast')}</span></div>
            <div className={styles.settingDescription}>{translate('settings_movement_speed_desc')}</div>
          </div>

          {/* Show Feedback */}
          <div className={styles.settingGroup}>
            <label>
              <input type="checkbox" name="showFeedback"
                checked={settings.showFeedback} onChange={handleChange} />
              {' '}{translate('settings_show_feedback')}
            </label>
            <div className={styles.settingDescription}>{translate('settings_show_feedback_desc')}</div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button className={`${styles.button} ${styles.defaultButton}`} onClick={resetToDefaults}>
            {translate('settings_reset')}
          </button>
          <button className={`${styles.button} ${styles.primaryButton}`} onClick={onClose}>
            {translate('settings_save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MotSettings;
