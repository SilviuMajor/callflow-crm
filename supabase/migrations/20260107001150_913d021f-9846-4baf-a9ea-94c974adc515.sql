-- Create static_script_settings table for global settings
CREATE TABLE public.static_script_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  default_expanded boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.static_script_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read static_script_settings" ON public.static_script_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert static_script_settings" ON public.static_script_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update static_script_settings" ON public.static_script_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete static_script_settings" ON public.static_script_settings FOR DELETE USING (true);

-- Create static_scripts table
CREATE TABLE public.static_scripts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Script 1',
  content text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  field_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.static_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read static_scripts" ON public.static_scripts FOR SELECT USING (true);
CREATE POLICY "Allow public insert static_scripts" ON public.static_scripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update static_scripts" ON public.static_scripts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete static_scripts" ON public.static_scripts FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_static_script_settings_updated_at
  BEFORE UPDATE ON public.static_script_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_static_scripts_updated_at
  BEFORE UPDATE ON public.static_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();