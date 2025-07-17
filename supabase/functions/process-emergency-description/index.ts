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
    console.log('Processing emergency description:', description)

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
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are an emergency classification system. Based on the user's description, identify the most appropriate emergency protocol from these exact options:

- "adult-choking" - for adult choking situations
- "baby-choking" - for baby/infant choking situations  
- "not-breathing" - for unconscious, not breathing situations requiring CPR
- "severe-bleeding" - for severe bleeding emergencies
- "unconscious-breathing" - for unconscious but breathing situations
- "heart-attack" - for heart attack symptoms
- "seizure" - for seizure situations
- "stroke" - for stroke symptoms

Respond with ONLY the protocol identifier (e.g., "severe-bleeding") and nothing else. No explanations, no additional text.

Examples:
- "there's a lot of bleeding" → "severe-bleeding"
- "person not breathing" → "not-breathing"
- "someone is choking" → "adult-choking"
- "baby can't breathe" → "baby-choking"`
          },
          {
            role: 'user',
            content: description
          }
        ],
        temperature: 0.1,
        max_tokens: 20
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const emergencyType = data.choices[0].message.content.trim()
    
    console.log('Identified emergency type:', emergencyType)

    return new Response(
      JSON.stringify({ emergencyType }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error processing emergency description:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})