import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export interface QuizEpisode {
  event: NostrEvent;
  d: string;
  title: string;
  episode: number;
  date: string;
  narrative: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: 'a' | 'b' | 'c' | 'd';
  answerExplanation: string;
  zapAmount: number;
  image?: string;
}

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([t]) => t === name)?.[1];
}

function parseEpisode(event: NostrEvent): QuizEpisode | null {
  const d = getTag(event, 'd');
  const title = getTag(event, 'title');
  const episodeStr = getTag(event, 'episode');
  const date = getTag(event, 'date');
  const optionA = getTag(event, 'option_a');
  const optionB = getTag(event, 'option_b');
  const optionC = getTag(event, 'option_c');
  const optionD = getTag(event, 'option_d');
  const answer = getTag(event, 'answer') as 'a' | 'b' | 'c' | 'd' | undefined;
  const answerExplanation = getTag(event, 'answer_explanation');

  if (!d || !title || !episodeStr || !date || !optionA || !optionB || !optionC || !optionD || !answer || !answerExplanation) {
    return null;
  }

  const validAnswers: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
  if (!validAnswers.includes(answer)) return null;

  return {
    event,
    d,
    title,
    episode: parseInt(episodeStr) || 0,
    date,
    narrative: event.content,
    optionA,
    optionB,
    optionC,
    optionD,
    answer,
    answerExplanation,
    zapAmount: parseInt(getTag(event, 'zap_amount') || '21') || 21,
    image: getTag(event, 'image'),
  };
}

// Francisco de Albo's Nostr pubkey — only episodes published by him are shown
// This prevents anyone from injecting unauthorized episodes
export const NARRATOR_PUBKEY = 'a312db7c832f667c45ac4601c9efed4eb35dd421004cd6797ed8d28c13f62353';

export function useEpisodes() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vuelta-al-mundo', 'episodes'],
    queryFn: async (c) => {
      const signal = AbortSignal.timeout(8000);
      // Security: filter by narrator's pubkey so only authorized episodes appear
      const events = await nostr.query(
        [{ kinds: [37183], authors: [NARRATOR_PUBKEY], '#t': ['vuelta-al-mundo'], limit: 50 }],
        { signal }
      );

      const episodes = events
        .map(parseEpisode)
        .filter((e): e is QuizEpisode => e !== null)
        .sort((a, b) => b.episode - a.episode);

      return episodes;
    },
    staleTime: 60000,
  });
}

export function useEpisodeByD(authorPubkey: string, dTag: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vuelta-al-mundo', 'episode', authorPubkey, dTag],
    queryFn: async () => {
      const signal = AbortSignal.timeout(8000);
      const events = await nostr.query(
        [{
          kinds: [37183],
          authors: [authorPubkey],
          '#d': [dTag],
          limit: 1,
        }],
        { signal }
      );

      if (!events.length) return null;
      return parseEpisode(events[0]);
    },
    enabled: !!authorPubkey && !!dTag,
    staleTime: 60000,
  });
}
