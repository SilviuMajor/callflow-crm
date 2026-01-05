-- Create pots table
CREATE TABLE public.pots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pots table
ALTER TABLE public.pots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pots
CREATE POLICY "Allow public read pots" ON public.pots FOR SELECT USING (true);
CREATE POLICY "Allow public insert pots" ON public.pots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update pots" ON public.pots FOR UPDATE USING (true);
CREATE POLICY "Allow public delete pots" ON public.pots FOR DELETE USING (true);

-- Add pot_id column to contacts table
ALTER TABLE public.contacts ADD COLUMN pot_id UUID REFERENCES public.pots(id);

-- Create default POT for existing contacts
INSERT INTO public.pots (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Initial Data');

-- Assign all existing contacts to the default POT
UPDATE public.contacts SET pot_id = '00000000-0000-0000-0000-000000000001' WHERE pot_id IS NULL;