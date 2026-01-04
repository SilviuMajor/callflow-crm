-- Create seller_custom_fields table for custom My Company fields
CREATE TABLE public.seller_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'short_text',
  options TEXT[],
  field_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_custom_fields ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read seller_custom_fields" ON public.seller_custom_fields FOR SELECT USING (true);
CREATE POLICY "Allow public insert seller_custom_fields" ON public.seller_custom_fields FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update seller_custom_fields" ON public.seller_custom_fields FOR UPDATE USING (true);
CREATE POLICY "Allow public delete seller_custom_fields" ON public.seller_custom_fields FOR DELETE USING (true);

-- Add custom_fields column to seller_company
ALTER TABLE public.seller_company ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;

-- Create trigger for updated_at on seller_custom_fields
CREATE TRIGGER update_seller_custom_fields_updated_at
BEFORE UPDATE ON public.seller_custom_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update the ai_prompts for custom_company_research to have new name and better default
UPDATE public.ai_prompts 
SET 
  name = 'Targeted Research and Suggestions',
  default_prompt = 'Research how to approach {company_name} ({website}) as a potential customer for {seller_company_name}.

About us:
- We are in the {seller_industry} industry
- Our product/service: {seller_product_offering}
- Our unique selling points: {seller_usps}
- Pain points we address: {seller_pain_points_solved}
- Our target audience: {seller_target_audience}
- Product sets available: {seller_product_sets}

Based on this context, provide:
1. How our offering could specifically benefit {company_name}
2. Potential pain points at {company_name} we could address
3. Suggested talking points that align with our {seller_tone_style} communication style
4. Relevant product sets to propose
5. Any specific angles to approach them with given their industry

Keep the response actionable and focused.',
  prompt = 'Research how to approach {company_name} ({website}) as a potential customer for {seller_company_name}.

About us:
- We are in the {seller_industry} industry
- Our product/service: {seller_product_offering}
- Our unique selling points: {seller_usps}
- Pain points we address: {seller_pain_points_solved}
- Our target audience: {seller_target_audience}
- Product sets available: {seller_product_sets}

Based on this context, provide:
1. How our offering could specifically benefit {company_name}
2. Potential pain points at {company_name} we could address
3. Suggested talking points that align with our {seller_tone_style} communication style
4. Relevant product sets to propose
5. Any specific angles to approach them with given their industry

Keep the response actionable and focused.'
WHERE prompt_type = 'custom_company_research';