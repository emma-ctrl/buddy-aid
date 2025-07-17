import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Heart, AlertTriangle, Phone, Brain, Zap, Volume2 } from 'lucide-react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { toast } from 'sonner';

export default function BuddyAidRealtime() {
  const {
    messages,
    isConnected,
    isRecording,
    currentTranscript,
    isAIResponding,
    startRecording,
    stopRecording,
    sendTextMessage,
    clearConversation
  } = useRealtimeChat();

  const [showQuickActions, setShowQuickActions] = useState(true);

  useEffect(() => {
    if (messages.length > 0) {
      setShowQuickActions(false);
    }
  }, [messages]);

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleQuickAction = (action: string) => {
    const actionTexts = {
      'severe-bleeding': "There's severe bleeding - I need help with first aid",
      'choking': "Someone is choking - I need immediate help",
      'unconscious': "Someone is unconscious and not breathing - I need CPR guidance",
      'heart-attack': "I think someone is having a heart attack",
      'stroke': "I think someone is having a stroke",
      'seizure': "Someone is having a seizure"
    };
    
    const text = actionTexts[action as keyof typeof actionTexts];
    if (text) {
      sendTextMessage(text);
      setShowQuickActions(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Auto-speak greeting on first load
  useEffect(() => {
    if (messages.length === 0 && isConnected) {
      const timer = setTimeout(() => {
        sendTextMessage("Hello, I'm BuddyAid. What's happening? I'm here to help you with any emergency first aid situation.");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, messages.length, sendTextMessage]);

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className="text-xl font-bold text-foreground">
            Hi, BuddyAid here
          </h1>
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "Connected" : "Connecting..."}
          </Badge>
        </div>
        <p className="text-sm font-medium text-foreground leading-relaxed max-w-sm mx-auto">
          <span className="gradient-text">
            I hope you never need me but in an emergency I'm here for you
          </span>
        </p>
      </div>

      {/* Voice Button Section */}
      <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in-delayed">
        {/* Large Voice Button */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={handleVoiceToggle}
            disabled={!isConnected}
            className={`voice-button ${isRecording ? 'active' : ''} ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isRecording ? 'Stop listening' : 'Start listening'}
          >
            {isRecording ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
            
            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-foreground/80 mb-2">
            {isRecording ? "I'm listening..." : "Tap to speak"}
          </p>
          {isAIResponding && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary">
              <Volume2 className="w-4 h-4" />
              <span>BuddyAid is responding...</span>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        {showQuickActions && (
          <div className="w-full max-w-md space-y-3 animate-fade-in-delayed">
            <p className="text-sm text-center text-foreground/80 mb-4">
              Or tap for quick help:
            </p>
            
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAction('severe-bleeding')}
                className="flex items-center gap-3 justify-start h-12 emergency-button"
              >
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-sm font-medium">Severe Bleeding</span>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAction('choking')}
                className="flex items-center gap-3 justify-start h-12 emergency-button"
              >
                <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium">Choking</span>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAction('unconscious')}
                className="flex items-center gap-3 justify-start h-12 emergency-button"
              >
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-sm font-medium">Unconscious/Not Breathing</span>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAction('heart-attack')}
                className="flex items-center gap-3 justify-start h-12 emergency-button"
              >
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-sm font-medium">Heart Attack</span>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAction('stroke')}
                className="flex items-center gap-3 justify-start h-12 emergency-button"
              >
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium">Stroke</span>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleQuickAction('seizure')}
                className="flex items-center gap-3 justify-start h-12 emergency-button"
              >
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
                <span className="text-sm font-medium">Seizure</span>
              </Button>
            </div>
          </div>
        )}

        {/* Call Emergency Services Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={() => {
            if (typeof window !== 'undefined' && 'navigator' in window) {
              window.open('tel:999', '_self');
            }
          }}
          className="w-full max-w-md emergency-call-button"
        >
          <Phone className="w-5 h-5 mr-2" />
          Call 999 - Emergency Services
        </Button>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 max-w-2xl mx-auto w-full mt-8 space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className={`${message.type === 'user' ? 'ml-8' : 'mr-8'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.type === 'user' ? (
                      <span className="text-sm font-medium">You</span>
                    ) : (
                      <span className="text-sm font-medium">BA</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground leading-relaxed">
                      {message.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Current AI response */}
          {currentTranscript && (
            <Card className="mr-8">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium">BA</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground leading-relaxed">
                      {currentTranscript}
                      <span className="animate-pulse">|</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Clear conversation button */}
      {messages.length > 0 && (
        <div className="fixed bottom-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={clearConversation}
            className="bg-background/80 backdrop-blur-sm"
          >
            Clear Chat
          </Button>
        </div>
      )}
    </div>
  );
}