// hooks/useTestEngine.js
import { useState, useRef, useCallback, useEffect } from 'react';
import { useFullscreen } from './useFullscreen';

/**
 * Shared engine hook for all cognitive test components.
 *
 * Provides: translation fallback, fullscreen management, countdown,
 * message overlay, settings toggle, and timer cleanup registry.
 *
 * Usage:
 *   const engine = useTestEngine({ t });
 *   // engine.translate('key')
 *   // engine.startCountdown(() => setGameState('playing'))
 *   // engine.showOverlayMessage('correct', 1000, 'success')
 *   // engine.requestFullscreen()
 *   // engine.addTimer(setTimeout(...))
 */
export default function useTestEngine({ t }) {
  // --- Translation fallback ---
  const translate = useCallback(
    t || ((key, params) => {
      if (params && typeof key === 'string' && key.includes('{{')) {
        let result = key;
        Object.keys(params).forEach((param) => {
          result = result.replace(`{{${param}}}`, params[param]);
        });
        return result;
      }
      return key;
    }),
    [t]
  );

  // --- Fullscreen ---
  const gameAreaRef = useRef(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameAreaRef);

  const requestFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      try {
        await enterFullscreen();
      } catch (err) {
        console.warn('Could not enter fullscreen mode:', err);
      }
    }
  }, [isFullscreen, enterFullscreen]);

  // --- Timer registry ---
  const timersRef = useRef(new Set());

  const addTimer = useCallback((timerId) => {
    timersRef.current.add(timerId);
    return timerId;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => {
      clearTimeout(id);
      clearInterval(id);
    });
    timersRef.current.clear();
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => {
        clearTimeout(id);
        clearInterval(id);
      });
    };
  }, []);

  // --- Countdown (3-2-1) ---
  const [countdown, setCountdown] = useState(3);

  const startCountdown = useCallback((onComplete) => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      timersRef.current.delete(interval);
      timersRef.current.delete(timeout);
      onComplete();
    }, 3000);
    timersRef.current.add(interval);
    timersRef.current.add(timeout);
  }, []);

  // --- Message overlay ---
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const showOverlayMessage = useCallback((textOrKey, duration = 1500, type = 'info') => {
    const text = typeof textOrKey === 'string' ? translate(textOrKey) : textOrKey;
    setMessage(text);
    setMessageType(type);
    setShowMessage(true);
    const id = setTimeout(() => {
      setShowMessage(false);
      timersRef.current.delete(id);
    }, duration);
    timersRef.current.add(id);
  }, [translate]);

  // --- Settings toggle ---
  const [showSettings, setShowSettings] = useState(false);

  return {
    // Translation
    translate,
    // Fullscreen
    gameAreaRef,
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
    // Timer management
    addTimer,
    clearAllTimers,
    // Countdown
    countdown,
    startCountdown,
    // Message overlay
    showMessage,
    message,
    messageType,
    showOverlayMessage,
    // Settings
    showSettings,
    setShowSettings,
  };
}
