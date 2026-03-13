import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { Ship, BookOpen, Scroll, Anchor, Wind } from 'lucide-react';

const NAO_VICTORIA_IMG = 'https://blossom.primal.net/b2e6ffdeff2383e1fa4303bbfe9c422ba40bf98d99502040dfe18a85c169e348.jpg';

export default function Index() {
  useSeoMeta({
    title: 'Vuelta al Mundo — La Primera Circunnavegación (1519–1522)',
    description: 'Sigue la épica crónica de la primera vuelta al mundo. Cada episodio te propone una pregunta real. Apuesta tus sats en Nostr e intenta adivinar lo que ocurrió.',
  });

  return (
    <div className="min-h-screen flex flex-col relative isolate overflow-hidden">

      {/* ── HERO BACKGROUND IMAGE ─────────────────── */}
      <div className="absolute inset-0 -z-20">
        <img
          src={NAO_VICTORIA_IMG}
          alt="Nao Victoria en mar tempestuoso"
          className="w-full h-full object-cover object-center"
        />
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/85" />
        {/* Atmospheric color tint */}
        <div className="absolute inset-0 bg-ocean-deep/40" />
      </div>

      <SiteHeader />

      {/* ── MAIN CONTENT ─────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-2xl mx-auto text-center">

          {/* Ship icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-amber-500/15 blur-2xl" />
              <Ship className="h-16 w-16 text-amber-400/90 animate-wave-drift relative drop-shadow-lg" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-cinzel text-4xl sm:text-5xl font-bold text-amber-300 mb-3 leading-tight tracking-wide drop-shadow-xl">
            La Vuelta al Mundo
          </h1>
          <p className="font-cinzel text-xs text-amber-500/90 tracking-[0.25em] uppercase mb-6 drop-shadow">
            Magallanes · Elcano · 1519–1522
          </p>

          {/* Decorative divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent mb-6" />

          {/* Quote */}
          <p className="font-garamond text-base italic text-white/70 leading-relaxed max-w-md mx-auto mb-10 drop-shadow">
            "Yo, Francisco de Albo, contramaestre de la nao Trinidad, doy testimonio
            de los hechos acaecidos en esta empresa que ningún hombre antes osó acometer."
          </p>

          {/* ── TWO MAIN BUTTONS ────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">

            {/* Episodios */}
            <Link
              to="/episodios"
              className="group relative flex flex-col items-center gap-3 w-full sm:w-56 rounded-2xl border border-amber-600/60 bg-amber-900/40 hover:bg-amber-900/60 hover:border-amber-500/80 px-6 py-7 transition-all duration-300 shadow-xl shadow-black/40 hover:shadow-amber-900/40 backdrop-blur-sm"
            >
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-amber-500/15 scale-0 group-hover:scale-100 transition-transform duration-300 blur-sm" />
                <Scroll className="h-8 w-8 text-amber-400 relative group-hover:text-amber-300 transition-colors duration-300 drop-shadow" />
              </div>
              <div>
                <p className="font-cinzel text-lg font-bold text-amber-300 group-hover:text-amber-200 transition-colors tracking-wide">
                  Episodios
                </p>
                <p className="font-garamond text-xs text-amber-100/50 mt-0.5 group-hover:text-amber-100/70 transition-colors">
                  Ver todos los capítulos
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/0 group-hover:via-amber-500/60 to-transparent transition-all duration-300" />
            </Link>

            {/* Cómo jugar */}
            <Link
              to="/como-jugar"
              className="group relative flex flex-col items-center gap-3 w-full sm:w-56 rounded-2xl border border-white/15 bg-black/30 hover:bg-black/45 hover:border-amber-700/50 px-6 py-7 transition-all duration-300 shadow-xl shadow-black/40 backdrop-blur-sm"
            >
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-amber-500/10 scale-0 group-hover:scale-100 transition-transform duration-300 blur-sm" />
                <BookOpen className="h-8 w-8 text-amber-600/80 relative group-hover:text-amber-400 transition-colors duration-300" />
              </div>
              <div>
                <p className="font-cinzel text-lg font-bold text-amber-500/90 group-hover:text-amber-300 transition-colors tracking-wide">
                  Cómo jugar
                </p>
                <p className="font-garamond text-xs text-white/40 mt-0.5 group-hover:text-white/60 transition-colors">
                  Aprende la dinámica
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/0 group-hover:via-amber-600/40 to-transparent transition-all duration-300" />
            </Link>
          </div>

          {/* Quick stats */}
          <div className="flex justify-center gap-10 mb-10">
            {[
              { icon: Anchor, label: '5 naos', sub: 'partieron' },
              { icon: Wind, label: '3 años', sub: 'de travesía' },
              { icon: Ship, label: '18 hombres', sub: 'regresaron' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center">
                <Icon className="h-4 w-4 text-amber-500/60 mx-auto mb-1 drop-shadow" />
                <p className="font-cinzel text-xs font-bold text-amber-400/90">{label}</p>
                <p className="text-[10px] text-white/40">{sub}</p>
              </div>
            ))}
          </div>

          {/* Decorative divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-amber-900/30 to-transparent mb-4" />
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <a
            href="https://shakespeare.diy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-garamond text-xs text-white/25 hover:text-amber-500/60 transition-colors"
          >
            Vibed with Shakespeare ✦
          </a>
        </div>
      </main>
    </div>
  );
}
