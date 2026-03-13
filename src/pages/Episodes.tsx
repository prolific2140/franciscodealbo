import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { EpisodeQuiz } from '@/components/EpisodeQuiz';
import { SourceBadge } from '@/components/SourcesPanel';
import { useEpisodes, isRevealed } from '@/hooks/useEpisodes';
import { useEpisodeAnswers } from '@/hooks/useEpisodeAnswers';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Anchor, Ship, Trophy,
  Users, Coins, ArrowLeft, Zap, ChevronDown, ChevronUp, ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizEpisode } from '@/hooks/useEpisodes';

const ESTRECHO_IMG = 'https://blossom.ditto.pub/cda54d3532e1d9605099006f6c96821519ec5011e509017f88652cc93cca8e1e.jpeg';

const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'] as const;
const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const LETTERS = ['a', 'b', 'c', 'd'] as const;

function QuizSkeleton() {
  return (
    <Card className="border border-amber-900/20 shadow-xl overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-4/5" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      </div>
    </Card>
  );
}

function PastEpisodeCard({ episode }: { episode: QuizEpisode }) {
  const [open, setOpen] = useState(false);
  const { data: stats } = useEpisodeAnswers(episode.event.id, episode.answer);

  const correctIdx = LETTERS.indexOf(episode.answer);
  const correctLabel = OPTION_LABELS[correctIdx];

  const formattedDate = (() => {
    try {
      return new Date(`${episode.date}T12:00:00`).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return episode.date; }
  })();

  const totalSats = stats?.totalSats ?? 0;
  const winnerCount = stats?.winners.length ?? 0;

  return (
    <Card className="border border-emerald-900/30 overflow-hidden">
      {/* Luminous green top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <CardContent className="p-4 space-y-3">
        {/* Top row — always visible */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full text-left group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge className="font-cinzel text-[10px] bg-amber-900/20 text-amber-500 border-amber-800/30">
                  Ep. {episode.episode}
                </Badge>
                <span className="text-[10px] font-cinzel text-emerald-400 flex items-center gap-1">
                  <Trophy className="h-2.5 w-2.5" /> Resuelto
                </span>
              </div>
              <h3 className="font-cinzel text-sm font-bold text-amber-300 leading-snug group-hover:text-amber-200 transition-colors">
                {episode.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Anchor className="h-2.5 w-2.5" />{formattedDate}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {episode.source && <SourceBadge sourceKey={episode.source} />}
              <span className="text-muted-foreground/50 group-hover:text-amber-500 transition-colors">
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </div>
          </div>

          {/* Compact correct-answer pill — shown when collapsed */}
          {!open && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-emerald-900/15 px-2.5 py-1">
              <span className="font-cinzel font-bold text-[10px] text-emerald-400">{correctLabel}.</span>
              <span className="font-garamond text-[11px] text-emerald-200/80 truncate max-w-[240px]">
                {episode[OPTION_KEYS[correctIdx]]}
              </span>
            </div>
          )}
        </button>

        {/* Stats row — always visible */}
        <div className="flex items-center gap-4 border-t border-border/20 pt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> {stats?.total ?? 0} apuestas
          </span>
          <span className="flex items-center gap-1 text-xs text-amber-600/70">
            <Coins className="h-3 w-3" /> {totalSats.toLocaleString()} sats
          </span>
          {winnerCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-500">
              <Trophy className="h-3 w-3" /> {winnerCount} ganador{winnerCount !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {/* Expanded content */}
        {open && (
          <div className="space-y-3 pt-1 border-t border-border/15">

            {/* Narrative */}
            <div className="space-y-1.5">
              <p className="font-cinzel text-[10px] text-amber-600/70 flex items-center gap-1.5 uppercase tracking-widest">
                <ScrollText className="h-3 w-3" /> Narración
              </p>
              <p className="font-garamond text-sm text-foreground/80 leading-relaxed">
                {episode.narrative}
              </p>
            </div>

            {/* Options — read-only, correct answer highlighted */}
            <div className="space-y-1.5">
              {LETTERS.map((letter, i) => {
                const text = episode[OPTION_KEYS[i]];
                const isCorrect = letter === episode.answer;
                const optStats = stats?.options[letter];
                return (
                  <div
                    key={letter}
                    className={cn(
                      'relative flex items-center gap-2.5 rounded-md border px-3 py-2 overflow-hidden',
                      isCorrect
                        ? 'border-emerald-600/50 bg-emerald-900/20 text-emerald-200'
                        : 'border-border/25 bg-card/20 text-muted-foreground/50 opacity-60',
                    )}
                  >
                    {optStats && optStats.satPercent > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          width: `${optStats.satPercent}%`,
                          background: isCorrect
                            ? 'linear-gradient(90deg, hsl(142 50% 30% / 0.25), transparent)'
                            : 'linear-gradient(90deg, hsl(0 40% 30% / 0.15), transparent)',
                        }}
                      />
                    )}
                    <span className={cn(
                      'relative font-cinzel font-bold text-[11px] shrink-0 w-5 h-5 flex items-center justify-center rounded border',
                      isCorrect
                        ? 'border-emerald-500 text-emerald-300 bg-emerald-900/40'
                        : 'border-border/30 text-muted-foreground/40',
                    )}>
                      {OPTION_LABELS[i]}
                    </span>
                    <span className="relative font-garamond text-xs leading-snug flex-1">{text}</span>
                    {optStats && (
                      <span className="relative text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">
                        {optStats.count}v · {optStats.sats.toLocaleString()}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            <div className="rounded-md border border-emerald-800/30 bg-emerald-900/10 px-3 py-2.5">
              <p className="font-cinzel text-[10px] text-emerald-500 mb-1.5">Lo que realmente ocurrió</p>
              <p className="font-garamond text-sm text-emerald-200/80 leading-relaxed">
                {episode.answerExplanation}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Episodes() {
  useSeoMeta({
    title: 'Episodios — Vuelta al Mundo',
    description: 'Todos los episodios publicados de la primera circunnavegación del mundo. El episodio activo y el historial completo.',
  });

  const { data: episodes, isLoading, error } = useEpisodes();

  // Two states only: one active (unrevealed) + resolved history
  const active = episodes?.find(ep => !isRevealed(ep)) ?? null;
  const resolved = episodes?.filter(ep => isRevealed(ep)) ?? [];

  return (
    <div className="min-h-screen bg-ocean-deep">
      <SiteHeader />

      {/* ── HERO IMAGE ─────────────────────────── */}
      <div className="relative h-48 sm:h-64 overflow-hidden isolate">
        <img
          src={ESTRECHO_IMG}
          alt="Naos entrando al estrecho de Magallanes"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
        <div className="absolute inset-0 bg-ocean-deep/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-4 text-center">
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-amber-300 drop-shadow-xl mb-1">
            Bitácora de Episodios
          </h1>
          <p className="font-garamond text-sm text-white/60 drop-shadow">
            Todos los capítulos publicados de la primera circunnavegación del mundo
          </p>
        </div>
      </div>

      <main className="container max-w-3xl mx-auto px-4 py-8 pb-16">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-400 transition-colors mb-6 font-cinzel"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
        </Link>

        {/* Loading */}
        {isLoading && <QuizSkeleton />}

        {/* Error */}
        {error && !isLoading && (
          <Card className="border border-amber-900/20 border-dashed">
            <CardContent className="py-12 text-center">
              <Anchor className="h-10 w-10 text-amber-800 mx-auto mb-3" />
              <p className="font-cinzel text-sm text-muted-foreground">No se pudo conectar con los relays de Nostr.</p>
              <p className="text-xs text-muted-foreground mt-1">Comprueba tu conexión e inténtalo de nuevo.</p>
            </CardContent>
          </Card>
        )}

        {/* No episodes yet */}
        {!isLoading && !error && !active && resolved.length === 0 && (
          <Card className="border border-amber-900/20 border-dashed">
            <CardContent className="py-16 text-center">
              <Ship className="h-12 w-12 text-amber-800/50 mx-auto mb-4 animate-wave-drift" />
              <h3 className="font-cinzel text-base text-amber-400 mb-2">La flota aún no ha zarpado</h3>
              <p className="font-garamond text-sm text-muted-foreground max-w-sm mx-auto">
                Pronto Francisco de Albo publicará el primer episodio. Vuelve en unos días.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── ACTIVE EPISODE ── */}
        {active && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900/40" />
              <h2 className="font-cinzel text-xs text-amber-500 tracking-widest uppercase flex items-center gap-1.5">
                <Zap className="h-3 w-3 fill-amber-500" /> Apuestas abiertas
              </h2>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900/40" />
            </div>
            <EpisodeQuiz episode={active} />
          </div>
        )}

        {/* ── RESOLVED EPISODES ── */}
        {resolved.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-900/40" />
              <span className="font-cinzel text-[10px] text-emerald-600/70 tracking-widest uppercase flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Episodios resueltos
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-emerald-900/40" />
            </div>
            <div className="space-y-3">
              {resolved.map(ep => (
                <PastEpisodeCard key={ep.event.id} episode={ep} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-900/30 to-transparent mb-4" />
          <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer"
            className="font-garamond text-xs text-muted-foreground/40 hover:text-amber-500/60 transition-colors">
            Vibed with Shakespeare ✦
          </a>
        </div>
      </main>
    </div>
  );
}
