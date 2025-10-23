// components/tests/gng/test.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../../styles/GNGTest.module.css';
import GNGResults from '../../results/gng';
import GNGSettings from '../../settings/gng';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, RESPONSE_KEY, STOP_SIGNAL_VISUAL, THEME_COLOR } from './data';
import { useFullscreen } from '../../../hooks/useFullscreen';

// Simple stimulus display component
const StimulusDisplay = ({ stimulus, isStopSignalActive, isDemo }) => {
    if (!stimulus) return <div className={styles.stimulusArea}></div>;

    const style = {
        backgroundColor: stimulus.color || 'transparent',
        borderColor: isStopSignalActive ? STOP_SIGNAL_VISUAL.color : '#ccc',
        borderWidth: isStopSignalActive ? STOP_SIGNAL_VISUAL.thickness : '2px',
        borderStyle: 'solid',
    };

    let content = null;
    if (stimulus.type === 'shape') {
        if (stimulus.value === 'circle') style.borderRadius = '50%';
    }

    if (isStopSignalActive && STOP_SIGNAL_VISUAL.type === 'overlay_x') {
         content = <span className={styles.stopOverlay} style={{color: STOP_SIGNAL_VISUAL.color}}>X</span>;
    }

    return (
        <div className={styles.stimulusArea}>
            <div className={`${styles.stimulusShape} ${isDemo ? styles.demoStimulus : ''}`} style={style}>
                {content}
            </div>
        </div>
    );
};


