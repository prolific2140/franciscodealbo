import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ZapDialogWrapper } from '@/components/ZapDialogWrapper';
import { SourceBadge } from '@/components/SourcesPanel';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useEpisodeAnswers, useUserAnswer } from '@/hooks/useEpisodeAnswers';
import { useToast } from '@/hooks/useToast';
import { genUserName } from '@/lib/genUserName';
import type { QuizEpisode } from '@/hooks/useEpisodes';
import { isRevealed } from '@/hooks/useEpisodes';
import {
  Zap, Anchor, Users, ChevronDown, ChevronUp,
  BookOpen, Clock, Trophy, Coins, ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Event } from 'nostr-tools';

interface EpisodeQuizProps {
  episode: QuizEpisode;
}

const LETTERS = ['a', 'b', 'c', 'd'] as const;
const LABELS = ['A', 'B', 'C', 'D'] as const;
const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'] as const;

export function EpisodeQuiz({ episode }: EpisodeQuizProps) {
  const { user } = useCurrentUser();
  const author = useAuthor(episode.event.pubkey);
  const { mutate: publish } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [expanded, setExpanded] = useState(false);

  const revealed = isRevealed(episode);
  const aTag = `37183:${episode.event.pubkey}:${episode.d}`;

  const { data: stats, isLoading: statsLoading } = useEpisodeAnswers(
    episode.event.id,
    revealed ? episode.answer : undefined,
  );
  const { data: userAnswer } = useUserAnswer(episode.event.id, user?.pubkey);

  const authorMeta = author.data?.metadata;
  const displayName = authorMeta?.name ?? genUserName(episode.event.pubkey);
  const avatar = authorMeta?.picture;
  const hasAnswered = !!userAnswer?.answerLetter;
  const myLetter = userAnswer?.answerLetter ?? null;
  const isWinner = revealed && myLetter === episode.answer;
  const isLoser = revealed && myLetter !== null && myLetter !== episode.answer;

  const formattedDate = (() => {
    try {
      const d = new Date(`${episode.date}T12:00:00`);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { /* ignore */ }
    return episode.date;
  })();

  const revealDateStr = (() => {
    if (!episode.revealAt) return null;
    try {
      const d = new Date(episode.revealAt * 1000);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { /* ignore */ }
    return null;
  })();

  // Called AFTER a successful zap for a given option
  function onZapSuccess(letter: 'a' | 'b' | 'c' | 'd') {
    if (!user) return;
    const optionText = episode[OPTION_KEYS[LETTERS.indexOf(letter)]];
    publish(
      {
        kind: 1,
        content: `Mi apuesta en #vuelta-al-mundo: ${letter.toUpperCase()} — ${optionText}`,
        tags: [
          ['e', episode.event.id],
          ['a', aTag],
          ['t', 'vuelta-al-mundo'],
          ['t', `answer:${letter}`],
        ],
      },
      {
        onSuccess: () => {
          toast({ title: '⚡ ¡Apuesta registrada!', description: `Opción ${letter.toUpperCase()} — que la fortuna te acompañe.` });
          queryClient.invalidateQueries({ queryKey: ['vuelta-al-mundo', 'answers', episode.event.id] });
          queryClient.invalidateQueries({ queryKey: ['vuelta-al-mundo', 'user-answer', episode.event.id, user.pubkey] });
        },
        onError: () => toast({ title: 'Error', description: 'No se pudo registrar tu voto.', variant: 'destructive' }),
      }
    );
  }

  function getOptionStyle(letter: 'a' | 'b' | 'c' | 'd') {
    if (revealed) {
      if (letter === episode.answer) return 'border-emerald-500 bg-emerald-500/10 text-emerald-200';
      if (letter === myLetter) return 'border-red-700/60 bg-red-900/10 text-red-300/70 opacity-70';
      return 'border-border/25 bg-card/20 text-muted-foreground/40 opacity-50';
    }
    if (letter === myLetter) return 'border-amber-500/60 bg-amber-900/15 text-amber-300';
    return 'border-border/60 bg-card/50 text-foreground';
  }

  const totalSats = stats?.totalSats ?? 0;
  const winnerSats = stats?.winnerSats ?? 0;
  const winnerCount = stats?.winners.length ?? 0;
  const perWinner = winnerCount > 0 ? Math.floor(winnerSats / winnerCount) : 0;

  return (
    <div className="space-y-0">
      {/* STATUS BANNER */}
      {revealed ? (
        <div className="flex items-center justify-between px-4 py-2 rounded-t-xl border border-b-0 border-emerald-700/40 bg-emerald-900/20">
          <span className="font-cinzel text-xs text-emerald-400 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Episodio resuelto
          </span>
          {myLetter && (
            <span className={cn('font-cinzel text-xs font-bold', isWinner ? 'text-emerald-400' : 'text-red-400')}>
              {isWinner ? '✓ Acertaste' : '✗ Fallaste'}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-2 rounded-t-xl border border-b-0 border-amber-800/40 bg-amber-900/10">
          <span className="font-cinzel text-xs text-amber-500 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 fill-amber-500" /> Apuestas abiertas
          </span>
          <div className="flex items-center gap-3">
            <span className="font-cinzel text-xs text-amber-400 font-bold flex items-center gap-1">
              <Zap className="h-3 w-3 fill-amber-400" /> Mín. {episode.zapAmount} sats
            </span>
            {revealDateStr && (
              <span className="font-garamond text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Resolución: {revealDateStr}
              </span>
            )}
          </div>
        </div>
      )}

      {/* MAIN CARD */}
      <Card className={cn(
        'border rounded-t-none overflow-hidden shadow-2xl',
        revealed ? 'border-emerald-700/40' : 'border-amber-800/40',
      )}>
        <div className={cn('h-px', revealed
          ? 'bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent'
          : 'bg-gradient-to-r from-transparent via-amber-500/50 to-transparent'
        )} />

        <CardContent className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-amber-700/40 ring-1 ring-amber-500/20 shrink-0">
                <AvatarImage src={avatar} alt={displayName} />
                <AvatarFallback className="bg-amber-900/30 text-amber-300 font-cinzel text-xs">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-cinzel text-sm text-amber-400 font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Anchor className="h-3 w-3 shrink-0" /> {formattedDate}
                </p>
              </div>
            </div>
            <Badge className="font-cinzel text-xs bg-amber-900/30 text-amber-400 border-amber-700/40 shrink-0">
              Ep. {episode.episode}
            </Badge>
          </div>

          {/* Title */}
          <h2 className="font-cinzel text-xl font-bold text-amber-200 leading-snug">
            {episode.title}
          </h2>

          {/* Narrative */}
          <div className="relative">
            <div className={cn(
              'font-garamond text-base leading-relaxed text-foreground/90',
              !expanded && 'max-h-32 overflow-hidden',
            )}>
              <p>{episode.narrative}</p>
            </div>
            {!expanded && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            )}
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-amber-500/70 hover:text-amber-400 mt-2 transition-colors"
            >
              {expanded
                ? <><ChevronUp className="h-3 w-3" /> Leer menos</>
                : <><ChevronDown className="h-3 w-3" /> Continuar leyendo...</>}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-800/30" />
            <span className="font-cinzel text-[10px] text-amber-600/60 flex items-center gap-1.5 shrink-0">
              <ScrollText className="h-3 w-3" />
              {revealed ? '¿Qué ocurrió realmente?' : '¿Qué ocurrió? Apuesta por tu respuesta ⚡'}
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-800/30" />
          </div>

          {/* OPTIONS */}
          <div className="space-y-2">
            {LETTERS.map((letter, i) => {
              const text = episode[OPTION_KEYS[i]];
              const optStats = stats?.options[letter];
              const isCorrect = letter === episode.answer;
              const isMyPick = letter === myLetter;
              const canInteract = !hasAnswered && !revealed && !!user;

              const optionEl = (
                <div className={cn(
                  'relative w-full text-left rounded-lg border px-4 py-3.5 transition-all duration-200 overflow-hidden',
                  getOptionStyle(letter),
                  canInteract && 'hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer',
                  !canInteract && 'cursor-default',
                )}>
                  {/* Sats progress fill */}
                  {(revealed || hasAnswered) && optStats && optStats.satPercent > 0 && (
                    <div
                      className="absolute inset-0 transition-all duration-700"
                      style={{
                        width: `${optStats.satPercent}%`,
                        background: isCorrect
                          ? 'linear-gradient(90deg, hsl(142 50% 30% / 0.3), transparent)'
                          : 'linear-gradient(90deg, hsl(0 40% 30% / 0.2), transparent)',
                      }}
                    />
                  )}

                  <div className="relative flex items-center gap-3">
                    {/* Letter badge */}
                    <span className={cn(
                      'font-cinzel font-bold text-xs shrink-0 w-6 h-6 flex items-center justify-center rounded border',
                      revealed && isCorrect
                        ? 'border-emerald-500 text-emerald-300 bg-emerald-900/40'
                        : isMyPick && !isCorrect
                        ? 'border-red-700 text-red-400 bg-red-900/20'
                        : isMyPick
                        ? 'border-amber-500 text-amber-300 bg-amber-900/20'
                        : 'border-amber-800/50 text-amber-700',
                    )}>
                      {LABELS[i]}
                    </span>

                    {/* Text */}
                    <span className="font-garamond text-sm leading-snug flex-1">{text}</span>

                    {/* Right side: stats or zap prompt */}
                    <div className="shrink-0 flex flex-col items-end gap-0.5 min-w-[72px]">
                      {(revealed || hasAnswered) && optStats ? (
                        <>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {optStats.count} {optStats.count === 1 ? 'voto' : 'votos'}
                          </span>
                          <span className="text-[11px] text-amber-600/70 tabular-nums flex items-center gap-0.5">
                            <Zap className="h-2.5 w-2.5" />
                            {optStats.sats.toLocaleString()} sats
                          </span>
                        </>
                      ) : canInteract ? (
                        <span className="text-[10px] text-amber-600/50 flex items-center gap-0.5 font-garamond">
                          <Zap className="h-2.5 w-2.5 fill-amber-600/50" />
                          {episode.zapAmount} sats
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );

              // Wrap clickable options in ZapDialogWrapper — always renders options even without Lightning
              if (canInteract) {
                return (
                  <ZapDialogWrapper
                    key={letter}
                    target={episode.event as Event}
                    onSuccess={() => onZapSuccess(letter)}
                  >
                    {optionEl}
                  </ZapDialogWrapper>
                );
              }

              return <div key={letter}>{optionEl}</div>;
            })}
          </div>

          {/* Not logged in */}
          {!user && !revealed && (
            <p className="font-garamond text-xs text-center text-muted-foreground/50 italic">
              Inicia sesión con Nostr para apostar tus sats ⚡
            </p>
          )}

          {/* Already answered (open episode) */}
          {hasAnswered && !revealed && (
            <div className="text-center py-2 px-4 rounded-lg border border-amber-800/30 bg-amber-900/10">
              <p className="font-garamond text-sm text-amber-400/80">
                Apostaste por la opción <span className="font-cinzel font-bold">{myLetter?.toUpperCase()}</span>.
                La respuesta se revelará el {revealDateStr ?? 'próximamente'}.
              </p>
            </div>
          )}

          {/* RESOLUTION PANEL */}
          {revealed && (
            <div className="space-y-4 pt-1">
              {/* Prize pool */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Coins, label: 'Total apostado', value: `${totalSats.toLocaleString()} sats` },
                  { icon: Trophy, label: 'Acertantes', value: `${winnerCount}` },
                  { icon: Zap, label: 'Por acertante', value: winnerCount > 0 ? `~${perWinner.toLocaleString()} sats` : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center p-3 rounded-lg border border-amber-900/25 bg-amber-900/10">
                    <Icon className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                    <p className="font-cinzel text-xs font-bold text-amber-300">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className={cn(
                'rounded-lg border p-4 space-y-3',
                isWinner ? 'border-emerald-700/40 bg-emerald-900/15'
                  : isLoser ? 'border-red-800/30 bg-red-900/10'
                  : 'border-amber-800/30 bg-amber-900/10',
              )}>
                <p className="font-cinzel text-xs flex items-center gap-1.5 text-amber-400/80">
                  <BookOpen className="h-3.5 w-3.5" />
                  {isWinner ? '¡Acertaste! Lo que realmente ocurrió:' : 'Lo que realmente ocurrió:'}
                </p>
                <p className="font-garamond text-sm leading-relaxed text-foreground/90">
                  {episode.answerExplanation}
                </p>
                {episode.source && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-garamond text-[11px] text-muted-foreground">Fuente:</span>
                    <SourceBadge sourceKey={episode.source} />
                  </div>
                )}
              </div>

              {/* Distribution note */}
              {winnerCount > 0 && totalSats > 0 && (
                <div className="rounded-lg border border-emerald-900/25 bg-emerald-900/10 p-3">
                  <p className="font-garamond text-xs text-muted-foreground leading-relaxed text-center">
                    <span className="text-emerald-400 font-semibold">{winnerCount} acertante{winnerCount !== 1 ? 's' : ''}</span> se
                    reparten los <span className="text-amber-400 font-semibold">{winnerSats.toLocaleString()} sats</span> apostados
                    en la opción correcta. Premio estimado:{' '}
                    <span className="text-amber-400 font-semibold">~{perWinner.toLocaleString()} sats</span> por persona.
                    El narrador redistribuye los sats mediante zap a cada ganador.
                  </p>
                </div>
              )}

              {winnerCount === 0 && totalSats > 0 && (
                <div className="rounded-lg border border-amber-900/20 bg-card/40 p-3 text-center">
                  <p className="font-garamond text-xs text-muted-foreground">
                    Nadie acertó esta vez. Los{' '}
                    <span className="text-amber-400">{totalSats.toLocaleString()} sats</span>{' '}
                    quedan en el tesoro de la expedición para el próximo episodio.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer stats */}
          <div className="flex items-center justify-between pt-1 border-t border-border/20">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {statsLoading
                ? <Skeleton className="h-3 w-14" />
                : <span>{stats?.total ?? 0} {stats?.total === 1 ? 'apuesta' : 'apuestas'}</span>}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-500/60">
              <Coins className="h-3.5 w-3.5" />
              {statsLoading
                ? <Skeleton className="h-3 w-20" />
                : <span>{totalSats.toLocaleString()} sats en juego</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
