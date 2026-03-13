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
  /** Pre-built 'a' tag coordinate (37183:pubkey:d) to avoid an extra relay query */
  aTagCoordinate?: string,
) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vuelta-al-mundo', 'answers', episodeEventId],
    queryFn: async (): Promise<AnswerStats> => {
      if (!episodeEventId) return emptyStats();

      const signal = AbortSignal.timeout(8000);

      // Build the 'a' tag coordinate for addressable zap lookup.
      // Use the pre-built one if provided; otherwise fetch the episode event.
      let aTag: string | null = aTagCoordinate ?? null;
      if (!aTag) {
        const episodeEvents = await nostr.query(
          [{ kinds: [37183], ids: [episodeEventId], limit: 1 }],
          { signal }
        );
        const episodeEvent = episodeEvents[0];
        if (episodeEvent) {
          const dTag = episodeEvent.tags.find(([t]) => t === 'd')?.[1];
          aTag = `37183:${episodeEvent.pubkey}:${dTag ?? ''}`;
        }
      }

      // Fetch answer notes AND zap receipts in parallel.
      // Zaps on addressable events use '#a'; also check '#e' as fallback.
      const [answerEvents, ...zapBatches] = await Promise.all([
        nostr.query(
          [{ kinds: [1], '#e': [episodeEventId], '#t': ['vuelta-al-mundo'], limit: 500 }],
          { signal }
        ),
        aTag
          ? nostr.query([{ kinds: [9735], '#a': [aTag], limit: 500 }], { signal })
          : Promise.resolve([] as NostrEvent[]),
        nostr.query([{ kinds: [9735], '#e': [episodeEventId], limit: 500 }], { signal }),
      ]);

      // Deduplicate zap events by id
      const zapById = new Map<string, NostrEvent>();
      for (const batch of zapBatches) {
        for (const zap of batch) zapById.set(zap.id, zap);
      }
      const zapEvents = [...zapById.values()];

      const validLetters = new Set<string>(['a', 'b', 'c', 'd']);

      // ── Primary source: zap receipts ──────────────────────────────────────
      // Each zap receipt carries the signed zap request in its `description`
      // tag. That request includes a `t: answer:X` tag injected by the client.
      // We read the option from there so the answer is self-contained in the zap.

      interface ZapRecord {
        zapperPubkey: string;
        letter: 'a' | 'b' | 'c' | 'd' | null;
        sats: number;
      }

      const zapRecords: ZapRecord[] = [];

      // Keep only the most-recent zap per pubkey (one zap = one vote per person)
      const latestZapByPubkey = new Map<string, { letter: 'a' | 'b' | 'c' | 'd' | null; sats: number; createdAt: number }>();

      for (const zap of zapEvents) {
        const sats = extractSatsFromZap(zap);
        if (sats <= 0) continue;

        const descStr = zap.tags.find(([n]) => n === 'description')?.[1];
        if (!descStr) continue;

        let zapperPubkey: string | undefined;
        let letter: 'a' | 'b' | 'c' | 'd' | null = null;

        try {
          const zapReq = JSON.parse(descStr) as NostrEvent;
          zapperPubkey = zapReq.pubkey;

          // Read the answer tag from the zap request
          const answerTag = zapReq.tags?.find(([t, v]: string[]) => t === 't' && v?.startsWith('answer:'));
          const rawLetter = answerTag?.[1]?.replace('answer:', '');
          if (rawLetter && validLetters.has(rawLetter)) {
            letter = rawLetter as 'a' | 'b' | 'c' | 'd';
          }
        } catch { /* ignore malformed description */ }

        if (!zapperPubkey) continue;

        const existing = latestZapByPubkey.get(zapperPubkey);
        if (!existing || zap.created_at > existing.createdAt) {
          latestZapByPubkey.set(zapperPubkey, { letter, sats, createdAt: zap.created_at });
        }
      }

      for (const [pubkey, { letter, sats }] of latestZapByPubkey) {
        zapRecords.push({ zapperPubkey: pubkey, letter, sats });
      }

      // ── Fallback: kind-1 answer notes (for users without Lightning) ───────
      // These let us count participants who answered but didn't zap.
      const answers = answerEvents.map(parseAnswer);

      // Build pubkey→letter from kind-1 notes (first note wins)
      const pubkeyToLetterFromNotes = new Map<string, 'a' | 'b' | 'c' | 'd'>();
      for (const a of answers) {
        if (a.answerLetter && !pubkeyToLetterFromNotes.has(a.event.pubkey)) {
          pubkeyToLetterFromNotes.set(a.event.pubkey, a.answerLetter);
        }
      }

      // ── Merge: zap records are authoritative; notes fill gaps ─────────────
      // Build the final pubkey→{letter, sats} map
      const participantMap = new Map<string, { letter: 'a' | 'b' | 'c' | 'd' | null; sats: number }>();

      // First: everyone who zapped
      for (const rec of zapRecords) {
        participantMap.set(rec.zapperPubkey, { letter: rec.letter, sats: rec.sats });
      }

      // Then: anyone who answered via kind-1 but did NOT zap
      for (const [pubkey, letter] of pubkeyToLetterFromNotes) {
        if (!participantMap.has(pubkey)) {
          participantMap.set(pubkey, { letter, sats: 0 });
        } else if (participantMap.get(pubkey)!.letter === null) {
          // Zapped but without answer tag — fill letter from kind-1 note
          participantMap.get(pubkey)!.letter = letter;
        }
      }

      // ── Aggregate by option ───────────────────────────────────────────────
      const countByOption: Record<'a' | 'b' | 'c' | 'd', number> = { a: 0, b: 0, c: 0, d: 0 };
      const satsByOption: Record<'a' | 'b' | 'c' | 'd', number> = { a: 0, b: 0, c: 0, d: 0 };
      let totalSats = 0;

      for (const { letter, sats } of participantMap.values()) {
        totalSats += sats;
        if (letter) {
          countByOption[letter]++;
          satsByOption[letter] += sats;
        }
      }

      const total = participantMap.size;
      const pct = (n: number, t: number) => t > 0 ? Math.round((n / t) * 100) : 0;

      const options: Record<'a' | 'b' | 'c' | 'd', OptionStats> = {
        a: { count: countByOption.a, sats: satsByOption.a, percent: pct(countByOption.a, total), satPercent: pct(satsByOption.a, totalSats) },
        b: { count: countByOption.b, sats: satsByOption.b, percent: pct(countByOption.b, total), satPercent: pct(satsByOption.b, totalSats) },
        c: { count: countByOption.c, sats: satsByOption.c, percent: pct(countByOption.c, total), satPercent: pct(satsByOption.c, totalSats) },
        d: { count: countByOption.d, sats: satsByOption.d, percent: pct(countByOption.d, total), satPercent: pct(satsByOption.d, totalSats) },
      };

      const winnerSats = correctAnswer ? satsByOption[correctAnswer] : 0;
      const winners = correctAnswer
        ? [...participantMap.entries()].filter(([, v]) => v.letter === correctAnswer).map(([pk]) => pk)
        : [];

      return { total, totalSats, winnerSats, options, answers, winners };
    },
    enabled: !!episodeEventId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useUserAnswer(
  episodeEventId: string | undefined,
  userPubkey: string | undefined,
  aTagCoordinate?: string,
) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vuelta-al-mundo', 'user-answer', episodeEventId, userPubkey],
    queryFn: async (): Promise<EpisodeAnswer | null> => {
      if (!episodeEventId || !userPubkey) return null;

      const signal = AbortSignal.timeout(5000);
      const validLetters = new Set<string>(['a', 'b', 'c', 'd']);

      // Check zap receipts first — the user may have zapped without publishing a kind 1
      const zapFilters: Parameters<typeof nostr.query>[0] = aTagCoordinate
        ? [{ kinds: [9735], '#a': [aTagCoordinate], '#P': [userPubkey], limit: 10 },
           { kinds: [9735], '#e': [episodeEventId], '#P': [userPubkey], limit: 10 }]
        : [{ kinds: [9735], '#e': [episodeEventId], '#P': [userPubkey], limit: 10 }];

      const [noteEvents, ...zapBatches] = await Promise.all([
        nostr.query(
          [{ kinds: [1], authors: [userPubkey], '#e': [episodeEventId], '#t': ['vuelta-al-mundo'], limit: 1 }],
          { signal }
        ),
        ...zapFilters.map(f => nostr.query(f, { signal })),
      ]);

      // Deduplicate zaps
      const zapById = new Map<string, NostrEvent>();
      for (const batch of zapBatches) for (const z of batch) zapById.set(z.id, z);
      const userZaps = [...zapById.values()];

      // Try to extract answer from zap description
      for (const zap of userZaps) {
        const descStr = zap.tags.find(([n]) => n === 'description')?.[1];
        if (!descStr) continue;
        try {
          const zapReq = JSON.parse(descStr) as NostrEvent;
          const answerTag = zapReq.tags?.find(([t, v]: string[]) => t === 't' && v?.startsWith('answer:'));
          const rawLetter = answerTag?.[1]?.replace('answer:', '');
          if (rawLetter && validLetters.has(rawLetter)) {
            return {
              event: zap,
              answerLetter: rawLetter as 'a' | 'b' | 'c' | 'd',
              comment: zapReq.content ?? '',
            };
          }
        } catch { /* ignore */ }
      }

      // Fallback: kind-1 note
      if (!noteEvents.length) return null;
      return parseAnswer(noteEvents[0]);
    },
    enabled: !!episodeEventId && !!userPubkey,
    staleTime: 30000,
  });
}
