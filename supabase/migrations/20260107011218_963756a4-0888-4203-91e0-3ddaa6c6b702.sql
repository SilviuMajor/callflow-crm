-- Remove 'company_fields' from any existing section_order arrays
UPDATE contact_card_section_order
SET section_order = array_remove(section_order, 'company_fields'),
    updated_at = now()
WHERE 'company_fields' = ANY(section_order);