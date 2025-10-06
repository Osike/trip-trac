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
    const { dateRange, filters, format = 'json' } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Fetching trips data with filters:', { dateRange, filters });

    // Build query
    let query = supabaseClient
      .from('trips')
      .select(`
        id,
        origin,
        destination,
        status,
        scheduled_date,
        distance,
        duration,
        "RATE",
        "FUEL",
        "MILEAGE",
        "SALARY",
        "ROAD TOLLS",
        created_at,
        updated_at,
        customers!inner(name, contact_person, email),
        trucks!inner(plate_number, model),
        profiles!trips_driver_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    // Apply date range filter
    if (dateRange?.from) {
      query = query.gte('scheduled_date', dateRange.from);
    }
    if (dateRange?.to) {
      query = query.lte('scheduled_date', dateRange.to);
    }

    // Apply additional filters
    if (filters?.status && filters.status !== '') {
      query = query.eq('status', filters.status);
    }

    const { data: trips, error } = await query;

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

    console.log(`Fetched ${trips?.length || 0} trips`);

    // Fetch maintenance data for all trips
    const tripIds = trips?.map(trip => trip.id) || [];
    let maintenanceData: any[] = [];
    
    if (tripIds.length > 0) {
      const { data: maintenance, error: maintenanceError } = await supabaseClient
        .from('maintenance')
        .select('trip_id, cost, description')
        .in('trip_id', tripIds);
      
      if (!maintenanceError) {
        maintenanceData = maintenance || [];
      }
    }

    // Transform data for display
    const transformedTrips = trips?.map(trip => {
      // Calculate maintenance cost for this trip
      const tripMaintenance = maintenanceData.filter(m => m.trip_id === trip.id);
      const maintenanceCost = tripMaintenance.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
      
      // Get numeric values for profit calculation
      const rate = Number(trip.RATE) || 0;
      const fuel = Number(trip.FUEL) || 0;
      const mileage = Number(trip.MILEAGE) || 0;
      const salary = Number(trip.SALARY) || 0;
      const roadTolls = Number(trip["ROAD TOLLS"]) || 0;
      
      // Calculate profit
      const totalCosts = fuel + mileage + salary + maintenanceCost + roadTolls;
      const profit = rate - totalCosts;
      
      return {
        id: trip.id,
        customer: (trip.customers as any)?.name || 'N/A',
        origin: trip.origin,
        destination: trip.destination,
        status: trip.status,
        scheduled_date: new Date(trip.scheduled_date).toLocaleDateString(),
        rate: rate,
        fuel: fuel,
        mileage: mileage,
        salary: salary,
        road_tolls: roadTolls,
        maintenance_cost: maintenanceCost,
        profit: profit,
        distance: trip.distance ? `${trip.distance} km` : 'N/A',
        duration: trip.duration ? `${trip.duration} hrs` : 'N/A',
        truck: (trip.trucks as any) ? `${(trip.trucks as any).plate_number} (${(trip.trucks as any).model})` : 'N/A',
        driver: (trip.profiles as any)?.name || 'Unassigned',
        created_at: new Date(trip.created_at).toLocaleDateString(),
        // Include maintenance records for detailed display
        maintenance: tripMaintenance
      }
    }) || [];

    // Return JSON data for UI display
    if (format === 'json') {
      return new Response(JSON.stringify(transformedTrips), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate CSV for download
    const csvHeader = 'Trip ID,Customer,Origin,Destination,Status,Scheduled Date,Rate,Fuel Cost,Mileage,Salary,Road Tolls,Maintenance Cost,Profit,Distance,Duration,Truck,Driver,Created Date\n'
    const csvRows = transformedTrips.map(trip => {
      return [
        trip.id,
        trip.customer,
        trip.origin,
        trip.destination,
        trip.status,
        trip.scheduled_date,
        `$${trip.rate}`,
        `$${trip.fuel}`,
        `$${trip.mileage}`,
        `$${trip.salary}`,
        `$${trip.road_tolls}`,
        `$${trip.maintenance_cost}`,
        `$${trip.profit}`,
        trip.distance,
        trip.duration,
        trip.truck,
        trip.driver,
        trip.created_at
      ].map(field => `"${field}"`).join(',')
    }).join('\n')

    const csvContent = csvHeader + csvRows

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