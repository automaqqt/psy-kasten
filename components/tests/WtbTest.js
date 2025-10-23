import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../styles/WTBTest.module.css';
import WtbSettings from '../settings/wtb';
import WtbResults from '../results/wtb';
import Footer from '../ui/footer';
import { useFullscreen } from '../../hooks/useFullscreen';

// Predefined sequences for each level (3-8 digits)
const PREDEFINED_SEQUENCES = [
  // 2-digit sequences
  [[3, 8], [7, 4], [5, 9]],
  // 3-digit sequences
  [[1, 8, 6], [9, 3, 7], [2, 1, 4]],
  // 4-digit sequences
  [[8, 2, 7, 9], [6, 3, 5, 7], [4, 1, 6, 8]],
  // 5-digit sequences
  [[7, 2, 5, 9, 6], [3, 1, 8, 4, 2], [4, 9, 1, 7, 6]],
  // 6-digit sequences
  [[9, 2, 1, 6, 7, 5], [7, 8, 4, 5, 6, 2], [3, 7, 5, 9, 4, 6]],
  // 7-digit sequences
  [[1, 5, 8, 7, 9, 3, 2], [8, 9, 6, 1, 2, 7, 5], [4, 3, 7, 9, 2, 1, 8]],
  // 8-digit sequences
  [[5, 8, 1, 7, 2, 6, 9, 4], [2, 9, 1, 4, 7, 8, 3, 5], [7, 5, 6, 1, 3, 8, 4, 2]],
  // 9-digit sequences
  [[4, 9, 1, 8, 2, 5, 3, 6, 7], [9, 2, 4, 5, 7, 1, 3, 8, 6], [6, 4, 9, 5, 1, 7, 3, 2, 8]]
];

