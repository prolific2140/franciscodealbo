import { useSeoMeta } from '@unhead/react';
import { SiteHeader } from '@/components/SiteHeader';
import { EpisodeCard } from '@/components/EpisodeCard';
import { SourcesPanel } from '@/components/SourcesPanel';
import { useEpisodes } from '@/hooks/useEpisodes';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Anchor, Wind, Ship } from 'lucide-react';

function EpisodeSkeleton() {
  return (
    <Card className="border border-amber-900/20 bg-card shadow-xl overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </Card>
  );
}

export default function Index() {
  useSeoMeta({
    title: 'Vuelta al Mundo — La Primera Circunnavegación (1519–1522)',
    description: 'Sigue la épica crónica de la primera vuelta al mundo. Cada episodio narra los hechos tal como los vivió Francisco de Albo. ¿Sabes qué ocurrió realmente? Apuesta tus sats en Nostr.',
  });

  const { data: episodes, isLoading, error } = useEpisodes();

  return (
    <div className="min-h-screen bg-ocean-deep">
      <SiteHeader />

      {/* Hero */}
      <div className="relative overflow-hidden isolate">
        {/* Background waves decoration */}
        <div className="absolute inset-0 -z-10 opacity-10">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path fill="hsl(38 85% 55%)" d="M0,192L48,186.7C96,181,192,171,288,176C384,181,480,203,576,202.7C672,203,768,181,864,170.7C960,160,1056,160,1152,170.7C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path fill="hsl(195 60% 35%)" fillOpacity="0.5" d="M0,256L48,245.3C96,235,192,213,288,213.3C384,213,480,235,576,240C672,245,768,235,864,213.3C960,192,1056,160,1152,160C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
        </div>

        <div className="container max-w-3xl mx-auto px-4 py-12 text-center relative">
          {/* Ship icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Ship className="h-16 w-16 text-amber-500/80 animate-wave-drift" />
              <div className="absolute -inset-4 rounded-full bg-amber-500/5 blur-xl" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300 mb-3 leading-tight">
            La Vuelta al Mundo
          </h1>
          <p className="font-cinzel text-sm text-amber-600 tracking-[0.2em] uppercase mb-6">
            Magallanes · Elcano · 1519–1522
          </p>

          {/* Quote */}
          <div className="max-w-xl mx-auto">
            <div className="h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent mb-4" />
            <p className="font-garamond text-lg italic text-foreground/80 leading-relaxed">
              "Yo, Francisco de Albo, piloto de la nao Trinidad, doy testimonio de los hechos acaecidos
              en esta empresa que ningún hombre antes osó acometer."
            </p>
            <div className="h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent mt-4 mb-4" />
            <p className="font-garamond text-sm text-muted-foreground">
              Cada episodio narra un hecho real de la expedición.{' '}
              <span className="text-amber-500">Elige la respuesta correcta</span>{' '}
              y zapea tus sats para apostar.
            </p>
          </div>

          {/* Stats pills */}
          <div className="flex justify-center gap-6 mt-8">
            {[
              { icon: Anchor, label: '5 naos', sub: 'partieron' },
              { icon: Wind, label: '3 años', sub: 'de travesía' },
              { icon: Ship, label: '1 victoria', sub: 'regresó' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-1">
                  <Icon className="h-4 w-4 text-amber-500/70" />
                </div>
                <p className="font-cinzel text-xs font-bold text-amber-400">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Episodes Feed */}
      <main className="container max-w-3xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900/40" />
          <h2 className="font-cinzel text-xs text-amber-600/70 tracking-widest uppercase">Bitácora de Episodios</h2>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900/40" />
        </div>

        {isLoading && (
          <div className="space-y-6">
            <EpisodeSkeleton />
            <EpisodeSkeleton />
            <EpisodeSkeleton />
          </div>
        )}

        {error && (
          <Card className="border-dashed border-amber-900/30">
            <CardContent className="py-12 text-center">
              <Anchor className="h-10 w-10 text-amber-800 mx-auto mb-4" />
              <p className="font-cinzel text-sm text-muted-foreground">
                No se pudo conectar con los relays de Nostr.
              </p>
              <p className="text-xs text-muted-foreground mt-1">Comprueba tu conexión e inténtalo de nuevo.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && episodes?.length === 0 && (
          <Card className="border border-amber-900/20 border-dashed">
            <CardContent className="py-16 text-center">
              <Ship className="h-12 w-12 text-amber-800/60 mx-auto mb-4 animate-wave-drift" />
              <h3 className="font-cinzel text-base text-amber-400 mb-2">La flota aún no ha zarpado</h3>
              <p className="font-garamond text-sm text-muted-foreground max-w-sm mx-auto">
                Pronto Francisco de Albo publicará el primer episodio de la mayor epopeya que el ser humano ha llevado a cabo.
                Vuelve en unos días.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && episodes && episodes.length > 0 && (
          <div className="space-y-6">
            {episodes.map(episode => (
              <EpisodeCard key={episode.event.id} episode={episode} />
            ))}
          </div>
        )}

        {/* Historical sources */}
        <SourcesPanel />

        {/* Footer attribution */}
        <div className="mt-8 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-900/30 to-transparent mb-4" />
          <a
            href="https://shakespeare.diy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-garamond text-xs text-muted-foreground/50 hover:text-amber-500/70 transition-colors"
          >
            Vibed with Shakespeare ✦
          </a>
        </div>
      </main>
    </div>
  );
}
