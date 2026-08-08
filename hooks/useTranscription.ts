import { useState, useCallback } from 'react';

export function useTranscription() {
  const [transcript, setTranscriptState] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const appendTranscript = useCallback((text: string) => {
    setTranscriptState(prev => {
      const trimmed = text.trim();
      if (!trimmed) return prev;
      return prev ? `${prev} ${trimmed}` : trimmed;
    });
  }, []);

  const setTranscript = useCallback((text: string) => {
    setTranscriptState(text);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscriptState('');
  }, []);

  return {
    transcript,
    isTranscribing,
    setIsTranscribing,
    appendTranscript,
    setTranscript,
    clearTranscript,
  };
}
