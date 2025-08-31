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
    console.log('Starting trucks report generation...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch trucks data with assigned driver information
    const { data: trucks, error } = await supabase
      .from('trucks')
      .select(`
        *,
        driver:profiles!trucks_assigned_driver_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trucks:', error);
      throw error;
    }

    console.log(`Fetched ${trucks?.length || 0} trucks`);

    // Generate CSV content
    const csvHeaders = [
      'Plate Number',
      'Model', 
      'Status',
      'Capacity (tons)',
      'Assigned Driver',
      'Created Date'
    ];

    const csvRows = trucks?.map(truck => [
      truck.plate_number,
      truck.model,
      truck.status,
      truck.capacity || 'N/A',
      truck.driver?.name || 'Unassigned',
      new Date(truck.created_at).toLocaleDateString()
    ]) || [];

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