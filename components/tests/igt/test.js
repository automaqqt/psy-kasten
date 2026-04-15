// components/tests/igt/test.js
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from '../../../styles/IgtTest.module.css';
import IgtResults from '../../results/igt';
import IgtSettings from '../../settings/igt';
import { DEFAULT_SETTINGS, PRACTICE_SETTINGS, DECK_SCHEDULES, DECK_IDS } from './data';
import useTestEngine from '../../../hooks/useTestEngine';
import TestHeader from '../../ui/TestHeader';
import CountdownOverlay from '../../ui/CountdownOverlay';
import MessageOverlay from '../../ui/MessageOverlay';

export default function IgtTest({ assignmentId, onComplete, isStandalone, t }) {
  const engine = useTestEngine({ t });
  const { translate, gameAreaRef, isFullscreen, requestFullscreen, exitFullscreen,
          clearAllTimers, countdown, startCountdown,
          showMessage, message, messageType, showOverlayMessage,
          showSettings, setShowSettings } = engine;

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState('welcome');
  // Game states: welcome, tutorial, demo, practice, practiceComplete, countdown, playing, feedback, results
  const [trials, setTrials] = useState([]);
  const [practiceTrials, setPracticeTrials] = useState([]);
  const [isPractice, setIsPractice] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // IGT-specific state
  const [balance, setBalance] = useState(DEFAULT_SETTINGS.startingBalance);
  const [deckPositions, setDeckPositions] = useState({ A: 0, B: 0, C: 0, D: 0 });
  const [lastOutcome, setLastOutcome] = useState(null); // { deck, reward, loss, net }
  const [canRespond, setCanRespond] = useState(false);

  // Refs
  const feedbackTimerRef = useRef(null);
  const itiTimerRef = useRef(null);
  const trialStartTimeRef = useRef(null);
  const isPracticeRef = useRef(false);
  const trialsRef = useRef([]);
  const practiceTrialsRef = useRef([]);
  const balanceRef = useRef(DEFAULT_SETTINGS.startingBalance);
  const deckPositionsRef = useRef({ A: 0, B: 0, C: 0, D: 0 });
  const settingsRef = useRef(DEFAULT_SETTINGS);

  useEffect(() => { isPracticeRef.current = isPractice; }, [isPractice]);
  useEffect(() => { trialsRef.current = trials; }, [trials]);
  useEffect(() => { practiceTrialsRef.current = practiceTrials; }, [practiceTrials]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { deckPositionsRef.current = deckPositions; }, [deckPositions]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Demo animation (6 steps walking through a single trial + outcome)
  useEffect(() => {
    if (gameState !== 'demo') return;
    if (demoStep < 6) {
      const timer = setTimeout(() => setDemoStep(prev => prev + 1), 2500);
      return () => clearTimeout(timer);
    }
  }, [gameState, demoStep]);

  // Pick the next card from a chosen deck (deterministic cycle per deck)
  const drawCard = useCallback((deckId) => {
    const schedule = DECK_SCHEDULES[deckId];
    const pos = deckPositionsRef.current[deckId] || 0;
    const card = schedule[pos % schedule.length];
    const newPositions = { ...deckPositionsRef.current, [deckId]: pos + 1 };
    setDeckPositions(newPositions);
    deckPositionsRef.current = newPositions;
    return { reward: card.reward, loss: card.loss, net: card.reward - card.loss };
  }, []);

  const presentTrial = useCallback(() => {
    setCanRespond(true);
    setLastOutcome(null);
    setGameState('playing');
    trialStartTimeRef.current = Date.now();
  }, []);

  const handleDeckClick = useCallback((deckId) => {
    if (!canRespond) return;
    setCanRespond(false);

    const activeSettings = isPracticeRef.current ? PRACTICE_SETTINGS : settingsRef.current;
    const rt = Date.now() - trialStartTimeRef.current;
    const outcome = drawCard(deckId);
    const newBalance = balanceRef.current + outcome.net;

    const trialList = isPracticeRef.current ? practiceTrialsRef.current : trialsRef.current;
    const trialResult = {
      trialNumber: trialList.length + 1,
      deck: deckId,
      reward: outcome.reward,
      loss: outcome.loss,
      net: outcome.net,
      balanceAfter: newBalance,
      reactionTime: rt,
    };

    const newTrialList = [...trialList, trialResult];
    if (isPracticeRef.current) {
      setPracticeTrials(newTrialList);
    } else {
      setTrials(newTrialList);
    }
    setBalance(newBalance);
    balanceRef.current = newBalance;

    setLastOutcome({ deck: deckId, reward: outcome.reward, loss: outcome.loss, net: outcome.net });
    setGameState('feedback');

    const totalTrials = activeSettings.totalTrials;

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setLastOutcome(null);

      if (newTrialList.length >= totalTrials) {
        if (isPracticeRef.current) finishPractice();
        else finishTest();
        return;
      }

      if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
      itiTimerRef.current = setTimeout(() => {
        presentTrial();
      }, activeSettings.itiDuration);
    }, activeSettings.feedbackDuration);
  }, [canRespond, drawCard, presentTrial]);

  const resetRunState = (startingBalance) => {
    setBalance(startingBalance);
    balanceRef.current = startingBalance;
    setDeckPositions({ A: 0, B: 0, C: 0, D: 0 });
    deckPositionsRef.current = { A: 0, B: 0, C: 0, D: 0 };
    setLastOutcome(null);
    setCanRespond(false);
  };

  const startPractice = async () => {
    clearAllTimers();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    setIsPractice(true);
    await requestFullscreen();
    setPracticeTrials([]);
    resetRunState(PRACTICE_SETTINGS.startingBalance);
    setGameState('countdown');

    startCountdown(() => {
      setTimeout(() => presentTrial(), 400);
    });
  };

  const startTest = async () => {
    clearAllTimers();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    setIsPractice(false);
    await requestFullscreen();
    setTrials([]);
    resetRunState(settings.startingBalance);
    setGameState('countdown');

    startCountdown(() => {
      setTimeout(() => presentTrial(), 400);
    });
  };

  const finishPractice = () => {
    clearAllTimers();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    if (isFullscreen) exitFullscreen();
    setCanRespond(false);
    setGameState('practiceComplete');
  };

  const finishTest = () => {
    clearAllTimers();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    if (isFullscreen) exitFullscreen();
    setCanRespond(false);
    showOverlayMessage('feedback_test_complete', 1500);

    setTimeout(() => {
      setGameState('results');

      if (!isStandalone && onComplete) {
        const finalTrials = trialsRef.current;
        const deckCounts = { A: 0, B: 0, C: 0, D: 0 };
        finalTrials.forEach(t => { deckCounts[t.deck] = (deckCounts[t.deck] || 0) + 1; });
        const goodChoices = deckCounts.C + deckCounts.D;
        const badChoices = deckCounts.A + deckCounts.B;
        const netScore = goodChoices - badChoices;

        onComplete({
          trials: finalTrials,
          totalTrials: finalTrials.length,
          startingBalance: settings.startingBalance,
          finalBalance: balanceRef.current,
          deckCounts,
          goodChoices,
          badChoices,
          netScore,
          settingsUsed: settings,
        });
      }
    }, 1500);
  };

  const stopTest = () => {
    if (gameState === 'playing' || gameState === 'feedback') {
      if (isPractice) finishPractice();
      else finishTest();
    }
  };

  const resetTest = () => {
    clearAllTimers();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    if (isFullscreen) exitFullscreen();
    setGameState('welcome');
    setTrials([]);
    setPracticeTrials([]);
    resetRunState(settings.startingBalance);
    setIsPractice(false);
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
    };
  }, [clearAllTimers]);

  const calculatePracticeStats = () => {
    const total = practiceTrials.length;
    const deckCounts = { A: 0, B: 0, C: 0, D: 0 };
    practiceTrials.forEach(t => { deckCounts[t.deck] = (deckCounts[t.deck] || 0) + 1; });
    const goodChoices = deckCounts.C + deckCounts.D;
    const badChoices = deckCounts.A + deckCounts.B;
    const netScore = goodChoices - badChoices;
    const finalBalance = total > 0 ? practiceTrials[total - 1].balanceAfter : PRACTICE_SETTINGS.startingBalance;
    return { total, deckCounts, goodChoices, badChoices, netScore, finalBalance };
  };

  const activeSettings = isPractice ? PRACTICE_SETTINGS : settings;
  const currentTrials = isPractice ? practiceTrials : trials;

  // Render the four deck cards. `clickable` controls whether clicking triggers
  // a draw; `demoHighlight` optionally flashes one deck for the demo animation.
  const renderDecks = ({ clickable, demoHighlight = null }) => (
    <div className={styles.deckRow}>
      {DECK_IDS.map(deckId => {
        const isHighlighted = demoHighlight === deckId;
        const isChosen = lastOutcome && lastOutcome.deck === deckId;
        return (
          <button
            key={deckId}
            type="button"
            className={`${styles.deck} ${clickable ? styles.deckClickable : ''} ${isChosen ? styles.deckChosen : ''} ${isHighlighted ? styles.deckHighlighted : ''}`}
            onClick={() => clickable && handleDeckClick(deckId)}
            disabled={!clickable}
            aria-label={`${translate('deck_label')} ${deckId}`}
          >
            <div className={styles.cardBack}>
              <div className={styles.cardPattern} aria-hidden="true" />
            </div>
            <div className={styles.deckName}>{translate('deck_label')} {deckId}</div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.testContainer}>
        <TestHeader>
          {(gameState === 'playing' || gameState === 'feedback') && (
            <div className={styles.gameMetrics}>
              <div className={styles.trialIndicator}>
                {translate('trial_counter', { current: currentTrials.length, max: activeSettings.totalTrials })}
              </div>
              <div className={styles.balanceIndicator}>
                {translate('balance_label')}: <span className={styles.metricValue}>${balance}</span>
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
              <p>{translate('welcome_p3', { trials: settings.totalTrials })}</p>
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
                  <div className={styles.tutorialStep} key={n}>
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
                {demoStep === 0 && <p>{translate('demo_step1')}</p>}
                {demoStep === 1 && <p>{translate('demo_step2')}</p>}
                {demoStep === 2 && <p>{translate('demo_step3')}</p>}
                {demoStep === 3 && <p>{translate('demo_step4')}</p>}
                {demoStep === 4 && <p>{translate('demo_step5')}</p>}
                {demoStep >= 5 && <p>{translate('demo_step6')}</p>}
              </div>

              <div className={styles.demoContainer}>
                {renderDecks({
                  clickable: false,
                  demoHighlight: demoStep === 1 ? 'B' : demoStep === 3 ? 'C' : null,
                })}
                {demoStep === 2 && (
                  <div className={`${styles.demoOutcome} ${styles.outcomeLoss}`}>
                    <div className={styles.outcomeReward}>+$100</div>
                    <div className={styles.outcomeLossText}>-$1250</div>
                  </div>
                )}
                {demoStep === 4 && (
                  <div className={`${styles.demoOutcome} ${styles.outcomeWin}`}>
                    <div className={styles.outcomeReward}>+$50</div>
                  </div>
                )}
              </div>

              <div className={styles.buttonContainer}>
                <button
                  className={styles.primaryButton}
                  onClick={startPractice}
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

          {/* Practice Complete */}
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
                        <span>{translate('practice_total_trials')}:</span>
                        <span className={styles.statValue}>{stats.total}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_good_choices')}:</span>
                        <span className={styles.statValue}>{stats.goodChoices}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_bad_choices')}:</span>
                        <span className={styles.statValue}>{stats.badChoices}</span>
                      </div>
                      <div className={styles.statRow}>
                        <span>{translate('practice_final_balance')}:</span>
                        <span className={styles.statValue}>${stats.finalBalance}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className={styles.buttonContainer}>
                <button className={styles.primaryButton} onClick={startTest}>
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

          {/* Playing / Feedback */}
          {(gameState === 'playing' || gameState === 'feedback') && (
            <div className={styles.playingArea}>
              <div className={styles.balanceDisplay}>
                <div className={styles.balanceLabel}>{translate('balance_label')}</div>
                <div className={styles.balanceValue}>${balance}</div>
              </div>

              {renderDecks({ clickable: gameState === 'playing' })}

              <div className={styles.outcomeArea} aria-live="polite">
                {gameState === 'feedback' && lastOutcome && (
                  <div className={`${styles.outcomeBox} ${lastOutcome.loss > 0 ? styles.outcomeLoss : styles.outcomeWin}`}>
                    <div className={styles.outcomeReward}>
                      {translate('feedback_won')}: +${lastOutcome.reward}
                    </div>
                    {lastOutcome.loss > 0 && (
                      <div className={styles.outcomeLossText}>
                        {translate('feedback_lost')}: -${lastOutcome.loss}
                      </div>
                    )}
                    <div className={styles.outcomeNet}>
                      {translate('feedback_net')}: {lastOutcome.net >= 0 ? '+' : ''}${lastOutcome.net}
                    </div>
                  </div>
                )}
                {gameState === 'playing' && (
                  <div className={styles.playingPrompt}>{translate('choose_prompt')}</div>
                )}
              </div>

              <div className={styles.bottomInstructions}>
                <p>{translate('bottom_instruction')}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && (
            <IgtResults
              trials={trials}
              startingBalance={settings.startingBalance}
              finalBalance={balance}
              onRestart={resetTest}
              t={translate}
            />
          )}

          <MessageOverlay show={showMessage} message={message} type={messageType} />
        </div>

        {showSettings && (
          <IgtSettings
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
