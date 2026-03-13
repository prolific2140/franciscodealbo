import { useState, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { SiteHeader } from '@/components/SiteHeader';
import { useEpisodes, isRevealed, NARRATOR_PUBKEY } from '@/hooks/useEpisodes';
import { useEpisodeAnswers } from '@/hooks/useEpisodeAnswers';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ZapDialog } from '@/components/ZapDialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { genUserName } from '@/lib/genUserName';
import {
  ArrowLeft, Trophy, Zap, Coins, Users,
  Shuffle, Star, Lock, Anchor, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NostrEvent } from '@nostrify/nostrify';
import type { Event } from 'nostr-tools';
import type { QuizEpisode, } from '@/hooks/useEpisodes';
import type { Participant } from '@/hooks/useEpisodeAnswers';

const OPTION_LABELS: Record<string, string> = { a: 'A', b: 'B', c: 'C', d: 'D' };
const OPTION_COLORS: Record<string, string> = {
  a: 'border-sky-700/50 bg-sky-900/15 text-sky-300',
  b: 'border-violet-700/50 bg-violet-900/15 text-violet-300',
  c: 'border-rose-700/50 bg-rose-900/15 text-rose-300',
  d: 'border-emerald-700/50 bg-emerald-900/15 text-emerald-300',
};

// ── Fila de participante ────────────────────────────────────────────────────

function ParticipantRow({
  participant,
  episodeEvent,
  prizeAmount,
  isWinner,
  isChosen,
  revealed,
  correctAnswer,
}: {
  participant: Participant;
  episodeEvent: NostrEvent;
  prizeAmount: number;
  isWinner: boolean;
  isChosen: boolean;
  revealed: boolean;
  correctAnswer: 'a' | 'b' | 'c' | 'd';
}) {
  const author = useAuthor(participant.pubkey);
  const meta = author.data?.metadata;
  const displayName = meta?.name ?? genUserName(participant.pubkey);
  const avatar = meta?.picture;
  const letter = participant.letter;
  const isCorrect = revealed && letter === correctAnswer;
  const isWrong = revealed && letter !== null && letter !== correctAnswer;

  return (
    <div className={cn(
      'flex items-center gap-3 py-3 px-3 rounded-lg border transition-colors',
      isChosen
        ? 'border-amber-500/60 bg-amber-900/20'
        : isCorrect
        ? 'border-emerald-800/30 bg-emerald-900/10'
        : isWrong
        ? 'border-border/20 bg-card/30 opacity-60'
        : 'border-border/20 bg-card/30',
    )}>
      {/* Chosen star */}
      {isChosen && <Star className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />}

      {/* Avatar */}
      <Avatar className={cn(
        'border shrink-0',
        isChosen
          ? 'h-9 w-9 border-amber-600/60 ring-2 ring-amber-500/30'
          : 'h-7 w-7 border-border/30',
      )}>
        <AvatarImage src={avatar} alt={displayName} />
        <AvatarFallback className="bg-amber-900/30 text-amber-300 font-cinzel text-xs">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name + option badge */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-garamond text-sm truncate',
          isChosen ? 'text-amber-200 font-semibold' : 'text-foreground/80',
        )}>
          {displayName}
          {isChosen && (
            <span className="ml-2 font-cinzel text-[10px] text-amber-500">✦ agraciado</span>
          )}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {letter && (
            <span className={cn(
              'font-cinzel text-[10px] font-bold px-1.5 py-0.5 rounded border',
              OPTION_COLORS[letter] ?? 'border-border/30 text-muted-foreground',
            )}>
              {OPTION_LABELS[letter]}
            </span>
          )}
          {participant.sats > 0 && (
            <span className="font-garamond text-[11px] text-amber-600/70 flex items-center gap-0.5">
              <Zap className="h-2.5 w-2.5" />{participant.sats.toLocaleString()} sats
            </span>
          )}
          {isCorrect && (
            <span className="font-cinzel text-[10px] text-emerald-400 flex items-center gap-0.5">
              <Trophy className="h-2.5 w-2.5" /> acertó
            </span>
          )}
        </div>
      </div>

      {/* Zap button — only for the chosen winner */}
      {isChosen && isWinner && (
        <ZapDialog target={episodeEvent as Event}>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-600/60 bg-amber-500/15 hover:bg-amber-500/30 hover:border-amber-500 transition-all font-cinzel text-xs text-amber-300 hover:text-amber-200 shrink-0">
            <Zap className="h-3 w-3 fill-amber-400" />
            {prizeAmount > 0 ? `${prizeAmount.toLocaleString()} sats` : 'Zapear'}
          </button>
        </ZapDialog>
      )}
    </div>
  );
}

// ── Panel de sorteo para un episodio ───────────────────────────────────────

