import { serve } from "https://deno.land/std@0.220.0/http/server.ts";

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
    console.log('Payload received:', { code: typeof code === 'string' ? code.substring(0, 100) + '...' : '[non-string code]' });

    // Rate limiting: allow max 10 requests per IP per 60 seconds
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!globalThis.__rateLimitMap) {
      globalThis.__rateLimitMap = new Map();
    }
    const now = Date.now();
    const windowMs = 60 * 1000; // 60 seconds
    const maxRequests = 10;
    const rlMap = globalThis.__rateLimitMap;
    let entry = rlMap.get(ip);
    if (!entry || now - entry.start > windowMs) {
      entry = { count: 1, start: now };
    } else {
      entry.count += 1;
    }
    rlMap.set(ip, entry);
    if (entry.count > maxRequests) {
      console.error('Rate limit exceeded for IP:', ip);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Input validation for code
    if (!code || typeof code !== 'string') {
      console.error('Invalid code parameter: must be a non-empty string');
      return new Response(
        JSON.stringify({ error: 'Code must be a non-empty string' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    if (code.length > 100000) {
      console.error('Code exceeds maximum length of 100KB');
      return new Response(
        JSON.stringify({ error: 'Code exceeds maximum length of 100KB' }),
        {
          status: 400,
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
      throw new Error('Failed to process code analysis request');
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
