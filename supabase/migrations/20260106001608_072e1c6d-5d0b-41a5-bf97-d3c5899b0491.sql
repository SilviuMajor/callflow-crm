-- Add reason columns to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS completed_reason text,
ADD COLUMN IF NOT EXISTS not_interested_reason text;

-- Backfill completed_reason from contact_history
UPDATE contacts c
SET completed_reason = (
  SELECT reason 
  FROM contact_history h 
  WHERE h.contact_id = c.id 
    AND h.action_type = 'completed' 
  ORDER BY h.action_timestamp DESC 
  LIMIT 1
)
WHERE c.status = 'completed' AND c.completed_reason IS NULL;

-- Backfill not_interested_reason from contact_history
UPDATE contacts c
SET not_interested_reason = (
  SELECT reason 
  FROM contact_history h 
  WHERE h.contact_id = c.id 
    AND h.action_type = 'not_interested' 
  ORDER BY h.action_timestamp DESC 
  LIMIT 1
)
WHERE c.status = 'not_interested' AND c.not_interested_reason IS NULL;