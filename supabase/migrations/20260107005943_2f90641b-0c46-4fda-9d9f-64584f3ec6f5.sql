-- Update existing section orders to put history at top (new default)
UPDATE contact_card_section_order 
SET section_order = ARRAY['history', 'contact_info', 'targeted_research', 'persona', 'ai_script', 'static_script', 'company_fields']::text[],
    updated_at = now();

-- Update the default for new records
ALTER TABLE contact_card_section_order 
ALTER COLUMN section_order 
SET DEFAULT ARRAY['history', 'contact_info', 'targeted_research', 'persona', 'ai_script', 'static_script', 'company_fields']::text[];