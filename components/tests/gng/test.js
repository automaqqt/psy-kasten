// components/tests/gng/GNGTest.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from '../../../styles/GNGTest.module.css'; // Create this CSS file
import GNGResults from '../../results/gng'; // Create this Results component
import GNGSettings from '../../settings/gng'; // Create this Settings component
import { DEFAULT_SETTINGS, RESPONSE_KEY, STOP_SIGNAL_VISUAL } from './data';

// Simple stimulus display component
const StimulusDisplay = ({ stimulus, isStopSignalActive }) => {
    if (!stimulus) return <div className={styles.stimulusArea}></div>; // Empty area if no stimulus

    const style = {
        backgroundColor: stimulus.color || 'transparent', // Use color if defined
        borderColor: isStopSignalActive ? STOP_SIGNAL_VISUAL.color : '#ccc',
        borderWidth: isStopSignalActive ? STOP_SIGNAL_VISUAL.thickness : '1px',
        borderStyle: 'solid',
    };

    let content = null;
    if (stimulus.type === 'shape') {
        if (stimulus.value === 'circle') style.borderRadius = '50%';
        // Add other shapes if needed (e.g., triangle using clip-path)
    }
    // Add other stimulus types (e.g., letter) if defined

    // Optional: Add Stop Signal Overlay (like an X)
    if (isStopSignalActive && STOP_SIGNAL_VISUAL.type === 'overlay_x') {
         content = <span className={styles.stopOverlay} style={{color: STOP_SIGNAL_VISUAL.color}}>X</span>;
    }


    return (
        <div className={styles.stimulusArea}>
            <div className={styles.stimulusShape} style={style}>
                {content}
            </div>
        </div>
    );
};


