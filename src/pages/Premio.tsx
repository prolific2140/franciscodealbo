import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { useEpisodes, isRevealed, NARRATOR_PUBKEY } from '@/hooks/useEpisodes';
import { useEpisodeAnswers } from '@/hooks/useEpisodeAnswers';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ZapDialog } from '@/components/ZapDialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { genUserName } from '@/lib/genUserName';
import {
  ArrowLeft, Trophy, Zap, Coins, Users,
  Anchor, ScrollText, Lock, Shuffle, Star, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NostrEvent } from '@nostrify/nostrify';
import type { Event } from 'nostr-tools';
import type { QuizEpisode } from '@/hooks/useEpisodes';

const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'] as const;
const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const LETTERS = ['a', 'b', 'c', 'd'] as const;

// ── Panel del episodio ACTIVO (visible para todos los usuarios) ─────────────

function ActiveEpisodePanel({ episode }: { episode: QuizEpisode }) {
  const aTag = `37183:${episode.event.pubkey}:${episode.d}`;
  const { data: stats, isLoading } = useEpisodeAnswers(episode.event.id, undefined, aTag);

  const totalSats = stats?.totalSats ?? 0;
  const totalParticipants = stats?.total ?? 0;
  const prize80 = Math.floor(totalSats * 0.8);

  const revealDateStr = (() => {
    if (!episode.revealAt) return null;
    try {
      return new Date(episode.revealAt * 1000).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return null; }
  })();

  return (
    <Card className="border border-amber-800/40 overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className="font-cinzel text-[10px] bg-amber-900/20 text-amber-500 border-amber-800/30">
              Ep. {episode.episode}
            </Badge>
            <span className="font-cinzel text-[10px] text-amber-500 flex items-center gap-1">
              <Zap className="h-2.5 w-2.5 fill-amber-500" /> Apuestas abiertas
            </span>
          </div>
          {revealDateStr && (
            <span className="font-garamond text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Se revela el {revealDateStr}
            </span>
          )}
        </div>
        <h2 className="font-cinzel text-base font-bold text-amber-300 leading-snug mt-1">
          {episode.title}
        </h2>
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-4">
        {/* Estadísticas en tiempo real */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {/* Participantes */}
            <div className="text-center p-3 rounded-lg border border-amber-900/30 bg-amber-900/10 space-y-1">
              <Users className="h-5 w-5 text-amber-500 mx-auto" />
              <p className="font-cinzel text-xl font-bold text-amber-300">
                {totalParticipants}
              </p>
              <p className="font-garamond text-[11px] text-muted-foreground">
                {totalParticipants === 1 ? 'apuesta' : 'apuestas'}
              </p>
            </div>

            {/* Total bote */}
            <div className="text-center p-3 rounded-lg border border-amber-900/30 bg-amber-900/10 space-y-1">
              <Coins className="h-5 w-5 text-amber-500 mx-auto" />
              <p className="font-cinzel text-xl font-bold text-amber-300">
                {totalSats.toLocaleString()}
              </p>
              <p className="font-garamond text-[11px] text-muted-foreground">sats en juego</p>
            </div>

            {/* Premio 80 % */}
            <div className="text-center p-3 rounded-lg border border-emerald-900/30 bg-emerald-900/10 space-y-1">
              <Trophy className="h-5 w-5 text-emerald-500 mx-auto" />
              <p className="font-cinzel text-xl font-bold text-emerald-300">
                {prize80.toLocaleString()}
              </p>
              <p className="font-garamond text-[11px] text-muted-foreground">sats al ganador</p>
            </div>
          </div>
        )}

        {/* Nota informativa */}
        <div className="rounded-md border border-amber-900/20 bg-amber-900/10 px-3 py-2.5">
          <p className="font-garamond text-xs text-muted-foreground leading-relaxed">
            El <span className="text-emerald-400 font-semibold">80 %</span> del bote irá al ganador
            sorteado entre quienes aciertan la respuesta. El{' '}
            <span className="text-amber-400 font-semibold">20 % restante</span> queda en el tesoro
            de la expedición. La respuesta se revela el{' '}
            <span className="text-amber-400 font-semibold">{revealDateStr ?? 'próximamente'}</span>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Fila de ganador con botón de zap (solo narrador) ───────────────────────

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
      {isChosen && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}

      <Avatar className={cn(
        'border shrink-0',
        isChosen ? 'h-9 w-9 border-amber-600/60 ring-2 ring-amber-500/30' : 'h-7 w-7 border-amber-900/40',
      )}>
        <AvatarImage src={avatar} alt={displayName} />
        <AvatarFallback className="bg-amber-900/30 text-amber-300 font-cinzel text-xs">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <span className={cn(
        'font-garamond text-sm flex-1 truncate',
        isChosen ? 'text-amber-200 font-semibold' : 'text-foreground/70',
      )}>
        {displayName}
        {isChosen && <span className="ml-2 font-cinzel text-[10px] text-amber-500">✦ agraciado</span>}
      </span>

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

// ── Panel de episodio RESUELTO con sorteo (solo narrador) ───────────────────

function EpisodePrizePanel({ episode }: { episode: QuizEpisode }) {
  const aTag = `37183:${episode.event.pubkey}:${episode.d}`;
  const { data: stats, isLoading: statsLoading } = useEpisodeAnswers(
    episode.event.id,
    episode.answer,
    aTag,
  );

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

  const correctIdx = LETTERS.indexOf(episode.answer);
  const correctLabel = OPTION_LABELS[correctIdx];
  const correctText = episode[OPTION_KEYS[correctIdx]];
  const winners = stats?.winners ?? [];
  const totalSats = stats?.totalSats ?? 0;
  const prizeSats = Math.floor(totalSats * 0.8);

  function handleDraw() {
    if (winners.length === 0) return;
    setIsDrawing(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setChosenIdx(Math.floor(Math.random() * winners.length));
      ticks++;
      if (ticks >= 12) {
        clearInterval(interval);
        setChosenIdx(Math.floor(Math.random() * winners.length));
        setIsDrawing(false);
      }
    }, 100);
  }

  return (
    <Card className="border border-emerald-900/40 overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-600/40 to-transparent" />
      <CardContent className="p-5 space-y-4">

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

        <div className="rounded-md border border-emerald-800/40 bg-emerald-900/15 px-3 py-2">
          <p className="font-cinzel text-[10px] text-emerald-500 mb-1">Respuesta correcta</p>
          <p className="font-garamond text-sm text-emerald-200">
            <span className="font-bold">{correctLabel}.</span> {correctText}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Coins,  label: 'Total bote',   value: `${totalSats.toLocaleString()} sats` },
            { icon: Users,  label: 'Acertantes',   value: String(winners.length) },
            { icon: Trophy, label: 'Premio (80%)', value: winners.length > 0 ? `${prizeSats.toLocaleString()} sats` : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center p-2.5 rounded-lg border border-amber-900/25 bg-amber-900/10">
              <Icon className="h-3.5 w-3.5 text-amber-500 mx-auto mb-1" />
              <p className="font-cinzel text-xs font-bold text-amber-300">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {winners.length === 0 && (
          <p className="font-garamond text-sm text-muted-foreground text-center py-2">
            Nadie acertó en este episodio.
          </p>
        )}

        {winners.length > 0 && (
          <div className="space-y-3">
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
                  onClick={() => setChosenIdx(null)}
                  className="font-garamond text-[11px] text-muted-foreground/50 hover:text-amber-500/70 transition-colors underline underline-offset-2 mt-1"
                >
                  Repetir sorteo
                </button>
              </div>
            )}

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

// ── Página principal ────────────────────────────────────────────────────────

export default function Premio() {
  useSeoMeta({ title: 'Premio — Vuelta al Mundo' });

  const { user } = useCurrentUser();
  const isNarrator = user?.pubkey === NARRATOR_PUBKEY;

  const { data: episodes, isLoading } = useEpisodes();
  const active = episodes?.find(ep => !isRevealed(ep)) ?? null;
  const resolved = episodes?.filter(isRevealed) ?? [];

  // Cualquier usuario debe iniciar sesión para ver esta página
  if (!user) {
    return (
      <div className="min-h-screen bg-ocean-deep">
        <SiteHeader />
        <div className="container max-w-2xl mx-auto px-4 py-24 text-center">
          <Lock className="h-12 w-12 text-amber-800 mx-auto mb-4" />
          <h2 className="font-cinzel text-xl text-amber-400 mb-2">Acceso restringido</h2>
          <p className="font-garamond text-muted-foreground">Inicia sesión con Nostr para ver el premio.</p>
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
          <h1 className="font-cinzel text-2xl font-bold text-amber-300 mb-2">Zapmaravedí de oro</h1>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent my-4" />
          <p className="font-garamond text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            El 80 % de los sats apostados va al ganador sorteado entre quienes aciertan la respuesta.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <Card key={i} className="border border-amber-900/20">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-20 w-full rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="space-y-6">

            {/* ── Episodio activo: visible para todos ── */}
            {active && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900/40" />
                  <span className="font-cinzel text-[10px] text-amber-500/80 tracking-widest uppercase">
                    Episodio en curso
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900/40" />
                </div>
                <ActiveEpisodePanel episode={active} />
              </div>
            )}

            {/* ── Episodios resueltos: solo el narrador puede sortear ── */}
            {isNarrator && resolved.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-emerald-900/40" />
                  <span className="font-cinzel text-[10px] text-emerald-600/70 tracking-widest uppercase flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> Sorteos pendientes
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-emerald-900/40" />
                </div>
                <div className="space-y-6">
                  {resolved.map(ep => (
                    <EpisodePrizePanel key={ep.event.id} episode={ep} />
                  ))}
                </div>
              </div>
            )}

            {/* Sin episodios */}
            {!active && resolved.length === 0 && (
              <Card className="border border-amber-900/20 border-dashed">
                <CardContent className="py-16 text-center">
                  <Anchor className="h-10 w-10 text-amber-800/50 mx-auto mb-4" />
                  <h3 className="font-cinzel text-base text-amber-500 mb-2">La flota aún no ha zarpado</h3>
                  <p className="font-garamond text-sm text-muted-foreground max-w-xs mx-auto">
                    Cuando se publique el primer episodio aparecerá aquí el bote en juego.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Instrucciones para el narrador */}
            {isNarrator && resolved.length > 0 && (
              <div className="rounded-lg border border-amber-900/20 bg-amber-900/10 p-4">
                <p className="font-cinzel text-[10px] text-amber-600/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ScrollText className="h-3 w-3" /> Instrucciones
                </p>
                <ul className="font-garamond text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                  <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> Pulsa <strong className="text-amber-500/80">Realizar sorteo</strong> para elegir al azar un acertante.</li>
                  <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> El agraciado recibe el <strong className="text-amber-500/80">80 % del bote</strong> mediante un zap Lightning.</li>
                  <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> Pulsa <strong className="text-amber-500/80">Zapear</strong> junto a su nombre para enviar el premio.</li>
                  <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> El 20 % restante queda en el tesoro de la expedición.</li>
                </ul>
              </div>
            )}
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
