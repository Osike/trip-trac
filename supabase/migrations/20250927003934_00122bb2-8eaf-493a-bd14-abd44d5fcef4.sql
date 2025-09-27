-- Create maintenance table
CREATE TABLE public.maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  cost NUMERIC NOT NULL DEFAULT 0,
  maintenance_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance table
CREATE POLICY "Admins and dispatchers can manage maintenance" 
ON public.maintenance 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'dispatcher'::user_role));

CREATE POLICY "Authenticated users can view maintenance" 
ON public.maintenance 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_maintenance_updated_at
BEFORE UPDATE ON public.maintenance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_maintenance_truck_id ON public.maintenance(truck_id);
CREATE INDEX idx_maintenance_trip_id ON public.maintenance(trip_id);
CREATE INDEX idx_maintenance_date ON public.maintenance(maintenance_date);