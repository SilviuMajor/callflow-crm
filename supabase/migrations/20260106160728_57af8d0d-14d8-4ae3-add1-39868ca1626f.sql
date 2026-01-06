-- Create calendly_settings table for storing integration configuration
CREATE TABLE public.calendly_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  calendly_url text NOT NULL DEFAULT '',
  personal_access_token text,
  webhook_signing_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendly_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (single-row settings pattern)
CREATE POLICY "Allow public read calendly_settings" 
ON public.calendly_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert calendly_settings" 
ON public.calendly_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update calendly_settings" 
ON public.calendly_settings 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete calendly_settings" 
ON public.calendly_settings 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calendly_settings_updated_at
BEFORE UPDATE ON public.calendly_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();