import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Fetch trips data with related customer and truck information
    const { data: trips, error } = await supabaseClient
      .from('trips')
      .select(`
        id,
        origin,
        destination,
        status,
        scheduled_date,
        cost,
        distance,
        duration,
        created_at,
        customers!inner(name, contact_person),
        trucks!inner(plate_number, model)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching trips:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch trips data' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Generate CSV content (simpler than PDF for now, can be enhanced later)
    const csvHeader = 'Trip ID,Customer,Origin,Destination,Status,Scheduled Date,Cost,Distance,Duration,Truck\n'
    const csvRows = trips.map(trip => {
      const scheduledDate = new Date(trip.scheduled_date).toLocaleDateString()
      return [
        trip.id,
        trip.customers.name,
        trip.origin,
        trip.destination,
        trip.status,
        scheduledDate,
        trip.cost || 'N/A',
        trip.distance || 'N/A',
        trip.duration || 'N/A',
        `${trip.trucks.plate_number} (${trip.trucks.model})`
      ].join(',')
    }).join('\n')

    const csvContent = csvHeader + csvRows

    // For now, return CSV. In production, you'd want to use a PDF library
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="trips-report-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})