function SorteoPanel({ episode }: { episode: QuizEpisode }) {
  const aTag = `37183:${episode.event.pubkey}:${episode.d}`;
  const revealed = isRevealed(episode);

  const { data: stats, isLoading } = useEpisodeAnswers(
    episode.event.id,
    revealed ? episode.answer : undefined,
    aTag,
  );

  const [chosenPubkey, setChosenPubkey] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const participants = stats?.participants ?? [];
  const winners = stats?.winners ?? [];
  const totalSats = stats?.totalSats ?? 0;
  const prize80 = Math.floor(totalSats * 0.8);

  // Para el sorteo solo participan los que acertaron (si ya está revelado)
  // Si aún no está revelado, sorteo entre todos los participantes
  const drawPool = revealed ? winners : participants.map(p => p.pubkey);

  const fireWinnerConfetti = useCallback(() => {
    const burst = (origin: { x: number; y: number }) =>
      confetti({
        particleCount: 100,
        spread: 80,
        origin,
        colors: ['#f59e0b', '#fbbf24', '#fde68a', '#d97706', '#ffffff', '#facc15'],
        scalar: 1.2,
        gravity: 0.85,
      });
    burst({ x: 0.5, y: 0.6 });
    setTimeout(() => burst({ x: 0.3, y: 0.65 }), 150);
    setTimeout(() => burst({ x: 0.7, y: 0.65 }), 300);
    setTimeout(() => burst({ x: 0.5, y: 0.7 }), 450);
  }, []);

  function handleDraw() {
    if (drawPool.length === 0) return;
    setIsDrawing(true);
    setChosenPubkey(null);
    let ticks = 0;
    const interval = setInterval(() => {
      setChosenPubkey(drawPool[Math.floor(Math.random() * drawPool.length)]);
      ticks++;
      if (ticks >= 16) {
        clearInterval(interval);
        const final = drawPool[Math.floor(Math.random() * drawPool.length)];
        setChosenPubkey(final);
        setIsDrawing(false);
        fireWinnerConfetti();
      }
    }, 80);
  }

  const revealDateStr = (() => {
    if (!episode.revealAt) return null;
    try {
      return new Date(episode.revealAt * 1000).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return null; }
  })();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  const chosenParticipant = chosenPubkey
    ? participants.find(p => p.pubkey === chosenPubkey) ?? { pubkey: chosenPubkey, letter: null, sats: 0 }
    : null;
  const chosenIsWinner = chosenPubkey ? winners.includes(chosenPubkey) : false;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg border border-amber-900/30 bg-amber-900/10">
          <Users className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <p className="font-cinzel text-lg font-bold text-amber-300">{participants.length}</p>
          <p className="font-garamond text-[11px] text-muted-foreground">participantes</p>
        </div>
        <div className="text-center p-3 rounded-lg border border-amber-900/30 bg-amber-900/10">
          <Coins className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <p className="font-cinzel text-lg font-bold text-amber-300">{totalSats.toLocaleString()}</p>
          <p className="font-garamond text-[11px] text-muted-foreground">sats en juego</p>
        </div>
        <div className="text-center p-3 rounded-lg border border-emerald-900/30 bg-emerald-900/10">
          <Trophy className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <p className="font-cinzel text-lg font-bold text-emerald-300">{prize80.toLocaleString()}</p>
          <p className="font-garamond text-[11px] text-muted-foreground">sats al ganador</p>
        </div>
      </div>

      {/* Aviso si no revelado */}
      {!revealed && revealDateStr && (
        <div className="flex items-center gap-2 rounded-md border border-amber-900/25 bg-amber-900/10 px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <p className="font-garamond text-xs text-muted-foreground">
            La respuesta se revela el <span className="text-amber-400 font-semibold">{revealDateStr}</span>.
            El sorteo se realiza entre todos los apostantes.
          </p>
        </div>
      )}

      {/* Sin participantes */}
      {participants.length === 0 && (
        <div className="text-center py-8">
          <Anchor className="h-8 w-8 text-amber-800/40 mx-auto mb-3" />
          <p className="font-garamond text-sm text-muted-foreground">
            Aún no hay apuestas en este episodio.
          </p>
        </div>
      )}

      {/* Botón de sorteo */}
      {drawPool.length > 0 && (
        <Button
          onClick={handleDraw}
          disabled={isDrawing}
          className="w-full bg-amber-600 hover:bg-amber-500 text-amber-950 font-cinzel font-bold gap-2 h-11"
        >
          <Shuffle className={cn('h-4 w-4', isDrawing && 'animate-spin')} />
          {isDrawing
            ? 'Sorteando…'
            : chosenPubkey
            ? 'Repetir sorteo'
            : `Realizar sorteo entre ${drawPool.length} ${revealed ? 'acertante' : 'apostante'}${drawPool.length !== 1 ? 's' : ''}`}
        </Button>
      )}

      {/* Ganador destacado */}
      {chosenParticipant && (
        <div className={cn(
          'rounded-xl border px-5 py-4 text-center space-y-2',
          chosenIsWinner
            ? 'border-amber-500/50 bg-amber-900/25'
            : 'border-amber-700/30 bg-amber-900/15',
        )}>
          <p className="font-cinzel text-[10px] text-amber-600/70 uppercase tracking-widest">
            {chosenIsWinner ? '✦ Agraciado del sorteo ✦' : '✦ Seleccionado ✦'}
          </p>
          <ParticipantRow
            participant={chosenParticipant}
            episodeEvent={episode.event}
            prizeAmount={prize80}
            isWinner={chosenIsWinner}
            isChosen={true}
            revealed={revealed}
            correctAnswer={episode.answer}
          />
          {chosenIsWinner && prize80 > 0 && (
            <p className="font-garamond text-xs text-muted-foreground pt-1">
              Pulsa <span className="text-amber-400 font-semibold">Zapear</span> para enviarle{' '}
              <span className="text-amber-400 font-semibold">{prize80.toLocaleString()} sats</span>{' '}
              (el 80 % del bote).
            </p>
          )}
        </div>
      )}

      {/* Lista completa */}
      {participants.length > 0 && (
        <div className="space-y-2">
          <p className="font-cinzel text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Users className="h-3 w-3 text-amber-700" />
            {participants.length} apostante{participants.length !== 1 ? 's' : ''}
            {revealed && winners.length > 0 && (
              <span className="text-emerald-500 ml-1">· {winners.length} acertaron</span>
            )}
          </p>
          <div className="space-y-1.5">
            {participants.map(p => (
              p.pubkey !== chosenPubkey && (
                <ParticipantRow
                  key={p.pubkey}
                  participant={p}
                  episodeEvent={episode.event}
                  prizeAmount={prize80}
                  isWinner={winners.includes(p.pubkey)}
                  isChosen={false}
                  revealed={revealed}
                  correctAnswer={episode.answer}
                />
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────────

export default function RealizarSorteo() {
  useSeoMeta({ title: 'Realizar Sorteo — Vuelta al Mundo' });

  const { user } = useCurrentUser();
  const isNarrator = user?.pubkey === NARRATOR_PUBKEY;

  const { data: episodes, isLoading } = useEpisodes();
  const active = episodes?.find(ep => !isRevealed(ep)) ?? null;
  const resolved = episodes?.filter(isRevealed) ?? [];

  if (!user) {
    return (
      <div className="min-h-screen bg-ocean-deep">
        <SiteHeader />
        <div className="container max-w-2xl mx-auto px-4 py-24 text-center">
          <Lock className="h-12 w-12 text-amber-800 mx-auto mb-4" />
          <h2 className="font-cinzel text-xl text-amber-400 mb-2">Acceso restringido</h2>
          <p className="font-garamond text-muted-foreground">Inicia sesión con Nostr para acceder.</p>
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

  // Episodios a mostrar: primero el activo, luego los resueltos
  const allEpisodes = [...(active ? [active] : []), ...resolved];

  return (
    <div className="min-h-screen bg-ocean-deep">
      <SiteHeader />

      <main className="container max-w-2xl mx-auto px-4 py-8 pb-16">

        <Link
          to="/premio"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-400 transition-colors mb-6 font-cinzel"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a Premio
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full border border-amber-700/40 bg-amber-900/20 flex items-center justify-center">
              <Shuffle className="h-5 w-5 text-amber-400" />
            </div>
          </div>
          <h1 className="font-cinzel text-2xl font-bold text-amber-300 mb-2">Realizar sorteo</h1>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent my-4" />
          <p className="font-garamond text-sm text-muted-foreground max-w-sm mx-auto">
            Lista completa de apostantes por episodio. Sortea y zappea el premio al agraciado.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="border border-amber-900/20">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && allEpisodes.length === 0 && (
          <Card className="border border-amber-900/20 border-dashed">
            <CardContent className="py-16 text-center">
              <Anchor className="h-10 w-10 text-amber-800/50 mx-auto mb-4" />
              <h3 className="font-cinzel text-base text-amber-500 mb-2">Sin episodios publicados</h3>
              <p className="font-garamond text-sm text-muted-foreground">
                Publica el primer episodio para empezar.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && allEpisodes.length > 0 && (
          <div className="space-y-8">
            {allEpisodes.map(ep => (
              <Card key={ep.event.id} className={cn(
                'border overflow-hidden',
                isRevealed(ep) ? 'border-emerald-900/30' : 'border-amber-800/40',
              )}>
                <div className={cn('h-px', isRevealed(ep)
                  ? 'bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-amber-500/50 to-transparent'
                )} />
                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="font-cinzel text-[10px] bg-amber-900/20 text-amber-500 border-amber-800/30">
                      Ep. {ep.episode}
                    </Badge>
                    {isRevealed(ep)
                      ? <span className="font-cinzel text-[10px] text-emerald-400 flex items-center gap-1"><Trophy className="h-2.5 w-2.5" /> Resuelto</span>
                      : <span className="font-cinzel text-[10px] text-amber-500 flex items-center gap-1"><Zap className="h-2.5 w-2.5 fill-amber-500" /> Apuestas abiertas</span>
                    }
                  </div>
                  <h2 className="font-cinzel text-base font-bold text-amber-300 leading-snug mt-1">
                    {ep.title}
                  </h2>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <SorteoPanel episode={ep} />
                </CardContent>
              </Card>
            ))}
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
