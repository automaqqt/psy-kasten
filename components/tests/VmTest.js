import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../../styles/VmTest.module.css';
import VmSettings from '../settings/vm';
import VmResults from '../results/vm';

const ALL_IMAGES = [
  { id: 'strawberry', src: '/images/vm/strawberry.png' },
  { id: 'lawnmower', src: '/images/vm/lawnmower.png' },
  { id: 'sheep', src: '/images/vm/sheep.png' },
  { id: 'pretzel', src: '/images/vm/pretzel.png' },
  { id: 'phone', src: '/images/vm/phone.png' },
  { id: 'butterfly', src: '/images/vm/butterfly.png' },
  { id: 'sausage', src: '/images/vm/sausage.png' },
  { id: 'apple', src: '/images/vm/apple.png' },
  { id: 'radio', src: '/images/vm/radio.png' },
  { id: 'paperclips', src: '/images/vm/paperclips.png' },
  { id: 'screw', src: '/images/vm/screw.png' },
  { id: 'beetle', src: '/images/vm/beetle.png' },
  { id: 'bananas', src: '/images/vm/bananas.png' },
  { id: 'computer', src: '/images/vm/computer.png' },
  { id: 'cake', src: '/images/vm/cake.png' },
  { id: 'burger', src: '/images/vm/burger.png' },
  { id: 'coffee_maker', src: '/images/vm/coffee_maker.png' },
  { id: 'dog', src: '/images/vm/dog.png' },
  { id: 'umbrella', src: '/images/vm/umbrella.png' },
  { id: 'grapes', src: '/images/vm/grapes.png' },
];

const PREDEFINED_SEQUENCES = {
  2: [['apple', 'computer'], ['beetle', 'pretzel'], ['umbrella', 'cake']],
  3: [['lawnmower', 'bananas', 'paperclips'], ['screw', 'cake', 'sheep'], ['grapes', 'butterfly', 'phone']],
  4: [['burger', 'radio', 'strawberry', 'dog'], ['bananas', 'lawnmower', 'pretzel', 'computer'], ['apple', 'coffee_maker', 'umbrella', 'beetle']],
  5: [['grapes', 'phone', 'sheep', 'paperclips', 'sausage'], ['strawberry', 'butterfly', 'screw', 'cake', 'computer'], ['pretzel', 'apple', 'dog', 'umbrella', 'radio']],
  6: [['bananas', 'strawberry', 'beetle', 'burger', 'phone', 'lawnmower'], ['screw', 'grapes', 'sheep', 'sausage', 'paperclips', 'coffee_maker'], ['umbrella', 'apple', 'computer', 'cake', 'radio', 'butterfly']],
  7: [['sausage', 'radio', 'phone', 'pretzel', 'beetle', 'sheep', 'strawberry'], ['computer', 'lawnmower', 'paperclips', 'burger', 'dog', 'apple', 'grapes'], ['cake', 'umbrella', 'screw', 'bananas', 'butterfly', 'coffee_maker', 'strawberry']],
  8: [['apple', 'sausage', 'radio', 'phone', 'pretzel', 'beetle', 'sheep', 'strawberry'], ['grapes', 'computer', 'lawnmower', 'paperclips', 'burger', 'dog', 'umbrella', 'cake'], ['butterfly', 'screw', 'bananas', 'coffee_maker', 'strawberry', 'apple', 'sausage', 'radio']],
  9: [['phone', 'pretzel', 'beetle', 'sheep', 'strawberry', 'apple', 'sausage', 'radio', 'cake'], ['umbrella', 'grapes', 'computer', 'lawnmower', 'paperclips', 'burger', 'dog', 'butterfly', 'screw'], ['bananas', 'coffee_maker', 'strawberry', 'apple', 'sausage', 'radio', 'phone', 'pretzel', 'beetle']],
};