export default function GNGTest() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [gameState, setGameState] = useState('welcome');
    // welcome, instructions, countdown, playing, results
    const [trialCount, setTrialCount] = useState(0);
    const [currentStimulus, setCurrentStimulus] = useState(null);
    const [isStopSignalActive, setIsStopSignalActive] = useState(false);
    const [isFixationVisible, setIsFixationVisible] = useState(false);
    const [trialData, setTrialData] = useState([]);
    const [currentSSD, setCurrentSSD] = useState(settings.initialSSDM); // ms
    const [showSettings, setShowSettings] = useState(false);

    // Refs for managing timeouts and state within timeouts/event listeners
    const responseAllowed = useRef(false);
    const responseTimer = useRef(null);
    const stimulusTimer = useRef(null);
    const stopSignalTimer = useRef(null);
    const ISITimer = useRef(null);
    const trialStartTime = useRef(null);
    const currentTrialInfo = useRef(null); // Store info about the current trial

    // --- Core Trial Logic ---
    const runTrial = useCallback(() => {
        clearAllTimeouts(); // Clear any pending timeouts from previous trial steps
        setIsFixationVisible(true);
        setCurrentStimulus(null);
        setIsStopSignalActive(false);
        responseAllowed.current = false; // Disallow response during fixation/ISI

        const isi = settings.minISIMs + Math.random() * (settings.maxISIMs - settings.minISIMs);

        ISITimer.current = setTimeout(() => {
            setIsFixationVisible(false);

            // Determine Trial Type
            let trialType = 'go'; // Default
            const randGo = Math.random();
            if (randGo > settings.goProbability) {
                trialType = 'nogo';
            }

            let isStopTrial = false;
            if (trialType === 'go' && settings.stopSignalProbability > 0) {
                if (Math.random() < settings.stopSignalProbability) {
                    trialType = 'stop';
                    isStopTrial = true;
                }
            }

            // Select Stimulus
            const stimulus = (trialType === 'nogo') ? settings.nogoStimulus : settings.goStimulus;
            setCurrentStimulus(stimulus);
            trialStartTime.current = performance.now();
            responseAllowed.current = true; // Allow response once stimulus appears


            // Store current trial details for response handler
            currentTrialInfo.current = {
                trialNum: trialCount + 1,
                type: trialType,
                stimulus: stimulus,
                stopSignal: isStopTrial,
                ssd: isStopTrial ? currentSSD : null,
                isi: isi,
            };

            // Schedule Stimulus Offset
            stimulusTimer.current = setTimeout(() => {
                setCurrentStimulus(null); // Remove stimulus
                // Note: Response window might still be open even if stimulus is gone
            }, settings.stimulusDurationMs);

            // Schedule Stop Signal (if applicable)
            if (isStopTrial) {
                stopSignalTimer.current = setTimeout(() => {
                    setIsStopSignalActive(true);
                    // Stop signal stays active until end of response window or stimulus duration, whichever is longer?
                    // For simplicity, let it stay until the response window ends or stimulus offset if shorter
                    // (This might need refinement based on specific SST protocols)
                }, currentSSD);
            }

            // Schedule Response Window End / Omission Check (for Go/Stop trials)
            if (trialType === 'go' || trialType === 'stop') {
                responseTimer.current = setTimeout(() => {
                     // If this timeout fires, no valid response was made in time
                     if (responseAllowed.current) { // Check if a response hasn't already been processed
                         handleResponse(null, null); // Process as omission/correct inhibit
                     }
                }, settings.responseWindowMs);
            } else { // NoGo trial - no response expected
                 responseTimer.current = setTimeout(() => {
                     // If this timeout fires for a NoGo, it means they correctly withheld
                      if (responseAllowed.current) {
                         handleResponse(null, null); // Process as correct inhibit
                      }
                 }, settings.responseWindowMs); // Wait window duration to confirm withholding
            }

        }, isi);

    }, [settings, trialCount, currentSSD]); // Include currentSSD for stop trials

    // --- Start/Stop Test ---
    useEffect(() => {
        if (gameState === 'playing') {
            if (settings.testDurationMode === 'trials' && trialCount >= settings.totalTrials) {
                finishTest();
            } else {
                runTrial();
            }
        }
        // Cleanup on unmount or when game state changes
        return () => clearAllTimeouts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, trialCount]); // runTrial dependency removed to avoid loop, it's called explicitly

    const startTest = () => {
        setTrialCount(0);
        setTrialData([]);
        setCurrentSSD(settings.initialSSDM); // Reset SSD
        setGameState('countdown');
        // Add countdown logic if desired, then setGameState('playing')
         setTimeout(() => setGameState('playing'), 1000); // Simple immediate start for now
    };

    const finishTest = () => {
        clearAllTimeouts();
        setGameState('results');
    };

    const resetGame = () => {
        clearAllTimeouts();
        setGameState('welcome');
        setTrialCount(0);
        setTrialData([]);
        setCurrentStimulus(null);
        setIsFixationVisible(false);
        setIsStopSignalActive(false);
         // Settings are kept, SSD reset by startTest if needed
    };


    // --- Response Handling ---
    const handleResponse = useCallback((key, responseTimestamp) => {
        if (!responseAllowed.current || !currentTrialInfo.current) return; // Ignore response if not allowed or no trial info

        clearTimeout(responseTimer.current); // Response received, clear the timeout
        responseAllowed.current = false; // Prevent multiple responses for this trial

        const rt = responseTimestamp ? responseTimestamp - trialStartTime.current : null;
        const pressedCorrectKey = key === RESPONSE_KEY;

        let outcome = 'unknown';
        let ssdAdjustment = 0; // 0 = no change, 1 = increase SSD, -1 = decrease SSD

        const { type, stopSignal, ssd } = currentTrialInfo.current;

        if (type === 'go') {
            if (pressedCorrectKey && rt <= settings.responseWindowMs) {
                outcome = 'correctGo';
            } else {
                outcome = 'omission'; // Missed or wrong key
            }
        } else if (type === 'nogo') {
            if (pressedCorrectKey) {
                outcome = 'commission'; // Responded when shouldn't have
            } else {
                outcome = 'correctInhibit'; // Correctly withheld
            }
        } else if (type === 'stop') {
            if (pressedCorrectKey && rt <= settings.responseWindowMs) {
                outcome = 'commission'; // Failed to stop
                ssdAdjustment = -1; // Make next stop easier
            } else {
                outcome = 'correctInhibit'; // Successfully stopped / withheld
                ssdAdjustment = 1; // Make next stop harder
            }
        }

        // Log trial data
        setTrialData(prev => [...prev, {
            ...currentTrialInfo.current,
            responseKey: key,
            responseTime: rt,
            outcome: outcome,
            ssd: ssd, // Log the SSD used for this trial
        }]);

        // Adjust SSD for next stop trial (Staircase)
        if (settings.useStaircaseSSD && ssdAdjustment !== 0) {
            setCurrentSSD(prevSSD => Math.max(50, Math.min(1000, prevSSD + ssdAdjustment * settings.ssdStepM))); // Keep SSD within bounds
        }


        // Move to next trial prep (fixation/ISI)
        // Need a slight delay before starting next ISI to allow state update?
        // Or trigger next step via useEffect on trialCount changing.
         setTrialCount(prev => prev + 1); // This will trigger the useEffect to call runTrial


    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]); // Dependencies managed carefully

    // Keyboard listener
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === RESPONSE_KEY && responseAllowed.current) {
                handleResponse(event.key, performance.now());
            }
        };

        if (gameState === 'playing') {
            window.addEventListener('keydown', handleKeyDown);
        } else {
            window.removeEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gameState, handleResponse]);

     // Utility to clear all timeouts
    const clearAllTimeouts = () => {
        clearTimeout(responseTimer.current);
        clearTimeout(stimulusTimer.current);
        clearTimeout(stopSignalTimer.current);
        clearTimeout(ISITimer.current);
    };

    // --- Render ---
    return (
        <div className={styles.container}>
            <div className={styles.testContainer}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Go/NoGo Stop-Signal Task</h1>
                     {gameState === 'playing' && (
                         <div className={styles.progressInfo}>
                            Trial: {trialCount + 1} / {settings.testDurationMode === 'trials' ? settings.totalTrials : 'Time Limit'}
                         </div>
                     )}
                    </div>

                <div className={styles.gameArea}>
                    {gameState === 'welcome' && (
                        <div className={styles.welcomeCard}>
                            <h2>Welcome!</h2>
                            <p>Press the <strong>'{RESPONSE_KEY === ' ' ? 'Spacebar' : RESPONSE_KEY}'</strong> as quickly as possible when you see the <span style={{color: settings.goStimulus.color}}>Go stimulus ({settings.goStimulus.value})</span>.</p>
                            {settings.stopSignalProbability === 0 && (
                                <p><strong>Do NOT press</strong> the key if you see the <span style={{color: settings.nogoStimulus.color}}>NoGo stimulus ({settings.nogoStimulus.value})</span>.</p>
                            )}
                            {settings.stopSignalProbability > 0 && (
                                <p>If the Go stimulus suddenly changes (e.g., gets a <span style={{color: STOP_SIGNAL_VISUAL.color, fontWeight:'bold'}}>red border</span>), try your best to <strong>STOP yourself</strong> from pressing the key.</p>
                            )}
                            <p>Focus on the cross (+) that appears between stimuli.</p>
                            <div className={styles.buttonContainer}>
                                <button className={styles.primaryButton} onClick={startTest}>
                                Start Test
                                </button>
                                <button 
                                className={styles.secondaryButton} 
                                onClick={() => setShowSettings(true)}
                                >
                                Adjust Settings
                                </button>
                            </div>
                            <div className={styles.linkContainer}>
                                <Link href="/">
                                <div className={styles.link}>Back to Home</div>
                                </Link>
                            </div>
                        </div>
                    )}

                    {(gameState === 'playing' || gameState === 'countdown') && (
                        <div className={styles.stimulusContainer}>
                            {isFixationVisible && <div className={styles.fixationCross}>+</div>}
                            <StimulusDisplay stimulus={currentStimulus} isStopSignalActive={isStopSignalActive} />
                        </div>
                    )}
                    {/* Add Countdown display if implemented */}

                     {gameState === 'results' && (
                         <GNGResults
                             results={trialData}
                             settings={settings}
                             onRestart={resetGame}
                         />
                     )}
                </div>

                 {showSettings && (
                    <GNGSettings
                        settings={settings}
                        setSettings={setSettings}
                        onClose={() => setShowSettings(false)}
                    />
                 )}

                 <footer className={styles.footer}>
                    <p>Go/NoGo Stop-Signal Task for assessing response control.</p>
                 </footer>

            </div>
        </div>
    );
}