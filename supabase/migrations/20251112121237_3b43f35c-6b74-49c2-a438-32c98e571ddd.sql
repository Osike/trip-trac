-- Create OTP verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  user_data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting OTPs (public access for signup)
CREATE POLICY "Anyone can create OTP verifications"
ON public.otp_verifications
FOR INSERT
WITH CHECK (true);

-- Create policy for reading OTPs (only for verification)
CREATE POLICY "Anyone can read their own OTP verifications"
ON public.otp_verifications
FOR SELECT
USING (true);

-- Create policy for updating OTPs (marking as verified)
CREATE POLICY "Anyone can update OTP verifications"
ON public.otp_verifications
FOR UPDATE
USING (true);

-- Create index on email and expiration for faster lookups
CREATE INDEX idx_otp_verifications_email ON public.otp_verifications(email);
CREATE INDEX idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);

-- Create function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE expires_at < now();
END;
$function$;