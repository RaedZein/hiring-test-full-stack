import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../data/query-keys';
import type { LLMStreamChunk } from '../types/chat';
import { toast } from 'sonner';

interface Options {
  chatId: string | null;
  model?: string;
}

const API_BASE_URL = 'http://localhost:8000';

export function useStreamingMessage({ chatId, model }: Options) {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      toast.info('Stream cancelled');
    }
  }, []);
  
  const sendMessage = useCallback(async (content: string) => {
    if (!chatId) {
      toast.error('No chat selected');
      return;
    }
    
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'richard',
        },
        body: JSON.stringify({
          message: content,
          modelId: model,
        }),
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            const chunk: LLMStreamChunk = JSON.parse(data);
            
            if (chunk.type === 'connected') {
              // Connection established
            } else if (chunk.type === 'text' && chunk.content) {
              setStreamingContent(prev => prev + chunk.content);
            } else if (chunk.type === 'done') {
              queryClient.invalidateQueries({
                queryKey: queryKeys.chats.detail(chatId),
              });
              setIsStreaming(false);
            } else if (chunk.type === 'error') {
              setError(chunk.error || 'Stream error');
              toast.error(chunk.error || 'Stream error');
              setIsStreaming(false);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      
      setError(err.message || 'Failed to stream');
      toast.error('Failed to stream response');
      setIsStreaming(false);
    } finally {
      abortControllerRef.current = null;
    }
  }, [chatId, model, queryClient]);
  
  return {
    streamingContent,
    isStreaming,
    error,
    sendMessage,
    abort,
  };
}
