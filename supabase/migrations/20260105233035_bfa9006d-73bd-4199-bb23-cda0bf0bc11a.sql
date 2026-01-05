-- Add appointment tracking columns to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS appointment_date timestamptz,
ADD COLUMN IF NOT EXISTS appointment_attended boolean;