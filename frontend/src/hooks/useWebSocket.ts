import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
}

export const useWebSocket = (url: string, options: { reconnectInterval?: number; maxReconnectAttempts?: number } = {}) => {
  const { reconnectInterval = 5000, maxReconnectAttempts = 5 } = options;
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Mock WebSocket for development - replace with real WebSocket
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: (data: string) => {
          console.log('Mock WebSocket send:', data);
        },
        close: () => {
          console.log('Mock WebSocket closed');
        },
        addEventListener: (event: string, handler: (event: any) => void) => {
          if (event === 'open') {
            setTimeout(() => handler({ type: 'open' }), 100);
          } else if (event === 'message') {
            // Simulate receiving messages
            const interval = setInterval(() => {
              const mockMessage = {
                type: 'message',
                data: JSON.stringify({
                  type: 'price_update',
                  data: {
                    symbol: 'EURUSD',
                    price: 1.0950 + (Math.random() - 0.5) * 0.01,
                    timestamp: new Date().toISOString(),
                  },
                }),
              };
              handler(mockMessage);
            }, 1000);
            
            // Store interval for cleanup
            (mockWs as any)._interval = interval;
          } else if (event === 'close') {
            // Store handler for cleanup
            (mockWs as any)._closeHandler = handler;
          } else if (event === 'error') {
            // Store handler for cleanup
            (mockWs as any)._errorHandler = handler;
          }
        },
        removeEventListener: (event: string, handler: (event: any) => void) => {
          if (event === 'message' && (mockWs as any)._interval) {
            clearInterval((mockWs as any)._interval);
          }
        },
      };

      wsRef.current = mockWs as any;

      const handleOpen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
        reconnectAttemptsRef.current = 0;
      };

      const handleMessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setState(prev => ({
            ...prev,
            lastMessage: message,
          }));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      const handleClose = () => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      const handleError = (error: Event) => {
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection error',
          isConnecting: false,
        }));
      };

      wsRef.current.addEventListener('open', handleOpen);
      wsRef.current.addEventListener('message', handleMessage);
      wsRef.current.addEventListener('close', handleClose);
      wsRef.current.addEventListener('error', handleError);

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to create WebSocket connection',
        isConnecting: false,
      }));
    }
  }, [url, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
    }));
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
  };
};










