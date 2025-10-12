import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../../styles/AktTest.module.css';
import AktSettings from '../settings/akt';
import AktResults from '../results/akt';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '../ui/footer';
import { useFullscreen } from '../../hooks/useFullscreen';

// Practice Grid: 3 rows × 5 columns (15 symbols, 3 targets)
// Target: rotation 180, Distractor: rotation 0, 90, or 270
const PRACTICE_GRID = [
  { type: 'distractor', rotation: 90 },
  { type: 'target', rotation: 180 },
  { type: 'distractor', rotation: 0 },
  { type: 'distractor', rotation: 270 },
  { type: 'distractor', rotation: 90 },
  { type: 'distractor', rotation: 0 },
  { type: 'distractor', rotation: 270 },
  { type: 'target', rotation: 180 },
  { type: 'distractor', rotation: 90 },
  { type: 'distractor', rotation: 0 },
  { type: 'distractor', rotation: 270 },
  { type: 'distractor', rotation: 90 },
  { type: 'target', rotation: 180 },
  { type: 'distractor', rotation: 0 },
  { type: 'distractor', rotation: 270 }
];

// Main Test Grid: 5 rows × 11 columns (55 symbols, 20 targets)
const MAIN_GRID = [
  { type: 'distractor', rotation: 0 }, { type: 'distractor', rotation: 270 }, { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 270 }, { type: 'distractor', rotation: 0 }, { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 90 }, { type: 'distractor', rotation: 0 }, { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 270 },
  { type: 'distractor', rotation: 270 }, { type: 'distractor', rotation: 0 }, { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 0 }, { type: 'distractor', rotation: 90 }, { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 0 }, { type: 'distractor', rotation: 90 }, { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 270 },
  { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 90 }, { type: 'distractor', rotation: 270 }, { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 0 }, { type: 'distractor', rotation: 90 }, { type: 'distractor', rotation: 0 }, { type: 'distractor', rotation: 0 }, { type: 'distractor', rotation: 270 }, { type: 'target', rotation: 180 },
  { type: 'distractor', rotation: 90 }, { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 270 }, { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 0 }, { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 90 }, { type: 'target', rotation: 180 }, { type: 'distractor', rotation: 270 }, { type: 'distractor', rotation: 90 }
];

