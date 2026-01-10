-- Add section_expanded_defaults column to contact_card_section_order
ALTER TABLE contact_card_section_order 
ADD COLUMN section_expanded_defaults JSONB 
DEFAULT '{"targeted_research": false, "persona": false, "ai_script": false, "static_script": false}'::jsonb;