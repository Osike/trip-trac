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
    console.log('Starting customers report generation...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch customers data with trip count
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        *,
        trips(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }

    console.log(`Fetched ${customers?.length || 0} customers`);

    // Generate CSV content
    const csvHeaders = [
      'Customer Name',
      'Contact Person',
      'Email',
      'Phone',
      'Address',
      'Total Trips',
      'Created Date'
    ];

    const csvRows = customers?.map(customer => [
      customer.name,
      customer.contact_person || 'N/A',
      customer.email || 'N/A',
      customer.phone || 'N/A',
      customer.address || 'N/A',
      customer.trips?.[0]?.count || 0,
      new Date(customer.created_at).toLocaleDateString()
    ]) || [];

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    console.log('Generated CSV content for customers report');

    // Return CSV file
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error in customers report generation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});