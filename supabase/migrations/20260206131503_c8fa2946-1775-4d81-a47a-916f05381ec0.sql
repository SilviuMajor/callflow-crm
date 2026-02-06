
-- Create invite_codes table
CREATE TABLE public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    uses_remaining INTEGER DEFAULT 1,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Admins can view their org's invite codes
CREATE POLICY "Admins can view org invite codes"
ON public.invite_codes FOR SELECT TO authenticated
USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
);

-- Admins can create invite codes for their org
CREATE POLICY "Admins can create invite codes"
ON public.invite_codes FOR INSERT TO authenticated
WITH CHECK (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
);

-- Admins can update (deactivate) their org's invite codes
CREATE POLICY "Admins can update invite codes"
ON public.invite_codes FOR UPDATE TO authenticated
USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
);

-- Create function to validate and use invite codes (for signup - called by anon users)
CREATE OR REPLACE FUNCTION public.validate_invite_code(invite_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    code_record invite_codes%ROWTYPE;
BEGIN
    SELECT * INTO code_record
    FROM invite_codes
    WHERE code = invite_code
      AND is_active = true
      AND (uses_remaining IS NULL OR uses_remaining > 0)
      AND (expires_at IS NULL OR expires_at > now());
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Decrement uses if limited
    IF code_record.uses_remaining IS NOT NULL THEN
        UPDATE invite_codes
        SET uses_remaining = uses_remaining - 1
        WHERE id = code_record.id;
    END IF;
    
    RETURN code_record.organization_id;
END;
$$;
