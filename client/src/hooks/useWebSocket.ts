import { useCallback, useEffect, useRef } from 'react';
import { API_BASE } from '../api';
import type { WsEvent } from '../types';

/* WS klient s reconnectem (exponential backoff) a resyncem po reconnectu */
export function useWebSocket(
  enabled: boolean,
  token: string | null,
  onEvent: (ev: WsEvent) => void,
  onResync: () => void,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const closedByUserRef = useRef(false);

  const connect = useCallback(() => {
    if (!enabled || !token) return;
    const url = API_BASE.replace(/^http/, 'ws') + '/ws?token=' + encodeURIComponent(token);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retriesRef.current = 0;
      onResync();
    };

    ws.onmessage = (e) => {
      try { onEvent(JSON.parse(e.data) as WsEvent); } catch { /* ignore */ }
    };

    ws.onclose = () => {
      if (closedByUserRef.current) return;
      const delay = Math.min(1000 * 2 ** retriesRef.current, 15000);
      retriesRef.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [enabled, token, onEvent, onResync]);

  useEffect(() => {
    closedByUserRef.current = false;
    connect();
    return () => { closedByUserRef.current = true; wsRef.current?.close(); };
  }, [connect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}
