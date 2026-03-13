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
  Anchor, Ship, Scroll, Trophy, Clock,
  Users, Coins, ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizEpisode } from '@/hooks/useEpisodes';

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
  const revealed = isRevealed(episode);
  const { data: stats } = useEpisodeAnswers(
    episode.event.id,
    revealed ? episode.answer : undefined,
  );

  const correctIdx = LETTERS.indexOf(episode.answer);
  const correctText = episode[OPTION_KEYS[correctIdx]];
  const correctLabel = OPTION_LABELS[correctIdx];

  const formattedDate = (() => {
    try {
      return new Date(`${episode.date}T12:00:00`).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return episode.date; }
  })();

  const revealDate = (() => {
    if (!episode.revealAt) return null;
    try {
      return new Date(episode.revealAt * 1000).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return null; }
  })();

  return (
    <Card className={cn(
      'border overflow-hidden',
      revealed ? 'border-emerald-900/30' : 'border-amber-900/20',
    )}>
      <div className={cn('h-px', revealed
        ? 'bg-gradient-to-r from-transparent via-emerald-600/40 to-transparent'
        : 'bg-gradient-to-r from-transparent via-amber-800/30 to-transparent'
      )} />
      <CardContent className="p-4 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="font-cinzel text-[10px] bg-amber-900/20 text-amber-500 border-amber-800/30">
                Ep. {episode.episode}
              </Badge>
              {revealed
                ? <span className="text-[10px] font-cinzel text-emerald-500 flex items-center gap-1"><Trophy className="h-2.5 w-2.5" /> Resuelto</span>
                : <span className="text-[10px] font-cinzel text-amber-600 flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Pendiente</span>}
            </div>
            <h3 className="font-cinzel text-sm font-bold text-amber-300 leading-snug">{episode.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Anchor className="h-2.5 w-2.5" />{formattedDate}</p>
          </div>
          {episode.source && <SourceBadge sourceKey={episode.source} />}
        </div>

        {/* Correct answer (only shown when revealed) */}
        {revealed && (
          <div className="rounded-md border border-emerald-800/40 bg-emerald-900/15 px-3 py-2">
            <p className="font-cinzel text-[10px] text-emerald-500 mb-1">Respuesta correcta</p>
            <p className="font-garamond text-sm text-emerald-200">
              <span className="font-bold">{correctLabel}.</span> {correctText}
            </p>
          </div>
        )}

        {/* Pending reveal */}
        {!revealed && revealDate && (
          <div className="rounded-md border border-amber-900/25 bg-amber-900/10 px-3 py-2">
            <p className="font-garamond text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-amber-600" />
              Respuesta el {revealDate}
            </p>
          </div>
        )}

        {/* Stats row */}
        {stats && (
          <div className="flex items-center gap-4 pt-1 border-t border-border/20">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {stats.total} apuestas
            </span>
            <span className="flex items-center gap-1 text-xs text-amber-600/70">
              <Coins className="h-3 w-3" /> {stats.totalSats.toLocaleString()} sats
            </span>
            {revealed && stats.winners.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <Trophy className="h-3 w-3" /> {stats.winners.length} ganador{stats.winners.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistorySkeletons() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Card key={i} className="border border-amber-900/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="flex gap-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Episodes() {
  useSeoMeta({
    title: 'Episodios — Vuelta al Mundo',
    description: 'Todos los episodios publicados de la primera circunnavegación del mundo. El episodio activo y el historial completo.',
  });

  const { data: episodes, isLoading, error } = useEpisodes();
  const active = episodes?.[0] ?? null;
  const past = episodes ? episodes.slice(1) : [];

  return (
    <div className="min-h-screen bg-ocean-deep">
      <SiteHeader />

      <main className="container max-w-3xl mx-auto px-4 py-8 pb-16">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-400 transition-colors mb-6 font-cinzel"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-2xl font-bold text-amber-300 mb-2">Bitácora de Episodios</h1>
          <p className="font-garamond text-sm text-muted-foreground">
            Todos los capítulos publicados de la primera circunnavegación del mundo
          </p>
        </div>

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
        {!isLoading && !error && !active && (
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

        {/* Active episode */}
        {active && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900/40" />
              <h2 className="font-cinzel text-xs text-amber-600/70 tracking-widest uppercase flex items-center gap-1.5">
                <Scroll className="h-3 w-3" /> Episodio en curso
              </h2>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900/40" />
            </div>
            <EpisodeQuiz episode={active} />
          </div>
        )}

        {/* Past episodes */}
        {past.length > 0 && (
          <div>
            {/* Resolved */}
            {past.filter(isRevealed).length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-900/40" />
                  <span className="font-cinzel text-[10px] text-emerald-700/70 tracking-widest uppercase flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> Episodios resueltos
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-emerald-900/40" />
                </div>
                <div className="space-y-3">
                  {past.filter(isRevealed).map(ep => (
                    <PastEpisodeCard key={ep.event.id} episode={ep} />
                  ))}
                </div>
              </div>
            )}

            {/* Pending reveal */}
            {past.filter(ep => !isRevealed(ep)).length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900/30" />
                  <span className="font-cinzel text-[10px] text-amber-700/60 tracking-widest uppercase flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Pendientes de resolución
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900/30" />
                </div>
                <div className="space-y-3">
                  {past.filter(ep => !isRevealed(ep)).map(ep => (
                    <PastEpisodeCard key={ep.event.id} episode={ep} />
                  ))}
                </div>
              </div>
            )}
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
