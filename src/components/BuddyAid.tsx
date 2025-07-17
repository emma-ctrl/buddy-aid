import { useState } from 'react';
import { Mic, MicOff, Phone, Heart, Droplets, Users } from 'lucide-react';

const BuddyAid = () => {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
  };

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // In a real app, this would trigger the voice assistant with the specific emergency
  };

  const handleEmergencyCall = () => {
    console.log('Emergency call initiated');
    // In a real app, this would initiate emergency services call
  };

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

        {/* Prompt Text */}
        <div className="text-center">
          <p className="text-xl font-medium text-foreground mb-2">
            Tell me, what's happening?
          </p>
          <p className="text-base text-muted-foreground">
            I'm here to help
          </p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-12 animate-fade-in-delayed-2">
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
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