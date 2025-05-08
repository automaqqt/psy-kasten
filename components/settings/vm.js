// components/settings/vm.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css'; // Reusing the same styles as Corsi

const SettingsPanel = ({ settings, setSettings, onClose }) => {
  const panelRef = useRef(null);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Trap focus inside modal
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
    
    // Focus first element on mount
    const firstFocusable = panelRef.current.querySelector('button, [href], input, select');
    if (firstFocusable) {
      firstFocusable.focus();
    }
    
    // Handle escape key
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    // Add body class to prevent scrolling
    document.body.classList.add('modal-open');
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setSettings(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setSettings(prev => ({
        ...prev,
        [name]: parseInt(value, 10)
      }));
    } else if (type === 'range') {
      setSettings(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const resetToDefaults = () => {
    setSettings({
      viewingTimeLevel2: 5000, // milliseconds
      viewingTimeLevel3to6: 13000,
      viewingTimeLevel7to9: 21000,
      imagesPerRow: 5,
      selectionMode: 'multiple',
      useDistractors: true
    });
  };
  
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.settingsPanel} ref={panelRef}>
        <div className={styles.panelHeader}>
          <h2 className={styles.settingsTitle}>Visual Memory Test Settings</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>
        
        <div className={styles.panelContent}>
          <div className={styles.settingGroup}>
            <label htmlFor="viewingTimeLevel2">
              Viewing Time (Level 2) (ms): {settings.viewingTimeLevel2}
            </label>
            <input
              type="range"
              id="viewingTimeLevel2"
              name="viewingTimeLevel2"
              min="3000"
              max="10000"
              step="500"
              value={settings.viewingTimeLevel2}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>3s</span>
              <span>10s</span>
            </div>
          </div>
          
          <div className={styles.settingGroup}>
            <label htmlFor="viewingTimeLevel3to6">
              Viewing Time (Level 3-6) (ms): {settings.viewingTimeLevel3to6}
            </label>
            <input
              type="range"
              id="viewingTimeLevel3to6"
              name="viewingTimeLevel3to6"
              min="5000"
              max="20000"
              step="1000"
              value={settings.viewingTimeLevel3to6}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>5s</span>
              <span>20s</span>
            </div>
          </div>
          
          <div className={styles.settingGroup}>
            <label htmlFor="viewingTimeLevel7to9">
              Viewing Time (Level 7-9) (ms): {settings.viewingTimeLevel7to9}
            </label>
            <input
              type="range"
              id="viewingTimeLevel7to9"
              name="viewingTimeLevel7to9"
              min="10000"
              max="30000"
              step="1000"
              value={settings.viewingTimeLevel7to9}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>10s</span>
              <span>30s</span>
            </div>
          </div>
          
          <div className={styles.settingGroup}>
            <label htmlFor="imagesPerRow">
              Images Per Row: {settings.imagesPerRow}
            </label>
            <input
              type="range"
              id="imagesPerRow"
              name="imagesPerRow"
              min="3"
              max="7"
              step="1"
              value={settings.imagesPerRow}
              onChange={handleChange}
              className={styles.slider}
            />
            <div className={styles.rangeLabels}>
              <span>3</span>
              <span>7</span>
            </div>
          </div>
          
          <div className={styles.settingGroup}>
            <label htmlFor="selectionMode">Selection Mode:</label>
            <select
              id="selectionMode"
              name="selectionMode"
              value={settings.selectionMode}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="multiple">Multiple Selection</option>
              <option value="sequence">Sequential Selection</option>
            </select>
            <div className={styles.settingDescription}>
              Multiple selection allows clicking any image in any order. Sequential requires selecting in the correct order.
            </div>
          </div>
          
          <div className={styles.settingGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="useDistractors"
                checked={settings.useDistractors}
                onChange={handleChange}
                className={styles.checkbox}
              />
              Use Distractor Images
            </label>
            <div className={styles.settingDescription}>
              When enabled, additional images not from the original set will be shown during recall.
            </div>
          </div>
        </div>
        
        <div className={styles.buttonGroup}>
          <button 
            className={`${styles.button} ${styles.defaultButton}`} 
            onClick={resetToDefaults}
          >
            Reset to Defaults
          </button>
          <button 
            className={`${styles.button} ${styles.primaryButton}`} 
            onClick={onClose}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;