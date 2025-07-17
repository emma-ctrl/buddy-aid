import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string;
  isLoading: boolean;
  error: string | null;
  queueLength: number;
}

interface QueueItem {
  text: string;
  id: string;
}

export const useTextToSpeech = () => {
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    currentText: '',
    isLoading: false,
    error: null,
    queueLength: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrl = useRef<string | null>(null);
  const queue = useRef<QueueItem[]>([]);
  const isProcessing = useRef(false);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleAudioEnd);
      audioRef.current.removeEventListener('error', handleAudioError);
    }
    if (currentAudioUrl.current) {
      URL.revokeObjectURL(currentAudioUrl.current);
      currentAudioUrl.current = null;
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || queue.current.length === 0) return;
    
    isProcessing.current = true;
    const item = queue.current.shift();
    
    if (!item) {
      isProcessing.current = false;
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      currentText: item.text,
      error: null,
      queueLength: queue.current.length
    }));

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: item.text }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      // Convert base64 to audio blob
      const audioData = atob(data.audioContent);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      currentAudioUrl.current = URL.createObjectURL(audioBlob);

      // Create and configure audio element
      audioRef.current = new Audio(currentAudioUrl.current);
      audioRef.current.addEventListener('ended', handleAudioEnd);
      audioRef.current.addEventListener('error', handleAudioError);

      // Play the audio
      await audioRef.current.play();

      setState(prev => ({ 
        ...prev, 
        isPlaying: true, 
        isPaused: false,
        isLoading: false 
      }));

    } catch (error) {
      console.error('TTS Error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate speech',
        queueLength: queue.current.length
      }));
      // Continue processing queue even if one item fails
      isProcessing.current = false;
      processQueue();
    }
  }, []);

  const handleAudioEnd = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
    cleanup();
    isProcessing.current = false;
    // Process next item in queue
    processQueue();
  }, [cleanup, processQueue]);

  const handleAudioError = useCallback((error: any) => {
    console.error('Audio playback error:', error);
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false,
      error: 'Audio playback failed' 
    }));
    cleanup();
    isProcessing.current = false;
    // Continue processing queue
    processQueue();
  }, [cleanup, processQueue]);

  const speak = useCallback((text: string) => {
    if (!text.trim()) return;

    const id = Date.now().toString();
    queue.current.push({ text, id });
    
    setState(prev => ({ 
      ...prev, 
      queueLength: queue.current.length 
    }));

    // Start processing if not already processing
    processQueue();
  }, [processQueue]);

  const pause = useCallback(() => {
    if (audioRef.current && state.isPlaying) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    }
  }, [state.isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && state.isPaused) {
      audioRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    }
  }, [state.isPaused]);

  const stop = useCallback(() => {
    // Clear the queue and stop current playback
    queue.current = [];
    isProcessing.current = false;
    cleanup();
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false,
      currentText: '',
      error: null,
      queueLength: 0
    }));
  }, [cleanup]);

  const replay = useCallback(() => {
    if (state.currentText) {
      speak(state.currentText);
    }
  }, [state.currentText, speak]);

  return {
    ...state,
    speak,
    pause,
    resume,
    stop,
    replay,
  };
};