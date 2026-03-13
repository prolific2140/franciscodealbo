import { ZapDialog } from '@/components/ZapDialog';
import { useAuthor } from '@/hooks/useAuthor';
import type { Event } from 'nostr-tools';

interface ZapDialogWrapperProps {
  target: Event;
  onSuccess: () => void;
  children: React.ReactNode;
}

/**
 * Wraps children in ZapDialog only when the target author has a Lightning
 * address configured. Always renders children regardless, so quiz options
 * are never hidden due to a missing lud06/lud16 on the narrator profile.
 */
export function ZapDialogWrapper({ target, onSuccess, children }: ZapDialogWrapperProps) {
  const { data: targetAuthor } = useAuthor(target.pubkey);
  const hasLightning = !!(targetAuthor?.metadata?.lud06 || targetAuthor?.metadata?.lud16);

  if (!hasLightning) {
    return <>{children}</>;
  }

  return (
    <ZapDialog target={target} onSuccess={onSuccess}>
      {children}
    </ZapDialog>
  );
}
