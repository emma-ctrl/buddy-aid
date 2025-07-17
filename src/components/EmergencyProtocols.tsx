import { useState } from 'react';
import { ChevronRight, Phone, AlertTriangle, Heart, Droplets, Users, Baby } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface EmergencyProtocolsProps {
  emergencyType: string;
  onBack: () => void;
}

const EmergencyProtocols = ({ emergencyType, onBack }: EmergencyProtocolsProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCalledEmergency, setHasCalledEmergency] = useState(false);

  const protocols = {
    'adult-choking': {
      title: 'Adult Choking',
      icon: <AlertTriangle className="w-6 h-6" />,
      disclaimer: 'Following St. John Ambulance approved protocols. Call emergency services immediately if obstruction persists.',
      steps: [
        {
          title: 'Check if choking',
          instruction: 'Ask "Are you choking?" Look for signs they cannot cough, speak, or breathe.',
          action: 'If they can cough, encourage them to keep coughing.'
        },
        {
          title: 'Support and position',
          instruction: 'If they cannot clear the obstruction themselves, support them with one hand and lean them forward.',
          action: 'This helps gravity assist in clearing the airway.'
        },
        {
          title: 'Give back blows',
          instruction: 'Give up to 5 sharp back blows between their shoulder blades with the heel of your hand.',
          action: 'Check their mouth after each blow and remove any visible obstruction with your fingertips.'
        },
        {
          title: 'Abdominal thrusts',
          instruction: 'If choking persists, stand behind them and give up to 5 abdominal thrusts.',
          action: 'Link your hands below their rib cage and pull sharply inwards and upwards.'
        },
        {
          title: 'Call emergency services',
          instruction: 'If obstruction still hasn\'t cleared, dial 999 or 112 immediately.',
          action: 'Continue cycles of 5 back blows and 5 abdominal thrusts while waiting for help.'
        },
        {
          title: 'If they become unresponsive',
          instruction: 'If the casualty becomes unresponsive, begin CPR immediately.',
          action: 'Place them on their back and start chest compressions.'
        }
      ]
    },
    'baby-choking': {
      title: 'Baby Choking',
      icon: <Baby className="w-6 h-6" />,
      disclaimer: 'Following St. John Ambulance approved protocols. Call emergency services immediately if obstruction persists.',
      steps: [
        {
          title: 'Position baby',
          instruction: 'Lay the baby face down on your thigh while supporting their head.',
          action: 'Keep the baby\'s head lower than their body.'
        },
        {
          title: 'Give back blows',
          instruction: 'Give up to 5 back blows between the shoulder blades with the heel of your hand.',
          action: 'Use less force than for an adult.'
        },
        {
          title: 'Check mouth',
          instruction: 'Turn baby over and check their mouth for visible obstructions.',
          action: 'Remove any visible obstruction with your fingertips - don\'t sweep blindly.'
        },
        {
          title: 'Chest thrusts',
          instruction: 'If choking persists, give up to 5 chest thrusts.',
          action: 'Place two fingers on breastbone, one finger\'s breadth below nipple line. Push with downward motion.'
        },
        {
          title: 'Call emergency services',
          instruction: 'If obstruction hasn\'t cleared, dial 999 or 112 immediately.',
          action: 'Continue cycles of 5 back blows and 5 chest thrusts while waiting for help.'
        }
      ]
    },
    'not-breathing': {
      title: 'CPR - Adult Not Breathing',
      icon: <Users className="w-6 h-6" />,
      disclaimer: 'Following St. John Ambulance approved protocols. Call emergency services immediately.',
      steps: [
        {
          title: 'Check responsiveness',
          instruction: 'Shout "Are you okay?" and tap their shoulders firmly.',
          action: 'If no response, they are unresponsive.'
        },
        {
          title: 'Open airway',
          instruction: 'Tilt their head back and lift their chin to open the airway.',
          action: 'Look, listen, and feel for breathing for maximum 10 seconds.'
        },
        {
          title: 'Call for help',
          instruction: 'If not breathing normally, call 999 or 112 immediately.',
          action: 'Use speakerphone and request ambulance and AED if available.'
        },
        {
          title: 'Position for CPR',
          instruction: 'Place heel of one hand on centre of chest (breastbone), other hand on top.',
          action: 'Interlock fingers, keep arms straight, shoulders over hands.'
        },
        {
          title: 'Chest compressions',
          instruction: 'Push hard and fast: 30 chest compressions.',
          action: 'Depth: 5-6cm, rate: 100-120 per minute. Allow full chest recoil between compressions.'
        },
        {
          title: 'Rescue breaths',
          instruction: 'Tilt head back, lift chin, pinch nose. Give 2 rescue breaths.',
          action: 'Make seal over mouth, give 1-second breath, watch chest rise.'
        },
        {
          title: 'Continue CPR',
          instruction: 'Continue 30 compressions : 2 breaths ratio without stopping.',
          action: 'Keep going until emergency services arrive or casualty starts breathing normally.'
        }
      ]
    },
    'severe-bleeding': {
      title: 'Severe Bleeding',
      icon: <Droplets className="w-6 h-6" />,
      disclaimer: 'Following St. John Ambulance approved protocols. Call emergency services immediately for severe bleeding.',
      steps: [
        {
          title: 'Apply direct pressure',
          instruction: 'Use clean cloth, dressing, or clothing to press firmly on the wound.',
          action: 'Don\'t remove cloth if blood soaks through - add more on top.'
        },
        {
          title: 'Call emergency services',
          instruction: 'Call 999 or 112 immediately and state "severe bleeding".',
          action: 'Keep applying pressure while on the phone.'
        },
        {
          title: 'Elevate if possible',
          instruction: 'Raise the injured area above heart level if no suspected fracture.',
          action: 'Continue maintaining direct pressure while elevating.'
        },
        {
          title: 'Apply firm dressing',
          instruction: 'Place sterile dressing over wound and bandage firmly.',
          action: 'Not so tight it cuts off circulation - check fingers/toes remain pink.'
        },
        {
          title: 'Treat for shock',
          instruction: 'Lay casualty down, raise legs (unless leg injury), keep warm.',
          action: 'Monitor breathing and consciousness. Do NOT give food or drink.'
        },
        {
          title: 'Monitor closely',
          instruction: 'Check breathing and responsiveness constantly.',
          action: 'Be prepared to start CPR if they become unresponsive and stop breathing.'
        }
      ]
    },
    'unconscious-breathing': {
      title: 'Recovery Position',
      icon: <Heart className="w-6 h-6" />,
      disclaimer: 'Following St. John Ambulance approved protocols. Call emergency services immediately.',
      steps: [
        {
          title: 'Check breathing',
          instruction: 'Confirm they are breathing normally but unresponsive.',
          action: 'If not breathing normally, begin CPR immediately.'
        },
        {
          title: 'Call emergency services',
          instruction: 'Call 999 or 112 immediately.',
          action: 'State casualty is unconscious but breathing.'
        },
        {
          title: 'Position nearest arm',
          instruction: 'Place nearest arm at right angles, elbow bent, palm up.',
          action: 'This will support them when rolled.'
        },
        {
          title: 'Position far arm',
          instruction: 'Bring far arm across chest, place hand under near cheek.',
          action: 'This protects the head during rolling.'
        },
        {
          title: 'Roll into position',
          instruction: 'Grasp far leg above knee, pull up until foot flat, then roll towards you.',
          action: 'Keep their hand against their cheek during the roll.'
        },
        {
          title: 'Final positioning',
          instruction: 'Adjust upper leg so hip and knee are at right angles.',
          action: 'Tilt head back to keep airway open. Monitor breathing continuously.'
        }
      ]
    }
  };

  const currentProtocol = protocols[emergencyType as keyof typeof protocols];

  if (!currentProtocol) {
    return (
      <div className="min-h-screen px-6 py-8 flex flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground mb-4">Protocol not found</p>
        <Button onClick={onBack}>Back to Main Menu</Button>
      </div>
    );
  }

  const currentStepData = currentProtocol.steps[currentStep];
  const isLastStep = currentStep === currentProtocol.steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEmergencyCall = () => {
    setHasCalledEmergency(true);
    // In a real app, this would initiate emergency services call
    console.log('Emergency call initiated');
  };

  return (
    <div className="min-h-screen px-6 py-8 flex flex-col">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          {currentProtocol.icon}
          <h1 className="text-2xl font-bold text-foreground">{currentProtocol.title}</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-destructive font-medium">
            {currentProtocol.disclaimer}
          </p>
        </div>
      </div>

      {/* Emergency Call Button */}
      {!hasCalledEmergency && (
        <div className="mb-6">
          <Button 
            onClick={handleEmergencyCall}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            size="lg"
          >
            <Phone className="w-5 h-5 mr-2" />
            Call 999 / 112 Emergency Services
          </Button>
        </div>
      )}

      {/* Step Card */}
      <Card className="flex-1 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Step {currentStep + 1} of {currentProtocol.steps.length}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / currentProtocol.steps.length) * 100)}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            {currentStepData.title}
          </h3>
          <p className="text-base text-foreground leading-relaxed">
            {currentStepData.instruction}
          </p>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-primary font-medium">
              {currentStepData.action}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="outline"
        >
          Previous
        </Button>
        
        <div className="flex space-x-2">
          {currentProtocol.steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {isLastStep ? (
          <Button onClick={onBack} variant="outline">
            Back to Menu
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmergencyProtocols;