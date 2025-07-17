import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string;
  isLoading: boolean;
  error: string | null;
}

export const useTextToSpeech = () => {
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    currentText: '',
    isLoading: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrl = useRef<string | null>(null);

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

  const handleAudioEnd = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
    cleanup();
  }, [cleanup]);

  const handleAudioError = useCallback((error: any) => {
    console.error('Audio playback error:', error);
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false,
      error: 'Audio playback failed' 
    }));
    cleanup();
  }, [cleanup]);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Stop any current playback
    cleanup();

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      currentText: text,
      error: null 
    }));

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text }
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
        error: error instanceof Error ? error.message : 'Failed to generate speech'
      }));
    }
  }, [cleanup, handleAudioEnd, handleAudioError]);

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
    cleanup();
    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false,
      currentText: '',
      error: null 
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