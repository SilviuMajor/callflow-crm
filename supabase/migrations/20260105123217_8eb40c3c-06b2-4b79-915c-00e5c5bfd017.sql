-- Create table for storing prompt refinement history
CREATE TABLE public.prompt_refinements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_type TEXT NOT NULL,
  original_prompt TEXT NOT NULL,
  refined_prompt TEXT NOT NULL,
  feedback TEXT NOT NULL,
  refinement_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  sample_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  example_output TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prompt_refinements ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching existing pattern)
CREATE POLICY "Allow public read prompt_refinements" 
ON public.prompt_refinements 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert prompt_refinements" 
ON public.prompt_refinements 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update prompt_refinements" 
ON public.prompt_refinements 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete prompt_refinements" 
ON public.prompt_refinements 
FOR DELETE 
USING (true);

-- Create index for faster lookups by prompt_type
CREATE INDEX idx_prompt_refinements_prompt_type ON public.prompt_refinements(prompt_type);

-- Create index for ordering by created_at
CREATE INDEX idx_prompt_refinements_created_at ON public.prompt_refinements(created_at DESC);