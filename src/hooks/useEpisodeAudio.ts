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

export function useEpisodeAudio(episode: QuizEpisode) {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Keep isPlaying in sync if browser stops speech externally
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        setIsPlaying(false);
      }
    }, 500);
    return () => clearInterval(id);
  }, [isPlaying]);

  const toggle = useCallback(() => {
    if (!('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(buildNarrationText(episode));
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Prefer a Spanish voice if available
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(
      (v) => v.lang.startsWith('es') && !v.name.toLowerCase().includes('compact')
    );
    if (spanishVoice) utterance.voice = spanishVoice;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [isPlaying, episode]);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return { isPlaying, toggle, isSupported };
}
