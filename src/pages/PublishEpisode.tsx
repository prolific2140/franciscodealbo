import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { SiteHeader } from '@/components/SiteHeader';
import { NARRATOR_PUBKEY } from '@/hooks/useEpisodes';
import { HISTORICAL_SOURCES } from '@/components/SourcesPanel';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useEpisodes } from '@/hooks/useEpisodes';
import { useGenerateEpisode } from '@/hooks/useGenerateEpisode';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ScrollText, Anchor, PenLine, Eye, EyeOff,
  Sparkles, RotateCcw, CheckCircle, AlertCircle, Calendar,
} from 'lucide-react';
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
  revealDate: string;
}

const INITIAL_FORM: FormData = {
  episode: '', title: '', date: '', narrative: '',
  optionA: '', optionB: '', optionC: '', optionD: '',
  answer: '', answerExplanation: '', zapAmount: '21', source: '', revealDate: '',
};

function generateSlug(episode: string, title: string): string {
  const num = episode.padStart(3, '0');
  const slug = title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `ep-${num}-${slug}`;
}

/** Translate today's month/day into the corresponding expedition year (1519-1522) */
function expeditionDate(publishDate: string): string {
  if (!publishDate) return '';
  const d = new Date(`${publishDate}T12:00:00`);
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();

  // Expedition ran from sep 1519 to sep 1522
  // Map the calendar day to the correct expedition year:
  // Sep 20 1519 → Sep 6 1522. We pick the year that best matches the narrative arc.
  // Simple rule: use 1520 for Jan-Aug, 1519 for Sep-Dec of first year,
  // but we let the AI figure out what happened — we just give it a plausible year.
  let year: number;
  if (month >= 9) {
    year = 1519; // Sep–Dec 1519 (departure phase)
  } else if (month <= 6) {
    year = 1520; // Jan–Jun 1520 (Patagonia, strait)
  } else {
    year = 1521; // Jul–Aug 1521 (Philippines, Moluccas)
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function PublishEpisode() {
  useSeoMeta({ title: 'Publicar Episodio — Vuelta al Mundo' });

  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { mutate: publish, isPending: isPublishing } = useNostrPublish();
  const { data: episodes } = useEpisodes();
  const { generate, isGenerating } = useGenerateEpisode();
  const { toast } = useToast();

  const [publishDate, setPublishDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [generated, setGenerated] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const isNarrator = user?.pubkey === NARRATOR_PUBKEY;

  // Auto-fill episode number from existing episodes
  const nextEpisode = (episodes?.length ?? 0) + 1;
  useEffect(() => {
    if (nextEpisode && !form.episode) {
      setForm(f => ({ ...f, episode: String(nextEpisode) }));
    }
  }, [nextEpisode]);

  // Auto-fill reveal date = publishDate + 2 days
  useEffect(() => {
    if (publishDate) {
      const d = new Date(`${publishDate}T12:00:00`);
      d.setDate(d.getDate() + 2);
      const reveal = d.toISOString().slice(0, 10);
      setForm(f => ({ ...f, revealDate: reveal }));
    }
  }, [publishDate]);

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
            Solo Francisco de Albo puede escribir en esta bitácora.
          </p>
        </div>
      </div>
    );
  }

  const set = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleGenerate() {
    const histDate = expeditionDate(publishDate);
    if (!histDate) {
      toast({ title: 'Error', description: 'Selecciona una fecha de publicación.', variant: 'destructive' });
      return;
    }
    try {
      const ep = await generate(histDate, parseInt(form.episode) || nextEpisode);
      setForm(f => ({
        ...f,
        title: ep.title,
        narrative: ep.narrative,
        optionA: ep.optionA,
        optionB: ep.optionB,
        optionC: ep.optionC,
        optionD: ep.optionD,
        answer: ep.answer,
        answerExplanation: ep.answerExplanation,
        source: ep.source,
        date: histDate,
      }));
      setGenerated(true);
      toast({ title: '✓ Episodio generado', description: 'Revisa el contenido y publica cuando estés listo.' });
    } catch (err) {
      toast({ title: 'Error al generar', description: (err as Error).message, variant: 'destructive' });
    }
  }

  function handleReset() {
    setForm(f => ({
      ...INITIAL_FORM,
      episode: f.episode,
      revealDate: f.revealDate,
    }));
    setGenerated(false);
  }

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
    if (form.source) tags.push(['source', form.source]);
    if (form.revealDate) {
      const ts = Math.floor(new Date(`${form.revealDate}T12:00:00Z`).getTime() / 1000);
      tags.push(['reveal_at', String(ts)]);
    }

    publish(
      { kind: 37183, content: form.narrative, tags },
      {
        onSuccess: () => {
          toast({ title: '⚓ ¡Episodio publicado!', description: `El episodio ${form.episode} ya navega en Nostr.` });
          navigate('/');
        },
        onError: (err) => toast({ title: 'Error al publicar', description: err.message, variant: 'destructive' }),
      }
    );
  }

  const histDate = expeditionDate(publishDate);
  const histFormatted = histDate
    ? new Date(`${histDate}T12:00:00`).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-ocean-deep">
      <SiteHeader />

      <main className="container max-w-3xl mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative p-3 rounded-full border border-amber-700/30 bg-amber-900/20">
              <PenLine className="h-7 w-7 text-amber-500" />
            </div>
          </div>
          <h1 className="font-cinzel text-2xl font-bold text-amber-300 mb-2">Publicar Nuevo Episodio</h1>
          <p className="font-garamond text-sm text-muted-foreground">
            Elige la fecha de hoy y deja que la IA genere el episodio histórico correspondiente
          </p>
        </div>

        {/* ── STEP 1: Date selector + Generate ── */}
        <Card className="border border-amber-900/30 bg-card mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="font-cinzel text-sm text-amber-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Paso 1 — Selecciona la fecha y genera el episodio
              </h2>
              {generated && (
                <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-700/40 font-cinzel text-[10px]">
                  <CheckCircle className="h-3 w-3 mr-1" /> Generado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="publishDate" className="font-cinzel text-xs text-amber-500/80">
                  Fecha de publicación (hoy)
                </Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={publishDate}
                  onChange={e => {
                    setPublishDate(e.target.value);
                    setGenerated(false);
                  }}
                  className="bg-background/50 border-border/60 font-garamond"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-cinzel text-xs text-amber-500/80">Fecha histórica equivalente</Label>
                <div className="h-9 px-3 flex items-center rounded-md border border-border/40 bg-muted/20">
                  <span className="font-garamond text-sm text-amber-400">{histFormatted || '—'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="episode" className="font-cinzel text-xs text-amber-500/80">Nº de episodio</Label>
                <Input
                  id="episode"
                  type="number"
                  min="1"
                  value={form.episode}
                  onChange={set('episode')}
                  className="bg-background/50 border-border/60 font-garamond"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zapAmount" className="font-cinzel text-xs text-amber-500/80">Sats por apuesta</Label>
                <Input
                  id="zapAmount"
                  type="number"
                  min="1"
                  value={form.zapAmount}
                  onChange={set('zapAmount')}
                  className="bg-background/50 border-border/60 font-garamond"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="revealDate" className="font-cinzel text-xs text-amber-500/80">Fecha resolución</Label>
                <Input
                  id="revealDate"
                  type="date"
                  value={form.revealDate}
                  onChange={set('revealDate')}
                  className="bg-background/50 border-border/60 font-garamond"
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground font-garamond">
              La resolución se publica automáticamente en 2 días. Podrás editar cualquier campo generado antes de publicar.
            </p>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !publishDate}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-amber-950 font-cinzel font-bold text-sm gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin">⚙</span>
                    Consultando las fuentes históricas...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generar episodio con IA
                  </>
                )}
              </Button>
              {generated && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="font-cinzel text-xs border-border/60 gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Regenerar
                </Button>
              )}
            </div>

            {isGenerating && (
              <div className="rounded-lg border border-amber-900/25 bg-amber-900/10 p-4 text-center">
                <p className="font-garamond text-sm text-amber-400/80 italic">
                  "Consultando el Derrotero, a Pigafetta, a Ginés de Mafra..."
                </p>
                <div className="flex justify-center gap-1 mt-3">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-amber-500/60 animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── STEP 2: Review & edit generated content ── */}
        {generated && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Section header */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900/40" />
                <span className="font-cinzel text-xs text-amber-600/70 tracking-widest uppercase">
                  Paso 2 — Revisa y publica
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900/40" />
              </div>

              <div className="rounded-lg border border-amber-900/20 bg-amber-900/10 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="font-garamond text-xs text-muted-foreground leading-relaxed">
                  Revisa cuidadosamente el contenido generado por la IA. Puedes editar cualquier campo.
                  Asegúrate de que los hechos son exactos antes de publicar. La IA se basa en las fuentes
                  históricas documentadas, pero siempre contrasta con las obras originales.
                </p>
              </div>

              {/* Title */}
              <Card className="border border-amber-900/30 bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="font-cinzel text-xs text-amber-500/80">Título *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={set('title')}
                      className="bg-background/50 border-border/60 font-cinzel text-amber-200 font-semibold"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-cinzel text-xs text-amber-500/80">Fecha histórica</Label>
                      <Input
                        value={form.date}
                        onChange={set('date')}
                        className="bg-background/50 border-border/60 font-garamond"
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-cinzel text-xs text-amber-500/80">Fuente principal</Label>
                      <Select
                        value={form.source || 'none'}
                        onValueChange={v => setForm(f => ({ ...f, source: v === 'none' ? '' : v }))}
                      >
                        <SelectTrigger className="bg-background/50 border-border/60 font-garamond">
                          <SelectValue placeholder="Fuente..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="font-garamond text-muted-foreground">Sin especificar</SelectItem>
                          {HISTORICAL_SOURCES.map(s => (
                            <SelectItem key={s.key} value={s.key} className="font-garamond">
                              {s.tag} — {s.author}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Narrative */}
              <Card className="border border-amber-900/30 bg-card">
                <CardHeader className="pb-2">
                  <h2 className="font-cinzel text-sm text-amber-400 flex items-center gap-2">
                    <ScrollText className="h-4 w-4" /> Narración
                  </h2>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={form.narrative}
                    onChange={set('narrative')}
                    className="bg-background/50 border-border/60 font-garamond text-base leading-relaxed min-h-[220px] resize-none"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">{form.narrative.length} caracteres</p>
                </CardContent>
              </Card>

              {/* Options */}
              <Card className="border border-amber-900/30 bg-card">
                <CardHeader className="pb-2">
                  <h2 className="font-cinzel text-sm text-amber-400">Las cuatro opciones</h2>
                  <p className="font-garamond text-xs text-muted-foreground">La correcta aparece resaltada en verde</p>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {(['A', 'B', 'C', 'D'] as const).map(label => {
                    const key = `option${label}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                    const letter = label.toLowerCase() as 'a' | 'b' | 'c' | 'd';
                    const isCorrect = form.answer === letter;
                    return (
                      <div key={label} className={cn(
                        'flex gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                        isCorrect ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-border/40 hover:border-amber-800/50',
                      )}
                        onClick={() => setForm(f => ({ ...f, answer: letter }))}
                      >
                        <span className={cn(
                          'font-cinzel font-bold text-sm shrink-0 w-6 h-6 flex items-center justify-center rounded border mt-1',
                          isCorrect ? 'border-emerald-500 text-emerald-300 bg-emerald-900/30' : 'border-amber-800/50 text-amber-700',
                        )}>
                          {label}
                        </span>
                        <div className="flex-1 space-y-1">
                          <Input
                            value={form[key]}
                            onChange={set(key)}
                            onClick={e => e.stopPropagation()}
                            className="bg-background/50 border-border/60 font-garamond"
                            required
                          />
                          {isCorrect && (
                            <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Respuesta correcta — haz clic en otra para cambiar
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Explanation */}
              <Card className="border border-amber-900/30 bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-cinzel text-sm text-amber-400">Explicación de la respuesta</h2>
                      <p className="font-garamond text-xs text-muted-foreground mt-0.5">
                        Se revela tras apostar. Debe citar la fuente.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAnswer(v => !v)}
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-amber-400 transition-colors"
                    >
                      {showAnswer ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {showAnswer ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={form.answerExplanation}
                    onChange={set('answerExplanation')}
                    className="bg-background/50 border-border/60 font-garamond text-base leading-relaxed min-h-[140px] resize-none"
                    required
                  />
                </CardContent>
              </Card>

              {/* Slug preview */}
              {form.episode && form.title && (
                <div className="text-xs text-muted-foreground font-mono bg-muted/20 px-3 py-2 rounded-md border border-border/30">
                  ID: <span className="text-amber-500">{generateSlug(form.episode, form.title)}</span>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isPublishing}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-amber-950 font-cinzel font-bold text-sm gap-2"
                >
                  <PenLine className="h-4 w-4" />
                  {isPublishing ? 'Publicando en Nostr...' : `Publicar Episodio ${form.episode}`}
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
        )}
      </main>
    </div>
  );
}
