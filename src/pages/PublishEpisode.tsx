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
  title: string;
  /** ISO date in expedition year, e.g. "1521-03-13" */
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
  title: '', date: '', narrative: '',
  optionA: '', optionB: '', optionC: '', optionD: '',
  answer: '', answerExplanation: '', zapAmount: '21', source: '', revealDate: '',
};

const EXPEDITION_YEARS = [1519, 1520, 1521, 1522] as const;

function generateSlug(episode: number, title: string): string {
  const num = String(episode).padStart(3, '0');
  const slug = title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `ep-${num}-${slug}`;
}

/** Extract YYYY-MM-DD parts from an ISO date string, with fallback defaults */
function parseDateParts(iso: string): { year: number; month: string; day: string } {
  const parts = iso.split('-');
  return {
    year: parseInt(parts[0]) || 1521,
    month: parts[1] ?? '03',
    day: parts[2] ?? '13',
  };
}

/** Build ISO date from parts */
function buildDate(year: number, month: string, day: string): string {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/** Default expedition year for a given calendar month */
function defaultExpeditionYear(month: number): number {
  if (month >= 9) return 1519;   // Sep–Dec: departure & Atlantic crossing
  if (month <= 3) return 1521;   // Jan–Mar: Pacific crossing & Philippines
  if (month <= 6) return 1520;   // Apr–Jun: Patagonia & strait
  return 1521;                   // Jul–Aug: Philippines & Moluccas
}

export default function PublishEpisode() {
  useSeoMeta({ title: 'Publicar Episodio — Vuelta al Mundo' });

  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { mutate: publish, isPending: isPublishing } = useNostrPublish();
  const { data: episodes, isLoading: loadingEpisodes } = useEpisodes();
  const { generate, isGenerating } = useGenerateEpisode();
  const { toast } = useToast();

  // Today's calendar date (for display and reveal calculation)
  const [publishDate, setPublishDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Expedition date parts — editable independently
  const todayMonth = new Date().getMonth() + 1;
  const todayDay = new Date().getDate();
  const [histYear, setHistYear] = useState<number>(() => defaultExpeditionYear(todayMonth));
  const [histMonth, setHistMonth] = useState<string>(() => String(todayMonth).padStart(2, '0'));
  const [histDay, setHistDay] = useState<string>(() => String(todayDay).padStart(2, '0'));

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [generated, setGenerated] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const isNarrator = user?.pubkey === NARRATOR_PUBKEY;
  const nextEpisode = (episodes?.length ?? 0) + 1;

  // Keep form.date in sync with the three selectors
  useEffect(() => {
    setForm(f => ({ ...f, date: buildDate(histYear, histMonth, histDay) }));
  }, [histYear, histMonth, histDay]);

  // Auto-fill reveal date = publishDate + 2 days
  useEffect(() => {
    if (publishDate) {
      const d = new Date(`${publishDate}T12:00:00`);
      d.setDate(d.getDate() + 2);
      setForm(f => ({ ...f, revealDate: d.toISOString().slice(0, 10) }));
    }
  }, [publishDate]);

  // ── Guards ────────────────────────────────────────────────────────────────

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
          <p className="font-garamond text-muted-foreground">Solo Francisco de Albo puede escribir en esta bitácora.</p>
        </div>
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  const set = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleGenerate() {
    const histDate = buildDate(histYear, histMonth, histDay);
    try {
      const ep = await generate(histDate, nextEpisode);
      // If the AI returns a date, sync the selectors
      if (ep.date) {
        const parts = parseDateParts(ep.date as unknown as string);
        if (EXPEDITION_YEARS.includes(parts.year as typeof EXPEDITION_YEARS[number])) {
          setHistYear(parts.year);
          setHistMonth(parts.month);
          setHistDay(parts.day);
        }
      }
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
      toast({ title: '✓ Episodio generado', description: `Ep. ${nextEpisode} listo. Revisa y publica.` });
    } catch (err) {
      toast({ title: 'Error al generar', description: (err as Error).message, variant: 'destructive' });
    }
  }

  function handleReset() {
    setForm(f => ({ ...INITIAL_FORM, date: f.date, revealDate: f.revealDate }));
    setGenerated(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.answer) {
      toast({ title: 'Falta la respuesta', description: 'Haz clic en una opción para marcarla como correcta.', variant: 'destructive' });
      return;
    }
    if (!form.title || !form.date || !form.narrative ||
      !form.optionA || !form.optionB || !form.optionC || !form.optionD || !form.answerExplanation) {
      toast({ title: 'Campos incompletos', description: 'Rellena todos los campos antes de publicar.', variant: 'destructive' });
      return;
    }

    const epNum = nextEpisode;
    const dTag = generateSlug(epNum, form.title);

    const tags: string[][] = [
      ['d', dTag],
      ['title', form.title],
      ['episode', String(epNum)],
      ['date', form.date],
      ['option_a', form.optionA],
      ['option_b', form.optionB],
      ['option_c', form.optionC],
      ['option_d', form.optionD],
      ['answer', form.answer],
      ['answer_explanation', form.answerExplanation],
      ['zap_amount', form.zapAmount || '21'],
      ['t', 'vuelta-al-mundo'],
      ['alt', `Episodio ${epNum} de la primera circunnavegación del mundo (1519-1522): ${form.title}`],
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
          toast({ title: '⚓ ¡Episodio publicado!', description: `El episodio #${epNum} ya navega en Nostr.` });
          navigate('/episodios');
        },
        onError: (err) => {
          toast({ title: 'Error al publicar', description: err.message, variant: 'destructive' });
        },
      }
    );
  }

  const histDateFormatted = (() => {
    try {
      return new Date(`${form.date}T12:00:00`).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return form.date; }
  })();

  // ── Render ────────────────────────────────────────────────────────────────

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
            Configura la fecha y deja que la IA genere el episodio histórico correspondiente
          </p>
        </div>

        {/* ── STEP 1 ── */}
        <Card className="border border-amber-900/30 bg-card mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="font-cinzel text-sm text-amber-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Paso 1 — Configura las fechas y genera
              </h2>
              {generated && (
                <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-700/40 font-cinzel text-[10px]">
                  <CheckCircle className="h-3 w-3 mr-1" /> Generado
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">

            {/* Episode number (read-only) */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-amber-900/30 bg-amber-900/10">
              <span className="font-cinzel text-xs text-amber-600/70">Episodio</span>
              {loadingEpisodes
                ? <span className="font-cinzel text-sm text-muted-foreground animate-pulse">calculando…</span>
                : <span className="font-cinzel text-lg font-bold text-amber-400">#{nextEpisode}</span>
              }
              <span className="font-garamond text-xs text-muted-foreground ml-auto">
                {episodes?.length ?? 0} publicados
              </span>
            </div>

            {/* Publication date + reveal date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="publishDate" className="font-cinzel text-xs text-amber-500/80">
                  Fecha de publicación
                </Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={publishDate}
                  onChange={e => { setPublishDate(e.target.value); setGenerated(false); }}
                  className="bg-background/50 border-border/60 font-garamond"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="revealDate" className="font-cinzel text-xs text-amber-500/80">
                  Fecha de resolución
                </Label>
                <Input
                  id="revealDate"
                  type="date"
                  value={form.revealDate}
                  onChange={set('revealDate')}
                  className="bg-background/50 border-border/60 font-garamond"
                />
              </div>
            </div>

            {/* Historical date with YEAR selector */}
            <div className="space-y-2">
              <Label className="font-cinzel text-xs text-amber-500/80">
                Fecha histórica de la expedición
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {/* Year selector — key control */}
                <div className="space-y-1">
                  <p className="font-cinzel text-[10px] text-muted-foreground uppercase tracking-widest">Año</p>
                  <Select
                    value={String(histYear)}
                    onValueChange={v => { setHistYear(Number(v)); setGenerated(false); }}
                  >
                    <SelectTrigger className="bg-background/50 border-amber-800/50 font-cinzel text-amber-300 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPEDITION_YEARS.map(y => (
                        <SelectItem key={y} value={String(y)} className="font-cinzel">
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Month */}
                <div className="space-y-1">
                  <p className="font-cinzel text-[10px] text-muted-foreground uppercase tracking-widest">Mes</p>
                  <Select
                    value={histMonth}
                    onValueChange={v => { setHistMonth(v); setGenerated(false); }}
                  >
                    <SelectTrigger className="bg-background/50 border-border/60 font-garamond">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const m = String(i + 1).padStart(2, '0');
                        const name = new Date(`2000-${m}-01`).toLocaleDateString('es-ES', { month: 'long' });
                        return (
                          <SelectItem key={m} value={m} className="font-garamond capitalize">
                            {name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {/* Day */}
                <div className="space-y-1">
                  <p className="font-cinzel text-[10px] text-muted-foreground uppercase tracking-widest">Día</p>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={histDay}
                    onChange={e => { setHistDay(e.target.value.padStart(2, '0')); setGenerated(false); }}
                    className="bg-background/50 border-border/60 font-garamond"
                  />
                </div>
              </div>
              {/* Formatted preview */}
              {form.date && (
                <p className="font-garamond text-sm text-amber-400/80 italic pl-1">
                  {histDateFormatted}
                </p>
              )}
            </div>

            {/* Zap amount */}
            <div className="space-y-1.5">
              <Label htmlFor="zapAmount" className="font-cinzel text-xs text-amber-500/80">
                Sats mínimos por apuesta
              </Label>
              <Input
                id="zapAmount"
                type="number"
                min="1"
                value={form.zapAmount}
                onChange={set('zapAmount')}
                className="bg-background/50 border-border/60 font-garamond w-40"
              />
            </div>

            {/* Generate button */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || loadingEpisodes}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-amber-950 font-cinzel font-bold text-sm gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin inline-block">⚙</span>
                    Consultando las fuentes históricas...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generar episodio #{nextEpisode} con IA
                  </>
                )}
              </Button>
              {generated && (
                <Button type="button" variant="outline" onClick={handleReset}
                  className="font-cinzel text-xs border-border/60 gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Regenerar
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
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-amber-500/60 animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── STEP 2: Review & publish ── */}
        {generated && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">

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
                  Revisa el contenido generado. Puedes editar cualquier campo.
                  Contrasta los hechos con las fuentes originales antes de publicar.
                </p>
              </div>

              {/* Title + source */}
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
                  <p className="font-garamond text-xs text-muted-foreground">Haz clic en una opción para marcarla como correcta</p>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {(['A', 'B', 'C', 'D'] as const).map(label => {
                    const key = `option${label}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                    const letter = label.toLowerCase() as 'a' | 'b' | 'c' | 'd';
                    const isCorrect = form.answer === letter;
                    return (
                      <div
                        key={label}
                        className={cn(
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
                              <CheckCircle className="h-3 w-3" /> Respuesta correcta
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
                    <button type="button" onClick={() => setShowAnswer(v => !v)}
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-amber-400 transition-colors">
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

              {/* d-tag preview */}
              {form.title && (
                <div className="text-xs text-muted-foreground font-mono bg-muted/20 px-3 py-2 rounded-md border border-border/30">
                  ID: <span className="text-amber-500">{generateSlug(nextEpisode, form.title)}</span>
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
                  {isPublishing ? 'Publicando en Nostr…' : `Publicar Episodio #${nextEpisode}`}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')}
                  className="font-cinzel text-sm border-border/60">
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
