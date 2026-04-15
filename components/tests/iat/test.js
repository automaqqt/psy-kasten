// components/tests/iat/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/IatTest.module.css';
import IatResults from '../../results/iat';
import IatSettings from '../../settings/iat';
import {
  DEFAULT_SETTINGS, PRACTICE_SETTINGS, THEME_COLOR,
  BLOCKS, STIMULI, LEFT_KEY, RIGHT_KEY,
  TARGET_COLOR, ATTRIBUTE_COLOR,
} from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';

const TARGET_CATS = ['flowers', 'insects'];

function isTargetCat(cat) { return TARGET_CATS.includes(cat); }
function catColor(cat) { return isTargetCat(cat) ? TARGET_COLOR : ATTRIBUTE_COLOR; }

function buildBlockSequence(block, translate, trialMultiplier) {
  // Build a trial list for this block.
  // For targets/attributes: pick from the two category pools.
  // For combined: pick from all four category pools (intermix).
  const total = Math.max(4, Math.round(block.trials * trialMultiplier));
  const leftCats = block.left;
  const rightCats = block.right;
  const trials = [];

  // Pool of (category, word) for each side
  const pool = [];
  leftCats.forEach(cat => STIMULI[cat].forEach(word => pool.push({ cat, word, side: 'L' })));
  rightCats.forEach(cat => STIMULI[cat].forEach(word => pool.push({ cat, word, side: 'R' })));

  for (let i = 0; i < total; i++) {
    const item = pool[Math.floor(Math.random() * pool.length)];
    trials.push({ ...item, trialInBlock: i + 1 });
  }
  return trials;
}

