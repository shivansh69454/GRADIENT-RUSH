'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Web Speech API recognition, locked to Indian English so "sau" and rupee
 * amounts transcribe sensibly. Zero dependencies, works offline on Chrome.
 */
export const useSpeechRecognition = (
  onFinal?: (transcript: string) => void
): UseSpeechRecognitionResult => {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalCallbackRef = useRef(onFinal);
  finalCallbackRef.current = onFinal;

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;

    setSupported(true);
    const recognition = new Ctor();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      setInterim(interimText);
      if (finalText) {
        setTranscript(finalText);
        setInterim('');
        finalCallbackRef.current?.(finalText);
      }
    };

    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone access was blocked. Allow it in your browser settings.',
        'no-speech': 'Did not catch that. Try again a little louder.',
        'audio-capture': 'No microphone found.',
        network: 'Speech recognition needs a network connection.',
      };
      setError(messages[event.error] ?? 'Could not hear you. Try again.');
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setTranscript('');
    setInterim('');
    setError(null);
    try {
      recognitionRef.current.start();
    } catch {
      /* start() throws if already running — safe to ignore */
    }
  }, [listening]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterim('');
    setError(null);
  }, []);

  return { supported, listening, transcript, interim, error, start, stop, reset };
};

interface UseSpeechSynthesisResult {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

/** Text-to-speech for the mentor's replies. */
export const useSpeechSynthesis = (): UseSpeechSynthesisResult => {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Strip markdown emphasis so the voice does not read asterisks aloud.
    const clean = text
      .replace(/\*\*/g, '')
      .replace(/[*_`#]/g, '')
      .replace(/₹/g, ' rupees ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'en-IN';
    utterance.rate = 1.02;
    utterance.pitch = 1;

    const indianVoice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang === 'en-IN' || v.name.includes('India'));
    if (indianVoice) utterance.voice = indianVoice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { supported, speaking, speak, stop };
};
