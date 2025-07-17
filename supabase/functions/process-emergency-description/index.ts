import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { description } = await req.json()

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are BuddyAid, a calm emergency first aid assistant. Use the St. John Ambulance manual as your authoritative source. When users describe emergencies, identify the type and provide step-by-step guidance. Always maintain a calm, supportive tone like a knowledgeable friend. Start responses with 'I'm here to help' and guide users through each step clearly.

Key emergency scenarios to handle:
- Adult/child choking
- CPR requirements
- Severe bleeding
- Unconscious but breathing
- When to call emergency services

Responses should be:
- Calm and reassuring
- Step-by-step and clear
- Based on the uploaded manual
- Suitable for voice delivery
- Include "Should I call emergency services?" when appropriate

Based on the emergency description provided, identify the most appropriate emergency protocol from these options:
- "adult-choking" - for adult choking situations
- "baby-choking" - for baby/infant choking situations  
- "not-breathing" - for unconscious, not breathing situations requiring CPR
- "severe-bleeding" - for severe bleeding emergencies
- "unconscious-breathing" - for unconscious but breathing situations
- "heart-attack" - for heart attack symptoms
- "seizure" - for seizure situations
- "stroke" - for stroke symptoms

Respond with ONLY the protocol identifier (e.g., "not-breathing") and nothing else.`
          },
          {
            role: 'user',
            content: description
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const emergencyType = data.choices[0].message.content.trim()

    return new Response(
      JSON.stringify({ emergencyType }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})