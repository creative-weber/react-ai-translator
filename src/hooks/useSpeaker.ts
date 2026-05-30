import { useState, useCallback, useRef } from 'react';

export type SpeakerState = 'idle' | 'speaking';

// Map app language codes → BCP 47 locale tags for SpeechSynthesis
const LANG_TO_LOCALE: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  it: 'it-IT',
  pt: 'pt-PT',
  nl: 'nl-NL',
  ru: 'ru-RU',
  zh: 'zh-CN',
  ar: 'ar-SA',
};

const isSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useSpeaker() {
  const [state, setState] = useState<SpeakerState>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, lang: string) => {
    if (!isSupported) return;

    // Cancel any in-flight speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_TO_LOCALE[lang] ?? lang;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setState('speaking');
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');

    utteranceRef.current = utterance;
    setState('speaking');
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setState('idle');
  }, []);

  const toggle = useCallback(
    (text: string, lang: string) => {
      if (state === 'speaking') {
        stop();
      } else {
        speak(text, lang);
      }
    },
    [state, speak, stop]
  );

  return { state, isSupported, toggle };
}
