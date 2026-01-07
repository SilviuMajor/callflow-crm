-- Reset all section orders to the new default with split AI research sections
UPDATE contact_card_section_order
SET section_order = ARRAY['contact_info', 'history', 'targeted_research', 'persona', 'ai_script', 'static_script', 'company_fields'],
    updated_at = now();

-- Update the default value for future inserts
ALTER TABLE contact_card_section_order 
ALTER COLUMN section_order 
SET DEFAULT ARRAY['contact_info', 'history', 'targeted_research', 'persona', 'ai_script', 'static_script', 'company_fields'];