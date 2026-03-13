import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export interface EpisodeAnswer {
  event: NostrEvent;
  answerLetter: 'a' | 'b' | 'c' | 'd' | null;
  comment: string;
}

function parseAnswer(event: NostrEvent): EpisodeAnswer {
  const answerTag = event.tags.find(([t, v]) => t === 't' && v?.startsWith('answer:'));
  const rawLetter = answerTag?.[1]?.replace('answer:', '');
  const validLetters: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
  const answerLetter = (rawLetter && validLetters.includes(rawLetter as 'a' | 'b' | 'c' | 'd'))
    ? rawLetter as 'a' | 'b' | 'c' | 'd'
    : null;

  return {
    event,
    answerLetter,
    comment: event.content,
  };
}

export interface AnswerStats {
  total: number;
  countA: number;
  countB: number;
  countC: number;
  countD: number;
  percentA: number;
  percentB: number;
  percentC: number;
  percentD: number;
  answers: EpisodeAnswer[];
}

export function useEpisodeAnswers(episodeEventId: string | undefined, aTag: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vuelta-al-mundo', 'answers', episodeEventId],
    queryFn: async (): Promise<AnswerStats> => {
      if (!episodeEventId) return emptyStats();

      const signal = AbortSignal.timeout(8000);
      const events = await nostr.query(
        [{
          kinds: [1],
          '#e': [episodeEventId],
          '#t': ['vuelta-al-mundo'],
          limit: 500,
        }],
        { signal }
      );

      const answers = events.map(parseAnswer);
      const total = answers.length;

      const countA = answers.filter(a => a.answerLetter === 'a').length;
      const countB = answers.filter(a => a.answerLetter === 'b').length;
      const countC = answers.filter(a => a.answerLetter === 'c').length;
      const countD = answers.filter(a => a.answerLetter === 'd').length;

      const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

      return {
        total,
        countA,
        countB,
        countC,
        countD,
        percentA: pct(countA),
        percentB: pct(countB),
        percentC: pct(countC),
        percentD: pct(countD),
        answers,
      };
    },
    enabled: !!episodeEventId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

function emptyStats(): AnswerStats {
  return { total: 0, countA: 0, countB: 0, countC: 0, countD: 0, percentA: 0, percentB: 0, percentC: 0, percentD: 0, answers: [] };
}

export function useUserAnswer(episodeEventId: string | undefined, userPubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vuelta-al-mundo', 'user-answer', episodeEventId, userPubkey],
    queryFn: async (): Promise<EpisodeAnswer | null> => {
      if (!episodeEventId || !userPubkey) return null;

      const signal = AbortSignal.timeout(5000);
      const events = await nostr.query(
        [{
          kinds: [1],
          authors: [userPubkey],
          '#e': [episodeEventId],
          '#t': ['vuelta-al-mundo'],
          limit: 1,
        }],
        { signal }
      );

      if (!events.length) return null;
      return parseAnswer(events[0]);
    },
    enabled: !!episodeEventId && !!userPubkey,
    staleTime: 30000,
  });
}
