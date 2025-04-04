// components/settings/gng/GNGSettings.js
import React, { useEffect, useRef } from 'react';
import styles from '../../styles/Settings.module.css'; // Reuse existing settings styles
import { DEFAULT_SETTINGS } from '../tests/gng/data';

const GNGSettings = ({ settings, setSettings, onClose }) => {
  const panelRef = useRef(null);

  // Re-use useEffect for closing modal, focus trapping, escape key...
  useEffect(() => {
     const handleClickOutside = (event) => { if (panelRef.current && !panelRef.current.contains(event.target)) onClose(); };
     document.addEventListener('mousedown', handleClickOutside);
     // Add focus trap and escape key logic here...
     document.body.classList.add('modal-open');
     panelRef.current?.querySelector('input, select, button')?.focus();
     return () => {
         document.removeEventListener('mousedown', handleClickOutside);
         // remove other listeners...
         document.body.classList.remove('modal-open');
     };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;

    if (type === 'checkbox') {
        processedValue = checked;
    } else if (type === 'number' || type === 'range') {
        processedValue = parseFloat(value); // Use float for probabilities
        // Add clamps/validation
        if (name === 'goProbability') processedValue = Math.max(0.1, Math.min(0.9, processedValue));
        if (name === 'stopSignalProbability') processedValue = Math.max(0, Math.min(1 - settings.goProbability, processedValue)); // Cannot exceed 1-goProb
        // Convert probabilities back to percentage for display if needed, but store as decimal
    }

    // Ensure related probabilities make sense
    if (name === 'goProbability') {
         const currentStopProb = settings.stopSignalProbability;
         if (currentStopProb > (1 - processedValue)) {
             // If decreasing GoProb makes StopProb invalid, reduce StopProb
             setSettings(prev => ({
                 ...prev,
                 [name]: processedValue,
                 stopSignalProbability: Math.max(0, 1 - processedValue)
             }));
             return; // Exit early as state is set
         }
    }


    setSettings(prev => ({
        ...prev,
        [name]: processedValue
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const nogoProbability = (1 - settings.goProbability).toFixed(2);
  const actualGoProbability = (settings.goProbability * (1 - settings.stopSignalProbability)).toFixed(2);
  const actualStopProbability = (settings.goProbability * settings.stopSignalProbability).toFixed(2);


  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.settingsPanel} ref={panelRef}>
        <div className={styles.panelHeader}>
          <h2 className={styles.settingsTitle}>Go/NoGo/SST Settings</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close settings">×</button>
        </div>

        <div className={styles.panelContent}>
            {/* Basic Settings */}
             <div className={styles.settingGroup}>
                <label htmlFor="goProbability">
                  Base Go Probability (%): {Math.round(settings.goProbability * 100)}
                </label>
                <input type="range" id="goProbability" name="goProbability" min="0.1" max="0.9" step="0.05"
                       value={settings.goProbability} onChange={handleChange} className={styles.slider} />
                 <div className={styles.rangeLabels}><span>10%</span><span>90%</span></div>
                 <div className={styles.settingDescription}>Determines NoGo rate (100% - Go Prob).</div>
            </div>

            <div className={styles.settingGroup}>
                <label htmlFor="stopSignalProbability">
                   Stop Signal Probability (relative to Go trials, %): {Math.round(settings.stopSignalProbability * 100)}
                </label>
                <input type="range" id="stopSignalProbability" name="stopSignalProbability" min="0" max={Math.max(0, (1 - settings.goProbability) / settings.goProbability).toFixed(2) || 1} step="0.05" // Max depends on Go rate logic? Simpler: just min 0 max 1
                       // Simplified max:
                       value={settings.stopSignalProbability} onChange={handleChange} className={styles.slider}
                       disabled={settings.goProbability <= 0} />
                 <div className={styles.rangeLabels}><span>0% (Pure Go/NoGo)</span><span>50%</span></div>
            </div>

             <div className={styles.settingGroup} style={{border:'1px dashed #ccc', padding:'0.5rem', borderRadius:'4px', fontSize:'0.9em'}}>
                <strong>Resulting Trial Mix:</strong><br/>
                Go Trials: ~{Math.round(actualGoProbability * 100)}%<br/>
                NoGo Trials: ~{Math.round(nogoProbability * 100)}%<br/>
                Stop Trials: ~{Math.round(actualStopProbability * 100)}%
            </div>


            <div className={styles.settingGroup}>
                <label htmlFor="totalTrials">Total Trials:</label>
                <input type="number" id="totalTrials" name="totalTrials" min="20" max="500" step="10"
                       value={settings.totalTrials} onChange={handleChange} style={{width:'80px', padding:'5px'}} />
                 {/* Add option for Time-based duration if needed */}
            </div>

             <div className={styles.settingGroup}>
                <label htmlFor="stimulusDurationMs">Stimulus Duration (ms): {settings.stimulusDurationMs}</label>
                 <input type="range" id="stimulusDurationMs" name="stimulusDurationMs" min="100" max="2000" step="100"
                        value={settings.stimulusDurationMs} onChange={handleChange} className={styles.slider}/>
                  <div className={styles.rangeLabels}><span>Fast</span><span>Slow</span></div>
            </div>

            <div className={styles.settingGroup}>
                <label>Inter-Stimulus Interval (ISI) Range (ms):</label>
                 Min: <input type="number" name="minISIMs" value={settings.minISIMs} onChange={handleChange} style={{width:'70px'}}/> {' '}
                 Max: <input type="number" name="maxISIMs" value={settings.maxISIMs} onChange={handleChange} style={{width:'70px'}}/>
            </div>

             <div className={styles.settingGroup}>
                <label htmlFor="responseWindowMs">Response Window (ms): {settings.responseWindowMs}</label>
                 <input type="range" id="responseWindowMs" name="responseWindowMs" min="500" max="2000" step="100"
                        value={settings.responseWindowMs} onChange={handleChange} className={styles.slider}/>
                 <div className={styles.rangeLabels}><span>Strict</span><span>Lenient</span></div>
            </div>


             {/* Stop Signal Specific */}
            {settings.stopSignalProbability > 0 && (
                <fieldset style={{border: '1px solid blue', padding: '1rem', marginTop: '1rem', borderRadius:'5px'}}>
                    <legend>Stop Signal Settings</legend>
                     <div className={styles.settingGroup}>
                        <label>
                            <input type="checkbox" name="useStaircaseSSD" checked={settings.useStaircaseSSD} onChange={handleChange}/>
                            Use Staircase SSD Adjustment
                        </label>
                     </div>
                     <div className={styles.settingGroup}>
                        <label htmlFor="initialSSDM">{settings.useStaircaseSSD ? 'Initial' : 'Fixed'} SSD (ms):</label>
                         <input type="number" id="initialSSDM" name="initialSSDM" min="50" max="1000" step="10"
                                value={settings.initialSSDM} onChange={handleChange} style={{width:'80px'}}/>
                     </div>
                     {settings.useStaircaseSSD && (
                         <div className={styles.settingGroup}>
                            <label htmlFor="ssdStepM">Staircase Step Size (ms):</label>
                             <input type="number" id="ssdStepM" name="ssdStepM" min="10" max="100" step="5"
                                    value={settings.ssdStepM} onChange={handleChange} style={{width:'80px'}}/>
                         </div>
                     )}
                </fieldset>
            )}

        </div>

        <div className={styles.buttonGroup}>
          <button className={`${styles.button} ${styles.defaultButton}`} onClick={resetToDefaults}> Reset Defaults </button>
          <button className={`${styles.button} ${styles.primaryButton}`} onClick={onClose}> Save & Close </button>
        </div>
      </div>
    </div>
  );
};

export default GNGSettings;