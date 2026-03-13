import { Link, useLocation } from 'react-router-dom';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NARRATOR_PUBKEY } from '@/hooks/useEpisodes';
import { Anchor, Compass, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

export { NARRATOR_PUBKEY };

export function SiteHeader() {
  const { user } = useCurrentUser();
  const location = useLocation();
  const isNarrator = user?.pubkey === NARRATOR_PUBKEY;

  return (
    <header className="sticky top-0 z-50 border-b border-amber-900/30 bg-background/95 backdrop-blur-sm">
      {/* Top decorative line */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />

      <div className="container max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative isolate">
              <Compass className="h-7 w-7 text-amber-500 group-hover:rotate-45 transition-transform duration-500" />
              <div className="absolute inset-0 rounded-full bg-amber-500/10 scale-0 group-hover:scale-150 transition-transform duration-500 -z-10" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-cinzel font-bold text-base text-amber-400 leading-none tracking-wide">
                Vuelta al Mundo
              </h1>
              <p className="text-[10px] text-muted-foreground font-garamond tracking-widest uppercase mt-0.5">
                1519 – 1522
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-cinzel text-xs transition-colors',
                location.pathname === '/'
                  ? 'text-amber-400 bg-amber-900/20'
                  : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-900/10'
              )}
            >
              <Anchor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Episodios</span>
            </Link>

            {isNarrator && (
              <Link
                to="/publicar"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-cinzel text-xs transition-colors',
                  location.pathname === '/publicar'
                    ? 'text-amber-400 bg-amber-900/20'
                    : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-900/10'
                )}
              >
                <PenLine className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Publicar</span>
              </Link>
            )}
          </nav>

          {/* Login */}
          <LoginArea className="max-w-44 shrink-0" />
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-900/40 to-transparent" />
    </header>
  );
}
