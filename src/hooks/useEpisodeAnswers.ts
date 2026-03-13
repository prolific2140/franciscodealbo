import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip57 } from 'nostr-tools';

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

  return { event, answerLetter, comment: event.content };
}

function extractSatsFromZap(zap: NostrEvent): number {
  // Method 1: amount tag
  const amountTag = zap.tags.find(([n]) => n === 'amount')?.[1];
  if (amountTag) return Math.floor(parseInt(amountTag) / 1000);

  // Method 2: bolt11 invoice
  const bolt11 = zap.tags.find(([n]) => n === 'bolt11')?.[1];
  if (bolt11) {
    try { return nip57.getSatoshisAmountFromBolt11(bolt11); } catch { /* ignore */ }
  }

  // Method 3: description JSON
  const desc = zap.tags.find(([n]) => n === 'description')?.[1];
  if (desc) {
    try {
      const req = JSON.parse(desc);
      const ms = req.tags?.find(([n]: string[]) => n === 'amount')?.[1];
      if (ms) return Math.floor(parseInt(ms) / 1000);
    } catch { /* ignore */ }
  }

  return 0;
}

export interface OptionStats {
  count: number;
  sats: number;
  percent: number;
  satPercent: number;
}

export interface AnswerStats {
  total: number;
  totalSats: number;
  winnerSats: number; // sats bet on the correct option
  options: Record<'a' | 'b' | 'c' | 'd', OptionStats>;
  answers: EpisodeAnswer[];
  /** pubkeys that answered correctly */
  winners: string[];
}

function emptyStats(): AnswerStats {
  const opt = (): OptionStats => ({ count: 0, sats: 0, percent: 0, satPercent: 0 });
  return {
    total: 0, totalSats: 0, winnerSats: 0,
    options: { a: opt(), b: opt(), c: opt(), d: opt() },
    answers: [],
    winners: [],
  };
}

export function useEpisodeAnswers(
  episodeEventId: string | undefined,
  correctAnswer?: 'a' | 'b' | 'c' | 'd',
) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vuelta-al-mundo', 'answers', episodeEventId],
    queryFn: async (): Promise<AnswerStats> => {
      if (!episodeEventId) return emptyStats();

      const signal = AbortSignal.timeout(8000);

      // We need the episode event to build the 'a' tag for addressable zap lookup
      const episodeEvents = await nostr.query(
        [{ kinds: [37183], ids: [episodeEventId], limit: 1 }],
        { signal }
      );
      const episodeEvent = episodeEvents[0];
      const dTag = episodeEvent?.tags.find(([t]) => t === 'd')?.[1];
      const aTag = episodeEvent ? `37183:${episodeEvent.pubkey}:${dTag ?? ''}` : null;

      // Fetch answer notes AND zap receipts in parallel
      // Zaps on addressable events use '#a'; also check '#e' as fallback
      const zapFilters = aTag
        ? [{ kinds: [9735], '#a': [aTag], limit: 500 }, { kinds: [9735], '#e': [episodeEventId], limit: 500 }]
        : [{ kinds: [9735], '#e': [episodeEventId], limit: 500 }];

      const [answerEvents, ...zapBatches] = await Promise.all([
        nostr.query(
          [{ kinds: [1], '#e': [episodeEventId], '#t': ['vuelta-al-mundo'], limit: 500 }],
          { signal }
        ),
        ...zapFilters.map(f => nostr.query([f], { signal })),
      ]);

      // Deduplicate zap events by id
      const zapById = new Map<string, NostrEvent>();
      for (const batch of zapBatches) {
        for (const zap of batch) zapById.set(zap.id, zap);
      }
      const zapEvents = [...zapById.values()];

      const answers = answerEvents.map(parseAnswer);
      const total = answers.length;

      // Map each pubkey to their chosen letter (first answer wins)
      const pubkeyToLetter = new Map<string, 'a' | 'b' | 'c' | 'd'>();
      for (const a of answers) {
        if (a.answerLetter && !pubkeyToLetter.has(a.event.pubkey)) {
          pubkeyToLetter.set(a.event.pubkey, a.answerLetter);
        }
      }

      // Aggregate sats per option
      const satsByOption: Record<'a' | 'b' | 'c' | 'd', number> = { a: 0, b: 0, c: 0, d: 0 };
      let totalSats = 0;

      for (const zap of zapEvents) {
        const sats = extractSatsFromZap(zap);
        if (sats <= 0) continue;
        totalSats += sats;

        // Find zapper pubkey from the description field
        const descStr = zap.tags.find(([n]) => n === 'description')?.[1];
        if (descStr) {
          try {
            const zapReq = JSON.parse(descStr) as NostrEvent;
            const zapperPubkey = zapReq.pubkey;
            const letter = pubkeyToLetter.get(zapperPubkey);
            if (letter) {
              satsByOption[letter] += sats;
            }
          } catch { /* ignore */ }
        }
      }

      const countByOption = { a: 0, b: 0, c: 0, d: 0 } as Record<'a' | 'b' | 'c' | 'd', number>;
      for (const [, letter] of pubkeyToLetter) countByOption[letter]++;

      const pct = (n: number, t: number) => t > 0 ? Math.round((n / t) * 100) : 0;

      const options: Record<'a' | 'b' | 'c' | 'd', OptionStats> = {
        a: { count: countByOption.a, sats: satsByOption.a, percent: pct(countByOption.a, total), satPercent: pct(satsByOption.a, totalSats) },
        b: { count: countByOption.b, sats: satsByOption.b, percent: pct(countByOption.b, total), satPercent: pct(satsByOption.b, totalSats) },
        c: { count: countByOption.c, sats: satsByOption.c, percent: pct(countByOption.c, total), satPercent: pct(satsByOption.c, totalSats) },
        d: { count: countByOption.d, sats: satsByOption.d, percent: pct(countByOption.d, total), satPercent: pct(satsByOption.d, totalSats) },
      };

      const winnerSats = correctAnswer ? satsByOption[correctAnswer] : 0;
      const winners = correctAnswer
        ? [...pubkeyToLetter.entries()].filter(([, l]) => l === correctAnswer).map(([pk]) => pk)
        : [];

      return { total, totalSats, winnerSats, options, answers, winners };
    },
    enabled: !!episodeEventId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useUserAnswer(episodeEventId: string | undefined, userPubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vuelta-al-mundo', 'user-answer', episodeEventId, userPubkey],
    queryFn: async (): Promise<EpisodeAnswer | null> => {
      if (!episodeEventId || !userPubkey) return null;

      const signal = AbortSignal.timeout(5000);
      const events = await nostr.query(
        [{ kinds: [1], authors: [userPubkey], '#e': [episodeEventId], '#t': ['vuelta-al-mundo'], limit: 1 }],
        { signal }
      );

      if (!events.length) return null;
      return parseAnswer(events[0]);
    },
    enabled: !!episodeEventId && !!userPubkey,
    staleTime: 30000,
  });
}
