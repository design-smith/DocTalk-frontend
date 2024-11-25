import React, { useEffect, useRef, useState } from 'react';

interface TranslationProps {
  text: string;
  onTranslated: (translatedText: string) => void;
}

const RealTimeTranslation: React.FC<TranslationProps> = ({ text, onTranslated }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const lastText = useRef<string>('');
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Reset handler when text becomes empty
  useEffect(() => {
    if (text === '') {
      lastText.current = '';
      setIsLoading(false);
      setError(null);
    }
  }, [text]);

  const connect = () => {
    try {
      if (ws.current?.readyState === WebSocket.OPEN) {
        return;
      }

      ws.current = new WebSocket('ws://localhost:8000/ws/translate');

      ws.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        lastText.current = ''; // Reset on new connection
      };

      ws.current.onclose = (event) => {
        setIsConnected(false);
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          setTimeout(connect, 2000 * reconnectAttempts.current);
          setError(`Connection lost. Reconnecting (attempt ${reconnectAttempts.current})...`);
        } else {
          setError('Unable to connect to translation server after multiple attempts.');
        }
      };

      ws.current.onerror = (event) => {
        console.error('WebSocket error:', event);
      };

      ws.current.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          setIsLoading(false);

          if (response.status === 'success') {
            onTranslated(response.translation);
            lastText.current = ''; // Reset after successful translation
          } else {
            setError(response.error || 'Translation failed');
          }
        } catch (err) {
          console.error('Error processing message:', err);
          setError('Error processing translation response');
        }
      };
    } catch (err) {
      console.error('Connection error:', err);
      setError('Failed to connect to translation server');
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!text || !isConnected || text === lastText.current) return;

    lastText.current = text;
    setIsLoading(true);
    setError(null);

    try {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(text);
      } else {
        setError('Connection not ready. Please wait...');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Send error:', err);
      setError('Failed to send text for translation');
      setIsLoading(false);
    }
  }, [text, isConnected]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!isConnected || isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-gray-600">
          {!isConnected ? 'Connecting to translation server...' : 'Translating...'}
        </p>
      </div>
    );
  }

  return null;
};

export default RealTimeTranslation;