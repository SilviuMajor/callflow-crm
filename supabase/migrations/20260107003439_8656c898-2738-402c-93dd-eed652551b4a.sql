-- Create table for contact card section order settings
CREATE TABLE public.contact_card_section_order (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_order text[] NOT NULL DEFAULT ARRAY['contact_info', 'history', 'ai_research', 'static_script', 'company_fields'],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_card_section_order ENABLE ROW LEVEL SECURITY;

-- Create public access policies (no auth)
CREATE POLICY "Allow public read contact_card_section_order" ON public.contact_card_section_order FOR SELECT USING (true);
CREATE POLICY "Allow public insert contact_card_section_order" ON public.contact_card_section_order FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update contact_card_section_order" ON public.contact_card_section_order FOR UPDATE USING (true);
CREATE POLICY "Allow public delete contact_card_section_order" ON public.contact_card_section_order FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_contact_card_section_order_updated_at
  BEFORE UPDATE ON public.contact_card_section_order
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();