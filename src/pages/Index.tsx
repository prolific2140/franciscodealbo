import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { EpisodeQuiz } from '@/components/EpisodeQuiz';
import { SourcesPanel } from '@/components/SourcesPanel';
import { useEpisodes } from '@/hooks/useEpisodes';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Anchor, Ship, Wind, Scroll, History } from 'lucide-react';

function QuizSkeleton() {
  return (
    <Card className="border border-amber-900/20 shadow-xl overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-4/5" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      </div>
    </Card>
  );
}

export default function Index() {
  useSeoMeta({
    title: 'Vuelta al Mundo — La Primera Circunnavegación (1519–1522)',
    description: 'Sigue la épica crónica de la primera vuelta al mundo. Cada episodio te propone una pregunta real. Apuesta tus sats en Nostr e intenta adivinar lo que ocurrió.',
  });

  const { data: episodes, isLoading, error } = useEpisodes();
  const active = episodes?.[0] ?? null;

  return (
    <div className="min-h-screen bg-ocean-deep">
      <SiteHeader />

      {/* ── HERO ─────────────────────────────────── */}
      <div className="relative overflow-hidden isolate">
        <div className="absolute inset-0 -z-10 opacity-8">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path fill="hsl(38 85% 55%)" d="M0,192L48,186.7C96,181,192,171,288,176C384,181,480,203,576,202.7C672,203,768,181,864,170.7C960,160,1056,160,1152,170.7C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
        </div>

        <div className="container max-w-3xl mx-auto px-4 pt-10 pb-8 text-center">
          {/* Ship */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <Ship className="h-14 w-14 text-amber-500/70 animate-wave-drift" />
              <div className="absolute -inset-4 rounded-full bg-amber-500/5 blur-xl" />
            </div>
          </div>

          <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-amber-300 mb-2 leading-tight">
            La Vuelta al Mundo
          </h1>
          <p className="font-cinzel text-xs text-amber-600/80 tracking-[0.2em] uppercase mb-5">
            Magallanes · Elcano · 1519–1522
          </p>

          <div className="max-w-lg mx-auto">
            <div className="h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent mb-4" />
            <p className="font-garamond text-base italic text-foreground/70 leading-relaxed">
              "Yo, Francisco de Albo, contramaestre de la nao Trinidad, doy testimonio
              de los hechos acaecidos en esta empresa que ningún hombre antes osó acometer."
            </p>
            <div className="h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent mt-4 mb-4" />
            <p className="font-garamond text-sm text-muted-foreground">
              Cada episodio narra un hecho real de la expedición.{' '}
              <span className="text-amber-500">Elige la respuesta correcta y apuesta tus sats.</span>{' '}
              Si aciertas, te llevas parte del bote.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex justify-center gap-8 mt-7">
            {[
              { icon: Anchor, label: '5 naos', sub: 'partieron' },
              { icon: Wind, label: '3 años', sub: 'de travesía' },
              { icon: Ship, label: '18 hombres', sub: 'regresaron' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center">
                <Icon className="h-4 w-4 text-amber-500/60 mx-auto mb-1" />
                <p className="font-cinzel text-xs font-bold text-amber-400">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────── */}
      <main className="container max-w-3xl mx-auto px-4 pb-16">

        {/* Active episode section header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900/40" />
          <h2 className="font-cinzel text-xs text-amber-600/70 tracking-widest uppercase flex items-center gap-1.5">
            <Scroll className="h-3 w-3" /> Episodio en curso
          </h2>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900/40" />
        </div>

        {/* Loading */}
        {isLoading && <QuizSkeleton />}

        {/* Error */}
        {error && !isLoading && (
          <Card className="border border-amber-900/20 border-dashed">
            <CardContent className="py-12 text-center">
              <Anchor className="h-10 w-10 text-amber-800 mx-auto mb-3" />
              <p className="font-cinzel text-sm text-muted-foreground">No se pudo conectar con los relays de Nostr.</p>
              <p className="text-xs text-muted-foreground mt-1">Comprueba tu conexión e inténtalo de nuevo.</p>
            </CardContent>
          </Card>
        )}

        {/* No episodes yet */}
        {!isLoading && !error && !active && (
          <Card className="border border-amber-900/20 border-dashed">
            <CardContent className="py-16 text-center">
              <Ship className="h-12 w-12 text-amber-800/50 mx-auto mb-4 animate-wave-drift" />
              <h3 className="font-cinzel text-base text-amber-400 mb-2">La flota aún no ha zarpado</h3>
              <p className="font-garamond text-sm text-muted-foreground max-w-sm mx-auto">
                Pronto Francisco de Albo publicará el primer episodio.
                Vuelve en unos días.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Active episode */}
        {active && <EpisodeQuiz episode={active} />}

        {/* Link to history */}
        {episodes && episodes.length > 1 && (
          <div className="mt-6 text-center">
            <Link
              to="/historial"
              className="inline-flex items-center gap-2 font-cinzel text-xs text-amber-600/70 hover:text-amber-400 transition-colors border border-amber-900/30 rounded-full px-4 py-2 hover:border-amber-700/40 hover:bg-amber-900/10"
            >
              <History className="h-3.5 w-3.5" />
              Ver los {episodes.length - 1} episodios anteriores
            </Link>
          </div>
        )}

        {/* Sources panel */}
        <SourcesPanel />

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-900/20 to-transparent mb-4" />
          <a
            href="https://shakespeare.diy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-garamond text-xs text-muted-foreground/40 hover:text-amber-500/60 transition-colors"
          >
            Vibed with Shakespeare ✦
          </a>
        </div>
      </main>
    </div>
  );
}
