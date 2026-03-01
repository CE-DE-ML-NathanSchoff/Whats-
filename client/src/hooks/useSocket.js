import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket(eventHandlers = {}) {
  const socketRef = useRef(null);
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    const token = localStorage.getItem('ct_token');
    const socket = io({
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('event:created', (data) => handlersRef.current['event:created']?.(data));
    socket.on('event:updated', (data) => handlersRef.current['event:updated']?.(data));
    socket.on('event:watered', (data) => handlersRef.current['event:watered']?.(data));

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
}
