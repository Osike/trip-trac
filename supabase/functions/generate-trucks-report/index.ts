import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dateRange, filters, format = 'json' } = await req.json();
    console.log('Starting trucks report generation...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from('trucks')
      .select(`
        *,
        driver:profiles!trucks_assigned_driver_id_fkey(name),
        trips(count)
      `)
      .order('created_at', { ascending: false });

    // Apply date range filter
    if (dateRange?.from) {
      query = query.gte('created_at', dateRange.from);
    }
    if (dateRange?.to) {
      query = query.lte('created_at', dateRange.to);
    }

    // Apply status filter
    if (filters?.status && filters.status !== '') {
      query = query.eq('status', filters.status);
    }

    const { data: trucks, error } = await query;

    if (error) {
      console.error('Error fetching trucks:', error);
      throw error;
    }

    console.log(`Fetched ${trucks?.length || 0} trucks`);

    // Transform data for display
    const transformedTrucks = trucks?.map(truck => ({
      id: truck.id,
      plate_number: truck.plate_number,
      model: truck.model,
      status: truck.status,
      capacity: truck.capacity ? `${truck.capacity} tons` : 'N/A',
      assigned_driver: truck.driver?.name || 'Unassigned',
      total_trips: truck.trips?.[0]?.count || 0,
      created_at: new Date(truck.created_at).toLocaleDateString()
    })) || [];

    // Return JSON data for UI display
    if (format === 'json') {
      return new Response(JSON.stringify(transformedTrucks), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate CSV content for download
    const csvHeaders = [
      'Plate Number',
      'Model', 
      'Status',
      'Capacity',
      'Assigned Driver',
      'Total Trips',
      'Created Date'
    ];

    const csvRows = transformedTrucks.map(truck => [
      truck.plate_number,
      truck.model,
      truck.status,
      truck.capacity,
      truck.assigned_driver,
      truck.total_trips,
      truck.created_at
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    console.log('Generated CSV content for trucks report');

    // Return CSV file
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="trucks-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error in trucks report generation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});