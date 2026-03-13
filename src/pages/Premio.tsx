import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { genUserName } from '@/lib/genUserName';
import {
  ArrowLeft, Trophy, Zap, Coins, Users,
  Anchor, ScrollText, Lock, Shuffle, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NostrEvent } from '@nostrify/nostrify';
import type { Event } from 'nostr-tools';

const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'] as const;
const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const LETTERS = ['a', 'b', 'c', 'd'] as const;

/** Fila del participante agraciado con botón de zap */
function WinnerRow({
  pubkey,
  episodeEvent,
  prizeAmount,
  isChosen,
}: {
  pubkey: string;
  episodeEvent: NostrEvent;
  prizeAmount: number;
  isChosen: boolean;
}) {
  const author = useAuthor(pubkey);
  const meta = author.data?.metadata;
  const displayName = meta?.name ?? genUserName(pubkey);
  const avatar = meta?.picture;

  return (
    <div className={cn(
      'flex items-center gap-3 py-3 border-b border-border/20 last:border-0 transition-colors',
      isChosen && 'bg-amber-900/10 rounded-lg px-2',
    )}>
      {/* Chosen star */}
      {isChosen && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}

      {/* Avatar */}
      <Avatar className={cn(
        'border shrink-0',
        isChosen ? 'h-9 w-9 border-amber-600/60 ring-2 ring-amber-500/30' : 'h-7 w-7 border-amber-900/40',
      )}>
        <AvatarImage src={avatar} alt={displayName} />
        <AvatarFallback className="bg-amber-900/30 text-amber-300 font-cinzel text-xs">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <span className={cn(
        'font-garamond text-sm flex-1 truncate',
        isChosen ? 'text-amber-200 font-semibold' : 'text-foreground/70',
      )}>
        {displayName}
        {isChosen && <span className="ml-2 font-cinzel text-[10px] text-amber-500">✦ agraciado</span>}
      </span>

      {/* Zap button — only shown for the chosen winner */}
      {isChosen && (
        <ZapDialog target={episodeEvent as Event}>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-600/60 bg-amber-500/15 hover:bg-amber-500/30 hover:border-amber-500/80 transition-all duration-200 font-cinzel text-xs text-amber-300 hover:text-amber-200 shrink-0">
            <Zap className="h-3 w-3 fill-amber-400" />
            {prizeAmount > 0 ? `${prizeAmount.toLocaleString()} sats` : 'Zapear'}
          </button>
        </ZapDialog>
      )}
    </div>
  );
}

