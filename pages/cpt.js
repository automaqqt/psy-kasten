// pages/cpt.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import SettingsPanel from '../components/settings/corsi';
import CPTResults from '../components/results/cpt';

export default function CPT() {
  // State management
  const [gameState, setGameState] = useState('welcome'); // welcome, settings, ready, test, results
  const [settings, setSettings] = useState({
    testDuration: 300, // seconds
    stimulusInterval: 1500, // milliseconds
    stimulusDuration: 250, // milliseconds
    targetProbability: 0.2, // 20% of stimuli are targets
    countdownTimer: 3, // seconds
    targetLetter: 'X', // The target letter (respond when NOT this letter)
    nonTargetLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], // Letters that will appear
  });
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [trials, setTrials] = useState([]);
  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [stimulusVisible, setStimulusVisible] = useState(false);
  const [testStartTime, setTestStartTime] = useState(null);
  const [testTimeRemaining, setTestTimeRemaining] = useState(0);
  const [keyPressAllowed, setKeyPressAllowed] = useState(false);
  
  const stimulusRef = useRef(null);
  const timerRef = useRef(null);
  const testTimerRef = useRef(null);
  const stimulusTimerRef = useRef(null);
  
  // Initialize test based on settings
  const startTest = useCallback(() => {
    // Reset state for new test
    setTrials([]);
    setGameState('countdown');
    setCountdown(settings.countdownTimer);
    
    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setGameState('test');
          const now = Date.now();
          setTestStartTime(now);
          setTestTimeRemaining(settings.testDuration);
          
          // Start test timer
          testTimerRef.current = setInterval(() => {
            setTestTimeRemaining(prev => {
              const remaining = Math.max(0, prev - 1);
              if (remaining <= 0) {
                clearInterval(testTimerRef.current);
                endTest();
              }
              return remaining;
            });
          }, 1000);
          
          // Start stimulus presentation
          presentNextStimulus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings]);
  
  // Present a stimulus
  const presentNextStimulus = useCallback(() => {
    // Clear any existing timers
    if (stimulusTimerRef.current) {
      clearTimeout(stimulusTimerRef.current);
    }
    
    // Check if test time is remaining
    if (testTimeRemaining <= 0) {
      return;
    }
    
    // Generate random stimulus
    const isTarget = Math.random() < settings.targetProbability;
    let letter;
    
    if (isTarget) {
      letter = settings.targetLetter;
    } else {
      // Choose a random non-target letter
      const randomIndex = Math.floor(Math.random() * settings.nonTargetLetters.length);
      letter = settings.nonTargetLetters[randomIndex];
    }
    
    // Create trial object
    const trial = {
      stimulus: letter,
      isTarget: isTarget,
      responseTime: null,
      responded: false,
      correct: null,
      trialStartTime: Date.now() - testStartTime, // ms since test start
    };
    
    // Update state
    setCurrentStimulus(trial);
    setStimulusVisible(true);
    setKeyPressAllowed(true);
    
    // Schedule stimulus to disappear
    stimulusTimerRef.current = setTimeout(() => {
      setStimulusVisible(false);
      setKeyPressAllowed(false);
      
      // If no response and it was a target, mark as miss (false negative)
      if (!isTarget && !trial.responded) {
        trial.correct = false;
        trial.responseType = 'miss';
      }
      // If no response and it was not a target, mark as correct rejection
      else if (isTarget && !trial.responded) {
        trial.correct = true;
        trial.responseType = 'correctRejection';
      }
      
      // Add completed trial to trials array
      const updatedTrial = {...trial};
      setTrials(prevTrials => [...prevTrials, updatedTrial]);
      
      // Schedule next stimulus
      stimulusTimerRef.current = setTimeout(() => {
        presentNextStimulus();
      }, settings.stimulusInterval - settings.stimulusDuration);
    }, settings.stimulusDuration);
  }, [settings, testStartTime, testTimeRemaining]);
  
  // Handle user response via keyboard
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState === 'test' && keyPressAllowed && (e.code === 'Space' || e.key === ' ')) {
        handleResponse();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameState, keyPressAllowed]);
  
  // Handle user response
  const handleResponse = useCallback(() => {
    if (!keyPressAllowed || !currentStimulus) return;
    
    // Prevent multiple responses to same stimulus
    setKeyPressAllowed(false);
    
    // Calculate response time
    const responseTime = Date.now() - (testStartTime + currentStimulus.trialStartTime);
    
    // Update trial with response data
    const updatedStimulus = {
      ...currentStimulus,
      responseTime,
      responded: true,
    };
    
    // Determine if response was correct
    // In a CPT with X paradigm:
    // - Correct response to non-X (hit)
    // - No response to X (correct rejection)
    // - Response to X (false alarm)
    // - No response to non-X (miss)
    if (!updatedStimulus.isTarget) {
      // Responded to non-target (correct)
      updatedStimulus.correct = true;
      updatedStimulus.responseType = 'hit';
    } else {
      // Responded to target (error)
      updatedStimulus.correct = false;
      updatedStimulus.responseType = 'falseAlarm';
    }
    
    setCurrentStimulus(updatedStimulus);
  }, [currentStimulus, testStartTime]);
  
  // End the test
  const endTest = useCallback(() => {
    // Clear all timers
    if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);
    if (testTimerRef.current) clearInterval(testTimerRef.current);
    
    setGameState('results');
  }, []);
  
  // Stop the test early
  const stopTest = () => {
    if (gameState !== 'welcome' && gameState !== 'results') {
      endTest();
    }
  };
  
  // Reset the test
  const resetTest = () => {
    // Clear all timers
    if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);
    if (testTimerRef.current) clearInterval(testTimerRef.current);
    
    setGameState('welcome');
  };
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);
      if (testTimerRef.current) clearInterval(testTimerRef.current);
    };
  }, []);
  
  // Format time as minutes:seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Calculate summary statistics for display
  const calculateStats = () => {
    if (trials.length === 0) {
      return {
        totalTrials: 0,
        hits: 0,
        misses: 0,
        correctRejections: 0,
        falseAlarms: 0,
        meanRT: 0,
        accuracy: 0,
        d_prime: 0,
        omissionErrors: 0,
        commissionErrors: 0
      };
    }
    
    // Count different response types
    const hits = trials.filter(t => t.responseType === 'hit').length;
    const misses = trials.filter(t => t.responseType === 'miss').length;
    const correctRejections = trials.filter(t => t.responseType === 'correctRejection').length;
    const falseAlarms = trials.filter(t => t.responseType === 'falseAlarm').length;
    
    // Calculate reaction times for correct responses (hits)
    const hitTrials = trials.filter(t => t.responseType === 'hit');
    const meanRT = hitTrials.length > 0 
      ? hitTrials.reduce((sum, t) => sum + t.responseTime, 0) / hitTrials.length 
      : 0;
    
    // Calculate accuracy
    const accuracy = trials.length > 0 ? (hits + correctRejections) / trials.length * 100 : 0;
    
    // Calculate d-prime (sensitivity index)
    // First find hit rate and false alarm rate
    const hitRate = hits / (hits + misses) || 0.5;
    const falseAlarmRate = falseAlarms / (falseAlarms + correctRejections) || 0.5;
    
    // Convert to z-scores (with bounds checking to avoid infinity)
    const zHitRate = normalCDFInverse(Math.min(Math.max(0.01, hitRate), 0.99));
    const zFalseAlarmRate = normalCDFInverse(Math.min(Math.max(0.01, falseAlarmRate), 0.99));
    
    // d' = z(hit rate) - z(false alarm rate)
    const d_prime = zHitRate - zFalseAlarmRate;
    
    return {
      totalTrials: trials.length,
      hits,
      misses,
      correctRejections,
      falseAlarms,
      meanRT,
      accuracy,
      d_prime,
      omissionErrors: misses,
      commissionErrors: falseAlarms
    };
  };
  
  // Approximation of the inverse of the normal CDF
  function normalCDFInverse(p) {
    if (p <= 0 || p >= 1) {
      return p <= 0 ? -4 : 4; // Avoid errors with extreme values
    }
    
    // Coefficients for the approximation
    const c = [2.515517, 0.802853, 0.010328];
    const d = [1.432788, 0.189269, 0.001308];
    
    // Compute the intermediate variables
    const t = p < 0.5 ? Math.sqrt(-2 * Math.log(p)) : Math.sqrt(-2 * Math.log(1 - p));
    
    // Compute the initial approximation
    const x = t - 
        (c[0] + c[1] * t + c[2] * t * t) / 
        (1 + d[0] * t + d[1] * t * t + d[2] * t * t * t);
    
    // Return the appropriate value of x
    return p < 0.5 ? -x : x;
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Continuous Performance Test (CPT)</title>
        <meta name="description" content="A digital implementation of the Continuous Performance Test (CPT)" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Continuous Performance Test (CPT)
        </h1>
        
        {gameState === 'welcome' && (
          <div className={styles.card}>
            <h2>Welcome to the Continuous Performance Test</h2>
            <p>
              This test measures your sustained attention and response inhibition. You'll see a series of letters appearing on the screen one at a time.
            </p>
            <p>
              Press the SPACE BAR whenever you see any letter <strong>EXCEPT</strong> the letter "{settings.targetLetter}". 
              In other words, respond to all letters but do not respond to "{settings.targetLetter}".
            </p>
            <p>
              Try to respond as quickly and accurately as possible. The test will take approximately {settings.testDuration / 60} minutes to complete.
            </p>
            <div className={styles.buttonContainer}>
              <button className={styles.button} onClick={startTest}>
                Start Test
              </button>
              <button 
                className={`${styles.button} ${styles.secondaryButton}`} 
                onClick={() => setShowSettings(true)}
              >
                Adjust Settings
              </button>
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <Link href="/">
                <a className={styles.link}>Try Corsi Block Test</a>
              </Link>
              <Link href="/pvt">
                <a className={styles.link} style={{ marginLeft: '1rem' }}>Try PVT Test</a>
              </Link>
            </div>
          </div>
        )}
        
        {showSettings && (
          <div className={styles.modalOverlay}>
            <SettingsPanel 
              settings={settings} 
              setSettings={setSettings} 
              onClose={() => setShowSettings(false)}
              isCPT={true}
            />
          </div>
        )}
        
        {gameState === 'countdown' && (
          <div className={styles.countdown}>
            <h2>Get Ready</h2>
            <div className={styles.countdownNumber}>{countdown}</div>
            <p>Press SPACE BAR for any letter EXCEPT "{settings.targetLetter}"</p>
          </div>
        )}
        
        {gameState === 'test' && (
          <div className={styles.cptContainer}>
            <div className={styles.cptHeader}>
              <div className={styles.cptTimer}>
                Time Remaining: {formatTime(testTimeRemaining)}
              </div>
              <div className={styles.cptTrials}>
                Trials: {trials.length}
              </div>
              <button 
                className={`${styles.iconButton} ${styles.stopButton}`}
                onClick={stopTest}
                title="Stop test"
              >
                ⏹️
              </button>
            </div>
            
            <div className={styles.cptStimulusContainer}>
              <div 
                className={styles.cptStimulus}
                ref={stimulusRef}
                onClick={handleResponse}
                style={{
                  opacity: stimulusVisible ? 1 : 0,
                  cursor: keyPressAllowed ? 'pointer' : 'default'
                }}
              >
                {currentStimulus && <div className={styles.cptLetter}>{currentStimulus.stimulus}</div>}
              </div>
            </div>
            
            <div className={styles.cptFooter}>
              <p>Press SPACE BAR for any letter EXCEPT "{settings.targetLetter}"</p>
              <div className={styles.cptLegend}>
                <div className={styles.cptLegendItem}>
                  <span className={styles.cptDot} style={{ backgroundColor: '#28a745' }}></span>
                  <span>Respond to all other letters</span>
                </div>
                <div className={styles.cptLegendItem}>
                  <span className={styles.cptDot} style={{ backgroundColor: '#dc3545' }}></span>
                  <span>Do NOT respond to "{settings.targetLetter}"</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {gameState === 'results' && (
          <div className={styles.resultsCard}>
            <h2>CPT Results</h2>
            
            <div className={styles.cptSummary}>
              <div className={styles.cptStatRow}>
                <div className={styles.cptStat}>
                  <h3>Accuracy</h3>
                  <p>{Math.round(calculateStats().accuracy)}%</p>
                </div>
                <div className={styles.cptStat}>
                  <h3>Mean Response Time</h3>
                  <p>{Math.round(calculateStats().meanRT)} ms</p>
                </div>
                <div className={styles.cptStat}>
                  <h3>Sensitivity (d')</h3>
                  <p>{calculateStats().d_prime.toFixed(2)}</p>
                </div>
              </div>
              
              <div className={styles.cptStatRow}>
                <div className={styles.cptStat}>
                  <h3>Correct Responses</h3>
                  <p>{calculateStats().hits} / {calculateStats().hits + calculateStats().misses}</p>
                </div>
                <div className={styles.cptStat}>
                  <h3>Commission Errors</h3>
                  <p>{calculateStats().falseAlarms}</p>
                  <span className={styles.cptStatDescription}>
                    Responded when should not have
                  </span>
                </div>
                <div className={styles.cptStat}>
                  <h3>Omission Errors</h3>
                  <p>{calculateStats().misses}</p>
                  <span className={styles.cptStatDescription}>
                    Failed to respond when should have
                  </span>
                </div>
              </div>
            </div>
            
            <CPTResults 
              trials={trials}
              stats={calculateStats()}
              targetLetter={settings.targetLetter}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '2rem' }}>
              <button className={styles.button} onClick={resetTest}>
                Try Again
              </button>
              
              <div className={styles.buttonContainer} style={{ marginTop: '0.5rem' }}>
                <Link href="/">
                  <a className={`${styles.button} ${styles.secondaryButton}`} style={{ width: '48%' }}>
                    Corsi Block Test
                  </a>
                </Link>
                <Link href="/pvt">
                  <a className={`${styles.button} ${styles.secondaryButton}`} style={{ width: '48%' }}>
                    PVT Test
                  </a>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          The Continuous Performance Test (CPT) is used to measure sustained attention and response inhibition.
          <Link href="/about-cpt">
            <a className={styles.link} style={{ marginLeft: '0.5rem' }}>Learn more</a>
          </Link>
        </p>
      </footer>
    </div>
  );
}