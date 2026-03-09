

## Complete Plan: Admin Account Bootstrap + Invite Code System

### Overview

This plan will:
1. **Create your admin account** linked to the existing "Default Organization" (with your 23 contacts)
2. **Implement invite code system** so new users must have an invite to join your organization
3. **Add invite code management UI** for admins to create/manage invite codes

---

### Current State Analysis

| Component | Status |
|-----------|--------|
| Default Organization | ✅ Exists (`00000000-0000-0000-0000-000000000001`) |
| Your existing data | ✅ 23 contacts, settings, scripts |
| `profiles` table | ✅ Exists (empty) |
| `user_roles` table | ✅ Exists with `app_role` enum (`admin`, `member`) |
| `has_role()` function | ✅ Exists |
| Auth users | ❌ None - need to create your account |
| Invite codes table | ❌ Doesn't exist |

---

### Phase 1: Database Migration

Create the `invite_codes` table:

```sql
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

-- Create function to validate and use invite codes (for signup)
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
```

---

### Phase 2: Create Admin Bootstrap Edge Function

Create `supabase/functions/create-admin-user/index.ts`:

**Purpose:** One-time function to create your admin account linked to the Default Organization.

**Logic:**
1. Accept email, password, and a bootstrap secret (for security)
2. Use the Supabase Admin API (service role) to create the auth user
3. Create the profile linked to Default Organization
4. Assign admin role
5. Return success/failure

```typescript
// Key implementation points:
- Uses SUPABASE_SERVICE_ROLE_KEY for elevated privileges
- Creates user with email confirmation disabled (already logged in)
- Links to organization_id: "00000000-0000-0000-0000-000000000001"
- Creates profile and user_roles entries
- One-time use via bootstrap secret
```

---

### Phase 3: Update Signup Flow

**Modify `SignupPage.tsx`:**

Add a toggle between two modes:
- **Create New Organization** - Current behavior
- **Join Existing Organization** - Requires invite code

```
┌───────────────────────────────────────────────────────┐
│              Create an account                         │
│                                                        │
│   ┌──────────────────┐  ┌──────────────────────────┐  │
│   │ Create New Org   │  │ Join Existing Org        │  │
│   └──────────────────┘  └──────────────────────────┘  │
│                                                        │
│   [If Join Existing selected:]                         │
│   Invite Code: [________________]                      │
│                                                        │
│   Full Name:   [________________]                      │
│   Email:       [________________]                      │
│   Password:    [________________]                      │
│   Confirm:     [________________]                      │
│                                                        │
│           [Create Account]                             │
└───────────────────────────────────────────────────────┘
```

**Modify `AuthContext.tsx`:**

Update `signUp` function to accept optional `inviteCode`:
- If invite code provided: validate it, use returned `organization_id`
- If no invite code: create new organization (current behavior)
- Assign `member` role (not admin) when joining via invite

---

### Phase 4: Add Invite Code Management to Settings

Create `src/components/InviteCodeManager.tsx`:

Features:
- Generate new invite codes (random 8-character strings)
- Set expiration (optional)
- Set max uses (optional, default = 1)
- View active codes with copy button
- Deactivate/revoke codes

Add to Settings page as a new section (only visible to admins).

---

### Phase 5: Create Hook for Invite Codes

Create `src/hooks/useInviteCodes.ts`:

```typescript
export function useInviteCodes() {
  // Fetch invite codes for current organization
  // Create new invite code
  // Deactivate invite code
  // Copy code to clipboard helper
}
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/create-admin-user/index.ts` | Bootstrap admin account |
| `src/components/InviteCodeManager.tsx` | UI to manage invite codes |
| `src/hooks/useInviteCodes.ts` | CRUD operations for invite codes |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add `create-admin-user` function config |
| `src/pages/SignupPage.tsx` | Add invite code mode toggle and input |
| `src/contexts/AuthContext.tsx` | Update `signUp` to handle invite codes |
| `src/pages/SettingsPage.tsx` | Add InviteCodeManager section |

---

### Execution Steps After Implementation

1. **Database migration runs** - Creates `invite_codes` table
2. **Edge function deploys** - `create-admin-user` becomes available
3. **I call the edge function** with your credentials:
   - Email: `silviu.major@fiveleaf.co.uk`
   - Password: `Fiveleaf.1!`
   - This creates your admin account linked to Default Organization
4. **You log in** at `/login` with these credentials
5. **You see all your existing data** (23 contacts, settings, etc.)
6. **To add team members:** Go to Settings → Invite Codes → Generate code → Share

---

### Security Considerations

| Aspect | Implementation |
|--------|----------------|
| Bootstrap secret | One-time use secret prevents unauthorized admin creation |
| Invite code validation | Server-side via SECURITY DEFINER function |
| RLS on invite_codes | Only admins can view/manage their org's codes |
| Role assignment | Invited users get `member` role, not `admin` |
| Password security | Validated for minimum length on both client and server |

---

### Your Credentials (for reference)

| Field | Value |
|-------|-------|
| Email | `silviu.major@fiveleaf.co.uk` |
| Password | `Fiveleaf.1!` |
| Organization | Default Organization |
| Role | Admin |

