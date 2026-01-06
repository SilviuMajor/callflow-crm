-- Add appointment_date column to contact_history table
ALTER TABLE contact_history 
ADD COLUMN IF NOT EXISTS appointment_date timestamptz;