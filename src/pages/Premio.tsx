import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { useEpisodes, isRevealed, NARRATOR_PUBKEY } from '@/hooks/useEpisodes';
import { useEpisodeAnswers } from '@/hooks/useEpisodeAnswers';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ZapDialog } from '@/components/ZapDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { genUserName } from '@/lib/genUserName';
import {
  ArrowLeft, Trophy, Zap, Coins, Users,
  Anchor, ScrollText, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NostrEvent } from '@nostrify/nostrify';
import type { Event } from 'nostr-tools';

const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'] as const;
const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const LETTERS = ['a', 'b', 'c', 'd'] as const;

/** Muestra avatar + nombre del ganador con botón de zap */
function WinnerRow({
  pubkey,
  rank,
  episodeEvent,
}: {
  pubkey: string;
  rank: number;
  episodeEvent: NostrEvent;
}) {
  const author = useAuthor(pubkey);
  const meta = author.data?.metadata;
  const displayName = meta?.name ?? genUserName(pubkey);
  const avatar = meta?.picture;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/20 last:border-0">
      {/* Rank */}
      <span className="font-cinzel text-xs text-amber-600/60 w-5 text-right shrink-0">{rank}.</span>

      {/* Avatar */}
      <Avatar className="h-8 w-8 border border-amber-700/30 shrink-0">
        <AvatarImage src={avatar} alt={displayName} />
        <AvatarFallback className="bg-amber-900/30 text-amber-300 font-cinzel text-xs">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <span className="font-garamond text-sm text-foreground/90 flex-1 truncate">{displayName}</span>

      {/* Zap button */}
      <ZapDialog target={episodeEvent as Event}>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-700/50 bg-amber-900/20 hover:bg-amber-900/40 hover:border-amber-600/70 transition-all duration-200 font-cinzel text-xs text-amber-400 hover:text-amber-300 shrink-0">
          <Zap className="h-3 w-3 fill-amber-500" />
          Zapear premio
        </button>
      </ZapDialog>
    </div>
  );
}

