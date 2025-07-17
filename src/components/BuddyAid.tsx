import { useState, useEffect } from 'react';
import { Mic, MicOff, Phone, Heart, Droplets, Users, AlertTriangle } from 'lucide-react';
import EmergencyProtocols from './EmergencyProtocols';
import { supabase } from '@/integrations/supabase/client';
import { ConversationHistory, Message } from './ConversationHistory';
import { VoiceControls } from './VoiceControls';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

const BuddyAid = () => {
  const [isListening, setIsListening] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { 
    isPlaying, 
    isPaused, 
    isLoading: ttsLoading, 
    currentText, 
    speak, 
    pause, 
    resume, 
    stop, 
    replay 
  } = useTextToSpeech();

  const addMessage = (type: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
  };

  const handleQuickAction = (emergencyType: string) => {
    const userMsg = `Help with ${emergencyType.replace('-', ' ')}`;
    addMessage('user', userMsg);
    
    setActiveEmergency(emergencyType);
    const response = `I'm here to help with ${emergencyType.replace('-', ' ')}. Let me guide you through the steps.`;
    addMessage('assistant', response);
    speak(response);
  };

  const handleEmergencyCall = () => {
    // In a real app, this would initiate emergency services call
    window.location.href = 'tel:999';
  };

  const handleBackToMenu = () => {
    setActiveEmergency(null);
    stop(); // Stop any current speech
  };

  const processEmergencyDescription = async (description: string) => {
    if (!description.trim()) return;
    
    setIsProcessing(true);
    // Add user message
    addMessage('user', description);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-emergency-description', {
        body: { description }
      });

      if (error) {
        console.error('Error processing emergency description:', error);
        const errorMsg = "I'm sorry, I couldn't process that. Please try describing the emergency again.";
        addMessage('assistant', errorMsg);
        speak(errorMsg);
        return;
      }

      if (data && data.emergencyType) {
        setActiveEmergency(data.emergencyType);
        const response = `I understand this is about ${data.emergencyType.replace('-', ' ')}. Let me guide you through the proper steps.`;
        addMessage('assistant', response);
        speak(response);
      }
    } catch (error) {
      console.error('Error calling edge function:', error);
      const errorMsg = "I'm having trouble connecting right now. Please call emergency services directly if this is urgent.";
      addMessage('assistant', errorMsg);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-speak greeting on first load
  useEffect(() => {
    const greeting = "What's happening? I'm here to help.";
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        addMessage('assistant', greeting);
        speak(greeting);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (activeEmergency) {
    return (
      <EmergencyProtocols 
        emergencyType={activeEmergency} 
        onBack={handleBackToMenu}
        messages={messages}
        onAddMessage={addMessage}
        ttsSpeak={speak}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-xl font-bold text-foreground mb-2">
          Hi, BuddyAid here
        </h1>
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
            className={`voice-button ${isListening ? 'active' : ''}`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>
        </div>

        {/* Voice Status Indicator */}
        <div className="w-full max-w-md">
          {(isPlaying || isPaused || ttsLoading) && (
            <div className="flex items-center justify-center mb-2">
              <div className={`w-3 h-3 rounded-full ${
                isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
            </div>
          )}
        </div>

        {/* Prompt Text */}
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-2">
            {isProcessing ? 'Processing...' : 'Tell me, what\'s happening?'}
          </p>
        </div>

      </div>

      {/* Voice Controls */}
      <div className="mt-4">
        <VoiceControls
          isPlaying={isPlaying}
          isPaused={isPaused}
          isLoading={ttsLoading}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onReplay={replay}
          currentText={currentText}
        />
      </div>

      {/* Conversation History */}
      <div className="mt-4">
        <ConversationHistory messages={messages} />
      </div>

      {/* Quick Action Buttons - Smaller and Mobile-Friendly */}
      <div className="mt-8 animate-fade-in-delayed-2">
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {/* Not breathing */}
          <button
            onClick={() => handleQuickAction('not-breathing')}
            className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-center"
          >
            <div className="flex flex-col items-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium">Not breathing</span>
            </div>
          </button>

          {/* Severe bleeding */}
          <button
            onClick={() => handleQuickAction('severe-bleeding')}
            className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-center"
          >
            <div className="flex flex-col items-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium">Severe bleeding</span>
            </div>
          </button>

          {/* Choking */}
          <button
            onClick={() => handleQuickAction('adult-choking')}
            className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-center"
          >
            <div className="flex flex-col items-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium">Choking</span>
            </div>
          </button>

          {/* Unconscious, still breathing */}
          <button
            onClick={() => handleQuickAction('unconscious-breathing')}
            className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-center"
          >
            <div className="flex flex-col items-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium">Unconscious still breathing</span>
            </div>
          </button>
        </div>
        
        {/* Emergency Call Button - Separate and prominent */}
        <div className="mt-4 max-w-sm mx-auto">
          <button
            onClick={handleEmergencyCall}
            className="w-full p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <div className="flex items-center justify-center space-x-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Call Emergency Services</span>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="mt-6 text-center animate-fade-in-delayed-3">
        <p className="text-xs text-muted-foreground">
          {isListening ? 'Listening... tap to stop' : ''}
        </p>
      </div>
    </div>
  );
};

export default BuddyAid;