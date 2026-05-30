import { useState, useRef, useCallback } from 'react';

export type VoiceInputState = 'idle' | 'listening' | 'error';

// Map app language codes → BCP 47 locale tags for SpeechRecognition
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

interface UseVoiceInputOptions {
  /** App language code (e.g. "en", "fr"). Defaults to "en". */
  lang?: string;
  /** Called with the final transcript when speech recognition ends. */
  onTranscript: (text: string) => void;
}

// Minimal local type declarations so we don't depend on lib="DOM" globals
interface ISpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

type WindowWithSpeech = Window & {
  SpeechRecognition?: ISpeechRecognitionConstructor;
  webkitSpeechRecognition?: ISpeechRecognitionConstructor;
};

const SpeechRecognitionAPI: ISpeechRecognitionConstructor | null =
  typeof window !== 'undefined'
    ? ((window as WindowWithSpeech).SpeechRecognition ??
        (window as WindowWithSpeech).webkitSpeechRecognition ??
        null)
    : null;

export function useVoiceInput({ lang = 'en', onTranscript }: UseVoiceInputOptions) {
  const [state, setState] = useState<VoiceInputState>('idle');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isSupported = SpeechRecognitionAPI !== null;

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = LANG_TO_LOCALE[lang] ?? lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setState('listening');

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (transcript) onTranscript(transcript);
      setState('idle');
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      // "no-speech" is benign — just reset to idle
      if (event.error === 'no-speech' || event.error === 'aborted') {
        setState('idle');
      } else {
        setState('error');
        // Auto-clear the error state after 2 s
        setTimeout(() => setState('idle'), 2000);
      }
    };

    recognition.onend = () => {
      setState(prev => (prev === 'listening' ? 'idle' : prev));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState('idle');
  }, []);

  const toggle = useCallback(() => {
    if (state === 'listening') {
      stop();
    } else {
      start();
    }
  }, [state, start, stop]);

  return { state, isSupported, toggle };
}
