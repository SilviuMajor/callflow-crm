-- Create outcome_options table for customizable completed/not interested reasons
CREATE TABLE outcome_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome_type TEXT NOT NULL CHECK (outcome_type IN ('completed', 'not_interested')),
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  option_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE outcome_options ENABLE ROW LEVEL SECURITY;

-- Add public access policies
CREATE POLICY "Allow public read outcome_options" ON outcome_options FOR SELECT USING (true);
CREATE POLICY "Allow public insert outcome_options" ON outcome_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update outcome_options" ON outcome_options FOR UPDATE USING (true);
CREATE POLICY "Allow public delete outcome_options" ON outcome_options FOR DELETE USING (true);

-- Seed with default values
INSERT INTO outcome_options (outcome_type, value, label, option_order) VALUES
  ('completed', 'appointment_booked', 'Appointment Booked', 0),
  ('completed', 'sale_closed', 'Sale Closed', 1),
  ('completed', 'info_sent', 'Info Sent', 2),
  ('completed', 'other', 'Other', 3),
  ('not_interested', 'no_budget', 'No Budget', 0),
  ('not_interested', 'wrong_timing', 'Wrong Timing', 1),
  ('not_interested', 'using_competitor', 'Using Competitor', 2),
  ('not_interested', 'no_need', 'No Need', 3),
  ('not_interested', 'gatekeeper_block', 'Gatekeeper Block', 4),
  ('not_interested', 'do_not_call', 'Do Not Call', 5),
  ('not_interested', 'other', 'Other', 6);

-- Add trigger for updated_at
CREATE TRIGGER update_outcome_options_updated_at
BEFORE UPDATE ON outcome_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();