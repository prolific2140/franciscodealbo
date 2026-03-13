import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { SiteHeader } from '@/components/SiteHeader';
import { NARRATOR_PUBKEY } from '@/hooks/useEpisodes';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, Anchor, PenLine, Eye, EyeOff } from 'lucide-react';
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
  const [preview, setPreview] = useState(false);

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

    publish(
      {
        kind: 37183,
        content: form.narrative,
        tags: [
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
        ],
      },
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="episode" className="font-cinzel text-xs text-amber-500/80">
                      Número de episodio *
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
                </div>
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
                    className="bg-background/50 border-border/60 font-garamond text-base leading-relaxed min-h-[180px] resize-none"
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
              </CardHeader>
              <CardContent className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map((label, i) => {
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
                  <h2 className="font-cinzel text-sm text-amber-400">Explicación de la respuesta</h2>
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
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Explica qué ocurrió realmente y por qué esa es la respuesta correcta..."
                  value={form.answerExplanation}
                  onChange={set('answerExplanation')}
                  className="bg-background/50 border-border/60 font-garamond text-base leading-relaxed min-h-[120px] resize-none"
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
              <div className="text-xs text-muted-foreground font-mono bg-muted/30 px-3 py-2 rounded-md border border-border/40">
                ID del evento: <span className="text-amber-500">{generateSlug(form.episode, form.title)}</span>
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