const AktTest = ({ assignmentId, onComplete, isStandalone, t }) => {
  const [gameState, setGameState] = useState('welcome'); // welcome, tutorial, intro, practice, practiceFailed, practiceComplete, countdown, testing, results
  const [settings, setSettings] = useState({
    gridRows: 5,
    gridCols: 11,
    numTargets: 20,
    countdownDuration: 3,
  });
  const [grid, setGrid] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [results, setResults] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState(settings.countdownDuration);
  const [isPractice, setIsPractice] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [practiceFailureData, setPracticeFailureData] = useState(null);
  const gameArea = useRef(null);
  const translate = t || ((key) => key);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameArea);

  const generateGrid = useCallback((practiceMode = false) => {
    const sourceGrid = practiceMode ? PRACTICE_GRID : MAIN_GRID;
    setGrid(sourceGrid.map((symbol, index) => ({ ...symbol, id: index, clicked: false })));
  }, []);

  useEffect(() => {
    setCountdown(settings.countdownDuration);
  }, [settings.countdownDuration]);

  useEffect(() => {
    if (gameState === 'countdown') {
      // Enter fullscreen when countdown starts for real test
      if (countdown === settings.countdownDuration && !isFullscreen) {
        enterFullscreen().catch(err => {
          console.warn('Could not enter fullscreen:', err);
        });
      }

      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setIsPractice(false);
        generateGrid(false);
        setClicks([]);
        setStartTime(Date.now());
        setGameState('testing');
      }
    }
  }, [gameState, countdown, generateGrid, settings.countdownDuration, isFullscreen, enterFullscreen]);

  

  const handleSymbolClick = (index) => {
    if (gameState !== 'testing' && gameState !== 'practice') return;

    const alreadyClicked = grid[index].clicked;
    if (alreadyClicked) return;

    const symbol = grid[index];
    setClicks(prev => [...prev, { index, symbol }]);

    // Mark as clicked in grid
    setGrid(prev => prev.map((item, i) =>
      i === index ? { ...item, clicked: true } : item
    ));
  };

  const finishTest = () => {
    const endTime = Date.now();
    const T = (endTime - startTime) / 1000;

    const numTargets = isPractice ? 3 : settings.numTargets;
    const R = clicks.filter(c => c.symbol.type === 'target').length;
    const F = clicks.filter(c => c.symbol.type === 'distractor').length;
    // Error type classification (for distractor clicks only):
    // F1: Rechts-links Fehler (focuses on Lage, neglects Muster) - rotation 270
    // F2: Lage-Fehler (focuses on Muster, neglects Lage) - rotation 90
    // F3: Doppelfehler (both Muster and Lage differ) - rotation 0
    const F1 = clicks.filter(c => c.symbol.type === 'distractor' && c.symbol.rotation === 270).length;
    const F2 = clicks.filter(c => c.symbol.type === 'distractor' && c.symbol.rotation === 90).length;
    const F3 = clicks.filter(c => c.symbol.type === 'distractor' && c.symbol.rotation === 0).length;
    const Omissions = numTargets - R;
    const F_perc = (F / (R + F)) * 100 || 0;
    const G = 35 - F + R; // Total correctly processed characters: distractors avoided + targets found

    const calculatedResults = { T, R, F, F1, F2, F3, Omissions, F_perc, G };

    if (isPractice) {
      // Check practice results
      const totalErrors = Omissions + F;
      if (totalErrors === 0) {
        if (isFullscreen) exitFullscreen();
        setGameState('practiceComplete');
      } else {
        if (isFullscreen) exitFullscreen();
        const mustRetry = totalErrors > 5;
        setPracticeFailureData({ Omissions, F, totalErrors, mustRetry });
        setGameState('practiceFailed');
      }
    } else {
      if (isFullscreen) exitFullscreen();
      setResults(calculatedResults);
      if (assignmentId) {
        onComplete(calculatedResults);
      }
      setGameState('results');
    }
  };

  const startTest = async () => {
    setIsPractice(false);
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen:', err);
      }
    }
    generateGrid(false);
    setClicks([]);
    setStartTime(Date.now());
    setGameState('testing');
  };

  const startPractice = async () => {
    setIsPractice(true);
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen:', err);
      }
    }
    generateGrid(true);
    setClicks([]);
    setStartTime(Date.now());
    setGameState('practice');
  };

  // Demo animation effect
  useEffect(() => {
    if (gameState === 'intro' && demoStep < 3) {
      const timer = setTimeout(() => {
        setDemoStep(prev => prev + 1);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState, demoStep]);

  const renderSymbol = (symbol) => {
    const style = {
      transform: `rotate(${symbol.rotation}deg)`,
    };
    return <div className={styles.symbol} style={style}></div>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
      <div className={styles.header}>
      <Link href="/" passHref>
                          <div className={styles.logoLink}> {/* Link wrapping the image */}
                                <Image
                                    src="/logo.png" // Path relative to the public folder
                                    alt={'psykasten Logo'} // Add alt text key
                                    width={50}     // Specify width (adjust as needed)
                                    height={50}    // Specify height (adjust aspect ratio)
                                />
                            </div>
                        </Link>
        </div>

        <div className={styles.gameArea} ref={gameArea}>
      {gameState === 'welcome' && (
        <div className={styles.welcomeCard}>
          <h2>{translate('welcome_title')}</h2>
          <p>{translate('welcome_p1')}</p>
          <p>{translate('welcome_p2')}</p>
          <div className={styles.buttonContainer}>
            <button className={styles.primaryButton} onClick={() => setGameState('tutorial')}>{translate('start_tutorial')}</button>
            <button className={styles.secondaryButton} onClick={() => setShowSettings(true)}>{translate('common:settings')}</button>
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
            <div className={styles.tutorialStep}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepText}>
                <h3>{translate('tutorial_step4_title')}</h3>
                <p>{translate('tutorial_step4_text')}</p>
              </div>
            </div>
          </div>
          <div className={styles.targetReference}>
            <p>{translate('target_symbol_label')}</p>
            {renderSymbol({ rotation: 180 })}
          </div>
          <div className={styles.buttonContainer}>
            <button className={styles.primaryButton} onClick={() => { setDemoStep(0); setGameState('intro'); }}>{translate('see_demo')}</button>
            <button className={styles.secondaryButton} onClick={() => setGameState('welcome')}>{translate('back')}</button>
          </div>
        </div>
      )}

      {gameState === 'intro' && (
        <div className={styles.welcomeCard}>
          <h2>{translate('demo_title')}</h2>
          <p>{translate('demo_intro')}</p>
          <div className={styles.demoContainer}>
            <div className={styles.demoGrid}>
              {[
                { rotation: 90, type: 'distractor' },
                { rotation: 180, type: 'target' },
                { rotation: 270, type: 'distractor' },
                { rotation: 0, type: 'distractor' },
                { rotation: 180, type: 'target' },
                { rotation: 90, type: 'distractor' }
              ].map((symbol, index) => (
                <div
                  key={index}
                  className={`${styles.demoSymbolContainer} ${
                    symbol.type === 'target' && demoStep >= 1 ? styles.highlighted : ''
                  } ${
                    symbol.type === 'target' && demoStep >= 2 ? styles.demoClicked : ''
                  }`}
                >
                  {renderSymbol(symbol)}
                </div>
              ))}
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
            <button className={styles.secondaryButton} onClick={() => setGameState('tutorial')}>{translate('back')}</button>
          </div>
        </div>
      )}

      {gameState === 'practiceFailed' && practiceFailureData && (
        <div className={styles.welcomeCard}>
          <h2>{translate('practice_failed_title')}</h2>
          <p>{translate('practice_failed_p1')}</p>
          {practiceFailureData.Omissions > 0 && (
            <p className={styles.errorText}>
              {translate('practice_omissions')}: {practiceFailureData.Omissions}
            </p>
          )}
          {practiceFailureData.F > 0 && (
            <p className={styles.errorText}>
              {translate('practice_false_positives')}: {practiceFailureData.F}
            </p>
          )}
          {practiceFailureData.mustRetry ? (
            <p className={styles.errorText}>{translate('practice_must_retry')}</p>
          ) : (
            <p>{translate('practice_failed_p2')}</p>
          )}
          <div className={styles.buttonContainer}>
            <button className={styles.primaryButton} onClick={startPractice}>{translate('try_practice_again')}</button>
            {!practiceFailureData.mustRetry && (
              <button className={styles.secondaryButton} onClick={() => { setCountdown(settings.countdownDuration); setGameState('countdown'); }}>{translate('start_real_test')}</button>
            )}
            <button className={styles.secondaryButton} onClick={() => setGameState('tutorial')}>{translate('back_to_tutorial')}</button>
          </div>
        </div>
      )}

      {gameState === 'practiceComplete' && (
        <div className={styles.welcomeCard}>
          <h2>{translate('practice_complete_title')}</h2>
          <p>{translate('practice_complete_p1')}</p>
          <p>{translate('practice_complete_p2')}</p>
          <div className={styles.buttonContainer}>
            <button className={styles.primaryButton} onClick={() => { setCountdown(settings.countdownDuration); setGameState('countdown'); }}>{translate('start_real_test')}</button>
            <button className={styles.secondaryButton} onClick={startPractice}>{translate('practice_again')}</button>
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

      {(gameState === 'testing' || gameState === 'practice') && (
        <div>
          <div className={styles.targetReference}>
            <p>{translate('find_symbol')}</p>
            {renderSymbol({ rotation: 180 })}
          </div>
          <div className={styles.testGrid} style={gameState === 'practice' ? { gridTemplateColumns: 'repeat(5, 1fr)', maxWidth: '500px' } : {}}>
            {grid.map((symbol, index) => (
              <div key={index} className={styles.symbolContainer} onClick={() => handleSymbolClick(index)}>
                {renderSymbol(symbol)}
                {symbol.clicked && <div className={styles.clickedMarker}></div>}
              </div>
            ))}
          </div>
          <button className={styles.finishButton} onClick={finishTest}>
            {gameState === 'practice' ? translate('finish_practice') : translate('finish_test')}
          </button>
          </div>
      )}

      {gameState === 'results' && isStandalone && results && (
        <AktResults results={results} t={translate} />
      )}

      {showSettings && (
        <AktSettings
          settings={settings}
          setSettings={setSettings}
          onClose={() => setShowSettings(false)}
          t={translate}
        />
      )}
    </div>

    <Footer />

    </div>
    </div>
  );
};

export default AktTest;
