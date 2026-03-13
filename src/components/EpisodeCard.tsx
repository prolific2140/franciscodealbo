import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useEpisodeAnswers, useUserAnswer } from '@/hooks/useEpisodeAnswers';
import { useToast } from '@/hooks/useToast';
import { genUserName } from '@/lib/genUserName';
import type { QuizEpisode } from '@/hooks/useEpisodes';
import { Zap, Anchor, ScrollText, Users, ChevronDown, ChevronUp, BookOpen, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EpisodeCardProps {
  episode: QuizEpisode;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'] as const;
const OPTION_LETTERS = ['a', 'b', 'c', 'd'] as const;

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const { user } = useCurrentUser();
  const author = useAuthor(episode.event.pubkey);
  const { mutate: publish, isPending: isPublishing } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [expanded, setExpanded] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const { data: stats, isLoading: statsLoading } = useEpisodeAnswers(episode.event.id, undefined);
  const { data: userAnswer } = useUserAnswer(episode.event.id, user?.pubkey);

  const authorMeta = author.data?.metadata;
  const displayName = authorMeta?.name ?? genUserName(episode.event.pubkey);
  const avatar = authorMeta?.picture;

  const hasAnswered = !!userAnswer?.answerLetter;
  const myAnswer = userAnswer?.answerLetter ?? pendingAnswer;
  const isCorrect = myAnswer === episode.answer;

  function handleSelectOption(letter: 'a' | 'b' | 'c' | 'd') {
    if (hasAnswered || isPublishing) return;
    if (!user) {
      toast({ title: 'Inicia sesión', description: 'Debes iniciar sesión en Nostr para responder.', variant: 'destructive' });
      return;
    }
    setPendingAnswer(letter);
  }

  function handleSubmitAnswer() {
    if (!pendingAnswer || !user) return;
    const letter = pendingAnswer;
    const optionTextMap = { a: episode.optionA, b: episode.optionB, c: episode.optionC, d: episode.optionD };
    const optionText = optionTextMap[letter];
    const aTag = `37183:${episode.event.pubkey}:${episode.d}`;

    publish(
      {
        kind: 1,
        content: `Mi apuesta: ${letter.toUpperCase()} — ${optionText} #vuelta-al-mundo`,
        tags: [
          ['e', episode.event.id],
          ['a', aTag],
          ['t', 'vuelta-al-mundo'],
          ['t', `answer:${letter}`],
        ],
      },
      {
        onSuccess: () => {
          toast({ title: '¡Respuesta registrada!', description: `Has elegido la opción ${letter.toUpperCase()}. ¡Ahora zappea al narrador para apostar tus sats!` });
          queryClient.invalidateQueries({ queryKey: ['vuelta-al-mundo', 'answers', episode.event.id] });
          queryClient.invalidateQueries({ queryKey: ['vuelta-al-mundo', 'user-answer', episode.event.id, user.pubkey] });
          setShowExplanation(true);
        },
        onError: () => {
          toast({ title: 'Error', description: 'No se pudo publicar tu respuesta.', variant: 'destructive' });
        },
      }
    );
  }

  const getOptionStyle = (letter: 'a' | 'b' | 'c' | 'd') => {
    const showResults = hasAnswered || showExplanation;
    if (showResults) {
      if (letter === episode.answer) return 'border-emerald-500 bg-emerald-500/15 text-emerald-200';
      if (letter === myAnswer && letter !== episode.answer) return 'border-red-700 bg-red-900/20 text-red-300';
      return 'border-border/50 bg-card/30 text-muted-foreground opacity-60';
    }
    if (letter === pendingAnswer) return 'border-amber-500 bg-amber-500/10 text-amber-200 shadow-[0_0_12px_hsl(38_85%_55%/0.2)]';
    return 'border-border bg-card/50 hover:border-amber-500/40 hover:bg-amber-500/5 text-foreground cursor-pointer';
  };

  const getOptionPercent = (letter: 'a' | 'b' | 'c' | 'd') => {
    if (!stats) return 0;
    return { a: stats.percentA, b: stats.percentB, c: stats.percentC, d: stats.percentD }[letter];
  };

  const getOptionCount = (letter: 'a' | 'b' | 'c' | 'd') => {
    if (!stats) return 0;
    return { a: stats.countA, b: stats.countB, c: stats.countC, d: stats.countD }[letter];
  };

  const formattedDate = (() => {
    try {
      const parts = episode.date.split('-');
      if (parts.length === 3) {
        const d = new Date(`${episode.date}T12:00:00`);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        }
      }
      return episode.date;
    } catch {
      return episode.date;
    }
  })();

  const showResults = hasAnswered || showExplanation;

  return (
    <Card className="border border-amber-900/30 bg-card shadow-2xl overflow-hidden relative group">
      {/* Golden top border accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-amber-700/40 ring-1 ring-amber-500/20 shrink-0">
              <AvatarImage src={avatar} alt={displayName} />
              <AvatarFallback className="bg-amber-900/30 text-amber-300 font-cinzel text-xs">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-cinzel text-sm text-amber-400 font-semibold leading-tight">{displayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Anchor className="h-3 w-3 shrink-0" />
                {formattedDate}
              </p>
            </div>
          </div>
          <Badge className="font-cinzel text-xs bg-amber-900/30 text-amber-400 border-amber-700/40 whitespace-nowrap shrink-0">
            Ep. {episode.episode}
          </Badge>
        </div>

        <h2 className="font-cinzel text-lg font-bold text-amber-200 mt-3 leading-snug">
          {episode.title}
        </h2>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Narrative */}
        <div className="relative">
          <div
            className={cn(
              'text-foreground/90 font-garamond text-base leading-relaxed',
              !expanded && 'max-h-28 overflow-hidden'
            )}
          >
            <p>{episode.narrative}</p>
          </div>
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-amber-500/80 hover:text-amber-400 mt-2 transition-colors"
          >
            {expanded
              ? <><ChevronUp className="h-3 w-3" /> Leer menos</>
              : <><ChevronDown className="h-3 w-3" /> Continuar leyendo...</>}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-800/40" />
          <span className="font-cinzel text-[10px] text-amber-600/70 flex items-center gap-1.5 shrink-0">
            <ScrollText className="h-3 w-3" /> ¿Qué ocurrió?
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-800/40" />
        </div>

        {/* Quiz Options */}
        <div className="grid grid-cols-1 gap-2">
          {OPTION_LETTERS.map((letter, i) => {
            const text = episode[OPTION_KEYS[i]];
            const pct = getOptionPercent(letter);
            const count = getOptionCount(letter);
            const style = getOptionStyle(letter);

            return (
              <button
                key={letter}
                onClick={() => handleSelectOption(letter)}
                disabled={hasAnswered || isPublishing}
                className={cn(
                  'relative w-full text-left rounded-md border px-4 py-3 transition-all duration-200 overflow-hidden',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
                  style
                )}
              >
                {/* Progress bar background */}
                {showResults && (
                  <div
                    className="absolute inset-0 transition-all duration-700 ease-out"
                    style={{
                      width: `${pct}%`,
                      background: letter === episode.answer
                        ? 'linear-gradient(90deg, hsl(142 50% 35% / 0.3), transparent)'
                        : 'linear-gradient(90deg, hsl(0 50% 35% / 0.2), transparent)',
                    }}
                  />
                )}
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-cinzel font-bold text-sm shrink-0 w-5 text-amber-500/80">{OPTION_LABELS[i]}.</span>
                    <span className="font-garamond text-sm leading-snug">{text}</span>
                  </div>
                  {showResults && (
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit button (when option selected but not yet answered) */}
        {pendingAnswer && !hasAnswered && (
          <Button
            onClick={handleSubmitAnswer}
            disabled={isPublishing}
            className="w-full bg-amber-600 hover:bg-amber-500 text-amber-950 font-cinzel font-bold gap-2"
          >
            <Swords className="h-4 w-4" />
            {isPublishing ? 'Registrando...' : `Apostar por la opción ${pendingAnswer.toUpperCase()}`}
          </Button>
        )}

        {/* Reveal without betting */}
        {!hasAnswered && !showExplanation && !pendingAnswer && (
          <button
            onClick={() => setShowExplanation(true)}
            className="text-xs text-muted-foreground/60 hover:text-amber-500/80 transition-colors underline underline-offset-2"
          >
            Ver respuesta sin apostar
          </button>
        )}

        {/* Answer explanation */}
        {showResults && (
          <div className={cn(
            'rounded-md border p-4 font-garamond text-sm leading-relaxed',
            isCorrect && hasAnswered
              ? 'border-emerald-700/40 bg-emerald-900/20 text-emerald-200'
              : showExplanation && !hasAnswered
              ? 'border-amber-700/30 bg-amber-900/10 text-amber-200/80'
              : 'border-red-800/30 bg-red-900/15 text-red-300/80'
          )}>
            <p className="font-cinzel text-[11px] mb-2 flex items-center gap-1.5 opacity-80">
              <BookOpen className="h-3 w-3" />
              {hasAnswered
                ? isCorrect ? '¡Acertaste! Lo que realmente ocurrió:' : 'Fallaste. Lo que realmente ocurrió:'
                : 'Lo que realmente ocurrió:'}
            </p>
            <p>{episode.answerExplanation}</p>
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {statsLoading ? (
              <Skeleton className="h-3 w-16" />
            ) : (
              <span>{stats?.total ?? 0} {stats?.total === 1 ? 'respuesta' : 'respuestas'}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-500/70">
            <Zap className="h-3.5 w-3.5" />
            <span>Zappea {episode.zapAmount} sats al narrador</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
