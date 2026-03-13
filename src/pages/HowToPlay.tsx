import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { ArrowLeft, Scroll, Zap, Trophy, BookOpen, Users, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const NAOS_IMG = 'https://blossom.ditto.pub/1b0902eaa862b2c843443ab4b066379d15663d4b49ed0f9829e90df5ccaeaa03.jpeg';

interface StepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  detail?: string;
}

function Step({ number, icon, title, description, detail }: StepProps) {
  return (
    <div className="flex gap-4">
      {/* Number column */}
      <div className="flex flex-col items-center shrink-0">
        <div className="relative flex items-center justify-center h-10 w-10 rounded-full border border-amber-700/50 bg-amber-900/30 text-amber-400 font-cinzel font-bold text-sm shrink-0">
          {number}
        </div>
        <div className="w-px flex-1 bg-gradient-to-b from-amber-700/30 to-transparent mt-2" />
      </div>

      {/* Content */}
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-amber-500/80">{icon}</span>
          <h3 className="font-cinzel text-sm font-bold text-amber-300">{title}</h3>
        </div>
        <p className="font-garamond text-sm text-foreground/80 leading-relaxed">{description}</p>
        {detail && (
          <p className="font-garamond text-xs text-muted-foreground mt-2 leading-relaxed">{detail}</p>
        )}
      </div>
    </div>
  );
}

export default function HowToPlay() {
  useSeoMeta({
    title: 'Cómo jugar — Vuelta al Mundo',
    description: 'Aprende cómo funciona el juego de preguntas sobre la primera circunnavegación del mundo.',
  });

  return (
    <div className="min-h-screen bg-ocean-deep">
      <SiteHeader />

      {/* ── HERO IMAGE ─────────────────────────── */}
      <div className="relative h-48 sm:h-64 overflow-hidden isolate">
        <img
          src={NAOS_IMG}
          alt="Flota de naos al atardecer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-black/75" />
        <div className="absolute inset-0 bg-ocean-deep/25" />
        {/* Title overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <BookOpen className="h-5 w-5 text-amber-400 drop-shadow" />
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-amber-300 drop-shadow-xl">
              Cómo jugar
            </h1>
          </div>
          <p className="font-garamond text-sm text-white/60 drop-shadow">
            Una crónica interactiva de la primera vuelta al mundo
          </p>
        </div>
      </div>

      <main className="container max-w-2xl mx-auto px-4 py-8 pb-16">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-400 transition-colors mb-6 font-cinzel"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
        </Link>

        {/* Intro text */}
        <div className="text-center mb-10">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent mb-4" />
          <p className="font-garamond text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Cada episodio esconde un secreto histórico. ¿Adivinarás lo que ocurrió de verdad?
          </p>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <Step
            number={1}
            icon={<Scroll className="h-4 w-4" />}
            title="Lee el episodio"
            description="Cada capítulo narra un momento real de la expedición Magallanes-Elcano (1519–1522), escrito a modo de crónica del contramaestre Francisco de Albo."
            detail="Los hechos son históricos y están documentados en las fuentes originales de la época."
          />
          <Step
            number={2}
            icon={<ChevronRight className="h-4 w-4" />}
            title="Elige tu respuesta"
            description="Al final del relato encontrarás una pregunta sobre lo que realmente ocurrió, con cuatro opciones posibles: A, B, C y D."
            detail="Solo una respuesta es correcta. Reflexiona antes de elegir — la historia suele sorprender."
          />
          <Step
            number={3}
            icon={<Zap className="h-4 w-4" />}
            title="Apuesta tus sats"
            description="Tras seleccionar tu opción, zappea (envía satoshis vía Lightning Network) al narrador para registrar tu apuesta oficial."
            detail="Necesitas una cartera Lightning compatible con Nostr, como Alby o Mutiny Wallet. El mínimo de apuesta lo fija el narrador en cada episodio."
          />
          <Step
            number={4}
            icon={<Clock className="h-4 w-4" />}
            title="Espera la revelación"
            description="El narrador revela la respuesta correcta en la fecha indicada. Hasta entonces, el suspense es parte de la aventura."
          />
          <Step
            number={5}
            icon={<Trophy className="h-4 w-4" />}
            title="Recibe tu premio"
            description="Si acertaste, recibirás una parte proporcional del bote acumulado con las apuestas de todos los participantes."
            detail="Los sats se reparten entre los acertantes según el importe apostado. A mayor apuesta, mayor premio si aciertas."
          />
        </div>

        {/* Info card */}
        <div className="mb-8">
          <Card className="border border-amber-900/25 bg-amber-900/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-amber-500/70" />
                <p className="font-cinzel text-xs font-bold text-amber-400">Lo que necesitas para jugar</p>
              </div>
              <ul className="font-garamond text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> Una cuenta Nostr (npub)</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> Una cartera Lightning compatible (Alby, Mutiny…)</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> Sats suficientes para la apuesta mínima de cada episodio</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-600 mt-0.5">·</span> Ganas de aprender historia</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-800/30 to-transparent mb-8" />
          <p className="font-garamond text-sm text-muted-foreground mb-5">
            ¿Listo para zarpar? Consulta los episodios y pon a prueba tu conocimiento histórico.
          </p>
          <Link
            to="/episodios"
            className="inline-flex items-center gap-2 font-cinzel text-sm font-bold text-amber-950 bg-amber-500 hover:bg-amber-400 px-6 py-2.5 rounded-full transition-all duration-200 shadow-lg shadow-amber-900/30 hover:shadow-amber-800/40 hover:shadow-xl"
          >
            <Scroll className="h-4 w-4" />
            Ver episodios
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
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
