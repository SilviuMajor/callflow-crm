-- Add field_mappings column to calcom_settings for mapping contact fields to Cal.com booking question identifiers
ALTER TABLE calcom_settings 
ADD COLUMN field_mappings JSONB DEFAULT '{}'::jsonb;