import { useState, useEffect } from 'react';
import { Mic, MicOff, Phone, Heart, Droplets, Users } from 'lucide-react';
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
    <div className="min-h-screen px-6 py-8 flex flex-col">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Hi, BuddyAid here
        </h1>
        <p className="text-base font-medium text-foreground leading-relaxed max-w-sm mx-auto">
          <span className="gradient-text">
            I hope you never need me but in an emergency I'm here for you
          </span>
        </p>
      </div>

      {/* Voice Button Section */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fade-in-delayed">
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
            <div className="flex items-center justify-center">
              <div className={`w-4 h-4 rounded-full ${
                isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
            </div>
          )}
        </div>

        {/* Prompt Text */}
        <div className="text-center">
          <p className="text-xl font-medium text-foreground mb-2">
            {isProcessing ? 'Processing...' : 'Tell me, what\'s happening?'}
          </p>
          <p className="text-base text-muted-foreground">
            {isProcessing ? 'Analyzing your description' : 'I\'m here to help'}
          </p>
        </div>

        {/* Demo Input for Testing OpenAI Integration */}
        <div className="mt-6 max-w-md mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Describe the emergency situation..."
              className="flex-1 px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  processEmergencyDescription(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              disabled={isProcessing}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (input) {
                  processEmergencyDescription(input.value);
                  input.value = '';
                }
              }}
              disabled={isProcessing}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Submit'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Try: "person not breathing", "severe bleeding", "someone choking"
          </p>
        </div>
      </div>

      {/* Voice Controls */}
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

      {/* Conversation History */}
      <ConversationHistory messages={messages} />

      {/* Quick Action Buttons */}
      <div className="mt-12 animate-fade-in-delayed-2">
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-foreground mb-2">
            Quick suggestions
          </p>
          <p className="text-sm text-muted-foreground">
            Tap any scenario for step-by-step guidance
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {/* Not breathing */}
          <button
            onClick={() => handleQuickAction('not-breathing')}
            className="suggestion-button"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium">Not breathing</span>
            </div>
          </button>

          {/* Severe bleeding */}
          <button
            onClick={() => handleQuickAction('severe-bleeding')}
            className="suggestion-button"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium">Severe bleeding</span>
            </div>
          </button>

          {/* Unconscious, still breathing */}
          <button
            onClick={() => handleQuickAction('unconscious-breathing')}
            className="suggestion-button"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium">Unconscious, still breathing</span>
            </div>
          </button>

          {/* Emergency Call Button */}
          <button
            onClick={handleEmergencyCall}
            className="emergency-button"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium">📞 Call emergency services</span>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="mt-8 text-center animate-fade-in-delayed-3">
        <p className="text-xs text-muted-foreground">
          {isListening ? 'Listening... tap to stop' : 'Tap the microphone to start'}
        </p>
      </div>
    </div>
  );
};

export default BuddyAid;