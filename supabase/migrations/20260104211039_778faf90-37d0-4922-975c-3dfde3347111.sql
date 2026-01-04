-- Create seller_company table for "Our Company" profile
CREATE TABLE public.seller_company (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL DEFAULT '',
  website text DEFAULT '',
  product_offering text DEFAULT '',
  usps text DEFAULT '',
  industry text DEFAULT '',
  target_audience text DEFAULT '',
  tone_style text DEFAULT '',
  pain_points_solved text DEFAULT '',
  product_sets text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_company ENABLE ROW LEVEL SECURITY;

-- Public access policies (matches existing app pattern - no auth)
CREATE POLICY "Allow public read seller_company" 
ON public.seller_company FOR SELECT USING (true);

CREATE POLICY "Allow public insert seller_company" 
ON public.seller_company FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update seller_company" 
ON public.seller_company FOR UPDATE USING (true);

CREATE POLICY "Allow public delete seller_company" 
ON public.seller_company FOR DELETE USING (true);

-- Add default_prompt column to ai_prompts for restore functionality
ALTER TABLE public.ai_prompts ADD COLUMN IF NOT EXISTS default_prompt text;

-- Set default prompts for existing records
UPDATE public.ai_prompts 
SET default_prompt = prompt 
WHERE default_prompt IS NULL;