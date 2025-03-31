import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css';

const SettingsPanel = ({ settings, setSettings, onClose, isCPT = false, isPVT = false }) => {
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
    const { name, value, type } = e.target;
    
    if (type === 'number') {
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
    if (isCPT) {
      setSettings({
        testDuration: 300, // seconds
        stimulusInterval: 1500, // milliseconds
        stimulusDuration: 250, // milliseconds
        targetProbability: 0.2, // 20% of stimuli are targets
        countdownTimer: 3, // seconds
        targetLetter: 'X', // The target letter
        nonTargetLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], // Letters that will appear
      });
    } else if (isPVT) {
      setSettings({
        testDuration: 300, // seconds
        minInterval: 2000, // milliseconds
        maxInterval: 10000, // milliseconds
        countdownTimer: 3, // seconds
        stimulusColor: '#ff0000', // red
        backgroundColor: '#ffffff', // white
      });
    } else {
      // Corsi Block test
      setSettings({
        blockHighlightDuration: 700,
        intervalBetweenBlocks: 300,
        blockBlinkIntensity: 100,
        blockContrast: 70,
      });
    }
  };
  
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.settingsPanel} ref={panelRef}>
        <div className={styles.panelHeader}>
          <h2 className={styles.settingsTitle}>
            {isCPT ? 'CPT Test Settings' : 
             isPVT ? 'PVT Test Settings' : 
             'Corsi Block Test Settings'}
          </h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>
        
        <div className={styles.panelContent}>
          {isCPT && (
            <>
              <div className={styles.settingGroup}>
                <label htmlFor="testDuration">
                  Test Duration (seconds): {settings.testDuration}
                </label>
                <input
                  type="range"
                  id="testDuration"
                  name="testDuration"
                  min="60"
                  max="900"
                  step="30"
                  value={settings.testDuration}
                  onChange={handleChange}
                  className={styles.slider}
                />
                <div className={styles.rangeLabels}>
                  <span>1 min</span>
                  <span>15 min</span>
                </div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="stimulusInterval">
                  Interval Between Stimuli (ms): {settings.stimulusInterval}
                </label>
                <input
                  type="range"
                  id="stimulusInterval"
                  name="stimulusInterval"
                  min="1000"
                  max="3000"
                  step="100"
                  value={settings.stimulusInterval}
                  onChange={handleChange}
                  className={styles.slider}
                />
                <div className={styles.rangeLabels}>
                  <span>Fast (1s)</span>
                  <span>Slow (3s)</span>
                </div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="stimulusDuration">
                  Stimulus Duration (ms): {settings.stimulusDuration}
                </label>
                <input
                  type="range"
                  id="stimulusDuration"
                  name="stimulusDuration"
                  min="100"
                  max="500"
                  step="50"
                  value={settings.stimulusDuration}
                  onChange={handleChange}
                  className={styles.slider}
                />
                <div className={styles.rangeLabels}>
                  <span>Brief</span>
                  <span>Long</span>
                </div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="targetProbability">
                  Target Probability (%): {Math.round(settings.targetProbability * 100)}
                </label>
                <input
                  type="range"
                  id="targetProbability"
                  name="targetProbability"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={settings.targetProbability}
                  onChange={handleChange}
                  className={styles.slider}
                />
                <div className={styles.rangeLabels}>
                  <span>Rare (10%)</span>
                  <span>Common (50%)</span>
                </div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="targetLetter">Target Letter:</label>
                <select
                  id="targetLetter"
                  name="targetLetter"
                  value={settings.targetLetter}
                  onChange={handleChange}
                  className={styles.select}
                >
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
                    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(letter => (
                    <option key={letter} value={letter}>{letter}</option>
                  ))}
                </select>
                <div className={styles.settingDescription}>
                  The target letter is the one you should NOT respond to.
                </div>
              </div>
            </>
          )}
          
          {isPVT && (
            <>
              <div className={styles.settingGroup}>
                <label htmlFor="testDuration">
                  Test Duration (seconds): {settings.testDuration}
                </label>
                <input
                  type="range"
                  id="testDuration"
                  name="testDuration"
                  min="60"
                  max="900"
                  step="30"
                  value={settings.testDuration}
                  onChange={handleChange}
                  className={styles.slider}
                />
                <div className={styles.rangeLabels}>
                  <span>1 min</span>
                  <span>15 min</span>
                </div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="minInterval">
                  Minimum Interval (ms): {settings.minInterval}
                </label>
                <input
                  type="range"
                  id="minInterval"
                  name="minInterval"
                  min="1000"
                  max="5000"
                  step="500"
                  value={settings.minInterval}
                  onChange={handleChange}
                  className={styles.slider}
                />
                <div className={styles.rangeLabels}>
                  <span>1s</span>
                  <span>5s</span>
                </div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="maxInterval">
                  Maximum Interval (ms): {settings.maxInterval}
                </label>
                <input
                  type="range"
                  id="maxInterval"
                  name="maxInterval"
                  min="5000"
                  max="15000"
                  step="1000"
                  value={settings.maxInterval}
                  onChange={handleChange}
                  className={styles.slider}
                />
                <div className={styles.rangeLabels}>
                  <span>5s</span>
                  <span>15s</span>
                </div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="stimulusColor">Stimulus Color:</label>
                <input
                  type="color"
                  id="stimulusColor"
                  name="stimulusColor"
                  value={settings.stimulusColor}
                  onChange={handleChange}
                  className={styles.colorPicker}
                />
              </div>
            </>
          )}
          
          {!isCPT && !isPVT && (
            <>
              <div className={styles.settingGroup}>
                <label htmlFor="blockHighlightDuration">
                  Block Highlight Duration (ms): {settings.blockHighlightDuration}
                </label>
                <input
                  type="range"
                  id="blockHighlightDuration"
                  name="blockHighlightDuration"
                  min="200"
                  max="1500"
                  step="50"
                  value={settings.blockHighlightDuration}
                  onChange={handleChange}
                  className={styles.slider}
                />
                <div className={styles.rangeLabels}>
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="intervalBetweenBlocks">
                  Interval Between Blocks (ms): {settings.intervalBetweenBlocks}
                </label>
                <input
                  type="range"
                  id="intervalBetweenBlocks"
                  name="intervalBetweenBlocks"
                  min="100"
                  max="1000"
                  step="50"
                  value={settings.intervalBetweenBlocks}
                  onChange={handleChange}
                  className={styles.slider}
                />
                <div className={styles.rangeLabels}>
                  <span>Short</span>
                  <span>Long</span>
                </div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="blockBlinkIntensity">
                  Block Blink Intensity: {settings.blockBlinkIntensity}%
                </label>
                <input
                  type="range"
                  id="blockBlinkIntensity"
                  name="blockBlinkIntensity"
                  min="50"
                  max="100"
                  step="5"
                  value={settings.blockBlinkIntensity}
                  onChange={handleChange}
                  className={styles.slider}
                />
                <div className={styles.rangeLabels}>
                  <span>Subtle</span>
                  <span>Intense</span>
                </div>
              </div>
              
              <div className={styles.settingGroup}>
                <label htmlFor="blockContrast">
                  Block Contrast: {settings.blockContrast}%
                </label>
                <input
                  type="range"
                  id="blockContrast"
                  name="blockContrast"
                  min="30"
                  max="100"
                  step="5"
                  value={settings.blockContrast}
                  onChange={handleChange}
                  className={styles.slider}
                />
                <div className={styles.rangeLabels}>
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </>
          )}
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