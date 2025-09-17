-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to auto-start trips every 5 minutes
SELECT cron.schedule(
  'auto-start-trips',
  '*/5 * * * *', -- Run every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://xkhsakqmyphneyyartiz.supabase.co/functions/v1/auto-start-trips',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhraHNha3FteXBobmV5eWFydGl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTk4NTI3NSwiZXhwIjoyMDcxNTYxMjc1fQ.E2FKYsJfUGRFGy4VJLlx0rjXgJpJy-4rg0EadGzXzlI"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);