/** Panel de un episodio resuelto con sorteo */
function EpisodePrizePanel({ episode }: { episode: ReturnType<typeof useEpisodes>['data'] extends (infer U)[] | undefined ? U : never }) {
  const revealed = isRevealed(episode);

  const { data: stats, isLoading: statsLoading } = useEpisodeAnswers(
    episode.event.id,
    revealed ? episode.answer : undefined,
  );

  // Sorteo: índice del agraciado (null = aún no sorteado)
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  if (statsLoading) {
    return (
      <Card className="border border-amber-900/20">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-16 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!revealed) return null;

  const correctIdx = LETTERS.indexOf(episode.answer);
  const correctLabel = OPTION_LABELS[correctIdx];
  const correctText = episode[OPTION_KEYS[correctIdx]];
  const winners = stats?.winners ?? [];
  const totalSats = stats?.totalSats ?? 0;
  const prizeSats = Math.floor(totalSats * 0.8);   // 80 % para el agraciado

  function handleDraw() {
    if (winners.length === 0) return;
    setIsDrawing(true);
    // Animación de "ruleta" durante 1.2 s
    let ticks = 0;
    const interval = setInterval(() => {
      setChosenIdx(Math.floor(Math.random() * winners.length));
      ticks++;
      if (ticks >= 12) {
        clearInterval(interval);
        // Resultado final
        const final = Math.floor(Math.random() * winners.length);
        setChosenIdx(final);
        setIsDrawing(false);
      }
    }, 100);
  }

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
            { icon: Coins,  label: 'Total bote',    value: `${totalSats.toLocaleString()} sats` },
            { icon: Users,  label: 'Acertantes',    value: String(winners.length) },
            { icon: Trophy, label: 'Zapmaravedí',   value: winners.length > 0 ? `${prizeSats.toLocaleString()} sats` : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center p-2.5 rounded-lg border border-amber-900/25 bg-amber-900/10">
              <Icon className="h-3.5 w-3.5 text-amber-500 mx-auto mb-1" />
              <p className="font-cinzel text-xs font-bold text-amber-300">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* No winners */}
        {winners.length === 0 && (
          <div className="text-center py-4">
            <p className="font-garamond text-sm text-muted-foreground">
              Nadie acertó en este episodio.
            </p>
          </div>
        )}

        {/* Winners + draw */}
        {winners.length > 0 && (
          <div className="space-y-3">

            {/* Draw button */}
            {chosenIdx === null ? (
              <Button
                onClick={handleDraw}
                disabled={isDrawing}
                className="w-full bg-amber-600 hover:bg-amber-500 text-amber-950 font-cinzel font-bold gap-2"
              >
                <Shuffle className={cn('h-4 w-4', isDrawing && 'animate-spin')} />
                {isDrawing ? 'Sorteando…' : 'Realizar sorteo del zapmaravedí de oro'}
              </Button>
            ) : (
              <div className="rounded-lg border border-amber-600/50 bg-amber-900/20 px-4 py-3 text-center space-y-1">
                <p className="font-cinzel text-[10px] text-amber-600/70 uppercase tracking-widest">Agraciado del sorteo</p>
                <p className="font-cinzel text-base font-bold text-amber-300">
                  {genUserName(winners[chosenIdx])}
                </p>
                <p className="font-garamond text-xs text-muted-foreground">
                  Recibe el 80 % del bote:{' '}
                  <span className="text-amber-400 font-semibold">{prizeSats.toLocaleString()} sats</span>
                </p>
                <button
                  onClick={() => { setChosenIdx(null); }}
                  className="font-garamond text-[11px] text-muted-foreground/50 hover:text-amber-500/70 transition-colors underline underline-offset-2 mt-1"
                >
                  Repetir sorteo
                </button>
              </div>
            )}

            {/* Full list */}
            <div>
              <p className="font-cinzel text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Users className="h-3 w-3 text-amber-700" />
                {winners.length} acertante{winners.length !== 1 ? 's' : ''} en el sorteo
              </p>
              <div>
                {winners.map((pubkey, idx) => (
                  <WinnerRow
                    key={pubkey}
                    pubkey={pubkey}
                    episodeEvent={episode.event}
                    prizeAmount={prizeSats}
                    isChosen={chosenIdx === idx}
                  />
                ))}
              </div>
            </div>

            {/* Instruction */}
            {chosenIdx !== null && (
              <div className="rounded-md border border-amber-900/20 bg-amber-900/10 px-3 py-2.5">
                <p className="font-garamond text-xs text-muted-foreground leading-relaxed">
                  Pulsa <span className="text-amber-400 font-semibold">Zapear</span> junto al nombre del agraciado para enviarle{' '}
                  <span className="text-amber-400 font-semibold">{prizeSats.toLocaleString()} sats</span>{' '}
                  (el 80 % de los {totalSats.toLocaleString()} sats recaudados) mediante Lightning.
                </p>
              </div>
            )}
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
  const resolved = episodes?.filter(isRevealed) ?? [];

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
          <h1 className="font-cinzel text-2xl font-bold text-amber-300 mb-2">Sorteo del zapmaravedí de oro</h1>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent my-4" />
          <p className="font-garamond text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Por cada episodio resuelto, realiza el sorteo entre los acertantes y zappea el 80 % del bote al ganador elegido.
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
                Cuando un episodio supere su fecha de revelación aparecerá aquí para realizar el sorteo.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resolved episodes */}
        {!isLoading && resolved.length > 0 && (
          <div className="space-y-6">
            {resolved.map(ep => (
              <EpisodePrizePanel key={ep.event.id} episode={ep} />
            ))}
          </div>
        )}

        {/* Instructions */}
        {!isLoading && resolved.length > 0 && (
          <div className="mt-8 rounded-lg border border-amber-900/20 bg-amber-900/10 p-4">
            <p className="font-cinzel text-[10px] text-amber-600/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <ScrollText className="h-3 w-3" /> Instrucciones
            </p>
            <ul className="font-garamond text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> Pulsa <strong className="text-amber-500/80">Realizar sorteo</strong> para elegir al azar un acertante entre todos los participantes correctos.</li>
              <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> El agraciado recibe el <strong className="text-amber-500/80">80 % del bote total</strong> mediante un zap Lightning.</li>
              <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> Pulsa <strong className="text-amber-500/80">Zapear</strong> junto a su nombre para enviar el premio.</li>
              <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> El 20 % restante queda en el tesoro de la expedición.</li>
            </ul>
          </div>
        )}

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
