import { ZapDialog } from '@/components/ZapDialog';
import { useAuthor } from '@/hooks/useAuthor';
import type { Event } from 'nostr-tools';

interface ZapDialogWrapperProps {
  target: Event;
  onSuccess: () => void;
  children: React.ReactNode;
  /** Extra tags to embed in the zap request (e.g. answer letter) */
  extraTags?: string[][];
}

/**
 * Wraps children in ZapDialog when the target author has a Lightning address.
 * Waits for the author profile to load before deciding — this prevents
 * discarding the ZapDialog just because the profile hasn't arrived yet.
 * Always renders children so quiz options are never hidden.
 */
export function ZapDialogWrapper({ target, onSuccess, children, extraTags }: ZapDialogWrapperProps) {
  const { data: targetAuthor, isLoading } = useAuthor(target.pubkey);

  // While loading, render children without zap wrapper (will re-render once loaded)
  if (isLoading) {
    return <>{children}</>;
  }

  const hasLightning = !!(targetAuthor?.metadata?.lud06 || targetAuthor?.metadata?.lud16);

  if (!hasLightning) {
    return <>{children}</>;
  }

  return (
    <ZapDialog target={target} onSuccess={onSuccess} extraTags={extraTags}>
      {children}
    </ZapDialog>
  );
}
