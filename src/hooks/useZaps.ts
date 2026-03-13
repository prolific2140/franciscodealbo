import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useAppContext } from '@/hooks/useAppContext';
import { useToast } from '@/hooks/useToast';
import { useNWC } from '@/hooks/useNWCContext';
import type { NWCConnection } from '@/hooks/useNWC';
import { nip57 } from 'nostr-tools';
import type { Event } from 'nostr-tools';
import type { WebLNProvider } from '@webbtc/webln-types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

export function useZaps(
  target: Event | Event[],
  webln: WebLNProvider | null,
  _nwcConnection: NWCConnection | null,
  onZapSuccess?: () => void,
  /** Optional extra tags to embed in the zap request (e.g. [['t','answer:a']]) */
  extraTags?: string[][]
) {
  const { nostr } = useNostr();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const queryClient = useQueryClient();

  // Handle the case where an empty array is passed (from ZapButton when external data is provided)
  const actualTarget = Array.isArray(target) ? (target.length > 0 ? target[0] : null) : target;

  const author = useAuthor(actualTarget?.pubkey);
  const { sendPayment, getActiveConnection } = useNWC();
  const [isZapping, setIsZapping] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);

  // Cleanup state when component unmounts
  useEffect(() => {
    return () => {
      setIsZapping(false);
      setInvoice(null);
    };
  }, []);

  const { data: zapEvents, ...query } = useQuery<NostrEvent[], Error>({
    queryKey: ['nostr', 'zaps', actualTarget?.id],
    staleTime: 30000, // 30 seconds
    refetchInterval: (query) => {
      // Only refetch if the query is currently being observed (component is mounted)
      return query.getObserversCount() > 0 ? 60000 : false;
    },
    queryFn: async () => {
      if (!actualTarget) return [];

      const signal = AbortSignal.timeout(5000);

      // Query for zap receipts for this specific event
      if (actualTarget.kind >= 30000 && actualTarget.kind < 40000) {
        // Addressable event
        const identifier = actualTarget.tags.find((t) => t[0] === 'd')?.[1] || '';
        const events = await nostr.query([{
          kinds: [9735],
          '#a': [`${actualTarget.kind}:${actualTarget.pubkey}:${identifier}`],
        }], { signal });
        return events;
      } else {
        // Regular event
        const events = await nostr.query([{
          kinds: [9735],
          '#e': [actualTarget.id],
        }], { signal });
        return events;
      }
    },
    enabled: !!actualTarget?.id,
  });

  // Process zap events into simple counts and totals
  const { zapCount, totalSats, zaps } = useMemo(() => {
    if (!zapEvents || !Array.isArray(zapEvents) || !actualTarget) {
      return { zapCount: 0, totalSats: 0, zaps: [] };
    }

    let count = 0;
    let sats = 0;

    zapEvents.forEach(zap => {
      count++;

      // Try multiple methods to extract the amount:

      // Method 1: amount tag (from zap request, sometimes copied to receipt)
      const amountTag = zap.tags.find(([name]) => name === 'amount')?.[1];
      if (amountTag) {
        const millisats = parseInt(amountTag);
        sats += Math.floor(millisats / 1000);
        return;
      }

      // Method 2: Extract from bolt11 invoice
      const bolt11Tag = zap.tags.find(([name]) => name === 'bolt11')?.[1];
      if (bolt11Tag) {
        try {
          const invoiceSats = nip57.getSatoshisAmountFromBolt11(bolt11Tag);
          sats += invoiceSats;
          return;
        } catch (error) {
          console.warn('Failed to parse bolt11 amount:', error);
        }
      }

      // Method 3: Parse from description (zap request JSON)
      const descriptionTag = zap.tags.find(([name]) => name === 'description')?.[1];
      if (descriptionTag) {
        try {
          const zapRequest = JSON.parse(descriptionTag);
          const requestAmountTag = zapRequest.tags?.find(([name]: string[]) => name === 'amount')?.[1];
          if (requestAmountTag) {
            const millisats = parseInt(requestAmountTag);
            sats += Math.floor(millisats / 1000);
            return;
          }
        } catch (error) {
          console.warn('Failed to parse description JSON:', error);
        }
      }

      console.warn('Could not extract amount from zap receipt:', zap.id);
    });


    return { zapCount: count, totalSats: sats, zaps: zapEvents };
  }, [zapEvents, actualTarget]);

  // Poll for a zap receipt matching our invoice (for external wallet payments)
  const pollForReceipt = useCallback(async (
    invoiceStr: string,
    targetId: string,
    aCoord: string | null,
    onPaid: () => void,
  ) => {
    const maxAttempts = 40; // poll for up to ~2 minutes
    let attempts = 0;

    const check = async () => {
      attempts++;
      if (attempts > maxAttempts) return;

      try {
        const filters: Parameters<typeof nostr.query>[0] = aCoord
          ? [{ kinds: [9735], '#a': [aCoord], limit: 20 }, { kinds: [9735], '#e': [targetId], limit: 20 }]
          : [{ kinds: [9735], '#e': [targetId], limit: 20 }];

        const receipts = await Promise.all(
          filters.map(f => nostr.query(f, { signal: AbortSignal.timeout(4000) }))
        );
        const all = receipts.flat();

        // Check if any receipt contains our bolt11 invoice
        const found = all.some(r =>
          r.tags.find(([t, v]) => t === 'bolt11' && v === invoiceStr)
        );

        if (found) {
          onPaid();
        } else {
          setTimeout(check, 3000);
        }
      } catch {
        setTimeout(check, 3000);
      }
    };

    setTimeout(check, 3000);
  }, [nostr]);

  const zap = async (amount: number, comment: string) => {
    if (amount <= 0) {
      return;
    }

    setIsZapping(true);
    setInvoice(null); // Clear any previous invoice at the start

    if (!user) {
      toast({
        title: 'Sesión requerida',
        description: 'Debes iniciar sesión para enviar un zap.',
        variant: 'destructive',
      });
      setIsZapping(false);
      return;
    }

    if (!actualTarget) {
      toast({
        title: 'Evento no encontrado',
        description: 'No se pudo encontrar el evento.',
        variant: 'destructive',
      });
      setIsZapping(false);
      return;
    }

    try {
      if (!author.data || !author.data?.metadata || !author.data?.event) {
        toast({
          title: 'Perfil no encontrado',
          description: 'No se pudo encontrar el autor del evento.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      const { lud06, lud16 } = author.data.metadata;
      if (!lud06 && !lud16) {
        toast({
          title: 'Sin dirección Lightning',
          description: 'El autor no tiene una dirección Lightning configurada.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      const zapEndpoint = await nip57.getZapEndpoint(author.data.event);
      if (!zapEndpoint) {
        toast({
          title: 'Endpoint de zap no encontrado',
          description: 'No se pudo contactar con el servidor Lightning del autor.',
          variant: 'destructive',
        });
        setIsZapping(false);
        return;
      }

      // Create zap request - use appropriate event format based on kind
      // For addressable events (30000-39999), pass the object to get 'a' tag
      // For all other events, pass the ID string to get 'e' tag
      const event = (actualTarget.kind >= 30000 && actualTarget.kind < 40000)
        ? actualTarget
        : actualTarget.id;

      const zapAmount = amount * 1000; // convert to millisats

      const zapRequest = nip57.makeZapRequest({
        profile: actualTarget.pubkey,
        event: event,
        amount: zapAmount,
        relays: config.relayMetadata.relays.map(r => r.url),
        comment
      });

      // Inject extra tags (e.g. answer letter) into the zap request
      if (extraTags && extraTags.length > 0) {
        zapRequest.tags = [...zapRequest.tags, ...extraTags];
      }

      // Sign the zap request (but don't publish to relays - only send to LNURL endpoint)
      if (!user.signer) {
        throw new Error('No signer available');
      }
      const signedZapRequest = await user.signer.signEvent(zapRequest);

      try {
        const res = await fetch(`${zapEndpoint}?amount=${zapAmount}&nostr=${encodeURI(JSON.stringify(signedZapRequest))}`);
            const responseData = await res.json();

            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${responseData.reason || 'Unknown error'}`);
            }

            const newInvoice = responseData.pr;
            if (!newInvoice || typeof newInvoice !== 'string') {
              throw new Error('Lightning service did not return a valid invoice');
            }

            // Get the current active NWC connection dynamically
            const currentNWCConnection = getActiveConnection();

            // Helper: mark payment as successful
            const handleSuccess = () => {
              setIsZapping(false);
              setInvoice(null);
              queryClient.invalidateQueries({ queryKey: ['nostr', 'zaps'] });
              queryClient.invalidateQueries({ queryKey: ['vuelta-al-mundo', 'answers'] });
              onZapSuccess?.();
            };

            // Build coord for polling
            const aCoord = (actualTarget.kind >= 30000 && actualTarget.kind < 40000)
              ? `${actualTarget.kind}:${actualTarget.pubkey}:${actualTarget.tags.find(([t]) => t === 'd')?.[1] ?? ''}`
              : null;

            // Try NWC first if available and properly connected
            if (currentNWCConnection && currentNWCConnection.connectionString && currentNWCConnection.isConnected) {
              try {
                await sendPayment(currentNWCConnection, newInvoice);
                toast({ title: '⚡ ¡Apuesta registrada!', description: `Enviaste ${amount} sats mediante NWC.` });
                handleSuccess();
                return;
              } catch (nwcError) {
                const errorMessage = nwcError instanceof Error ? nwcError.message : 'Error NWC desconocido';
                toast({
                  title: 'Pago NWC fallido',
                  description: `${errorMessage}. Intenta con otra cartera.`,
                  variant: 'destructive',
                });
              }
            }

            if (webln) {
              try {
                let webLnProvider = webln;
                if (webln.enable && typeof webln.enable === 'function') {
                  const enabledProvider = await webln.enable();
                  const provider = enabledProvider as WebLNProvider | undefined;
                  if (provider) webLnProvider = provider;
                }
                await webLnProvider.sendPayment(newInvoice);
                toast({ title: '⚡ ¡Apuesta registrada!', description: `Enviaste ${amount} sats.` });
                handleSuccess();
              } catch (weblnError) {
                const errorMessage = weblnError instanceof Error ? weblnError.message : 'Error WebLN desconocido';
                toast({
                  title: 'Pago WebLN fallido',
                  description: `${errorMessage}. Escanea el código QR con tu cartera.`,
                  variant: 'destructive',
                });
                setInvoice(newInvoice);
                setIsZapping(false);
                // Poll for receipt in case they pay manually after WebLN fails
                pollForReceipt(newInvoice, actualTarget.id, aCoord, () => {
                  toast({ title: '⚡ ¡Pago confirmado!', description: `${amount} sats recibidos.` });
                  handleSuccess();
                });
              }
            } else {
              // No WebLN/NWC — show QR and poll for receipt
              setInvoice(newInvoice);
              setIsZapping(false);
              pollForReceipt(newInvoice, actualTarget.id, aCoord, () => {
                toast({ title: '⚡ ¡Pago confirmado!', description: `${amount} sats recibidos. ¡Buena suerte!` });
                handleSuccess();
              });
            }
          } catch (err) {
            console.error('Zap error:', err);
            toast({
              title: 'Error al zapear',
              description: (err as Error).message,
              variant: 'destructive',
            });
            setIsZapping(false);
          }
    } catch (err) {
      console.error('Zap error:', err);
      toast({
        title: 'Error al zapear',
        description: (err as Error).message,
        variant: 'destructive',
      });
      setIsZapping(false);
    }
  };

  const resetInvoice = useCallback(() => {
    setInvoice(null);
  }, []);

  return {
    zaps,
    zapCount,
    totalSats,
    ...query,
    zap,
    isZapping,
    invoice,
    setInvoice,
    resetInvoice,
  };
}
