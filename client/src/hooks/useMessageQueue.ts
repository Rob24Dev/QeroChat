import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { Message } from '../types';

export interface PendingMsg {
  id: string;
  chatId: string;
  text: string;
  status: 'sending' | 'failed';
}

/* fronta zpráv – offline se řadí, po obnovení spojení se odešlou */
export function useMessageQueue(
    online: boolean,
    onSent?: (chatId: string, localId: string, server: Message) => void,
) {
  const [pending, setPending] = useState<PendingMsg[]>([]);
  const pendingRef = useRef(pending);
  useEffect(() => { pendingRef.current = pending; }, [pending]);
  const processingRef = useRef(false);
  const onSentRef = useRef(onSent);
  useEffect(() => { onSentRef.current = onSent; });

  const enqueue = useCallback((msg: Omit<PendingMsg, 'status'>) => {
    setPending(prev => [...prev, { ...msg, status: 'sending' }]);
  }, []);

  const drain = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      let queue = [...pendingRef.current];
      for (;;) {
        const next = queue.find(m => m.status === 'sending');
        if (!next) break;
        try {
          const server = await api.sendMessage(next.chatId, next.text);
          onSentRef.current?.(next.chatId, next.id, server);
          queue = queue.filter(m => m.id !== next.id);
          setPending(queue);
        } catch {
          queue = queue.map(m => (m.id === next.id ? { ...m, status: 'failed' } : m));
          setPending(queue);
          break;
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (online) void drain();
  }, [online, pending, drain]);

  const retryFailed = useCallback(() => {
    setPending(prev => prev.map(m => ({ ...m, status: 'sending' })));
  }, []);

  return { pending, enqueue, retryFailed };
}