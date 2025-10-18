import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailyQuoteResult {
  quote_id: string;
  shown_at: string;
  expires_at: string;
  quotes: {
    id: string;
    text: string;
    author: string | null;
  } | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Getting daily quote for session:', sessionId);

    // Check if session exists, if not create it
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (!existingSession) {
      console.log('Creating new session:', sessionId);
      await supabase
        .from('user_sessions')
        .insert({ session_id: sessionId });
    }

    // Check if user already has a quote for today
    const today = new Date();
    const { data: existingDailyQuote } = await supabase
      .from('daily_quotes')
      .select(`
        quote_id,
        shown_at,
        expires_at,
        quotes (
          id,
          text,
          author
        )
      `)
      .eq('session_id', sessionId)
      .gte('expires_at', today.toISOString())
      .order('shown_at', { ascending: false })
      .limit(1)
      .single();

    if (existingDailyQuote) {
      console.log('Returning existing quote for today');
      const result = existingDailyQuote as unknown as DailyQuoteResult;
      return new Response(
        JSON.stringify({
          quote: result.quotes,
          expiresAt: existingDailyQuote.expires_at,
          isNew: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get a random quote that hasn't been shown to this user recently
    const { data: recentQuotes } = await supabase
      .from('daily_quotes')
      .select('quote_id')
      .eq('session_id', sessionId)
      .order('shown_at', { ascending: false })
      .limit(50);

    const recentQuoteIds = recentQuotes?.map((q) => q.quote_id) || [];

    // Get all quotes
    const { data: allQuotes } = await supabase
      .from('quotes')
      .select('id');

    if (!allQuotes || allQuotes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No quotes available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out recently shown quotes
    const availableQuotes = allQuotes.filter(
      (q) => !recentQuoteIds.includes(q.id)
    );

    // If all quotes have been shown, use all quotes again
    const quotesToChooseFrom = availableQuotes.length > 0 ? availableQuotes : allQuotes;

    // Select random quote
    const randomQuote = quotesToChooseFrom[
      Math.floor(Math.random() * quotesToChooseFrom.length)
    ];

    // Get full quote details
    const { data: selectedQuote } = await supabase
      .from('quotes')
      .select('id, text, author')
      .eq('id', randomQuote.id)
      .single();

    if (!selectedQuote) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch quote' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save the daily quote
    await supabase
      .from('daily_quotes')
      .insert({
        session_id: sessionId,
        quote_id: selectedQuote.id,
        expires_at: expiresAt.toISOString(),
      });

    console.log('Assigned new quote:', selectedQuote.text);

    return new Response(
      JSON.stringify({
        quote: selectedQuote,
        expiresAt: expiresAt.toISOString(),
        isNew: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-daily-quote function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
