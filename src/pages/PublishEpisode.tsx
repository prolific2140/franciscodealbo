import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { SiteHeader } from '@/components/SiteHeader';
import { NARRATOR_PUBKEY } from '@/hooks/useEpisodes';
import { HISTORICAL_SOURCES } from '@/components/SourcesPanel';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, Anchor, PenLine, Eye, EyeOff, BookOpen, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  episode: string;
  title: string;
  date: string;
  narrative: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: 'a' | 'b' | 'c' | 'd' | '';
  answerExplanation: string;
  zapAmount: string;
  source: string;
  /** ISO date string for when the answer is revealed (e.g. "2026-03-15") */
  revealDate: string;
}

const INITIAL_FORM: FormData = {
  episode: '',
  title: '',
  date: '',
  narrative: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  answer: '',
  answerExplanation: '',
  zapAmount: '21',
  source: '',
  revealDate: '',
};

function generateSlug(episode: string, title: string): string {
  const num = episode.padStart(3, '0');
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `ep-${num}-${slug}`;
}

export default function PublishEpisode() {
  useSeoMeta({ title: 'Publicar Episodio — Vuelta al Mundo' });

  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { mutate: publish, isPending } = useNostrPublish();
  const { toast } = useToast();

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const isNarrator = user?.pubkey === NARRATOR_PUBKEY;

  if (!user) {
    return (
      <div className="min-h-screen bg-ocean-deep">
        <SiteHeader />
        <div className="container max-w-3xl mx-auto px-4 py-24 text-center">
          <Anchor className="h-12 w-12 text-amber-800 mx-auto mb-4" />
          <h2 className="font-cinzel text-xl text-amber-400 mb-2">Acceso restringido</h2>
          <p className="font-garamond text-muted-foreground">Debes iniciar sesión con Nostr para publicar episodios.</p>
        </div>
      </div>
    );
  }

  if (!isNarrator) {
    return (
      <div className="min-h-screen bg-ocean-deep">
        <SiteHeader />
        <div className="container max-w-3xl mx-auto px-4 py-24 text-center">
          <ScrollText className="h-12 w-12 text-amber-800 mx-auto mb-4" />
          <h2 className="font-cinzel text-xl text-amber-400 mb-2">Solo el narrador puede publicar</h2>
          <p className="font-garamond text-muted-foreground">
            Solo Francisco de Albo, contramaestre de la nao Trinidad, puede escribir en esta bitácora.
          </p>
        </div>
      </div>
    );
  }

  const set = (key: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.answer) {
      toast({ title: 'Error', description: 'Debes elegir la respuesta correcta.', variant: 'destructive' });
      return;
    }
    if (!form.episode || !form.title || !form.date || !form.narrative ||
        !form.optionA || !form.optionB || !form.optionC || !form.optionD || !form.answerExplanation) {
      toast({ title: 'Error', description: 'Rellena todos los campos obligatorios.', variant: 'destructive' });
      return;
    }

    const d = generateSlug(form.episode, form.title);

    const tags: string[][] = [
      ['d', d],
      ['title', form.title],
      ['episode', form.episode],
      ['date', form.date],
      ['option_a', form.optionA],
      ['option_b', form.optionB],
      ['option_c', form.optionC],
      ['option_d', form.optionD],
      ['answer', form.answer],
      ['answer_explanation', form.answerExplanation],
      ['zap_amount', form.zapAmount || '21'],
      ['t', 'vuelta-al-mundo'],
      ['alt', `Episodio ${form.episode} de la primera circunnavegación del mundo (1519-1522): ${form.title}`],
    ];

    if (form.source) {
      tags.push(['source', form.source]);
    }

    // reveal_at: unix timestamp at midnight UTC on the chosen date
    if (form.revealDate) {
      const revealTs = Math.floor(new Date(`${form.revealDate}T12:00:00Z`).getTime() / 1000);
      tags.push(['reveal_at', String(revealTs)]);
    }

    publish(
      { kind: 37183, content: form.narrative, tags },
      {
        onSuccess: () => {
          toast({ title: '¡Episodio publicado!', description: `El episodio ${form.episode} ya está en los relays de Nostr.` });
          navigate('/');
        },
        onError: (err) => {
          toast({ title: 'Error al publicar', description: err.message, variant: 'destructive' });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-ocean-deep">
      <SiteHeader />

      <main className="container max-w-3xl mx-auto px-4 py-8 pb-16">
        {/* Page title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <PenLine className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="font-cinzel text-2xl font-bold text-amber-300 mb-2">Publicar Nuevo Episodio</h1>
          <p className="font-garamond text-sm text-muted-foreground">
            Escribe un nuevo capítulo de la bitácora de la primera circunnavegación
          </p>
        </div>

        {/* Sources reference panel */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowSources(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-md border border-amber-900/30 bg-amber-900/10 hover:bg-amber-900/20 transition-colors text-left"
          >
            <span className="font-cinzel text-xs text-amber-400 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Fuentes históricas de consulta
            </span>
            <span className="text-xs text-muted-foreground">
              {showSources ? 'Ocultar ▲' : 'Mostrar ▼'}
            </span>
          </button>

          {showSources && (
            <div className="mt-2 rounded-md border border-amber-900/25 bg-card/60 p-4 space-y-3">
              <p className="font-garamond text-xs text-muted-foreground">
                Consulta siempre alguna de estas fuentes antes de escribir el episodio para garantizar la fidelidad histórica:
              </p>
              {HISTORICAL_SOURCES.map(source => {
                const Icon = source.icon;
                return (
                  <div key={source.key} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                    <div className="shrink-0 p-1.5 rounded bg-amber-900/20 mt-0.5">
                      <Icon className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-cinzel text-xs text-amber-300">{source.title}</span>
                        <span className="font-garamond text-xs text-amber-700">— {source.author}</span>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-amber-600/70 hover:text-amber-400 transition-colors"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                            {source.url.replace('https://', '')}
                          </a>
                        )}
                      </div>
                      <p className="font-garamond text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {source.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Episode metadata */}
            <Card className="border border-amber-900/30 bg-card">
              <CardHeader className="pb-2">
                <h2 className="font-cinzel text-sm text-amber-400 flex items-center gap-2">
                  <Anchor className="h-4 w-4" /> Metadatos del episodio
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="episode" className="font-cinzel text-xs text-amber-500/80">
                      Episodio *
                    </Label>
                    <Input
                      id="episode"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={form.episode}
                      onChange={set('episode')}
                      className="bg-background/50 border-border/60 font-garamond"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="font-cinzel text-xs text-amber-500/80">
                      Fecha histórica *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={set('date')}
                      className="bg-background/50 border-border/60 font-garamond"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="revealDate" className="font-cinzel text-xs text-amber-500/80">
                      Resolución *
                    </Label>
                    <Input
                      id="revealDate"
                      type="date"
                      value={form.revealDate}
                      onChange={set('revealDate')}
                      className="bg-background/50 border-border/60 font-garamond"
                      required
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground font-garamond -mt-1">
                  La fecha de resolución es cuando se revela públicamente la respuesta correcta (1–2 días después de la publicación).
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="font-cinzel text-xs text-amber-500/80">
                    Título del episodio *
                  </Label>
                  <Input
                    id="title"
                    placeholder="Ej: La partida de Sanlúcar de Barrameda"
                    value={form.title}
                    onChange={set('title')}
                    className="bg-background/50 border-border/60 font-garamond"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-cinzel text-xs text-amber-500/80">
                    Fuente principal consultada
                  </Label>
                  <Select
                    value={form.source || 'none'}
                    onValueChange={(v) => setForm(f => ({ ...f, source: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger className="bg-background/50 border-border/60 font-garamond">
                      <SelectValue placeholder="Selecciona la fuente..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="font-garamond text-muted-foreground">Sin especificar</SelectItem>
                      {HISTORICAL_SOURCES.map(source => (
                        <SelectItem key={source.key} value={source.key} className="font-garamond">
                          {source.tag} — {source.author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground font-garamond">
                    Aparecerá como cita en la tarjeta del episodio
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Narrative */}
            <Card className="border border-amber-900/30 bg-card">
              <CardHeader className="pb-2">
                <h2 className="font-cinzel text-sm text-amber-400 flex items-center gap-2">
                  <ScrollText className="h-4 w-4" /> Narración del episodio
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <Label htmlFor="narrative" className="font-cinzel text-xs text-amber-500/80">
                    Crónica en primera persona *
                  </Label>
                  <Textarea
                    id="narrative"
                    placeholder="Yo, Francisco de Albo, contramaestre de la nao Trinidad, relato lo que aconteció..."
                    value={form.narrative}
                    onChange={set('narrative')}
                    className="bg-background/50 border-border/60 font-garamond text-base leading-relaxed min-h-[200px] resize-none"
                    required
                  />
                  <p className="text-xs text-muted-foreground">{form.narrative.length} caracteres</p>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Options */}
            <Card className="border border-amber-900/30 bg-card">
              <CardHeader className="pb-2">
                <h2 className="font-cinzel text-sm text-amber-400">Las cuatro opciones</h2>
                <p className="font-garamond text-xs text-muted-foreground">
                  Solo una debe ser verdadera. Las otras tres deben ser plausibles pero incorrectas.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map((label) => {
                  const key = `option${label}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                  const letter = label.toLowerCase() as 'a' | 'b' | 'c' | 'd';
                  const isCorrect = form.answer === letter;
                  return (
                    <div key={label} className={cn(
                      'flex gap-3 p-3 rounded-md border transition-colors',
                      isCorrect ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-border/50'
                    )}>
                      <span className={cn(
                        'font-cinzel font-bold text-sm shrink-0 w-5 mt-2.5',
                        isCorrect ? 'text-emerald-400' : 'text-amber-500/60'
                      )}>{label}.</span>
                      <Input
                        placeholder={`Opción ${label}`}
                        value={form[key]}
                        onChange={set(key)}
                        className="bg-background/50 border-border/60 font-garamond"
                        required
                      />
                    </div>
                  );
                })}

                <div className="space-y-1.5 pt-2">
                  <Label className="font-cinzel text-xs text-amber-500/80">Respuesta correcta *</Label>
                  <Select
                    value={form.answer}
                    onValueChange={(v) => setForm(f => ({ ...f, answer: v as 'a' | 'b' | 'c' | 'd' }))}
                  >
                    <SelectTrigger className="bg-background/50 border-border/60 font-garamond">
                      <SelectValue placeholder="Elige la opción correcta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(['a', 'b', 'c', 'd'] as const).map(letter => (
                        <SelectItem key={letter} value={letter} className="font-garamond">
                          Opción {letter.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Answer explanation */}
            <Card className="border border-amber-900/30 bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-cinzel text-sm text-amber-400">Explicación de la respuesta</h2>
                    <p className="font-garamond text-xs text-muted-foreground mt-0.5">
                      Se revela al usuario tras responder. Cita la fuente donde se documenta el hecho.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAnswer(v => !v)}
                    className="text-xs text-muted-foreground flex items-center gap-1 hover:text-amber-400 transition-colors shrink-0"
                  >
                    {showAnswer ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showAnswer ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Explica qué ocurrió realmente y por qué esa es la respuesta correcta. Puedes citar literalmente a Pigafetta, al Derrotero de Albo, a Ginés de Mafra o a rutaelcano.com..."
                  value={form.answerExplanation}
                  onChange={set('answerExplanation')}
                  className="bg-background/50 border-border/60 font-garamond text-base leading-relaxed min-h-[140px] resize-none"
                  required
                />
                <div className="space-y-1.5">
                  <Label htmlFor="zapAmount" className="font-cinzel text-xs text-amber-500/80">
                    Sats sugeridos para apostar
                  </Label>
                  <Input
                    id="zapAmount"
                    type="number"
                    min="1"
                    placeholder="21"
                    value={form.zapAmount}
                    onChange={set('zapAmount')}
                    className="bg-background/50 border-border/60 font-garamond max-w-[120px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview generated slug */}
            {form.episode && form.title && (
              <div className="text-xs text-muted-foreground font-mono bg-muted/20 px-3 py-2 rounded-md border border-border/40">
                ID del evento:{' '}
                <span className="text-amber-500">{generateSlug(form.episode, form.title)}</span>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-amber-950 font-cinzel font-bold text-sm gap-2"
              >
                <PenLine className="h-4 w-4" />
                {isPending ? 'Publicando en Nostr...' : 'Publicar episodio'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="font-cinzel text-sm border-border/60"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
