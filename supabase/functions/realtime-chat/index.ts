import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection, sec-websocket-key, sec-websocket-version, sec-websocket-protocol',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if this is a WebSocket upgrade request
  const upgrade = req.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 400 });
  }

  console.log('WebSocket upgrade request received');

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log('WebSocket connection opened');
    
    // Connect to OpenAI Realtime API
    const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    let sessionConfigured = false;

    openaiWs.onopen = () => {
      console.log('Connected to OpenAI Realtime API');
    };

    openaiWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('OpenAI message:', data.type);

      // Configure session after receiving session.created
      if (data.type === 'session.created' && !sessionConfigured) {
        console.log('Configuring session...');
        sessionConfigured = true;
        
        const sessionUpdate = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `You are BuddyAid, a calm, reassuring emergency first aid assistant following St John Ambulance protocols. You guide users through emergency situations step by step with clear, simple instructions. Always:

1. Stay calm and reassuring
2. Give clear, specific instructions
3. Use simple language
4. Wait for confirmation before moving to next step
5. Remind users to call 999/112 if they haven't already
6. Follow official St John Ambulance protocols exactly

You can help with these emergencies:
- Severe bleeding
- Choking (adult and baby)
- Unresponsive not breathing (CPR)
- Heart attack
- Stroke
- Seizures

Guide users through each step, wait for their response, then continue to the next step. Be supportive and encouraging throughout.`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1500
            },
            tools: [
              {
                type: 'function',
                name: 'emergency_guidance',
                description: 'Provide step-by-step emergency guidance for specific situations',
                parameters: {
                  type: 'object',
                  properties: {
                    emergency_type: {
                      type: 'string',
                      enum: ['severe-bleeding', 'choking-adult', 'choking-baby', 'cpr-adult', 'heart-attack', 'stroke', 'seizure'],
                      description: 'The type of emergency situation'
                    },
                    step: {
                      type: 'number',
                      description: 'Current step number in the protocol'
                    },
                    action: {
                      type: 'string',
                      enum: ['start', 'next', 'repeat', 'emergency_services'],
                      description: 'The action to take'
                    }
                  },
                  required: ['emergency_type', 'action']
                }
              }
            ],
            tool_choice: 'auto',
            temperature: 0.3,
            max_response_output_tokens: 'inf'
          }
        };

        openaiWs.send(JSON.stringify(sessionUpdate));
        console.log('Session configuration sent');
      }

      // Handle function calls
      if (data.type === 'response.function_call_arguments.done') {
        console.log('Function call completed:', data.arguments);
        
        try {
          const args = JSON.parse(data.arguments);
          const response = handleEmergencyGuidance(args);
          
          // Send function result back to OpenAI
          const functionResult = {
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: data.call_id,
              output: JSON.stringify(response)
            }
          };
          
          openaiWs.send(JSON.stringify(functionResult));
          openaiWs.send(JSON.stringify({ type: 'response.create' }));
          
        } catch (error) {
          console.error('Error handling function call:', error);
        }
      }

      // Forward all other messages to client
      socket.send(event.data);
    };

    openaiWs.onclose = () => {
      console.log('OpenAI WebSocket closed');
      socket.close();
    };

    openaiWs.onerror = (error) => {
      console.error('OpenAI WebSocket error:', error);
      socket.close();
    };

    // Handle messages from client
    socket.onmessage = (event) => {
      console.log('Client message received, forwarding to OpenAI');
      openaiWs.send(event.data);
    };

    socket.onclose = () => {
      console.log('Client WebSocket closed');
      openaiWs.close();
    };

    socket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
      openaiWs.close();
    };
  };

  return response;
});

// Emergency guidance function
function handleEmergencyGuidance(args: any) {
  const { emergency_type, action, step = 0 } = args;
  
  const protocols = {
    'severe-bleeding': {
      steps: [
        "Apply direct pressure to the wound using a clean cloth, towel, or clothing. Press firmly directly on the bleeding area.",
        "Call 999 or 112 immediately if you haven't already. Tell them it's severe bleeding.",
        "Keep applying pressure. Don't remove the cloth if blood soaks through - add more cloth on top.",
        "If possible, elevate the injured area above the heart level while maintaining pressure.",
        "Keep the person warm and reassure them. Monitor their breathing and consciousness.",
        "If bleeding continues through dressing, remove and reapply with fresh dressing using firm pressure."
      ]
    },
    'choking-adult': {
      steps: [
        "Ask 'Are you choking?' If they can't speak, cough, or breathe, continue with back blows.",
        "Lean them forward and give up to 5 sharp back blows between the shoulder blades with the heel of your hand.",
        "Check their mouth for any visible obstruction. Remove with fingertips if you can see it - don't sweep blindly.",
        "If choking continues, give up to 5 abdominal thrusts. Stand behind them, link your hands below their rib cage and pull sharply inwards and upwards.",
        "Check their mouth again. If obstruction still hasn't cleared, call 999/112.",
        "Continue cycles of 5 back blows and 5 abdominal thrusts until help arrives or obstruction clears."
      ]
    },
    'cpr-adult': {
      steps: [
        "Check for response by shouting 'Are you okay?' and tapping their shoulders firmly.",
        "Open their airway by tilting their head back and lifting their chin.",
        "Check for breathing for no more than 10 seconds. Look for chest movement.",
        "Call 999/112 immediately. Ask for an ambulance and AED if available.",
        "Place heel of one hand on center of chest, other hand on top with fingers interlocked.",
        "Give 30 chest compressions, pushing hard and fast 5-6cm deep at 100-120 compressions per minute.",
        "Give 2 rescue breaths. Tilt head back, lift chin, pinch nose, seal over mouth and give 1-second breath.",
        "Continue 30 compressions to 2 breaths until emergency services arrive or they start breathing normally."
      ]
    }
  };

  const protocol = protocols[emergency_type as keyof typeof protocols];
  if (!protocol) {
    return { error: 'Unknown emergency type' };
  }

  switch (action) {
    case 'start':
      return {
        message: `I'm going to guide you through ${emergency_type.replace('-', ' ')} first aid. Let's start with step 1:`,
        step: protocol.steps[0],
        current_step: 1,
        total_steps: protocol.steps.length
      };
    case 'next':
      const nextStep = step + 1;
      if (nextStep < protocol.steps.length) {
        return {
          message: `Great job! Now for step ${nextStep + 1}:`,
          step: protocol.steps[nextStep],
          current_step: nextStep + 1,
          total_steps: protocol.steps.length
        };
      } else {
        return {
          message: "You've completed all the steps. Keep doing what you're doing and stay with them until emergency services arrive. You're doing an amazing job.",
          completed: true
        };
      }
    case 'repeat':
      return {
        message: `Let me repeat step ${step + 1}:`,
        step: protocol.steps[step],
        current_step: step + 1,
        total_steps: protocol.steps.length
      };
    case 'emergency_services':
      return {
        message: "Call 999 or 112 immediately. Tell them you have a medical emergency and describe what's happening.",
        urgent: true
      };
    default:
      return { error: 'Unknown action' };
  }
}