export default function IatTest({ assignmentId, onComplete, isStandalone, t }) {
  const engine = useTestEngine({ t });
  const { translate, gameAreaRef, isFullscreen, requestFullscreen, exitFullscreen,
          clearAllTimers, countdown, startCountdown,
          showSettings, setShowSettings } = engine;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState('welcome');
  // Game states: welcome, tutorial, demo, practiceComplete, countdown, blockIntro, playing, results

  const [isPractice, setIsPractice] = useState(false);
  const [blockIndex, setBlockIndex] = useState(0);
  const [blockSequence, setBlockSequence] = useState([]);
  const [trialInBlock, setTrialInBlock] = useState(0);
  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [showError, setShowError] = useState(false);
  const [trials, setTrials] = useState([]);
  const [practiceTrials, setPracticeTrials] = useState([]);
  const [demoStep, setDemoStep] = useState(0);

  const stimulusStartRef = useRef(null);
  const awaitingCorrectionRef = useRef(false);
  const firstResponseRef = useRef(null); // { rt, side, correct }
  const itiTimerRef = useRef(null);
  const isPracticeRef = useRef(false);
  const blockIndexRef = useRef(0);
  const blockSequenceRef = useRef([]);
  const trialInBlockRef = useRef(0);
  const currentStimulusRef = useRef(null);
  const trialsRef = useRef([]);
  const practiceTrialsRef = useRef([]);

  useEffect(() => { isPracticeRef.current = isPractice; }, [isPractice]);
  useEffect(() => { blockIndexRef.current = blockIndex; }, [blockIndex]);
  useEffect(() => { blockSequenceRef.current = blockSequence; }, [blockSequence]);
  useEffect(() => { trialInBlockRef.current = trialInBlock; }, [trialInBlock]);
  useEffect(() => { currentStimulusRef.current = currentStimulus; }, [currentStimulus]);
  useEffect(() => { trialsRef.current = trials; }, [trials]);
  useEffect(() => { practiceTrialsRef.current = practiceTrials; }, [practiceTrials]);

  // Demo animation
  useEffect(() => {
    if (gameState !== 'demo') return;
    const timings = [3000, 3000, 3000, 3000, 3500];
    if (demoStep < timings.length) {
      const timer = setTimeout(() => setDemoStep(prev => prev + 1), timings[demoStep]);
      return () => clearTimeout(timer);
    }
  }, [gameState, demoStep]);

  const getActiveSettings = () => (isPracticeRef.current ? PRACTICE_SETTINGS : settings);

  const presentNextStimulus = useCallback(() => {
    const seq = blockSequenceRef.current;
    const idx = trialInBlockRef.current;
    if (idx >= seq.length) {
      // Block complete
      const nextBlock = blockIndexRef.current + 1;
      if (nextBlock >= BLOCKS.length) {
        finishRun();
      } else {
        startBlock(nextBlock);
      }
      return;
    }
    const stim = seq[idx];
    setCurrentStimulus(stim);
    setShowError(false);
    awaitingCorrectionRef.current = false;
    firstResponseRef.current = null;
    stimulusStartRef.current = Date.now();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recordTrial = (stim, firstResp) => {
    const block = BLOCKS[blockIndexRef.current];
    const trial = {
      blockIndex: block.index,
      kind: block.kind,
      compat: block.compat,
      practice: block.practice,
      trialInBlock: stim.trialInBlock,
      word: stim.word,
      category: stim.cat,
      correctSide: stim.side,
      responseSide: firstResp.side,
      correct: firstResp.correct,
      reactionTime: firstResp.rt,
    };
    if (isPracticeRef.current) {
      setPracticeTrials(prev => [...prev, trial]);
    } else {
      setTrials(prev => [...prev, trial]);
    }
  };

  const advanceTrial = () => {
    setTrialInBlock(prev => {
      const next = prev + 1;
      trialInBlockRef.current = next;
      return next;
    });
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    itiTimerRef.current = setTimeout(() => {
      presentNextStimulus();
    }, getActiveSettings().iti);
  };

  const handleKeyResponse = useCallback((side) => {
    if (gameState !== 'playing') return;
    const stim = currentStimulusRef.current;
    if (!stim) return;

    const correct = side === stim.side;

    if (awaitingCorrectionRef.current) {
      // Already made an error; waiting for the correct key.
      if (correct) {
        setShowError(false);
        recordTrial(stim, firstResponseRef.current);
        advanceTrial();
      }
      // ignore incorrect keys while awaiting correction
      return;
    }

    // First response
    const rt = Date.now() - stimulusStartRef.current;
    const firstResp = { rt, side, correct };
    firstResponseRef.current = firstResp;

    const activeSettings = getActiveSettings();

    if (correct) {
      recordTrial(stim, firstResp);
      advanceTrial();
    } else {
      setShowError(true);
      if (activeSettings.errorPenalty) {
        awaitingCorrectionRef.current = true;
      } else {
        recordTrial(stim, firstResp);
        advanceTrial();
      }
    }
  }, [gameState, settings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Key listener
  useEffect(() => {
    const onKey = (e) => {
      if (gameState === 'blockIntro' && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        beginBlockPlay();
        return;
      }
      if (gameState !== 'playing') return;
      const k = e.key.toLowerCase();
      if (k === LEFT_KEY) { e.preventDefault(); handleKeyResponse('L'); }
      else if (k === RIGHT_KEY) { e.preventDefault(); handleKeyResponse('R'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, handleKeyResponse]); // eslint-disable-line react-hooks/exhaustive-deps

  const startBlock = (idx) => {
    const block = BLOCKS[idx];
    const activeSettings = isPracticeRef.current ? PRACTICE_SETTINGS : settings;
    const seq = buildBlockSequence(block, translate, activeSettings.trialMultiplier);
    setBlockIndex(idx);
    blockIndexRef.current = idx;
    setBlockSequence(seq);
    blockSequenceRef.current = seq;
    setTrialInBlock(0);
    trialInBlockRef.current = 0;
    setCurrentStimulus(null);
    setShowError(false);
    setGameState('blockIntro');
  };

  const beginBlockPlay = () => {
    setGameState('playing');
    // small delay before first stimulus
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    itiTimerRef.current = setTimeout(() => presentNextStimulus(), 600);
  };

  const finishRun = () => {
    clearAllTimers();
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    if (isFullscreen) exitFullscreen();

    if (isPracticeRef.current) {
      setGameState('practiceComplete');
      return;
    }

    const finalTrials = trialsRef.current;
    const summary = summarize(finalTrials);

    setGameState('results');
    if (!isStandalone && onComplete) {
      onComplete({
        trials: finalTrials,
        ...summary,
        settingsUsed: settings,
      });
    }
  };

  const startPractice = async () => {
    clearAllTimers();
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    setIsPractice(true);
    isPracticeRef.current = true;
    await requestFullscreen();
    setPracticeTrials([]);
    practiceTrialsRef.current = [];
    setTrials([]);
    trialsRef.current = [];
    setGameState('countdown');
    startCountdown(() => {
      startBlock(0);
    });
  };

  const startRealTest = async () => {
    clearAllTimers();
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    setIsPractice(false);
    isPracticeRef.current = false;
    await requestFullscreen();
    setTrials([]);
    trialsRef.current = [];
    setGameState('countdown');
    startCountdown(() => {
      startBlock(0);
    });
  };

  const stopTest = () => {
    if (gameState === 'playing' || gameState === 'blockIntro') {
      finishRun();
    }
  };

  const resetTest = () => {
    clearAllTimers();
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    setTrials([]);
    setPracticeTrials([]);
    setBlockIndex(0);
    setTrialInBlock(0);
    setCurrentStimulus(null);
    setShowError(false);
    setIsPractice(false);
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
      if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    };
  }, [clearAllTimers]);

  const practiceStats = () => {
    const pt = practiceTrials;
    if (pt.length === 0) return { total: 0, correct: 0, accuracy: 0, meanRT: 0 };
    const correct = pt.filter(t => t.correct).length;
    const rts = pt.filter(t => t.correct).map(t => t.reactionTime);
    const meanRT = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
    return { total: pt.length, correct, accuracy: (correct / pt.length) * 100, meanRT };
  };

  const block = BLOCKS[blockIndex];
  const totalTestTrials = BLOCKS.filter(b => !b.practice).reduce((a, b) => a + b.trials, 0);

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {(gameState === 'playing' || gameState === 'blockIntro') && (
            <div className={styles.gameMetrics}>
              <div className={styles.trialIndicator}>
                {translate('block_indicator')}: <span className={styles.metricValue}>{blockIndex + 1}/{BLOCKS.length}</span>
              </div>
              <div className={styles.trialIndicator}>
                {translate('trials_completed')}: <span className={styles.metricValue}>{trialInBlock}/{blockSequence.length}</span>
              </div>
              <button
                className={styles.iconButton}
                onClick={stopTest}
                title={translate('stop_test')}
                aria-label={translate('stop_test')}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
              </button>
            </div>
          )}
        </TestHeader>

        <div className={styles.gameArea} ref={gameAreaRef}>
          {/* Welcome */}
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

          {/* Tutorial */}
          {gameState === 'tutorial' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('tutorial_title')}</h2>
              <div className={styles.tutorialContent}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={styles.tutorialStep}>
                    <div className={styles.stepNumber}>{i}</div>
                    <div className={styles.stepText}>
                      <h3>{translate(`tutorial_step${i}_title`)}</h3>
                      <p>{translate(`tutorial_step${i}_text`)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={() => { setDemoStep(0); setGameState('demo'); }}>
                  {translate('see_demo')}
                </button>
                <button className={styles.secondaryButton} onClick={startPractice}>
                  {translate('start_practice')}
                </button>
                <button className={styles.tertiaryButton} onClick={() => setGameState('welcome')}>
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {/* Demo */}
          {gameState === 'demo' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('demo_title')}</h2>
              <p className={styles.demoIntro}>{translate('demo_intro')}</p>

              <div className={styles.demoStepText}>
                <p>{translate(`demo_step${Math.min(demoStep + 1, 5)}`)}</p>
              </div>

              <div className={styles.demoContainer}>
                <DemoStimulus step={demoStep} translate={translate} styles={styles} />
              </div>

              <div className={styles.buttonContainer}>
                <button
                  className={styles.primaryButton}
                  onClick={startPractice}
                  disabled={demoStep < 4}
                >
                  {translate('start_practice')}
                </button>
                <button className={styles.secondaryButton} onClick={() => setGameState('tutorial')}>
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {/* Practice Complete */}
          {gameState === 'practiceComplete' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('practice_complete_title')}</h2>
              <p>{translate('practice_complete_text1')}</p>
              <p>{translate('practice_complete_text2')}</p>

              <div className={styles.practiceStats}>
                <h3>{translate('practice_stats_title')}</h3>
                {(() => {
                  const s = practiceStats();
                  return (
                    <>
                      <div className={styles.statRow}>
                        <span>{translate('practice_total_trials')}:</span>
                        <span className={styles.statValue}>{s.total}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_accuracy')}:</span>
                        <span className={styles.statValue}>{s.accuracy.toFixed(0)}%</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_mean_rt')}:</span>
                        <span className={styles.statValue}>{s.meanRT.toFixed(0)} ms</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={startRealTest}>
                  {translate('start_real_test')}
                </button>
                <button className={styles.secondaryButton} onClick={startPractice}>
                  {translate('practice_again')}
                </button>
              </div>
            </div>
          )}

          {/* Countdown */}
          {gameState === 'countdown' && (
            <CountdownOverlay countdown={countdown} translate={translate} />
          )}

          {/* Block intro */}
          {gameState === 'blockIntro' && block && (
            <div className={styles.blockIntro}>
              <h2>{translate('block_intro_title', { block: blockIndex + 1, total: BLOCKS.length })}</h2>
              <p className={styles.blockKind}>
                {translate(
                  block.kind === 'combined'
                    ? (block.compat ? 'block_kind_combined_compat' : 'block_kind_combined_incompat')
                    : block.kind === 'target'
                      ? 'block_kind_target'
                      : 'block_kind_attribute'
                )}
              </p>
              <div className={styles.mappingRow}>
                <div className={styles.mappingSide}>
                  <div className={styles.keyBadge}>{LEFT_KEY.toUpperCase()}</div>
                  <div className={styles.mappingLabels}>
                    {block.left.map((cat, i) => (
                      <div key={i} className={styles.catLabel} style={{ color: catColor(cat) }}>
                        {translate(`cat_${cat}`)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.mappingSide}>
                  <div className={styles.keyBadge}>{RIGHT_KEY.toUpperCase()}</div>
                  <div className={styles.mappingLabels}>
                    {block.right.map((cat, i) => (
                      <div key={i} className={styles.catLabel} style={{ color: catColor(cat) }}>
                        {translate(`cat_${cat}`)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className={styles.blockIntroHint}>{translate('block_intro_hint')}</p>
              <button className={styles.primaryButton} onClick={beginBlockPlay}>
                {translate('begin_block')}
              </button>
            </div>
          )}

          {/* Playing */}
          {gameState === 'playing' && block && (
            <div className={styles.playArea}>
              {/* Top-corner category labels */}
              <div className={styles.corner + ' ' + styles.cornerLeft}>
                <div className={styles.keyHint}>{LEFT_KEY.toUpperCase()}</div>
                {block.left.map((cat, i) => (
                  <div key={i} className={styles.catLabel} style={{ color: catColor(cat) }}>
                    {translate(`cat_${cat}`)}
                  </div>
                ))}
              </div>
              <div className={styles.corner + ' ' + styles.cornerRight}>
                <div className={styles.keyHint}>{RIGHT_KEY.toUpperCase()}</div>
                {block.right.map((cat, i) => (
                  <div key={i} className={styles.catLabel} style={{ color: catColor(cat) }}>
                    {translate(`cat_${cat}`)}
                  </div>
                ))}
              </div>

              {/* Centered stimulus */}
              <div className={styles.stimulusCenter}>
                {currentStimulus && (
                  <div
                    className={styles.stimulusWord}
                    style={{
                      fontSize: `${settings.fontSize}px`,
                      color: catColor(currentStimulus.cat),
                    }}
                  >
                    {translate(`word_${currentStimulus.word}`)}
                  </div>
                )}
                {showError && (
                  <div className={styles.errorX} aria-hidden>✕</div>
                )}
              </div>

              <div className={styles.bottomInstructions}>
                <p>{translate('play_bottom_instruction', { left: LEFT_KEY.toUpperCase(), right: RIGHT_KEY.toUpperCase() })}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && (
            <IatResults
              trials={trials}
              onRestart={resetTest}
              t={translate}
            />
          )}
        </div>

        {showSettings && (
          <IatSettings
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

// Demo stimulus — a static illustration that walks through what a trial looks like.
function DemoStimulus({ step, translate, styles }) {
  // Use a fixed combined compatible mapping for the demo.
  const leftCats = ['flowers', 'pleasant'];
  const rightCats = ['insects', 'unpleasant'];

  const words = [
    { cat: 'flowers', word: 'rose', correct: 'L' },
    { cat: 'unpleasant', word: 'hate', correct: 'R' },
  ];
  const visible = step >= 1;
  const wordIdx = step >= 3 ? 1 : 0;
  const w = words[wordIdx];
  const showError = step === 3;
  const showOk = step === 2 || step === 4;

  return (
    <div className={styles.demoPlay}>
      <div className={styles.demoCorner + ' ' + styles.cornerLeft}>
        <div className={styles.keyHint}>{LEFT_KEY.toUpperCase()}</div>
        {leftCats.map((c, i) => (
          <div key={i} className={styles.catLabel} style={{ color: catColor(c) }}>
            {translate(`cat_${c}`)}
          </div>
        ))}
      </div>
      <div className={styles.demoCorner + ' ' + styles.cornerRight}>
        <div className={styles.keyHint}>{RIGHT_KEY.toUpperCase()}</div>
        {rightCats.map((c, i) => (
          <div key={i} className={styles.catLabel} style={{ color: catColor(c) }}>
            {translate(`cat_${c}`)}
          </div>
        ))}
      </div>
      <div className={styles.stimulusCenter}>
        {visible && (
          <div className={styles.stimulusWord} style={{ color: catColor(w.cat), fontSize: '28px' }}>
            {translate(`word_${w.word}`)}
          </div>
        )}
        {showError && <div className={styles.errorX} aria-hidden>✕</div>}
        {showOk && <div className={styles.okCheck} aria-hidden>✓</div>}
      </div>
    </div>
  );
}

// --- scoring ---
function summarize(allTrials) {
  const testTrials = allTrials.filter(t => !t.practice);
  const combined = testTrials.filter(t => t.kind === 'combined');
  const compat = combined.filter(t => t.compat === true);
  const incompat = combined.filter(t => t.compat === false);

  const meanRT = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const sdRT = arr => {
    if (arr.length < 2) return 0;
    const m = meanRT(arr);
    const v = arr.reduce((acc, x) => acc + (x - m) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(v);
  };

  // Raw RTs (correct only) for mean; errors get block-mean + 600 for D-score.
  const compatCorrectRTs = compat.filter(t => t.correct).map(t => t.reactionTime);
  const incompatCorrectRTs = incompat.filter(t => t.correct).map(t => t.reactionTime);

  const meanRtCompat = meanRT(compatCorrectRTs);
  const meanRtIncompat = meanRT(incompatCorrectRTs);
  const iatEffect = meanRtIncompat - meanRtCompat;

  // D-score (Greenwald 2003 simplified): penalty = block mean (correct) + 600
  const compatPenalty = meanRtCompat + 600;
  const incompatPenalty = meanRtIncompat + 600;
  const compatAdjusted = compat.map(t => t.correct ? t.reactionTime : compatPenalty);
  const incompatAdjusted = incompat.map(t => t.correct ? t.reactionTime : incompatPenalty);
  const pooledSD = sdRT([...compatAdjusted, ...incompatAdjusted]);
  const dScore = pooledSD > 0
    ? (meanRT(incompatAdjusted) - meanRT(compatAdjusted)) / pooledSD
    : 0;

  const correctCount = testTrials.filter(t => t.correct).length;
  const accuracy = testTrials.length ? (correctCount / testTrials.length) * 100 : 0;

  // Per-block stats
  const blockStats = BLOCKS.filter(b => !b.practice).map(b => {
    const bt = testTrials.filter(t => t.blockIndex === b.index);
    const rts = bt.filter(t => t.correct).map(t => t.reactionTime);
    return {
      blockIndex: b.index,
      kind: b.kind,
      compat: b.compat,
      totalTrials: bt.length,
      meanRT: meanRT(rts),
      errorRate: bt.length ? bt.filter(t => !t.correct).length / bt.length : 0,
    };
  });

  return {
    iatEffect,
    dScore,
    meanRtCompat,
    meanRtIncompat,
    accuracy,
    totalTrials: testTrials.length,
    blockStats,
  };
}
