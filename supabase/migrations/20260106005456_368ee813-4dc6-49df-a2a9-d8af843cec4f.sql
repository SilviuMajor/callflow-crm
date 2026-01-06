-- Enable realtime for contacts table
ALTER TABLE contacts REPLICA IDENTITY FULL;

-- Enable realtime for contact_history table  
ALTER TABLE contact_history REPLICA IDENTITY FULL;

-- Enable realtime for pots table
ALTER TABLE pots REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE contact_history;
ALTER PUBLICATION supabase_realtime ADD TABLE pots;