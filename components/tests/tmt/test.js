// components/tests/tmt/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/TmtTest.module.css';
import TmtResults from '../../results/tmt';
import TmtSettings from '../../settings/tmt';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, LAYOUTS, SEQUENCES, THEME_COLOR } from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';
import MessageOverlay from '../../ui/MessageOverlay';

// Phases: each run of the test touches 4 segments in order.
const SEGMENTS = [
  { key: 'practiceA', part: 'A', practice: true },
  { key: 'partA',     part: 'A', practice: false },
  { key: 'practiceB', part: 'B', practice: true },
  { key: 'partB',     part: 'B', practice: false },
];

export default function TmtTest({ assignmentId, onComplete, isStandalone, t }) {
  const engine = useTestEngine({ t });
  const { translate, gameAreaRef, isFullscreen, requestFullscreen, exitFullscreen,
          clearAllTimers, countdown, startCountdown,
          showMessage, message, messageType, showOverlayMessage,
          showSettings, setShowSettings } = engine;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  // Game states: welcome, tutorial, demo, instruction, countdown, playing, segmentComplete, results
  const [gameState, setGameState] = useState('welcome');
  const [segmentIndex, setSegmentIndex] = useState(0);       // index into SEGMENTS
  const [nextIndex, setNextIndex] = useState(0);             // next expected label index in the sequence
  const [clicks, setClicks] = useState([]);                  // per-segment click log
  const [errors, setErrors] = useState(0);                   // errors in current segment
  const [elapsed, setElapsed] = useState(0);                 // current segment elapsed seconds
  const [wrongLabel, setWrongLabel] = useState(null);        // flash a red circle on wrong click
  const [demoStep, setDemoStep] = useState(0);

  // Results accumulator — one entry per segment that actually ran.
  const [segmentResults, setSegmentResults] = useState([]);

  // Refs for timers and state access in callbacks.
  const segmentStartRef = useRef(null);
  const tickRef = useRef(null);
  const abortTimeRef = useRef(null);
  const nextIndexRef = useRef(0);
  const errorsRef = useRef(0);
  const clicksRef = useRef([]);
  const segmentIndexRef = useRef(0);

  const currentSegment = SEGMENTS[segmentIndex] || SEGMENTS[0];
  const currentLayout = LAYOUTS[currentSegment.key];
  const currentSequence = SEQUENCES[currentSegment.key];
  const activeSettings = currentSegment.practice ? PRACTICE_SETTINGS : settings;
  const maxTime = currentSegment.part === 'A' ? activeSettings.maxTimePartA : activeSettings.maxTimePartB;

  // Keep refs in sync.
  useEffect(() => { nextIndexRef.current = nextIndex; }, [nextIndex]);
  useEffect(() => { errorsRef.current = errors; }, [errors]);
  useEffect(() => { clicksRef.current = clicks; }, [clicks]);
  useEffect(() => { segmentIndexRef.current = segmentIndex; }, [segmentIndex]);

  // Tiny demo animation loop — 6 steps.
  useEffect(() => {
    if (gameState !== 'demo') return;
    if (demoStep >= 5) return;
    const timer = setTimeout(() => setDemoStep(s => s + 1), 2500);
    return () => clearTimeout(timer);
  }, [gameState, demoStep]);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (abortTimeRef.current) {
      clearTimeout(abortTimeRef.current);
      abortTimeRef.current = null;
    }
  }, []);

  const finishSegment = useCallback((aborted = false) => {
    stopTick();
    const start = segmentStartRef.current || Date.now();
    const timeSec = (Date.now() - start) / 1000;
    const seg = SEGMENTS[segmentIndexRef.current];
    const result = {
      key: seg.key,
      part: seg.part,
      practice: seg.practice,
      timeSec: aborted ? (seg.part === 'A' ? settings.maxTimePartA + 1 : settings.maxTimePartB + 1) : timeSec,
      errors: errorsRef.current,
      aborted,
      clicks: clicksRef.current,
      totalCircles: SEQUENCES[seg.key].length,
    };
    setSegmentResults(prev => [...prev, result]);
    setGameState('segmentComplete');
  }, [stopTick, settings.maxTimePartA, settings.maxTimePartB]);

  const startSegment = useCallback(async () => {
    stopTick();
    await requestFullscreen();

    setNextIndex(0);
    setErrors(0);
    setClicks([]);
    setWrongLabel(null);
    nextIndexRef.current = 0;
    errorsRef.current = 0;
    clicksRef.current = [];

    const seg = SEGMENTS[segmentIndexRef.current];
    const segSettings = seg.practice ? PRACTICE_SETTINGS : settings;
    const segMax = seg.part === 'A' ? segSettings.maxTimePartA : segSettings.maxTimePartB;

    setGameState('countdown');
    startCountdown(() => {
      segmentStartRef.current = Date.now();
      setElapsed(0);
      setGameState('playing');

      tickRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - segmentStartRef.current) / 1000));
      }, 100);

      abortTimeRef.current = setTimeout(() => {
        showOverlayMessage('feedback_time_up', 1200, 'error');
        finishSegment(true);
      }, segMax * 1000);
    });
  }, [stopTick, requestFullscreen, startCountdown, showOverlayMessage, finishSegment, settings]);

  const goToInstructionFor = useCallback((index) => {
    setSegmentIndex(index);
    segmentIndexRef.current = index;
    setGameState('instruction');
  }, []);

  const handleCircleClick = useCallback((label, index) => {
    if (gameState !== 'playing') return;

    const expected = currentSequence[nextIndexRef.current];
    const now = Date.now();
    const elapsedMs = now - (segmentStartRef.current || now);

    if (label === expected) {
      const newIndex = nextIndexRef.current + 1;
      nextIndexRef.current = newIndex;
      setNextIndex(newIndex);
      clicksRef.current = [...clicksRef.current, { label, correct: true, elapsedMs }];
      setClicks(clicksRef.current);

      if (newIndex >= currentSequence.length) {
        // Segment complete
        showOverlayMessage('feedback_segment_complete', 900, 'success');
        finishSegment(false);
      }
    } else {
      errorsRef.current = errorsRef.current + 1;
      setErrors(errorsRef.current);
      clicksRef.current = [...clicksRef.current, { label, correct: false, elapsedMs, expected }];
      setClicks(clicksRef.current);
      setWrongLabel(label);
      setTimeout(() => setWrongLabel(null), 500);
      showOverlayMessage('feedback_wrong', 800, 'error');
    }
  }, [gameState, currentSequence, showOverlayMessage, finishSegment]);

  const continueAfterSegment = useCallback(() => {
    if (isFullscreen) exitFullscreen();

    const nextIdx = segmentIndexRef.current + 1;
    if (nextIdx >= SEGMENTS.length) {
      setGameState('results');
      if (!isStandalone && onComplete) {
        onComplete(buildPayload(segmentResults));
      }
      return;
    }
    goToInstructionFor(nextIdx);
  }, [isFullscreen, exitFullscreen, isStandalone, onComplete, segmentResults, goToInstructionFor]);

  // Build submission payload from accumulated segment results.
  const buildPayload = (results) => {
    const realA = results.find(r => r.key === 'partA');
    const realB = results.find(r => r.key === 'partB');
    return {
      partA: realA ? {
        timeSec: realA.timeSec,
        errors: realA.errors,
        aborted: realA.aborted,
        totalCircles: realA.totalCircles,
        clicks: realA.clicks,
      } : null,
      partB: realB ? {
        timeSec: realB.timeSec,
        errors: realB.errors,
        aborted: realB.aborted,
        totalCircles: realB.totalCircles,
        clicks: realB.clicks,
      } : null,
      // B minus A is a classic executive-function index (cognitive flexibility cost).
      bMinusA: (realA && realB && !realA.aborted && !realB.aborted)
        ? Math.max(0, realB.timeSec - realA.timeSec)
        : null,
    };
  };

  // When the fourth segment finishes, the state update to segmentResults happens
  // on the next render. We rely on the fact that `continueAfterSegment` is called
  // from the "Continue" button, which renders after the segmentResults state has settled.

  const resetTest = () => {
    stopTick();
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    setSegmentIndex(0);
    segmentIndexRef.current = 0;
    setSegmentResults([]);
    setNextIndex(0);
    setErrors(0);
    setClicks([]);
    setWrongLabel(null);
  };

  const stopCurrentSegment = () => {
    if (gameState === 'playing' || gameState === 'countdown') {
      finishSegment(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTick();
      clearAllTimers();
    };
  }, [stopTick, clearAllTimers]);

  const formatTime = (seconds) => {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Compute the SVG path of the trail so far — connect correct clicks in order.
  const trailPoints = (() => {
    const pts = [];
    // First `nextIndex` labels in the sequence have been hit correctly.
    for (let i = 0; i < nextIndex; i++) {
      const label = currentSequence[i];
      const circle = currentLayout.find(c => c.label === label);
      if (circle) pts.push(circle);
    }
    return pts;
  })();

  const lastSegmentResult = segmentResults[segmentResults.length - 1];

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {gameState === 'playing' && (
            <div className={styles.gameMetrics}>
              <div className={styles.timeIndicator}>
                {translate('time_label')}: <span className={styles.metricValue}>{formatTime(elapsed)}</span>
                <span className={styles.metricMuted}> / {formatTime(maxTime)}</span>
              </div>
              <div className={styles.trialIndicator}>
                {translate('progress_label')}: <span className={styles.metricValue}>{nextIndex}/{currentSequence.length}</span>
              </div>
              <div className={styles.trialIndicator}>
                {translate('errors_label')}: <span className={styles.metricValue}>{errors}</span>
              </div>
              <button
                className={styles.iconButton}
                onClick={stopCurrentSegment}
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
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className={styles.tutorialStep}>
                    <div className={styles.stepNumber}>{n}</div>
                    <div className={styles.stepText}>
                      <h3>{translate(`tutorial_step${n}_title`)}</h3>
                      <p>{translate(`tutorial_step${n}_text`)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={() => { setDemoStep(0); setGameState('demo'); }}>
                  {translate('see_demo')}
                </button>
                <button className={styles.secondaryButton} onClick={() => goToInstructionFor(0)}>
                  {translate('start_practice')}
                </button>
                <button className={styles.tertiaryButton} onClick={() => setGameState('welcome')}>
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {/* Demo — a mini 4-circle board that auto-plays. */}
          {gameState === 'demo' && (
            <div className={styles.welcomeCard}>
              <h2>{translate('demo_title')}</h2>
              <p className={styles.demoIntro}>{translate('demo_intro')}</p>

              <div className={styles.demoStepText}>
                <p>{translate(`demo_step${Math.min(demoStep + 1, 6)}`)}</p>
              </div>

              <div className={styles.demoBoard}>
                {[
                  { label: '1', x: 20, y: 55 },
                  { label: 'A', x: 45, y: 25 },
                  { label: '2', x: 70, y: 55 },
                  { label: 'B', x: 45, y: 85 },
                ].map((c, i) => {
                  const reached = demoStep >= i + 1;
                  return (
                    <div
                      key={c.label}
                      className={`${styles.circle} ${reached ? styles.circleDone : ''}`}
                      style={{ left: `${c.x}%`, top: `${c.y}%`, width: 48, height: 48 }}
                    >
                      {c.label}
                    </div>
                  );
                })}
                <svg className={styles.trailSvg}>
                  {[0, 1, 2, 3].slice(0, Math.max(0, demoStep - 1)).map(i => {
                    const a = [
                      { x: 20, y: 55 }, { x: 45, y: 25 }, { x: 70, y: 55 }, { x: 45, y: 85 },
                    ][i];
                    const b = [
                      { x: 20, y: 55 }, { x: 45, y: 25 }, { x: 70, y: 55 }, { x: 45, y: 85 },
                    ][i + 1];
                    if (!a || !b) return null;
                    return (
                      <line
                        key={i}
                        x1={`${a.x}%`} y1={`${a.y}%`}
                        x2={`${b.x}%`} y2={`${b.y}%`}
                        stroke={THEME_COLOR}
                        strokeWidth="3"
                      />
                    );
                  })}
                </svg>
              </div>

              <div className={styles.buttonContainer}>
                <button
                  className={styles.primaryButton}
                  onClick={() => goToInstructionFor(0)}
                  disabled={demoStep < 5}
                >
                  {translate('start_practice')}
                </button>
                <button className={styles.secondaryButton} onClick={() => setGameState('tutorial')}>
                  {translate('back')}
                </button>
              </div>
            </div>
          )}

          {/* Instruction screen before each segment */}
          {gameState === 'instruction' && (
            <div className={styles.welcomeCard}>
              <h2>{translate(`instruction_${currentSegment.key}_title`)}</h2>
              <p>{translate(`instruction_${currentSegment.key}_text1`)}</p>
              <p>{translate(`instruction_${currentSegment.key}_text2`)}</p>
              <p className={styles.mutedLine}>
                {translate('instruction_time_limit', { seconds: maxTime })}
              </p>
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={startSegment}>
                  {translate('ready_start')}
                </button>
              </div>
            </div>
          )}

          {/* Countdown */}
          {gameState === 'countdown' && (
            <CountdownOverlay countdown={countdown} translate={translate} />
          )}

          {/* Playing — the actual trail board */}
          {gameState === 'playing' && (
            <div className={styles.board}>
              <svg className={styles.trailSvg}>
                {trailPoints.slice(0, -1).map((p, i) => {
                  const next = trailPoints[i + 1];
                  return (
                    <line
                      key={i}
                      x1={`${p.x}%`} y1={`${p.y}%`}
                      x2={`${next.x}%`} y2={`${next.y}%`}
                      stroke={THEME_COLOR}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              {currentLayout.map((circle, i) => {
                const reachedIdx = currentSequence.indexOf(circle.label);
                const done = reachedIdx < nextIndex;
                const isWrong = wrongLabel === circle.label;
                return (
                  <button
                    key={i}
                    className={`${styles.circle} ${done ? styles.circleDone : ''} ${isWrong ? styles.circleWrong : ''}`}
                    style={{
                      left: `${circle.x}%`,
                      top: `${circle.y}%`,
                      width: activeSettings.circleSize,
                      height: activeSettings.circleSize,
                    }}
                    onClick={() => handleCircleClick(circle.label, i)}
                    aria-label={`${translate('circle_aria')} ${circle.label}`}
                  >
                    {circle.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Segment complete screen */}
          {gameState === 'segmentComplete' && lastSegmentResult && (
            <div className={styles.welcomeCard}>
              <h2>
                {translate(lastSegmentResult.practice ? 'practice_complete_title' : 'segment_complete_title',
                  { part: lastSegmentResult.part })}
              </h2>
              <div className={styles.practiceStats}>
                <div className={styles.statRow}>
                  <span>{translate('time_label')}:</span>
                  <span className={styles.statValue}>
                    {lastSegmentResult.aborted
                      ? translate('aborted')
                      : `${lastSegmentResult.timeSec.toFixed(1)} s`}
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span>{translate('errors_label')}:</span>
                  <span className={styles.statValue}>{lastSegmentResult.errors}</span>
                </div>
              </div>
              {segmentIndex < SEGMENTS.length - 1 ? (
                <p>{translate('segment_complete_next')}</p>
              ) : (
                <p>{translate('all_segments_complete')}</p>
              )}
              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={continueAfterSegment}>
                  {segmentIndex < SEGMENTS.length - 1 ? translate('continue_button') : translate('see_results')}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && (
            <TmtResults
              segmentResults={segmentResults}
              onRestart={resetTest}
              t={translate}
            />
          )}

          <MessageOverlay show={showMessage} message={message} type={messageType} />
        </div>

        {showSettings && (
          <TmtSettings
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