const VmTest = ({ assignmentId, onComplete, isStandalone, t }) => {
  const [gameState, setGameState] = useState('welcome');
  const [settings, setSettings] = useState({
    presentationTimeMultiplier: 1.0,
    countdownDuration: 3,
    recognitionGridCols: 5,
  });
  const [level, setLevel] = useState(2);
  const [trialIndex, setTrialIndex] = useState(0);
  const [failuresPerLevel, setFailuresPerLevel] = useState({});
  const [userSelection, setUserSelection] = useState([]);
  const [roundData, setRoundData] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState(settings.countdownDuration);
  const [recognitionStartTime, setRecognitionStartTime] = useState(null);

  useEffect(() => {
    setCountdown(settings.countdownDuration);
  }, [settings.countdownDuration]);

  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        displaySequence();
      }
    }
  }, [gameState, countdown]);

  const getPresentationTime = () => {
    if (level <= 3) return 5000;
    if (level <= 6) return 13000;
    return 21000;
  };

  const displaySequence = () => {
    setGameState('showing');
    const duration = getPresentationTime() * settings.presentationTimeMultiplier;
    setTimeout(() => {
      setGameState('input');
      setRecognitionStartTime(Date.now());
    }, duration);
  };

  const handleImageClick = (imageId) => {
    setUserSelection(prev =>
      prev.includes(imageId) ? prev.filter(id => id !== imageId) : [...prev, imageId]
    );
  };

  const checkResult = () => {
    const recognitionEndTime = Date.now();
    const responseTime = recognitionEndTime - recognitionStartTime;
    const targetSequence = PREDEFINED_SEQUENCES[level][trialIndex];
    const hits = userSelection.filter(id => targetSequence.includes(id)).length;
    const misses = targetSequence.filter(id => !userSelection.includes(id)).length;
    const falseAlarms = userSelection.filter(id => !targetSequence.includes(id)).length;
    const success = hits === targetSequence.length && falseAlarms === 0;

    const newRoundData = {
      level,
      trialIndex,
      success,
      responseTime,
      hits,
      misses,
      falseAlarms,
      targetSequence,
      userSelection,
    };
    setRoundData(prev => [...prev, newRoundData]);

    if (success) {
      if (level + 1 > 9) {
        setGameState('results');
        return;
      }
      setLevel(prev => prev + 1);
      setTrialIndex(0);
      setFailuresPerLevel(prev => ({ ...prev, [level + 1]: 0 }));
    } else {
      const newFailures = (failuresPerLevel[level] || 0) + 1;
      if (newFailures >= 3) {
        setGameState('results');
        return;
      }
      setFailuresPerLevel(prev => ({ ...prev, [level]: newFailures }));
      setTrialIndex(prev => prev + 1);
    }

    setUserSelection([]);
    setGameState('countdown');
    setCountdown(settings.countdownDuration);
  };

  const startTest = () => {
    setLevel(2);
    setTrialIndex(0);
    setFailuresPerLevel({ 2: 0 });
    setRoundData([]);
    setUserSelection([]);
    setGameState('countdown');
    setCountdown(settings.countdownDuration);
  };

  return (
    <div className={styles.container}>
      {gameState === 'welcome' && (
        <div className={styles.welcomeCard}>
          <h2>Visual Memory Test (VM)</h2>
          <p>This test measures your visual recognition memory.</p>
          <div className={styles.buttonContainer}>
            <button className={styles.primaryButton} onClick={() => setGameState('tutorial')}>Start Tutorial</button>
            <button className={styles.secondaryButton} onClick={() => setShowSettings(true)}>Settings</button>
          </div>
        </div>
      )}

      {gameState === 'tutorial' && (
        <div className={styles.welcomeCard}>
          <h2>Tutorial</h2>
          <p>You will be shown a sequence of images. Memorize them.</p>
          <p>Then, you will be shown a larger grid of images. Select the ones you just saw.</p>
          <button className={styles.primaryButton} onClick={startTest}>Start Test</button>
        </div>
      )}

      {gameState === 'countdown' && (
        <div className={styles.countdownOverlay}>
          <div className={styles.countdownNumber}>{countdown}</div>
        </div>
      )}

      {gameState === 'showing' && (
        <div className={styles.presentationArea}>
          {PREDEFINED_SEQUENCES[level][trialIndex].map(imageId => (
            <img key={imageId} src={`/images/vm/${imageId}.png`} alt={imageId} className={styles.presentationImage} />
          ))}
          <div className={styles.timerBar}>
            <div style={{ width: '100%', animation: `shrink ${getPresentationTime() * settings.presentationTimeMultiplier / 1000}s linear` }}></div>
          </div>
        </div>
      )}

      {gameState === 'input' && (
        <div className={styles.gameArea}>
          <div className={styles.recognitionGrid} style={{gridTemplateColumns: `repeat(${settings.recognitionGridCols}, 1fr)`}}>
            {ALL_IMAGES.map(image => (
              <div key={image.id} className={`${styles.imageTile} ${userSelection.includes(image.id) ? styles.selected : ''}`} onClick={() => handleImageClick(image.id)}>
                <img src={image.src} alt={image.id} />
              </div>
            ))}
          </div>
          <button className={styles.confirmButton} onClick={checkResult}>Confirm Selection</button>
        </div>
      )}

      {gameState === 'results' && isStandalone && (
        <VmResults roundData={roundData} />
      )}

      {showSettings && (
        <VmSettings
          settings={settings}
          setSettings={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default VmTest;
