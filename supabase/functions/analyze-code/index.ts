import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MAKE_WEBHOOK_URL = Deno.env.get('MAKE_WEBHOOK_URL');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Received request to analyze-code edge function');
    
    const { code } = await req.json();
    console.log('Payload received:', { code: code?.substring(0, 100) + '...' });

    if (!code) {
      console.error('No code provided in request');
      return new Response(
        JSON.stringify({ error: 'Code parameter is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!MAKE_WEBHOOK_URL) {
      console.error('MAKE_WEBHOOK_URL environment variable is not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook URL is not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Forwarding request to Make.com webhook:', MAKE_WEBHOOK_URL);
    
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    console.log('Make.com response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Make.com webhook error:', errorText);
      throw new Error(`Webhook request failed with status ${response.status}`);
    }

    const responseText = await response.text();
    console.log('Raw response from Make.com:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Make.com response as JSON:', parseError);
      throw new Error('Invalid JSON response from webhook');
    }

    console.log('Successfully parsed response:', data);
    
    return new Response(
      JSON.stringify(data), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in analyze-code edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