/** Panel de un episodio resuelto con sus ganadores */
function EpisodePrizePanel({ episodeIdx }: { episodeIdx: number }) {
  const { data: episodes, isLoading } = useEpisodes();
  const episode = episodes?.[episodeIdx] ?? null;

  const revealed = episode ? isRevealed(episode) : false;

  const { data: stats, isLoading: statsLoading } = useEpisodeAnswers(
    episode?.event.id,
    revealed ? episode?.answer : undefined,
  );

  if (isLoading || statsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!episode || !revealed) return null;

  const correctIdx = LETTERS.indexOf(episode.answer);
  const correctLabel = OPTION_LABELS[correctIdx];
  const correctText = episode[OPTION_KEYS[correctIdx]];
  const winners = stats?.winners ?? [];
  const totalSats = stats?.totalSats ?? 0;
  const winnerSats = stats?.winnerSats ?? 0;
  const perWinner = winners.length > 0 ? Math.floor(winnerSats / winners.length) : 0;

  return (
    <Card className="border border-emerald-900/40 overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-600/40 to-transparent" />
      <CardContent className="p-5 space-y-4">

        {/* Episode header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge className="font-cinzel text-[10px] bg-amber-900/20 text-amber-500 border-amber-800/30 mb-1.5">
              Ep. {episode.episode}
            </Badge>
            <h3 className="font-cinzel text-sm font-bold text-amber-300 leading-snug">{episode.title}</h3>
          </div>
          <span className="font-cinzel text-[10px] text-emerald-500 flex items-center gap-1 shrink-0">
            <Trophy className="h-3 w-3" /> Resuelto
          </span>
        </div>

        {/* Correct answer */}
        <div className="rounded-md border border-emerald-800/40 bg-emerald-900/15 px-3 py-2">
          <p className="font-cinzel text-[10px] text-emerald-500 mb-1">Respuesta correcta</p>
          <p className="font-garamond text-sm text-emerald-200">
            <span className="font-bold">{correctLabel}.</span> {correctText}
          </p>
        </div>

        {/* Prize pool stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Coins, label: 'Total bote', value: `${totalSats.toLocaleString()} sats` },
            { icon: Users, label: 'Ganadores', value: String(winners.length) },
            { icon: Zap,   label: 'Por ganador', value: winners.length > 0 ? `~${perWinner.toLocaleString()} sats` : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center p-2.5 rounded-lg border border-amber-900/25 bg-amber-900/10">
              <Icon className="h-3.5 w-3.5 text-amber-500 mx-auto mb-1" />
              <p className="font-cinzel text-xs font-bold text-amber-300">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Winners list */}
        {winners.length === 0 ? (
          <div className="text-center py-4">
            <p className="font-garamond text-sm text-muted-foreground">
              Nadie acertó en este episodio.
            </p>
          </div>
        ) : (
          <div>
            <p className="font-cinzel text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Trophy className="h-3 w-3 text-amber-600" /> Lista de ganadores — zapea a cada uno
            </p>
            <div className="space-y-0">
              {winners.map((pubkey, idx) => (
                <WinnerRow
                  key={pubkey}
                  pubkey={pubkey}
                  rank={idx + 1}
                  episodeEvent={episode.event}
                />
              ))}
            </div>
          </div>
        )}

        {/* Instruction */}
        {winners.length > 0 && (
          <div className="rounded-md border border-amber-900/20 bg-amber-900/10 px-3 py-2.5">
            <p className="font-garamond text-xs text-muted-foreground leading-relaxed">
              Zappea a cada ganador desde tu cartera Lightning. El importe recomendado es{' '}
              <span className="text-amber-400 font-semibold">~{perWinner.toLocaleString()} sats</span>{' '}
              por persona ({winnerSats.toLocaleString()} sats totales en la opción correcta).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Premio() {
  useSeoMeta({ title: 'Premio — Vuelta al Mundo' });

  const { user } = useCurrentUser();
  const isNarrator = user?.pubkey === NARRATOR_PUBKEY;

  const { data: episodes, isLoading } = useEpisodes();
  // All resolved episodes, sorted newest first
  const resolved = episodes?.filter(isRevealed) ?? [];

  // Guard: not narrator
  if (!user) {
    return (
      <div className="min-h-screen bg-ocean-deep">
        <SiteHeader />
        <div className="container max-w-2xl mx-auto px-4 py-24 text-center">
          <Lock className="h-12 w-12 text-amber-800 mx-auto mb-4" />
          <h2 className="font-cinzel text-xl text-amber-400 mb-2">Acceso restringido</h2>
          <p className="font-garamond text-muted-foreground">Debes iniciar sesión como el narrador para acceder.</p>
        </div>
      </div>
    );
  }

  if (!isNarrator) {
    return (
      <div className="min-h-screen bg-ocean-deep">
        <SiteHeader />
        <div className="container max-w-2xl mx-auto px-4 py-24 text-center">
          <Lock className="h-12 w-12 text-amber-800 mx-auto mb-4" />
          <h2 className="font-cinzel text-xl text-amber-400 mb-2">Solo el narrador</h2>
          <p className="font-garamond text-muted-foreground">
            Esta sección es exclusiva de Francisco de Albo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-deep">
      <SiteHeader />

      <main className="container max-w-2xl mx-auto px-4 py-8 pb-16">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-400 transition-colors mb-6 font-cinzel"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full border border-amber-700/40 bg-amber-900/20 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
          </div>
          <h1 className="font-cinzel text-2xl font-bold text-amber-300 mb-2">Reparto de premios</h1>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent my-4" />
          <p className="font-garamond text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Episodios resueltos con su lista de ganadores. Zappea a cada uno el importe que les corresponde.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <Card key={i} className="border border-amber-900/20">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-16 w-full rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No resolved episodes */}
        {!isLoading && resolved.length === 0 && (
          <Card className="border border-amber-900/20 border-dashed">
            <CardContent className="py-16 text-center">
              <Anchor className="h-10 w-10 text-amber-800/50 mx-auto mb-4" />
              <h3 className="font-cinzel text-base text-amber-500 mb-2">Sin episodios resueltos</h3>
              <p className="font-garamond text-sm text-muted-foreground max-w-xs mx-auto">
                Cuando un episodio supere su fecha de revelación aparecerá aquí con la lista de ganadores.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resolved episodes */}
        {!isLoading && resolved.length > 0 && (
          <div className="space-y-6">
            {resolved.map((ep, idx) => {
              // Find the index in the full episodes array
              const globalIdx = episodes?.findIndex(e => e.event.id === ep.event.id) ?? idx;
              return (
                <EpisodePrizePanel key={ep.event.id} episodeIdx={globalIdx} />
              );
            })}
          </div>
        )}

        {/* Info note */}
        {!isLoading && resolved.length > 0 && (
          <div className="mt-8 rounded-lg border border-amber-900/20 bg-amber-900/10 p-4">
            <p className="font-cinzel text-[10px] text-amber-600/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <ScrollText className="h-3 w-3" /> Instrucciones
            </p>
            <ul className="font-garamond text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> Pulsa "Zapear premio" en cada ganador para abrir el diálogo de pago Lightning.</li>
              <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> El importe sugerido es el bote de la opción correcta dividido entre el número de acertantes.</li>
              <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> Puedes ajustar el importe libremente en el diálogo antes de confirmar el pago.</li>
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-900/20 to-transparent mb-4" />
          <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer"
            className="font-garamond text-xs text-muted-foreground/40 hover:text-amber-500/60 transition-colors">
            Vibed with Shakespeare ✦
          </a>
        </div>
      </main>
    </div>
  );
}
