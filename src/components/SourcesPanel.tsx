import { ExternalLink, BookOpen, ScrollText, Globe, Feather } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Source {
  key: string;
  icon: typeof BookOpen;
  title: string;
  author: string;
  period: string;
  description: string;
  url?: string;
  tag: string;
}

export const HISTORICAL_SOURCES: Source[] = [
  {
    key: 'albo',
    icon: ScrollText,
    title: 'Derrotero',
    author: 'Francisco de Albo',
    period: 'c. 1519–1522',
    description:
      'El diario de navegación técnico del propio piloto de la Trinidad. Recoge datos de latitud, rumbos, sondeos y singladuras día a día. Es la fuente náutica más precisa de toda la expedición.',
    tag: 'Derrotero de Albo',
  },
  {
    key: 'pigafetta',
    icon: Feather,
    title: 'Relación del primer viaje alrededor del mundo',
    author: 'Antonio Pigafetta',
    period: 'c. 1522–1525',
    description:
      'El cronista italiano que embarcó voluntariamente en la expedición. Su diario es la fuente más completa y vívida: describe pueblos indígenas, tormentas, motines y el estrecho. Indispensable.',
    tag: 'Diario de Pigafetta',
  },
  {
    key: 'mafra',
    icon: BookOpen,
    title: 'Relación del viaje',
    author: 'Ginés de Mafra',
    period: 'c. 1544',
    description:
      'Marinero que participó en la expedición y fue capturado en las Molucas. Escrita décadas después, su relación aporta detalles únicos del regreso de la Trinidad y de la estancia en las islas.',
    tag: 'Relación de Mafra',
  },
  {
    key: 'rutaelcano',
    icon: Globe,
    title: 'Ruta Elcano',
    author: 'rutaelcano.com',
    period: 'Recurso web',
    description:
      'Web de referencia con cartografía histórica, cronología detallada, bibliografía especializada y documentación actualizada sobre toda la expedición. Excelente para verificar fechas y lugares.',
    url: 'https://www.rutaelcano.com',
    tag: 'rutaelcano.com',
  },
];

export function SourcesPanel() {
  return (
    <section className="mt-8 mb-2">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900/40" />
        <h2 className="font-cinzel text-xs text-amber-600/70 tracking-widest uppercase whitespace-nowrap">
          Fuentes Históricas
        </h2>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900/40" />
      </div>

      <p className="font-garamond text-sm text-muted-foreground text-center mb-5 max-w-xl mx-auto">
        Todos los episodios se basan en documentos originales de la expedición y fuentes históricas contrastadas.
        Ningún dato es inventado.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HISTORICAL_SOURCES.map((source) => {
          const Icon = source.icon;
          return (
            <Card
              key={source.key}
              className="border border-amber-900/25 bg-card/80 hover:border-amber-700/40 transition-colors group"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 p-2 rounded-md bg-amber-900/20 border border-amber-800/30">
                    <Icon className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-cinzel text-xs font-semibold text-amber-300 leading-tight">
                          {source.title}
                        </p>
                        <p className="font-garamond text-xs text-amber-600 mt-0.5">
                          {source.author} · <span className="text-muted-foreground">{source.period}</span>
                        </p>
                      </div>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-muted-foreground hover:text-amber-400 transition-colors mt-0.5"
                          title={`Visitar ${source.url}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="font-garamond text-xs text-muted-foreground leading-relaxed mt-2">
                      {source.description}
                    </p>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-[11px] text-amber-600/70 hover:text-amber-400 transition-colors font-garamond"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        {source.url.replace('https://', '')}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/** Small inline badge to cite a source within an EpisodeCard */
export function SourceBadge({ sourceKey }: { sourceKey: string }) {
  const source = HISTORICAL_SOURCES.find(s => s.key === sourceKey);
  if (!source) return null;
  const Icon = source.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700/80 font-garamond border border-amber-900/30 rounded px-1.5 py-0.5 bg-amber-900/10">
      <Icon className="h-2.5 w-2.5" />
      {source.tag}
    </span>
  );
}
