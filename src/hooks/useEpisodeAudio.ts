import { useState, useEffect, useCallback, useRef } from 'react';
import type { QuizEpisode } from '@/hooks/useEpisodes';

function buildNarrationText(episode: QuizEpisode): string {
  return [
    episode.title + '.',
    episode.narrative,
    '¿Qué ocurrió? Las cuatro opciones son:',
    `Opción A: ${episode.optionA}.`,
    `Opción B: ${episode.optionB}.`,
    `Opción C: ${episode.optionC}.`,
    `Opción D: ${episode.optionD}.`,
    'Apuesta tus sats en La Vuelta al Mundo.',
  ].join(' ');
}

function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function useEpisodeAudio(episode: QuizEpisode) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Detect support after mount (avoids SSR/SW issues)
  useEffect(() => {
    const supported = isSpeechSupported();
    console.log('[Audio] speechSynthesis supported:', supported, typeof window, 'speechSynthesis' in window);
    setIsSupported(supported);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isSpeechSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  // Keep isPlaying in sync if browser stops speech externally
  useEffect(() => {
    if (!isPlaying || !isSpeechSupported()) return;
    const id = setInterval(() => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        setIsPlaying(false);
      }
    }, 500);
    return () => clearInterval(id);
  }, [isPlaying]);

  const toggle = useCallback(() => {
    console.log('[Audio] toggle called, isSpeechSupported:', isSpeechSupported());
    if (!isSpeechSupported()) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();

    const text = buildNarrationText(episode);
    console.log('[Audio] text length:', text.length);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => { console.log('[Audio] started'); setIsPlaying(true); };
    utterance.onend = () => { console.log('[Audio] ended'); setIsPlaying(false); };
    utterance.onerror = (e) => { console.error('[Audio] error:', e.error); setIsPlaying(false); };

    utteranceRef.current = utterance;

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('[Audio] voices:', voices.length);
      const spanishVoice = voices.find(v => v.lang.startsWith('es'));
      if (spanishVoice) utterance.voice = spanishVoice;
      window.speechSynthesis.speak(utterance);
      console.log('[Audio] speaking:', window.speechSynthesis.speaking, 'pending:', window.speechSynthesis.pending);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    }

    setIsPlaying(true);
  }, [isPlaying, episode]);

  return { isPlaying, toggle, isSupported };
}
