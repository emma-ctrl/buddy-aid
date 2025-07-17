import { Button } from '@/components/ui/button';
import { Pause, Play, Square, RotateCcw, Volume2 } from 'lucide-react';

interface VoiceControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReplay: () => void;
  currentText: string;
}

export const VoiceControls = ({
  isPlaying,
  isPaused,
  isLoading,
  onPause,
  onResume,
  onStop,
  onReplay,
  currentText
}: VoiceControlsProps) => {
  if (!currentText && !isPlaying && !isPaused && !isLoading) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
      <Volume2 className="w-4 h-4 text-muted-foreground" />
      
      <div className="flex items-center gap-1">
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {isPlaying ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPause}
                className="h-8 w-8 p-0"
              >
                <Pause className="w-4 h-4" />
              </Button>
            ) : isPaused ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResume}
                className="h-8 w-8 p-0"
              >
                <Play className="w-4 h-4" />
              </Button>
            ) : null}
            
            {(isPlaying || isPaused) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onStop}
                className="h-8 w-8 p-0"
              >
                <Square className="w-4 h-4" />
              </Button>
            )}
            
            {currentText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReplay}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Generating speech...</p>
        )}
        {isPlaying && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-sm text-muted-foreground">Speaking...</p>
          </div>
        )}
        {isPaused && (
          <p className="text-sm text-muted-foreground">Paused</p>
        )}
      </div>
    </div>
  );
};