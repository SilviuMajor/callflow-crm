-- Create contact_history table for tracking all contact outcomes and notes
CREATE TABLE public.contact_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'no_answer', 'callback', 'completed', 'not_interested', 'note'
  action_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  callback_date TIMESTAMP WITH TIME ZONE, -- For callback actions
  reason TEXT, -- For completed/not_interested reasons
  note TEXT, -- Note content
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by contact
CREATE INDEX idx_contact_history_contact_id ON public.contact_history(contact_id);
CREATE INDEX idx_contact_history_action_timestamp ON public.contact_history(action_timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (matching existing tables pattern)
CREATE POLICY "Allow public read contact_history" 
ON public.contact_history 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert contact_history" 
ON public.contact_history 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update contact_history" 
ON public.contact_history 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete contact_history" 
ON public.contact_history 
FOR DELETE 
USING (true);

-- Migrate existing notes to contact_history
INSERT INTO public.contact_history (contact_id, action_type, action_timestamp, note, created_at)
SELECT id, 'note', created_at, notes, created_at
FROM public.contacts
WHERE notes IS NOT NULL AND notes != '';

-- Drop the notes column from contacts (data has been migrated)
ALTER TABLE public.contacts DROP COLUMN notes;