-- Create ai_scripts table for script templates
CREATE TABLE public.ai_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Call Script',
  template TEXT NOT NULL DEFAULT '',
  model TEXT DEFAULT 'sonar',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching existing pattern)
CREATE POLICY "Allow public read ai_scripts" ON public.ai_scripts FOR SELECT USING (true);
CREATE POLICY "Allow public insert ai_scripts" ON public.ai_scripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update ai_scripts" ON public.ai_scripts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete ai_scripts" ON public.ai_scripts FOR DELETE USING (true);

-- Add columns to contacts table for cached script
ALTER TABLE public.contacts ADD COLUMN ai_script TEXT;
ALTER TABLE public.contacts ADD COLUMN ai_script_updated_at TIMESTAMP WITH TIME ZONE;

-- Create trigger for automatic timestamp updates on ai_scripts
CREATE TRIGGER update_ai_scripts_updated_at
BEFORE UPDATE ON public.ai_scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();