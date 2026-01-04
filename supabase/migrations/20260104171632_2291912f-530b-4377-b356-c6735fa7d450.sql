-- Create ai_prompts table for storing AI research configurations
CREATE TABLE public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT DEFAULT 'sonar',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

-- Create public access policies
CREATE POLICY "Allow public read ai_prompts" ON public.ai_prompts FOR SELECT USING (true);
CREATE POLICY "Allow public insert ai_prompts" ON public.ai_prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update ai_prompts" ON public.ai_prompts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete ai_prompts" ON public.ai_prompts FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default prompts
INSERT INTO public.ai_prompts (prompt_type, name, prompt, model) VALUES
('company_search', 'Company Research', 'Research the company "{company_name}". Website: {website}. Provide a comprehensive summary including: company overview, industry, size, key products/services, recent news, and any notable information. Be concise but thorough.', 'sonar'),
('company_custom', 'Custom Company Research', 'Given the company "{company_name}" ({website}), analyze how we might approach them as a potential client. Consider their industry, size, and potential needs. Provide actionable insights for our sales approach.', 'sonar-pro'),
('persona', 'Contact Persona', 'Research {first_name} {last_name}, who works as {job_title} at {company}. Provide insights about: their likely responsibilities, decision-making authority, professional background if available, and how to best approach them. Be professional and factual.', 'sonar');

-- Add AI research cache fields to company_data
ALTER TABLE public.company_data 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_custom_research TEXT,
ADD COLUMN IF NOT EXISTS ai_summary_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_custom_updated_at TIMESTAMPTZ;

-- Add AI persona field to contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS ai_persona TEXT,
ADD COLUMN IF NOT EXISTS ai_persona_updated_at TIMESTAMPTZ;