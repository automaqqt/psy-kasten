import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';

const WtbSettings = ({ settings, setSettings, onClose, t }) => {
  const panelRef = useRef(null);
  const translate = t || ((key) => key);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        const focusableElements = panelRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        } else if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', handleTabKey);

    const firstFocusable = panelRef.current.querySelector('button, input, select');
    if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);

    document.body.classList.add('modal-open');

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const resetToDefaults = () => {
    setSettings({
      speechRate: 1.0,
      interDigitPause: 800,
      voiceLang: 'de-DE',
      countdownDuration: 3,
    });
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.settingsPanel} ref={panelRef}>
        <div className={styles.panelHeader}>
          <h2 className={styles.settingsTitle}>{translate('settings_title')}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label={translate('close_settings')}
          >
            ×
          </button>
        </div>

        <div className={styles.panelContent}>
          <div className={styles.settingGroup}>
            <label htmlFor="speechRate">{translate('speech_rate')}: {settings.speechRate.toFixed(1)}x</label>
            <input
              type="range"
              id="speechRate"
              name="speechRate"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.speechRate}
              onChange={handleChange}
              className={styles.slider}
            />
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="interDigitPause">{translate('inter_digit_pause')}: {settings.interDigitPause}ms</label>
            <input
              type="range"
              id="interDigitPause"
              name="interDigitPause"
              min="300"
              max="2000"
              step="100"
              value={settings.interDigitPause}
              onChange={handleChange}
              className={styles.slider}
            />
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="voiceLang">{translate('voice_language')}</label>
            <select
              id="voiceLang"
              name="voiceLang"
              value={settings.voiceLang}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="de-DE">Deutsch (German)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Español (Spanish)</option>
            </select>
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="countdownDuration">{translate('countdown_duration')}: {settings.countdownDuration}s</label>
            <input
              type="range"
              id="countdownDuration"
              name="countdownDuration"
              min="1"
              max="10"
              step="1"
              value={settings.countdownDuration}
              onChange={handleChange}
              className={styles.slider}
            />
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.defaultButton}`}
            onClick={resetToDefaults}
          >
            {translate('reset_to_defaults')}
          </button>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={onClose}
          >
            {translate('save_and_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WtbSettings;