export default function WtbTest({ assignmentId, onComplete, isStandalone, t }) {
  const [gameState, setGameState] = useState('welcome'); // welcome, tutorial, intro, practice, practiceComplete, countdown, playing, listening, results
  const [level, setLevel] = useState(1); // Start with 3-digit sequences
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [roundData, setRoundData] = useState([]);
  const [sequenceIndexPerLevel, setSequenceIndexPerLevel] = useState({}); // Track which sequence we're at for each level
  const [attemptsPerLevel, setAttemptsPerLevel] = useState({}); // Track number of attempts per level
  const [countdown, setCountdown] = useState(3);
  const [isPractice, setIsPractice] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [settings, setSettings] = useState({
    speechRate: 1.0,
    interDigitPause: 800,
    voiceLang: 'de-DE',
    countdownDuration: 3,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [recordingTime, setRecordingTime] = useState(0);
  const [microphonePermission, setMicrophonePermission] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const gameArea = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  const translate = t || ((key) => key);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameArea);

  const showOverlayMessage = useCallback((textKey, duration = 1500, type = 'info') => {
    setMessage(translate(textKey));
    setMessageType(type);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), duration);
  }, [translate]);

  const finishTest = useCallback((updatedRoundData, completedSuccessfully = false) => {
    if (isFullscreen) exitFullscreen();

    const finishMessage = completedSuccessfully ?
      translate('test_completed_successfully') :
      translate('test_finished');

    showOverlayMessage(finishMessage, 3500);

    if (assignmentId) {
      const finalTestData = {
        maxLevel: Math.max(...results.filter(r => r.success).map(r => r.level), 0),
        totalScore: score,
        rounds: updatedRoundData,
        settingsUsed: { ...settings },
        completedSuccessfully,
        sequenceIndexPerLevel,
        attemptsPerLevel
      };
      onComplete(finalTestData);
    }

    setTimeout(() => setGameState('results'), 1500);
  }, [isFullscreen, exitFullscreen, results, score, settings, sequenceIndexPerLevel, attemptsPerLevel, assignmentId, onComplete, translate, showOverlayMessage]);

  const speakSequence = useCallback(async (seq) => {
    if (!synthesisRef.current) return;

    synthesisRef.current.cancel();
    setIsSpeaking(true);

    for (let i = 0; i < seq.length; i++) {
      await new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(seq[i].toString());
        utterance.lang = settings.voiceLang;
        utterance.rate = settings.speechRate;
        utterance.onend = () => {
          setTimeout(resolve, settings.interDigitPause);
        };
        synthesisRef.current.speak(utterance);
      });
    }

    setIsSpeaking(false);
    setGameState(isPractice ? 'practice' : 'listening');
  }, [settings, isPractice]);
  
  const generateSequence = useCallback((targetLevel = null) => {
    const currentLevel = targetLevel || level;
    const levelIndex = currentLevel - 2; // level 2 = index 0 (2-digit), level 3 = index 1 (3-digit), etc.

    if (levelIndex < 0 || levelIndex >= PREDEFINED_SEQUENCES.length) {
      return PREDEFINED_SEQUENCES[1][0]; // Fallback to first 3-digit sequence
    }

    const levelSequences = PREDEFINED_SEQUENCES[levelIndex];
    const currentSequenceIndex = sequenceIndexPerLevel[currentLevel] || 0;

    // Check if we've run out of sequences for this level
    if (currentSequenceIndex >= levelSequences.length) {
      return null; // Signal that we've run out of sequences
    }

    return levelSequences[currentSequenceIndex];
  }, [level, sequenceIndexPerLevel]);

  const startRound = useCallback(async (targetLevel = null) => {
    const currentLevel = targetLevel || level;
    setIsPractice(false);

    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen:', err);
      }
    }

    // Increment attempts for this level
    setAttemptsPerLevel(prev => ({ ...prev, [currentLevel]: (prev[currentLevel] || 0) + 1 }));

    setUserInput('');
    setCountdown(settings.countdownDuration);
    setGameState('countdown');

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      const newSequence = generateSequence(currentLevel);

      // Check if we've run out of sequences
      if (newSequence === null) {
        clearInterval(countdownInterval);
        showOverlayMessage('test_failed_no_sequences', 3000, 'error');
        finishTest(roundData, false);
        return;
      }

      // Immediately increment the sequence index (pop the sequence)
      const currentSequenceIndex = sequenceIndexPerLevel[currentLevel] || 0;
      setSequenceIndexPerLevel(prev => ({ ...prev, [currentLevel]: currentSequenceIndex + 1 }));

      setSequence(newSequence);
      setGameState('playing');
      clearInterval(countdownInterval);
      setTimeout(() => speakSequence(newSequence), 500);
    }, settings.countdownDuration * 1000);
  }, [level, isFullscreen, enterFullscreen, settings, generateSequence, speakSequence, showOverlayMessage, finishTest, roundData, sequenceIndexPerLevel]);

  // Debug function
  const addDebug = useCallback((msg) => {
    console.log('[WTB Debug]', msg);
    setDebugInfo(prev => prev + '\n' + msg);
  }, []);

  // Helper function to convert spoken numbers to digits
  const extractNumbers = useCallback((text, lang) => {
    addDebug(`Extracting numbers from: "${text}"`);

    // Number word mappings for different languages
    const numberWords = {
      'de': {
        'null': '0', 'eins': '1', 'ein': '1', 'zwei': '2', 'drei': '3', 'vier': '4',
        'fünf': '5', 'fuenf': '5', 'sechs': '6', 'sieben': '7', 'acht': '8', 'neun': '9'
      },
      'en': {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
      },
      'es': {
        'cero': '0', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
        'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9'
      }
    };

    // Determine language prefix (de-DE -> de)
    const langPrefix = lang.split('-')[0];
    const wordMap = numberWords[langPrefix] || numberWords['en'];

    // Convert to lowercase for matching
    const lowerText = text.toLowerCase();

    // Extract digits that are already numbers
    const digits = [];

    // Split by common separators and process each token
    const tokens = lowerText.split(/[\s,.\-_]+/);

    for (const token of tokens) {
      // Check if token is a digit
      if (/^\d$/.test(token)) {
        digits.push(token);
        addDebug(`  Found digit: ${token}`);
      }
      // Check if token is a number word
      else if (wordMap[token]) {
        digits.push(wordMap[token]);
        addDebug(`  Converted "${token}" to ${wordMap[token]}`);
      }
      // Check for multi-digit numbers (e.g., "25")
      else if (/^\d+$/.test(token)) {
        // Split multi-digit into individual digits
        for (const char of token) {
          digits.push(char);
          addDebug(`  Extracted digit from number: ${char}`);
        }
      }
    }

    const result = digits.join(' ');
    addDebug(`  Final extracted: "${result}"`);
    return result;
  }, [addDebug]);

  // Check browser support and permissions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check TTS support
      if ('speechSynthesis' in window) {
        synthesisRef.current = window.speechSynthesis;
        addDebug('✓ Speech Synthesis (TTS) supported');
      } else {
        addDebug('✗ Speech Synthesis (TTS) NOT supported');
      }

      // Check STT support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        addDebug('✓ Speech Recognition (STT) supported');
      } else {
        addDebug('✗ Speech Recognition (STT) NOT supported');
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      }

      // Check microphone permissions
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'microphone' }).then((result) => {
          addDebug(`Microphone permission: ${result.state}`);
          setMicrophonePermission(result.state);
          result.onchange = () => {
            addDebug(`Microphone permission changed to: ${result.state}`);
            setMicrophonePermission(result.state);
          };
        }).catch(err => {
          addDebug(`Could not query permissions: ${err.message}`);
        });
      } else {
        addDebug('Permissions API not available');
      }
    }
  }, [addDebug]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        addDebug('Initializing speech recognition...');
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = settings.voiceLang;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          addDebug('Speech recognition started');
        };

        recognition.onresult = (event) => {
          // Clear any existing silence timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          // Build full transcript from all final results
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              fullTranscript += event.results[i][0].transcript + ' ';
            }
          }

          // Get the latest result for logging
          const lastResultIndex = event.results.length - 1;
          const result = event.results[lastResultIndex];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          const isFinal = result.isFinal;

          addDebug(`Recognition result: "${transcript}" (confidence: ${confidence.toFixed(2)}, final: ${isFinal})`);

          if (isFinal && fullTranscript.trim()) {
            // Accumulate the final transcript
            accumulatedTranscriptRef.current = fullTranscript.trim();
            addDebug(`Accumulated transcript: "${accumulatedTranscriptRef.current}"`);

            // Set a 5-second silence timeout to auto-stop
            silenceTimeoutRef.current = setTimeout(() => {
              addDebug('5-second silence detected, auto-stopping...');
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.stop();
                } catch (e) {
                  addDebug(`Error auto-stopping: ${e.message}`);
                }
              }
            }, 5000);
          }
        };

        recognition.onerror = (event) => {
          addDebug(`Speech recognition error: ${event.error} - ${event.message || 'No message'}`);
          console.error('Speech recognition error:', event.error, event);

          let errorMessage = 'Speech recognition error: ';
          switch(event.error) {
            case 'no-speech':
              errorMessage += 'No speech detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage += 'Microphone not accessible. Please check permissions.';
              break;
            case 'not-allowed':
              errorMessage += 'Microphone permission denied. Please allow microphone access.';
              break;
            case 'network':
              errorMessage += 'Network error occurred.';
              break;
            default:
              errorMessage += event.error;
          }

          alert(errorMessage);
          setIsRecording(false);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
          }
        };

        recognition.onend = () => {
          addDebug('Speech recognition ended');

          // Clear the silence timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          // Process accumulated transcript
          if (accumulatedTranscriptRef.current) {
            const numbersOnly = extractNumbers(accumulatedTranscriptRef.current, settings.voiceLang);
            addDebug(`Final filtered numbers: "${numbersOnly}"`);
            setUserInput(numbersOnly);
            accumulatedTranscriptRef.current = ''; // Reset
          }

          setIsRecording(false);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
          }
        };

        recognitionRef.current = recognition;
        addDebug('Speech recognition initialized successfully');
      }
    }
  }, [settings.voiceLang, addDebug, extractNumbers]);

  // Demo animation
  useEffect(() => {
    if (gameState === 'intro' && demoStep < 3) {
      const timer = setTimeout(() => {
        setDemoStep(prev => prev + 1);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState, demoStep]);

  // Demo speech synthesis - speak the numbers when they appear (demo only, no game state changes)
  useEffect(() => {
    if (gameState === 'intro' && demoStep === 0) {
      const speakDemoSequence = async () => {
        if (!synthesisRef.current) return;

        synthesisRef.current.cancel();
        const demoSequence = [5, 2, 9];

        for (let i = 0; i < demoSequence.length; i++) {
          await new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(demoSequence[i].toString());
            utterance.lang = settings.voiceLang;
            utterance.rate = settings.speechRate;
            utterance.onend = () => {
              setTimeout(resolve, settings.interDigitPause);
            };
            synthesisRef.current.speak(utterance);
          });
        }
      };

      setTimeout(() => speakDemoSequence(), 500);
    }
  }, [gameState, demoStep, settings.voiceLang, settings.speechRate, settings.interDigitPause]);

  // Generate sequence
  

  // Speak sequence
  

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      addDebug('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addDebug('✓ Microphone permission granted');
      setMicrophonePermission('granted');
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      addDebug(`✗ Microphone permission denied: ${error.message}`);
      console.error('Microphone permission error:', error);
      alert('Microphone access is required for this test. Please allow microphone access and try again.');
      setMicrophonePermission('denied');
      return false;
    }
  }, [addDebug]);

  // Start recording
  const startRecording = useCallback(async () => {
    addDebug('startRecording called');

    if (!recognitionRef.current) {
      addDebug('✗ Recognition not initialized');
      alert(translate('speech_recognition_not_supported'));
      return;
    }

    // Check and request permission if needed
    if (microphonePermission !== 'granted') {
      addDebug('Microphone permission not granted, requesting...');
      const granted = await requestMicrophonePermission();
      if (!granted) {
        addDebug('✗ Permission not granted, aborting');
        return;
      }
    }

    setUserInput('');
    setRecordingTime(0);
    setIsRecording(true);
    accumulatedTranscriptRef.current = ''; // Reset accumulated transcript

    // Clear any existing silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    try {
      addDebug('Calling recognition.start()...');
      recognitionRef.current.start();
    } catch (error) {
      addDebug(`✗ Failed to start recognition: ${error.message}`);
      console.error('Failed to start recognition:', error);
      alert(`Failed to start recording: ${error.message}`);
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }, [translate, microphonePermission, requestMicrophonePermission, addDebug]);

  // Stop recording
  const stopRecording = useCallback(() => {
    addDebug('stopRecording called');

    // Clear silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    if (recognitionRef.current && isRecording) {
      try {
        addDebug('Calling recognition.stop()...');
        recognitionRef.current.stop();
      } catch (error) {
        addDebug(`✗ Error stopping recognition: ${error.message}`);
        console.error('Error stopping recognition:', error);
      }
    }
  }, [isRecording, addDebug]);

  // Show message overlay
  

  // Check user response
  const checkResponse = useCallback(() => {
    addDebug(`checkResponse called with userInput: "${userInput}"`);
    addDebug(`Expected sequence: [${sequence.join(', ')}]`);

    // Extract digits from user input
    const userDigits = userInput.match(/\d/g) || [];
    const userSequence = userDigits.map(d => parseInt(d, 10));

    addDebug(`Extracted digits: [${userSequence.join(', ')}]`);

    const isCorrect = userSequence.length === sequence.length &&
                     userSequence.every((digit, index) => digit === sequence[index]);

    addDebug(`Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

    if (isPractice) {
      if (isCorrect) {
        showOverlayMessage('practice_correct', 3000, 'success');
        setTimeout(() => {
          if (isFullscreen) exitFullscreen();
          setGameState('practiceComplete');
        }, 2200);
      } else {
        showOverlayMessage('practice_incorrect_retry', 3000, 'error');
        setTimeout(() => startPractice(), 2200);
      }
      return;
    }

    const roundResult = {
      level,
      success: isCorrect,
      sequence: [...sequence],
      userSequence,
      userInput,
      timestamp: new Date().toISOString(),
      attemptNumber: attemptsPerLevel[level] || 0
    };

    const updatedRoundData = [...roundData, roundResult];
    setRoundData(updatedRoundData);

    if (isCorrect) {
      // Correct answer: move to next level
      // Award 1 point + 1 bonus point if first attempt (starting from level 3)
      // Level 2 (UT3_1) gets no bonus
      const levelPoints = 1;
      const bonusPoints = (level >= 3 && attemptsPerLevel[level] === 1) ? 1 : 0;
      const totalPoints = levelPoints + bonusPoints;

      setScore(prevScore => prevScore + totalPoints);
      showOverlayMessage('correct_feedback', 3000, 'success');
      setResults(prev => [...prev, { level, success: true, points: totalPoints, isFirstTry: attemptsPerLevel[level] === 1 }]);

      setTimeout(() => {
        // Check if we've reached 9-digit sequences
        if (level >= 9) {
          finishTest(updatedRoundData, true);
        } else {
          const nextLevel = level + 1;
          // Reset sequence index for the new level
          setSequenceIndexPerLevel(prev => ({ ...prev, [nextLevel]: 0 }));
          setLevel(nextLevel);
          startRound(nextLevel);
        }
      }, 1700);
    } else {
      // Incorrect answer: try next sequence from current level
      setResults(prev => [...prev, { level, success: false }]);

      // Check if we have more sequences available for this level
      const currentSequenceIndex = sequenceIndexPerLevel[level] || 0;
      const levelIndex = level - 2;
      const levelSequences = PREDEFINED_SEQUENCES[levelIndex];

      // Note: currentSequenceIndex already points to the next sequence
      // because we increment on presentation
      if (currentSequenceIndex >= levelSequences.length) {
        showOverlayMessage('test_failed_no_sequences', 3000, 'error');
        finishTest(updatedRoundData, false);
      } else {
        showOverlayMessage('incorrect_retry', 3000, 'error');
        setTimeout(() => startRound(level), 2200);
      }
    }
  }, [userInput, sequence, level, isPractice, roundData, sequenceIndexPerLevel, attemptsPerLevel, isFullscreen, exitFullscreen, showOverlayMessage, startRound, finishTest, addDebug]);

  // Start practice
  const startPractice = useCallback(async () => {
    setIsPractice(true);
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen:', err);
      }
    }
    const practiceSeq = [2, 5];
    setSequence(practiceSeq);
    setUserInput('');
    setGameState('playing');
    setTimeout(() => speakSequence(practiceSeq), 500);
  }, [isFullscreen, enterFullscreen, speakSequence]);

  // Start round
  
  // Finish test
  
  // Reset game
  const resetGame = () => {
    setLevel(2);
    setScore(0);
    setResults([]);
    setRoundData([]);
    setGameState('welcome');
    setSequenceIndexPerLevel({});
    setAttemptsPerLevel({});
  };

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
          {(gameState === 'playing' || gameState === 'listening') && (
            <div className={styles.gameMetrics}>
              <div className={styles.levelIndicator}>{translate('level')}: <span className={styles.metricValue}>{level}</span></div>
              <div className={styles.scoreIndicator}>{translate('score')}: <span className={styles.metricValue}>{score}</span></div>
            </div>
          )}
        </div>

        <div className={styles.gameArea} ref={gameArea}>
          {gameState === 'welcome' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('welcome_title')}</h2>
              <p>{translate('welcome_p1')}</p>
              <p>{translate('welcome_p2')}</p>

              {/* Microphone Permission Status */}
              <div className={styles.permissionStatus}>
                {microphonePermission === null && (
                  <div className={styles.permissionPending}>
                    🎤 {translate('microphone_required')}
                  </div>
                )}
                {microphonePermission === 'granted' && (
                  <div className={styles.permissionGranted}>
                    ✓ {translate('microphone_ready')}
                  </div>
                )}
                {microphonePermission === 'denied' && (
                  <div className={styles.permissionDenied}>
                    ✗ {translate('microphone_denied')}
                  </div>
                )}
                {microphonePermission === 'prompt' && (
                  <button
                    className={styles.permissionButton}
                    onClick={requestMicrophonePermission}
                  >
                    🎤 {translate('enable_microphone')}
                  </button>
                )}
              </div>

              <div className={styles.buttonContainer}>
                <button
                  className={styles.primaryButton}
                  onClick={() => setGameState('tutorial')}
                  disabled={microphonePermission === 'denied'}
                >
                  {translate('start_tutorial')}
                </button>
                <button className={styles.secondaryButton} onClick={() => setShowSettings(true)}>
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
              </div>

              {/* Request microphone permission if not granted yet */}
              {microphonePermission !== 'granted' && (
                <div className={styles.microphoneRequest}>
                  <h3>🎤 {translate('microphone_permission_needed')}</h3>
                  <p>{translate('microphone_permission_explanation')}</p>
                  <button
                    className={styles.primaryButton}
                    onClick={requestMicrophonePermission}
                  >
                    {translate('enable_microphone')}
                  </button>
                </div>
              )}

              <div className={styles.buttonContainer}>
                <button
                  className={styles.primaryButton}
                  onClick={() => { setDemoStep(0); setGameState('intro'); }}
                  disabled={microphonePermission !== 'granted'}
                >
                  {translate('see_demo')}
                </button>
                <button className={styles.secondaryButton} onClick={() => setGameState('welcome')}>
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {gameState === 'intro' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('demo_title')}</h2>
              <p>{translate('demo_intro')}</p>
              <div className={styles.demoContainer}>
                <div className={styles.demoSequence}>
                  {demoStep === 0 && <div className={styles.speaker}>🔊</div>}
                  {demoStep >= 1 && (
                    <div className={styles.demoNumbers}>
                      <span className={styles.demoNumber}>5</span>
                      <span className={styles.demoNumber}>2</span>
                      <span className={styles.demoNumber}>9</span>
                    </div>
                  )}
                  {demoStep >= 2 && (
                    <div className={styles.microphone}>
                      🎤
                    </div>
                  )}
                </div>
                <div className={styles.demoText}>
                  {demoStep === 0 && <p>{translate('demo_step0')}</p>}
                  {demoStep === 1 && <p className={styles.highlight}>{translate('demo_step1')}</p>}
                  {demoStep >= 2 && <p className={styles.success}>{translate('demo_step2')}</p>}
                </div>
              </div>
              <div className={styles.buttonContainer}>
                <button
                  className={styles.primaryButton}
                  onClick={startPractice}
                  disabled={demoStep < 2}
                >
                  {translate('start_practice')}
                </button>
                <button className={styles.secondaryButton} onClick={() => setGameState('tutorial')}>
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {gameState === 'practiceComplete' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('practice_complete_title')}</h2>
              <p>{translate('practice_complete_p1')}</p>
              <p>{translate('practice_complete_p2')}</p>
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={() => {
                  setLevel(2);
                  setSequenceIndexPerLevel({ 2: 0 });
                  setAttemptsPerLevel({});
                  setScore(0);
                  setResults([]);
                  setRoundData([]);
                  startRound(2);
                }}>
                  {translate('start_real_test')}
                </button>
                <button className={styles.secondaryButton} onClick={startPractice}>
                  {translate('practice_again')}
                </button>
              </div>
            </div>
          )}

          {gameState === 'countdown' && (
            <div className={styles.countdownOverlay}>
              <div className={styles.countdownContent}>
                <h2>{translate('countdown_get_ready')}</h2>
                <div className={styles.countdownNumber}>{countdown}</div>
                <p>{translate('countdown_message')}</p>
              </div>
            </div>
          )}

          {gameState === 'playing' && (
            <div className={styles.testArea}>
              <div className={styles.instructionCard}>
                {isSpeaking ? (
                  <>
                    <div className={styles.speakerIcon}>🔊</div>
                    <h3>{translate('listening_instruction')}</h3>
                  </>
                ) : (
                  <>
                    <div className={styles.microphoneIcon}>
                      {isSpeaking ? '🔊' : '⏳'}
                    </div>
                    <h3>{translate('waiting_to_speak')}</h3>
                  </>
                )}
              </div>
            </div>
          )}

          {gameState === 'listening' && (
            <div className={styles.testArea}>
              <div className={styles.instructionCard}>
                <div className={styles.microphoneIcon}>🎤</div>
                <h3>{translate('your_turn')}</h3>
                <p>{translate('repeat_numbers')}</p>
                {microphonePermission === 'denied' && (
                  <div className={styles.permissionWarning}>
                    ⚠️ Microphone access denied. Please enable microphone in your browser settings.
                  </div>
                )}
                {!isRecording && !userInput && (
                  <button
                    className={styles.recordButton}
                    onClick={startRecording}
                    disabled={microphonePermission === 'denied'}
                  >
                    {translate('start_recording')}
                  </button>
                )}
                {isRecording && (
                  <>
                    <div className={styles.recordingIndicator}>
                      <span className={styles.recordingDot}></span>
                      {translate('recording')} ({recordingTime}s)
                    </div>
                    <button className={styles.stopButton} onClick={stopRecording}>
                      {translate('stop_recording')}
                    </button>
                  </>
                )}
                {userInput && !isRecording && (
                  <div className={styles.transcriptionBox}>
                    <p className={styles.transcriptionLabel}>{translate('you_said')}:</p>
                    <p className={styles.transcription}>{userInput}</p>
                    <div className={styles.instructionText}>
                      👆 {translate('check_answer_instruction')}
                    </div>
                    <div className={styles.buttonGroup}>
                      <button className={styles.submitButton} onClick={checkResponse}>
                        ✓ {translate('submit')}
                      </button>
                      <button className={styles.retryButton} onClick={startRecording}>
                        🔄 {translate('retry')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(gameState === 'practice') && (
            <div className={styles.testArea}>
              <div className={styles.instructionCard}>
                {isSpeaking ? (
                  <>
                    <div className={styles.speakerIcon}>🔊</div>
                    <h3>{translate('listening_instruction')}</h3>
                    <p>{translate('listen_carefully')}</p>
                  </>
                ) : (
                  <>
                    <div className={styles.microphoneIcon}>🎤</div>
                    <h3>{translate('your_turn')}</h3>
                    <p>{translate('repeat_numbers')}</p>
                    {!isRecording && !userInput && (
                      <button className={styles.recordButton} onClick={startRecording}>
                        {translate('start_recording')}
                      </button>
                    )}
                    {isRecording && (
                      <>
                        <div className={styles.recordingIndicator}>
                          <span className={styles.recordingDot}></span>
                          {translate('recording')} ({recordingTime}s)
                        </div>
                        <button className={styles.stopButton} onClick={stopRecording}>
                          {translate('stop_recording')}
                        </button>
                      </>
                    )}
                    {userInput && !isRecording && (
                      <div className={styles.transcriptionBox}>
                        <p className={styles.transcriptionLabel}>{translate('you_said')}:</p>
                        <p className={styles.transcription}>{userInput}</p>
                        <div className={styles.instructionText}>
                          👆 {translate('check_answer_instruction')}
                        </div>
                        <div className={styles.buttonGroup}>
                          <button className={styles.submitButton} onClick={checkResponse}>
                            ✓ {translate('submit')}
                          </button>
                          <button className={styles.retryButton} onClick={startRecording}>
                            🔄 {translate('retry')}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {gameState === 'results' && isStandalone && roundData && (
            <WtbResults
              roundData={roundData}
              maxLevel={Math.max(...results.filter(r => r.success).map(r => r.level), 0)}
              totalScore={score}
              isStandalone={isStandalone}
              t={translate}
            />
          )}

          {showMessage && (
            <div className={styles.messageOverlay}>
              <div className={`${styles.message} ${styles[messageType]}`}>{message}</div>
            </div>
          )}
        </div>


        {showSettings && (
          <WtbSettings
            settings={settings}
            setSettings={setSettings}
            onClose={() => setShowSettings(false)}
            t={translate}
          />
        )}

        {/* Debug Toggle & Panel */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <button
              className={styles.debugToggle}
              onClick={() => setShowDebug(!showDebug)}
              title="Toggle Debug Panel"
            >
              👨‍💻
            </button>
            {showDebug && (
              <div className={styles.debugPanel}>
                <h4>Debug Info:</h4>
                <pre className={styles.debugText}>{debugInfo}</pre>
                <button onClick={() => setDebugInfo('')}>Clear</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}