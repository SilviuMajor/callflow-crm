-- Add is_default column to ai_scripts
ALTER TABLE public.ai_scripts ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Add ai_script_id to contacts to track which script was used
ALTER TABLE public.contacts ADD COLUMN ai_script_id uuid REFERENCES public.ai_scripts(id) ON DELETE SET NULL;

-- Create AI credits usage table (logs every AI call)
CREATE TABLE public.ai_credits_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_type text NOT NULL, -- 'company_research', 'contact_persona', 'targeted_research', 'script_generation'
  credits_used integer NOT NULL DEFAULT 1,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.company_data(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on ai_credits_usage
ALTER TABLE public.ai_credits_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read ai_credits_usage" ON public.ai_credits_usage FOR SELECT USING (true);
CREATE POLICY "Allow public insert ai_credits_usage" ON public.ai_credits_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update ai_credits_usage" ON public.ai_credits_usage FOR UPDATE USING (true);
CREATE POLICY "Allow public delete ai_credits_usage" ON public.ai_credits_usage FOR DELETE USING (true);

-- Create AI credits settings table (for future Stripe tier limits)
CREATE TABLE public.ai_credits_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monthly_limit integer, -- null means unlimited
  reset_day integer NOT NULL DEFAULT 1, -- day of month to reset
  tier_name text DEFAULT 'free', -- for future Stripe integration
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_credits_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read ai_credits_settings" ON public.ai_credits_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert ai_credits_settings" ON public.ai_credits_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update ai_credits_settings" ON public.ai_credits_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete ai_credits_settings" ON public.ai_credits_settings FOR DELETE USING (true);

-- Create auto-generate settings table
CREATE TABLE public.ai_auto_generate_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false, -- master toggle
  company_research boolean NOT NULL DEFAULT true,
  contact_persona boolean NOT NULL DEFAULT true,
  targeted_research boolean NOT NULL DEFAULT false,
  script_generation boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_auto_generate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read ai_auto_generate_settings" ON public.ai_auto_generate_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert ai_auto_generate_settings" ON public.ai_auto_generate_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update ai_auto_generate_settings" ON public.ai_auto_generate_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete ai_auto_generate_settings" ON public.ai_auto_generate_settings FOR DELETE USING (true);

-- Create Cal.com settings table
CREATE TABLE public.calcom_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  api_key text,
  event_type_slug text, -- the slug for the event type to use
  webhook_secret text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.calcom_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read calcom_settings" ON public.calcom_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert calcom_settings" ON public.calcom_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update calcom_settings" ON public.calcom_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete calcom_settings" ON public.calcom_settings FOR DELETE USING (true);

-- Add trigger for updated_at on new tables
CREATE TRIGGER update_ai_credits_settings_updated_at
  BEFORE UPDATE ON public.ai_credits_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_auto_generate_settings_updated_at
  BEFORE UPDATE ON public.ai_auto_generate_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calcom_settings_updated_at
  BEFORE UPDATE ON public.calcom_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();