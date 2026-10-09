import React, { useState, useEffect } from 'react';

/**
 * Smooth typewriter animation component for news headlines and paragraphs.
 * Types text character-by-character at a comfortable, readable pace (~32ms per character).
 */
export default function FastTypewriter({
  text = '',
  speedMs = 32,
  maxDuration = 6500,
  onComplete,
  className = '',
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);

    const len = text.length;
    // Comfortable tick interval (~32ms per character)
    const tickIntervalMs = Math.max(16, speedMs);
    // Cap total typing time so extremely long paragraphs finish within maxDuration
    const maxTicks = Math.max(1, Math.floor(maxDuration / tickIntervalMs));
    const charsPerTick = Math.max(1, Math.ceil(len / maxTicks));
    let charIndex = 0;

    const timer = setInterval(() => {
      charIndex += charsPerTick;
      if (charIndex >= len) {
        setDisplayedText(text);
        setIsTyping(false);
        clearInterval(timer);
        if (onComplete) onComplete();
      } else {
        setDisplayedText(text.slice(0, charIndex));
      }
    }, tickIntervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [text, speedMs, maxDuration]);

  return (
    <span className={`fast-typewriter-wrapper ${className}`}>
      {displayedText}
      {isTyping && <span className="typing-caret" aria-hidden="true" />}
    </span>
  );
}
