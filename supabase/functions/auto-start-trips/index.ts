import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto trip status update...');

    // Get current timestamp
    const now = new Date().toISOString();

    // Find all scheduled trips where the scheduled_date has passed
    const { data: tripsToStart, error: fetchError } = await supabase
      .from('trips')
      .select('id, scheduled_date, origin, destination')
      .eq('status', 'scheduled')
      .lte('scheduled_date', now);

    if (fetchError) {
      console.error('Error fetching trips:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch trips' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!tripsToStart || tripsToStart.length === 0) {
      console.log('No trips to start automatically');
      return new Response(
        JSON.stringify({ 
          message: 'No trips to start', 
          updated_count: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${tripsToStart.length} trips to start:`, tripsToStart);

    // Update all qualifying trips to 'ongoing' status
    const tripIds = tripsToStart.map(trip => trip.id);
    
    const { data: updatedTrips, error: updateError } = await supabase
      .from('trips')
      .update({ 
        status: 'ongoing',
        updated_at: now
      })
      .in('id', tripIds)
      .select('id, origin, destination, scheduled_date');

    if (updateError) {
      console.error('Error updating trips:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update trip statuses' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully started ${updatedTrips?.length || 0} trips`);

    return new Response(
      JSON.stringify({ 
        message: 'Trips auto-started successfully',
        updated_count: updatedTrips?.length || 0,
        updated_trips: updatedTrips
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});