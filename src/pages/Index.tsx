import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { Ship, BookOpen, Scroll, Anchor, Wind } from 'lucide-react';

const NAO_VICTORIA_IMG   = 'https://blossom.primal.net/b2e6ffdeff2383e1fa4303bbfe9c422ba40bf98d99502040dfe18a85c169e348.jpg';
// Episodios button: entrada del estrecho — naos en mar bravo
const ESTRECHO_IMG       = 'https://blossom.ditto.pub/cda54d3532e1d9605099006f6c96821519ec5011e509017f88652cc93cca8e1e.jpeg';
// Cómo jugar button: flota de naos al atardecer
const NAOS_IMG           = 'https://blossom.ditto.pub/1b0902eaa862b2c843443ab4b066379d15663d4b49ed0f9829e90df5ccaeaa03.jpeg';

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
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/85" />
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12">

            {/* ── Episodios ── */}
            <Link
              to="/episodios"
              className="group relative flex flex-col items-end justify-end w-full sm:w-64 h-40 rounded-2xl overflow-hidden border border-amber-600/50 shadow-2xl shadow-black/50 hover:shadow-amber-900/40 transition-all duration-400 hover:scale-[1.02]"
            >
              {/* Background image */}
              <img
                src={ESTRECHO_IMG}
                alt="Naos entrando al estrecho"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay: dark bottom for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/70 transition-all duration-300" />
              {/* Amber tint on hover */}
              <div className="absolute inset-0 bg-amber-900/0 group-hover:bg-amber-900/20 transition-all duration-300" />
              {/* Golden top border glow on hover */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/0 group-hover:via-amber-500/70 to-transparent transition-all duration-300" />

              {/* Content */}
              <div className="relative z-10 w-full px-5 pb-4 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <Scroll className="h-4 w-4 text-amber-400 drop-shadow" />
                  <p className="font-cinzel text-lg font-bold text-white tracking-wide drop-shadow-lg">
                    Episodios
                  </p>
                </div>
                <p className="font-garamond text-xs text-amber-100/60 group-hover:text-amber-100/80 transition-colors drop-shadow">
                  Ver todos los capítulos
                </p>
              </div>
            </Link>

            {/* ── Cómo jugar ── */}
            <Link
              to="/como-jugar"
              className="group relative flex flex-col items-end justify-end w-full sm:w-64 h-40 rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-black/50 hover:shadow-amber-900/30 transition-all duration-400 hover:scale-[1.02]"
            >
              {/* Background image */}
              <img
                src={NAOS_IMG}
                alt="Flota de naos al atardecer"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/70 transition-all duration-300" />
              {/* Warm tint on hover */}
              <div className="absolute inset-0 bg-amber-700/0 group-hover:bg-amber-700/15 transition-all duration-300" />
              {/* Golden top border glow on hover */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/0 group-hover:via-amber-400/60 to-transparent transition-all duration-300" />

              {/* Content */}
              <div className="relative z-10 w-full px-5 pb-4 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <BookOpen className="h-4 w-4 text-amber-400 drop-shadow" />
                  <p className="font-cinzel text-lg font-bold text-white tracking-wide drop-shadow-lg">
                    Cómo jugar
                  </p>
                </div>
                <p className="font-garamond text-xs text-amber-100/60 group-hover:text-amber-100/80 transition-colors drop-shadow">
                  Aprende la dinámica
                </p>
              </div>
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
