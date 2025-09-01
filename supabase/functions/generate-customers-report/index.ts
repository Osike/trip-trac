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
    console.log('Starting customers report generation...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from('customers')
      .select(`
        *,
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

    const { data: customers, error } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }

    console.log(`Fetched ${customers?.length || 0} customers`);

    // Transform data for display
    const transformedCustomers = customers?.map(customer => ({
      id: customer.id,
      name: customer.name,
      contact_person: customer.contact_person || 'N/A',
      email: customer.email || 'N/A',
      phone: customer.phone || 'N/A',
      address: customer.address || 'N/A',
      total_trips: customer.trips?.[0]?.count || 0,
      created_at: new Date(customer.created_at).toLocaleDateString()
    })) || [];

    // Return JSON data for UI display
    if (format === 'json') {
      return new Response(JSON.stringify(transformedCustomers), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate CSV content for download
    const csvHeaders = [
      'Customer Name',
      'Contact Person',
      'Email',
      'Phone',
      'Address',
      'Total Trips',
      'Created Date'
    ];

    const csvRows = transformedCustomers.map(customer => [
      customer.name,
      customer.contact_person,
      customer.email,
      customer.phone,
      customer.address,
      customer.total_trips,
      customer.created_at
    ]);

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