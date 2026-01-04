-- Update existing prompts to use the new prefixed model names (auto-migrate)
UPDATE ai_prompts 
SET model = 'perplexity:' || model 
WHERE model IS NOT NULL 
  AND model NOT LIKE 'perplexity:%' 
  AND model NOT LIKE 'openai:%';