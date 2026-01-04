-- Create custom_contact_fields table
CREATE TABLE public.custom_contact_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'short_text',
  options TEXT[],
  field_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company_fields table
CREATE TABLE public.company_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'short_text',
  options TEXT[],
  field_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company_data table (stores field values per company)
CREATE TABLE public.company_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL UNIQUE,
  field_values JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create qualifying_questions table
CREATE TABLE public.qualifying_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'short_text',
  options TEXT[],
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook_settings table
CREATE TABLE public.webhook_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT false,
  url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT NOT NULL,
  job_title TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  website TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  callback_date TIMESTAMP WITH TIME ZONE,
  qualifying_answers JSONB DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (public access for now, no auth required)
ALTER TABLE public.custom_contact_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifying_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create public access policies (no auth required for this app)
CREATE POLICY "Allow public read custom_contact_fields" ON public.custom_contact_fields FOR SELECT USING (true);
CREATE POLICY "Allow public insert custom_contact_fields" ON public.custom_contact_fields FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update custom_contact_fields" ON public.custom_contact_fields FOR UPDATE USING (true);
CREATE POLICY "Allow public delete custom_contact_fields" ON public.custom_contact_fields FOR DELETE USING (true);

CREATE POLICY "Allow public read company_fields" ON public.company_fields FOR SELECT USING (true);
CREATE POLICY "Allow public insert company_fields" ON public.company_fields FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update company_fields" ON public.company_fields FOR UPDATE USING (true);
CREATE POLICY "Allow public delete company_fields" ON public.company_fields FOR DELETE USING (true);

CREATE POLICY "Allow public read company_data" ON public.company_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert company_data" ON public.company_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update company_data" ON public.company_data FOR UPDATE USING (true);
CREATE POLICY "Allow public delete company_data" ON public.company_data FOR DELETE USING (true);

CREATE POLICY "Allow public read qualifying_questions" ON public.qualifying_questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert qualifying_questions" ON public.qualifying_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update qualifying_questions" ON public.qualifying_questions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete qualifying_questions" ON public.qualifying_questions FOR DELETE USING (true);

CREATE POLICY "Allow public read webhook_settings" ON public.webhook_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert webhook_settings" ON public.webhook_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update webhook_settings" ON public.webhook_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete webhook_settings" ON public.webhook_settings FOR DELETE USING (true);

CREATE POLICY "Allow public read contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Allow public insert contacts" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update contacts" ON public.contacts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete contacts" ON public.contacts FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_custom_contact_fields_updated_at
  BEFORE UPDATE ON public.custom_contact_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_fields_updated_at
  BEFORE UPDATE ON public.company_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_data_updated_at
  BEFORE UPDATE ON public.company_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qualifying_questions_updated_at
  BEFORE UPDATE ON public.qualifying_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_settings_updated_at
  BEFORE UPDATE ON public.webhook_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();