export default function GNGTest({ assignmentId, onComplete, isStandalone, t }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [gameState, setGameState] = useState('welcome');
    // welcome, tutorial, demo, practice, practiceComplete, countdown, playing, results
    const [trialCount, setTrialCount] = useState(0);
    const [currentStimulus, setCurrentStimulus] = useState(null);
    const [isStopSignalActive, setIsStopSignalActive] = useState(false);
    const [isFixationVisible, setIsFixationVisible] = useState(false);
    const [trialData, setTrialData] = useState([]);
    const [practiceData, setPracticeData] = useState([]);
    const [currentSSD, setCurrentSSD] = useState(settings.initialSSDM);
    const [showSettings, setShowSettings] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [demoStep, setDemoStep] = useState(0);
    const [isPractice, setIsPractice] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackType, setFeedbackType] = useState(''); // 'correct', 'incorrect', ''

    // Translation function with fallback
    const translate = t || ((key) => key);

    // Fullscreen functionality
    const gameArea = useRef(null);
    const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameArea);

    // Refs for managing timeouts and state within timeouts/event listeners
    const responseAllowed = useRef(false);
    const responseTimer = useRef(null);
    const stimulusTimer = useRef(null);
    const stopSignalTimer = useRef(null);
    const ISITimer = useRef(null);
    const trialStartTime = useRef(null);
    const currentTrialInfo = useRef(null);

    // Demo animation effect
    useEffect(() => {
        if (gameState === 'demo') {
            if (demoStep === 0) {
                // Step 1: Show Go stimulus
                setCurrentStimulus(settings.goStimulus);
                setIsStopSignalActive(false);
                const timer = setTimeout(() => setDemoStep(1), 2500);
                return () => clearTimeout(timer);
            } else if (demoStep === 1) {
                // Step 2: Show "Correct!" feedback
                setCurrentStimulus(null);
                const timer = setTimeout(() => setDemoStep(2), 1500);
                return () => clearTimeout(timer);
            } else if (demoStep === 2) {
                // Step 3: Show NoGo stimulus
                setCurrentStimulus(settings.nogoStimulus);
                const timer = setTimeout(() => setDemoStep(3), 2500);
                return () => clearTimeout(timer);
            } else if (demoStep === 3) {
                // Step 4: Show "Correct withholding" feedback
                setCurrentStimulus(null);
                const timer = setTimeout(() => setDemoStep(4), 1500);
                return () => clearTimeout(timer);
            } else if (demoStep === 4) {
                // Step 5: Show Go stimulus (for stop trial)
                setCurrentStimulus(settings.goStimulus);
                setIsStopSignalActive(false);
                const timer = setTimeout(() => setDemoStep(5), 1500);
                return () => clearTimeout(timer);
            } else if (demoStep === 5) {
                // Step 6: Show stop signal
                setIsStopSignalActive(true);
                const timer = setTimeout(() => setDemoStep(6), 2000);
                return () => clearTimeout(timer);
            } else if (demoStep === 6) {
                // Step 7: Complete
                setCurrentStimulus(null);
                setIsStopSignalActive(false);
            }
        }
    }, [gameState, demoStep, settings]);

    // --- Core Trial Logic ---
    const runTrial = useCallback(() => {
        clearAllTimeouts();
        setIsFixationVisible(true);
        setCurrentStimulus(null);
        setIsStopSignalActive(false);
        setFeedbackMessage('');
        setFeedbackType('');
        responseAllowed.current = false;

        const activeSettings = isPractice ? { ...settings, ...PRACTICE_SETTINGS } : settings;
        const isi = activeSettings.minISIMs + Math.random() * (activeSettings.maxISIMs - activeSettings.minISIMs);

        ISITimer.current = setTimeout(() => {
            setIsFixationVisible(false);

            // Determine Trial Type
            let trialType = 'go';
            const randGo = Math.random();
            if (randGo > activeSettings.goProbability) {
                trialType = 'nogo';
            }

            let isStopTrial = false;
            if (trialType === 'go' && activeSettings.stopSignalProbability > 0) {
                if (Math.random() < activeSettings.stopSignalProbability) {
                    trialType = 'stop';
                    isStopTrial = true;
                }
            }

            // Select Stimulus
            const stimulus = (trialType === 'nogo') ? activeSettings.nogoStimulus : activeSettings.goStimulus;
            setCurrentStimulus(stimulus);
            trialStartTime.current = performance.now();
            responseAllowed.current = true;

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
                setCurrentStimulus(null);
            }, activeSettings.stimulusDurationMs);

            // Schedule Stop Signal
            if (isStopTrial) {
                stopSignalTimer.current = setTimeout(() => {
                    setIsStopSignalActive(true);
                }, currentSSD);
            }

            // Schedule Response Window End
            if (trialType === 'go' || trialType === 'stop') {
                responseTimer.current = setTimeout(() => {
                     if (responseAllowed.current) {
                         handleResponse(null, null);
                     }
                }, activeSettings.responseWindowMs);
            } else {
                 responseTimer.current = setTimeout(() => {
                      if (responseAllowed.current) {
                         handleResponse(null, null);
                      }
                 }, activeSettings.responseWindowMs);
            }

        }, isi);

    }, [settings, trialCount, currentSSD, isPractice]);

    // --- Start/Stop Test ---
    useEffect(() => {
        if (gameState === 'playing' || gameState === 'practice') {
            const maxTrials = isPractice ? PRACTICE_SETTINGS.totalTrials : settings.totalTrials;
            if (settings.testDurationMode === 'trials' && trialCount >= maxTrials) {
                if (isPractice) {
                    if (isFullscreen) {
                        exitFullscreen();
                    }
                    setGameState('practiceComplete');
                } else {
                    finishTest();
                }
            } else {
                runTrial();
            }
        }
        return () => clearAllTimeouts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, trialCount]);

    const startPractice = async () => {
        setIsPractice(true);
        if (!isFullscreen) {
            try {
                await enterFullscreen();
            } catch (err) {
                console.warn('Could not enter fullscreen mode:', err);
            }
        }
        setTrialCount(0);
        setPracticeData([]);
        setCurrentSSD(PRACTICE_SETTINGS.initialSSDM);
        setCountdown(3);
        setGameState('countdown');

        // Countdown then start practice
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setTimeout(() => setGameState('practice'), 500);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const startTest = async () => {
        setIsPractice(false);
        if (!isFullscreen) {
            try {
                await enterFullscreen();
            } catch (err) {
                console.warn('Could not enter fullscreen mode:', err);
            }
        }
        setTrialCount(0);
        setTrialData([]);
        setCurrentSSD(settings.initialSSDM);
        setCountdown(3);
        setGameState('countdown');

        // Countdown then start playing
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setTimeout(() => setGameState('playing'), 500);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const finishTest = () => {
        clearAllTimeouts();
        if (isFullscreen) {
            exitFullscreen();
        }
        setGameState('results');

        // Submit results if not standalone
        if (!isStandalone && onComplete) {
            onComplete(trialData);
        }
    };

    const resetGame = () => {
        clearAllTimeouts();
        if (isFullscreen) {
            exitFullscreen();
        }
        setGameState('welcome');
        setTrialCount(0);
        setTrialData([]);
        setPracticeData([]);
        setCurrentStimulus(null);
        setIsFixationVisible(false);
        setIsStopSignalActive(false);
        setIsPractice(false);
    };

    // --- Response Handling ---
    const handleResponse = useCallback((key, responseTimestamp) => {
        if (!responseAllowed.current || !currentTrialInfo.current) return;

        clearTimeout(responseTimer.current);
        responseAllowed.current = false;

        const rt = responseTimestamp ? responseTimestamp - trialStartTime.current : null;
        const pressedCorrectKey = key === RESPONSE_KEY;

        let outcome = 'unknown';
        let ssdAdjustment = 0;

        const { type, stopSignal, ssd } = currentTrialInfo.current;

        if (type === 'go') {
            if (pressedCorrectKey && rt <= settings.responseWindowMs) {
                outcome = 'correctGo';
                if (isPractice) {
                    setFeedbackMessage(translate('feedback_correct_go'));
                    setFeedbackType('correct');
                }
            } else {
                outcome = 'omission';
                if (isPractice) {
                    setFeedbackMessage(translate('feedback_omission'));
                    setFeedbackType('incorrect');
                }
            }
        } else if (type === 'nogo') {
            if (pressedCorrectKey) {
                outcome = 'commission';
                if (isPractice) {
                    setFeedbackMessage(translate('feedback_commission_nogo'));
                    setFeedbackType('incorrect');
                }
            } else {
                outcome = 'correctInhibit';
                if (isPractice) {
                    setFeedbackMessage(translate('feedback_correct_inhibit'));
                    setFeedbackType('correct');
                }
            }
        } else if (type === 'stop') {
            if (pressedCorrectKey && rt <= settings.responseWindowMs) {
                outcome = 'commission';
                ssdAdjustment = -1;
                if (isPractice) {
                    setFeedbackMessage(translate('feedback_commission_stop'));
                    setFeedbackType('incorrect');
                }
            } else {
                outcome = 'correctInhibit';
                ssdAdjustment = 1;
                if (isPractice) {
                    setFeedbackMessage(translate('feedback_correct_stop'));
                    setFeedbackType('correct');
                }
            }
        }

        // Log trial data
        const trialResult = {
            ...currentTrialInfo.current,
            responseKey: key,
            responseTime: rt,
            outcome: outcome,
            ssd: ssd,
        };

        if (isPractice) {
            setPracticeData(prev => [...prev, trialResult]);
        } else {
            setTrialData(prev => [...prev, trialResult]);
        }

        // Adjust SSD for next stop trial (Staircase)
        if (settings.useStaircaseSSD && ssdAdjustment !== 0) {
            setCurrentSSD(prevSSD => Math.max(50, Math.min(1000, prevSSD + ssdAdjustment * settings.ssdStepM)));
        }

        // Clear feedback after a short delay, then move to next trial
        setTimeout(() => {
            setFeedbackMessage('');
            setFeedbackType('');
            setTrialCount(prev => prev + 1);
        }, isPractice ? 800 : 200);

    }, [settings, isPractice, translate]);

    // Keyboard listener
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === RESPONSE_KEY && responseAllowed.current) {
                handleResponse(event.key, performance.now());
            }
        };

        if (gameState === 'playing' || gameState === 'practice') {
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

    // Calculate practice stats
    const calculatePracticeStats = () => {
        const goTrials = practiceData.filter(r => r.type === 'go');
        const correctGoResponses = practiceData.filter(r => r.outcome === 'correctGo');
        const correctGoRTs = correctGoResponses.map(r => r.responseTime).filter(rt => rt !== null);
        const meanGoRT = correctGoRTs.length > 0 ? (correctGoRTs.reduce((a, b) => a + b, 0) / correctGoRTs.length) : 0;

        const nogoTrials = practiceData.filter(r => r.type === 'nogo');
        const correctInhibitsNoGo = practiceData.filter(r => r.type === 'nogo' && r.outcome === 'correctInhibit');

        const stopTrials = practiceData.filter(r => r.type === 'stop');
        const correctInhibitsStop = practiceData.filter(r => r.type === 'stop' && r.outcome === 'correctInhibit');

        return {
            meanGoRT: meanGoRT.toFixed(0),
            goCorrect: `${correctGoResponses.length}/${goTrials.length}`,
            nogoCorrect: `${correctInhibitsNoGo.length}/${nogoTrials.length}`,
            stopSuccess: stopTrials.length > 0 ? `${correctInhibitsStop.length}/${stopTrials.length}` : 'N/A',
        };
    };

    // --- Render ---
    return (
        <div className={styles.container}>
            <div className={styles.testContainer}>
                <div className={styles.header}>
                    <Link href="/" passHref>
                        <div className={styles.logoLink}>
                            <Image
                                src="/logo.png"
                                alt={'psykasten Logo'}
                                width={50}
                                height={50}
                            />
                        </div>
                    </Link>
                     {(gameState === 'playing' || gameState === 'practice') && (
                         <div className={styles.progressInfo}>
                            {translate('trial_counter', {
                                current: trialCount + 1,
                                total: isPractice ? PRACTICE_SETTINGS.totalTrials : settings.totalTrials
                            })}
                         </div>
                     )}
                </div>

                <div className={styles.gameArea} ref={gameArea}>
                    {/* Welcome screen */}
                    {gameState === 'welcome' && (
                        <div className={styles.welcomeCard}>
                            <h2>{translate('welcome_title')}</h2>
                            <p>{translate('welcome_p1')}</p>
                            <p>{translate('welcome_p2')}</p>
                            <p>{translate('welcome_p3')}</p>
                            <div className={styles.buttonContainer}>
                                <button className={styles.primaryButton} onClick={() => setGameState('tutorial')}>
                                    {translate('start_button')}
                                </button>
                                <button
                                    className={styles.secondaryButton}
                                    onClick={() => setShowSettings(true)}
                                >
                                    {translate('common:settings')}
                                </button>
                            </div>
                            <div className={styles.linkContainer}>
                                {isStandalone && (
                                    <Link href="/">
                                        <div className={styles.link}>{translate('common:back_to_home')}</div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tutorial screen */}
                    {gameState === 'tutorial' && (
                        <div className={styles.welcomeCard}>
                            <h2>{translate('tutorial_title')}</h2>
                            <div className={styles.tutorialContent}>
                                <div className={styles.tutorialStep}>
                                    <div className={styles.stepNumber}>1</div>
                                    <div className={styles.stepText}>
                                        <h3>{translate('tutorial_step1_title')}</h3>
                                        <p>{translate('tutorial_step1_text')}</p>
                                    </div>
                                </div>
                                <div className={styles.tutorialStep}>
                                    <div className={styles.stepNumber}>2</div>
                                    <div className={styles.stepText}>
                                        <h3>{translate('tutorial_step2_title')}</h3>
                                        <p>{translate('tutorial_step2_text')}</p>
                                    </div>
                                </div>
                                <div className={styles.tutorialStep}>
                                    <div className={styles.stepNumber}>3</div>
                                    <div className={styles.stepText}>
                                        <h3>{translate('tutorial_step3_title')}</h3>
                                        <p>{translate('tutorial_step3_text')}</p>
                                    </div>
                                </div>
                                <div className={styles.tutorialStep}>
                                    <div className={styles.stepNumber}>4</div>
                                    <div className={styles.stepText}>
                                        <h3>{translate('tutorial_step4_title')}</h3>
                                        <p>{translate('tutorial_step4_text')}</p>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.buttonContainer}>
                                <button className={styles.primaryButton} onClick={() => { setDemoStep(0); setGameState('demo'); }}>
                                    {translate('see_demo')}
                                </button>
                                <button className={styles.secondaryButton} onClick={startPractice}>
                                    {translate('start_practice')}
                                </button>
                                <button
                                    className={styles.tertiaryButton}
                                    onClick={() => setGameState('welcome')}
                                >
                                    {translate('back')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Demo screen */}
                    {gameState === 'demo' && (
                        <div className={styles.welcomeCard}>
                            <h2>{translate('demo_title')}</h2>
                            <p className={styles.demoIntro}>{translate('demo_intro')}</p>

                            <div className={styles.demoStepText}>
                                {demoStep === 0 && <p>{translate('demo_step1')}</p>}
                                {demoStep === 1 && <p>{translate('demo_step2')}</p>}
                                {demoStep === 2 && <p>{translate('demo_step3')}</p>}
                                {demoStep === 3 && <p>{translate('demo_step4')}</p>}
                                {demoStep === 4 && <p>{translate('demo_step5')}</p>}
                                {demoStep === 5 && <p>{translate('demo_step6')}</p>}
                                {demoStep === 6 && <p>{translate('demo_step7')}</p>}
                            </div>

                            {/* Demo stimulus display */}
                            <div className={styles.demoContainer}>
                                <StimulusDisplay
                                    stimulus={currentStimulus}
                                    isStopSignalActive={isStopSignalActive}
                                    isDemo={true}
                                />
                            </div>

                            <div className={styles.buttonContainer}>
                                <button
                                    className={styles.primaryButton}
                                    onClick={startPractice}
                                    disabled={demoStep < 6}
                                >
                                    {translate('start_practice')}
                                </button>
                                <button
                                    className={styles.secondaryButton}
                                    onClick={() => setGameState('tutorial')}
                                >
                                    {translate('back')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Practice Complete screen */}
                    {gameState === 'practiceComplete' && (
                        <div className={styles.welcomeCard}>
                            <h2>{translate('practice_complete_title')}</h2>
                            <p>{translate('practice_complete_text1')}</p>
                            <p>{translate('practice_complete_text2')}</p>

                            <div className={styles.practiceStats}>
                                <h3>{translate('practice_stats_title')}</h3>
                                {(() => {
                                    const stats = calculatePracticeStats();
                                    return (
                                        <>
                                            <div className={styles.statRow}>
                                                <span>{translate('practice_go_rt')}:</span>
                                                <span className={styles.statValue}>{stats.meanGoRT} ms</span>
                                            </div>
                                            <div className={styles.statRow}>
                                                <span>{translate('practice_go_correct')}:</span>
                                                <span className={styles.statValue}>{stats.goCorrect}</span>
                                            </div>
                                            <div className={styles.statRow}>
                                                <span>{translate('practice_nogo_correct')}:</span>
                                                <span className={styles.statValue}>{stats.nogoCorrect}</span>
                                            </div>
                                            <div className={styles.statRow}>
                                                <span>{translate('practice_stop_correct')}:</span>
                                                <span className={styles.statValue}>{stats.stopSuccess}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className={styles.buttonContainer}>
                                <button className={styles.primaryButton} onClick={startTest}>
                                    {translate('start_real_test')}
                                </button>
                                <button
                                    className={styles.secondaryButton}
                                    onClick={startPractice}
                                >
                                    {translate('practice_again')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Countdown screen */}
                    {gameState === 'countdown' && (
                        <div className={styles.countdownOverlay}>
                            <h2>{translate('get_ready')}</h2>
                            <div className={styles.countdownNumber}>{countdown > 0 ? countdown : 'GO!'}</div>
                        </div>
                    )}

                    {/* Playing/Practice Area */}
                    {(gameState === 'playing' || gameState === 'practice') && (
                        <div className={styles.stimulusContainer}>
                            {isFixationVisible && <div className={styles.fixationCross}>+</div>}
                            {!isFixationVisible && (
                                <StimulusDisplay
                                    stimulus={currentStimulus}
                                    isStopSignalActive={isStopSignalActive}
                                    isDemo={false}
                                />
                            )}
                            {feedbackMessage && (
                                <div className={`${styles.feedbackMessage} ${styles[feedbackType]}`}>
                                    {feedbackMessage}
                                </div>
                            )}
                        </div>
                    )}

                     {/* Results screen */}
                     {gameState === 'results' && (
                         <GNGResults
                             results={trialData}
                             settings={settings}
                             onRestart={resetGame}
                             t={translate}
                         />
                     )}

                </div>

                 {/* Settings panel */}
                 {showSettings && (
                    <GNGSettings
                        settings={settings}
                        setSettings={setSettings}
                        onClose={() => setShowSettings(false)}
                        t={translate}
                    />
                 )}



            </div>
        </div>
    );
}
