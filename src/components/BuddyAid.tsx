import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, Heart, Droplets, Users, AlertTriangle } from 'lucide-react';
import EmergencyProtocols from './EmergencyProtocols';
import { supabase } from '@/integrations/supabase/client';
import { ConversationHistory, Message } from './ConversationHistory';
import { VoiceControls } from './VoiceControls';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

const BuddyAid = () => {
  const [activeEmergency, setActiveEmergency] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isInGuidance, setIsInGuidance] = useState(false);
  
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

  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');
  const hasGreetingBeenSpoken = useRef(false);
  
  const { 
    isListening, 
    isSupported: speechSupported, 
    toggleListening 
  } = useSpeechRecognition({
    onResult: (result) => {
      console.log('Speech result:', result);
      
      if (result.isFinal && result.transcript) {
        lastTranscriptRef.current = result.transcript;
        
        // Clear any existing timeout
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }
        
        // Add a delay during guidance mode to ensure user has finished speaking
        const delay = isInGuidance ? 2000 : 500; // 2 seconds during guidance, 0.5 seconds otherwise
        
        speechTimeoutRef.current = setTimeout(() => {
          // Route to appropriate handler based on current state
          handleGuidanceResponse(lastTranscriptRef.current);
          lastTranscriptRef.current = '';
        }, delay);
      }
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
      const errorMsg = "I'm having trouble hearing you. Please try again or use the quick action buttons.";
      addMessage('assistant', errorMsg);
      speak(errorMsg);
    },
    continuous: false,
    interimResults: true
  });

  const handleVoiceToggle = () => {
    if (!speechSupported) {
      const errorMsg = "Speech recognition is not supported in this browser. Please use the quick action buttons or try a different browser.";
      addMessage('assistant', errorMsg);
      speak(errorMsg);
      return;
    }
    
    toggleListening();
  };

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

  const emergencyProtocols = {
    'severe-bleeding': {
      title: 'Severe Bleeding',
      steps: [
        {
          instruction: "First, I need you to apply direct pressure to the wound. Use a clean cloth, towel, or even clothing if that's all you have. Press firmly directly on the bleeding area.",
          followUp: "Are you able to apply pressure to the wound? Let me know when you've done this."
        },
        {
          instruction: "Great job. Now, if the bleeding is severe, we need to call emergency services immediately. Can you call 999 or 112 right now, or is someone else able to make that call?",
          followUp: "Let me know when emergency services have been contacted, then I'll guide you through the next steps."
        },
        {
          instruction: "Perfect. Now, if possible, try to elevate the injured area above the level of the heart. Only do this if you don't suspect a broken bone. Keep applying that pressure while you elevate.",
          followUp: "Have you been able to elevate the area? How is the bleeding now?"
        },
        {
          instruction: "You're doing brilliantly. If blood soaks through the cloth, don't remove it - just add more cloth on top and keep pressing. We want to maintain that pressure.",
          followUp: "Keep monitoring the person. Are they conscious and talking to you?"
        },
        {
          instruction: "Keep the person warm and as comfortable as possible. Don't give them anything to eat or drink. Keep talking to them and reassure them that help is coming.",
          followUp: "Stay with them and keep applying pressure until paramedics arrive. You're doing everything right."
        }
      ]
    },
    'not-breathing': {
      title: 'CPR - Not Breathing',
      steps: [
        {
          instruction: "This is very serious. First, check if they're responsive - tap their shoulders firmly and shout 'Are you okay?' Do this now.",
          followUp: "Are they responding at all to your voice or touch?"
        },
        {
          instruction: "Call 999 or 112 immediately and put it on speaker so you can hear me. Tell them you need an ambulance for someone not breathing. Do this right now.",
          followUp: "Have you called emergency services? Are they on the line?"
        },
        {
          instruction: "Now, tilt their head back gently and lift their chin up to open the airway. Look, listen and feel for any breathing for up to 10 seconds.",
          followUp: "Can you see their chest moving or feel any breath on your cheek?"
        },
        {
          instruction: "We need to start CPR. Place the heel of one hand on the center of their chest, between the nipples. Place your other hand on top and interlock your fingers.",
          followUp: "Do you have your hands positioned on their chest?"
        },
        {
          instruction: "Push hard and fast straight down at least 2 inches deep. Count out loud: '1, 2, 3...' up to 30. Push at least 100 times per minute - think of the beat of 'Stayin' Alive'.",
          followUp: "Have you completed 30 chest compressions? Now we need to give 2 rescue breaths."
        },
        {
          instruction: "Tilt their head back, lift the chin, pinch their nose closed. Cover their mouth with yours and give 2 breaths, each lasting 1 second. Watch for the chest to rise.",
          followUp: "Continue 30 compressions then 2 breaths. Keep going until paramedics arrive. You're saving their life."
        }
      ]
    },
    'adult-choking': {
      title: 'Adult Choking',
      steps: [
        {
          instruction: "Ask them 'Are you choking?' If they can cough or speak, encourage them to keep coughing to try to clear it themselves.",
          followUp: "Can they cough, speak, or breathe at all?"
        },
        {
          instruction: "If they can't cough or speak, we need to help them. Stand behind them and lean them forward. Support them with one hand on their chest.",
          followUp: "Are you positioned behind them with them leaning forward?"
        },
        {
          instruction: "Give up to 5 sharp back blows between their shoulder blades with the heel of your hand. Hit firmly and check their mouth after each blow.",
          followUp: "Have you given the back blows? Has anything come out of their mouth?"
        },
        {
          instruction: "If the blockage is still there, we'll try abdominal thrusts. Stand behind them, place your hands just below their ribcage, and pull sharply inward and upward up to 5 times.",
          followUp: "Have you tried the abdominal thrusts? Is the object cleared?"
        },
        {
          instruction: "If they're still choking, call 999 or 112 immediately. Keep alternating between 5 back blows and 5 abdominal thrusts until help arrives.",
          followUp: "Keep going with the back blows and abdominal thrusts. Help is coming."
        }
      ]
    },
    'unconscious-breathing': {
      title: 'Recovery Position',
      steps: [
        {
          instruction: "First, let's make sure they're breathing normally. Can you see their chest rising and falling regularly?",
          followUp: "Are they breathing normally? If not, we need to start CPR instead."
        },
        {
          instruction: "Call 999 or 112 and tell them you have someone who is unconscious but breathing. Put it on speaker.",
          followUp: "Have you called emergency services?"
        },
        {
          instruction: "We need to put them in the recovery position. First, place their nearest arm at a right angle with their palm facing up.",
          followUp: "Have you positioned their near arm?"
        },
        {
          instruction: "Now bring their far arm across their chest and place the back of their hand against their near cheek.",
          followUp: "Is their hand positioned against their cheek?"
        },
        {
          instruction: "Grab their far leg above the knee and pull it up so their foot is flat on the ground, then roll them toward you onto their side.",
          followUp: "Have you rolled them onto their side? Make sure their head is tilted back to keep their airway open."
        },
        {
          instruction: "Perfect. Keep monitoring their breathing and stay with them until paramedics arrive. Talk to them even if they can't respond.",
          followUp: "You've done great. Keep watching their breathing and stay with them."
        }
      ]
    }
  };

  const startConversationalGuidance = (emergencyType: string) => {
    const protocol = emergencyProtocols[emergencyType as keyof typeof emergencyProtocols];
    if (!protocol) {
      const errorMsg = "I'm not sure how to help with that specific emergency. Let me connect you with the quick action buttons instead.";
      addMessage('assistant', errorMsg);
      speak(errorMsg);
      return;
    }

    setActiveEmergency(emergencyType);
    setCurrentStep(0);
    setIsInGuidance(true);
    
    // Start with a calm, reassuring introduction
    const introMsg = `I understand this is about ${emergencyType.replace('-', ' ')}. I'm going to guide you through this step by step. Take a deep breath - we'll get through this together.`;
    addMessage('assistant', introMsg);
    speak(introMsg);
    
    // Give the first instruction after a brief pause
    setTimeout(() => {
      const firstInstruction = protocol.steps[0].instruction;
      addMessage('assistant', firstInstruction);
      speak(firstInstruction);
    }, 3000);
  };

  const handleNextStep = () => {
    if (!activeEmergency || !isInGuidance) return;
    
    const protocol = emergencyProtocols[activeEmergency as keyof typeof emergencyProtocols];
    if (!protocol) return;

    const nextStepIndex = currentStep + 1;
    
    if (nextStepIndex < protocol.steps.length) {
      setCurrentStep(nextStepIndex);
      const nextInstruction = protocol.steps[nextStepIndex].instruction;
      addMessage('assistant', nextInstruction);
      speak(nextInstruction);
    } else {
      // End of protocol
      const endMsg = "You've completed all the steps. Keep doing what you're doing and stay with them until emergency services arrive. You're doing an amazing job.";
      addMessage('assistant', endMsg);
      speak(endMsg);
      setIsInGuidance(false);
    }
  };

  const handleGuidanceResponse = (response: string) => {
    if (!isInGuidance || !activeEmergency) {
      // Normal processing
      processEmergencyDescription(response);
      return;
    }

    // In guidance mode - acknowledge their response and potentially move to next step
    addMessage('user', response);
    
    const protocol = emergencyProtocols[activeEmergency as keyof typeof emergencyProtocols];
    if (protocol && currentStep < protocol.steps.length) {
      const currentProtocolStep = protocol.steps[currentStep];
      
      // Acknowledge their response
      const acknowledgments = [
        "Good, that's exactly right.",
        "Perfect, you're doing great.",
        "Excellent work.",
        "That's it, well done.",
        "You're handling this brilliantly."
      ];
      const ack = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
      
      // Check if we should move to next step or give follow-up
      const lowerResponse = response.toLowerCase();
      const shouldProgress = lowerResponse.includes('yes') || lowerResponse.includes('done') || lowerResponse.includes('okay') || lowerResponse.includes('completed');
      
      if (shouldProgress) {
        addMessage('assistant', ack);
        speak(ack);
        
        setTimeout(() => {
          handleNextStep();
        }, 2000);
      } else {
        // Give follow-up guidance
        const followUp = currentProtocolStep.followUp;
        addMessage('assistant', `${ack} ${followUp}`);
        speak(`${ack} ${followUp}`);
      }
    }
  };

  const handleQuickAction = (emergencyType: string) => {
    const userMsg = `Help with ${emergencyType.replace('-', ' ')}`;
    addMessage('user', userMsg);
    
    // Start conversational guidance directly
    startConversationalGuidance(emergencyType);
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
    console.log('Processing emergency description:', description);
    
    // Add user message
    addMessage('user', description);
    
    try {
      console.log('Calling process-emergency-description edge function...');
      const { data, error } = await supabase.functions.invoke('process-emergency-description', {
        body: { description }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Error processing emergency description:', error);
        const errorMsg = "I'm sorry, I couldn't process that. Please try describing the emergency again or use the quick action buttons.";
        addMessage('assistant', errorMsg);
        speak(errorMsg);
        return;
      }

      if (data && data.emergencyType) {
        console.log('Starting conversational guidance for:', data.emergencyType);
        
        // Start conversational guidance instead of navigating to protocol screen
        startConversationalGuidance(data.emergencyType);
        
      } else {
        console.warn('No emergency type returned from edge function');
        const errorMsg = "I'm not sure what type of emergency this is. Please try describing it differently or use the quick action buttons.";
        addMessage('assistant', errorMsg);
        speak(errorMsg);
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
    if (messages.length === 0 && !hasGreetingBeenSpoken.current) {
      hasGreetingBeenSpoken.current = true;
      const timer = setTimeout(() => {
        addMessage('assistant', greeting);
        speak(greeting);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, speak]);

  // Don't navigate to separate screen - keep everything in chat
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