
-- ============================================
-- PHASE 1: Create Core Tables
-- ============================================

-- Create organizations table
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PHASE 2: Security Definer Functions
-- ============================================

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM profiles WHERE id = user_id
$$;

-- Function to check if user belongs to an organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(user_id UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND organization_id = org_id
    )
$$;

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = _user_id
        AND user_roles.role = _role
    )
$$;

-- ============================================
-- PHASE 3: Add organization_id to All Tables
-- ============================================

-- Create default organization for existing data
INSERT INTO public.organizations (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization');

-- Add organization_id to contacts
ALTER TABLE public.contacts ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.contacts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.contacts ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to contact_history
ALTER TABLE public.contact_history ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.contact_history SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.contact_history ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to company_data
ALTER TABLE public.company_data ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.company_data SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.company_data ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to pots
ALTER TABLE public.pots ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.pots SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.pots ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to ai_prompts
ALTER TABLE public.ai_prompts ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.ai_prompts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.ai_prompts ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to ai_scripts
ALTER TABLE public.ai_scripts ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.ai_scripts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.ai_scripts ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to ai_credits_usage
ALTER TABLE public.ai_credits_usage ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.ai_credits_usage SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.ai_credits_usage ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to ai_credits_settings
ALTER TABLE public.ai_credits_settings ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.ai_credits_settings SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.ai_credits_settings ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to ai_auto_generate_settings
ALTER TABLE public.ai_auto_generate_settings ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.ai_auto_generate_settings SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.ai_auto_generate_settings ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to calcom_settings
ALTER TABLE public.calcom_settings ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.calcom_settings SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.calcom_settings ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to calendly_settings
ALTER TABLE public.calendly_settings ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.calendly_settings SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.calendly_settings ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to webhook_settings
ALTER TABLE public.webhook_settings ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.webhook_settings SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.webhook_settings ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to seller_company
ALTER TABLE public.seller_company ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.seller_company SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.seller_company ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to seller_custom_fields
ALTER TABLE public.seller_custom_fields ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.seller_custom_fields SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.seller_custom_fields ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to custom_contact_fields
ALTER TABLE public.custom_contact_fields ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.custom_contact_fields SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.custom_contact_fields ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to company_fields
ALTER TABLE public.company_fields ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.company_fields SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.company_fields ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to qualifying_questions
ALTER TABLE public.qualifying_questions ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.qualifying_questions SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.qualifying_questions ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to outcome_options
ALTER TABLE public.outcome_options ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.outcome_options SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.outcome_options ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to static_scripts
ALTER TABLE public.static_scripts ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.static_scripts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.static_scripts ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to static_script_settings
ALTER TABLE public.static_script_settings ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.static_script_settings SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.static_script_settings ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to contact_card_section_order
ALTER TABLE public.contact_card_section_order ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.contact_card_section_order SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.contact_card_section_order ALTER COLUMN organization_id SET NOT NULL;

-- Add organization_id to prompt_refinements
ALTER TABLE public.prompt_refinements ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
UPDATE public.prompt_refinements SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
ALTER TABLE public.prompt_refinements ALTER COLUMN organization_id SET NOT NULL;

-- ============================================
-- PHASE 4: Create Indexes for Performance
-- ============================================

CREATE INDEX idx_contacts_organization_id ON public.contacts(organization_id);
CREATE INDEX idx_contact_history_organization_id ON public.contact_history(organization_id);
CREATE INDEX idx_company_data_organization_id ON public.company_data(organization_id);
CREATE INDEX idx_pots_organization_id ON public.pots(organization_id);
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);

-- ============================================
-- PHASE 5: Drop Old RLS Policies
-- ============================================

-- Drop all existing permissive policies
DROP POLICY IF EXISTS "Allow public read contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public delete contacts" ON public.contacts;

DROP POLICY IF EXISTS "Allow public read contact_history" ON public.contact_history;
DROP POLICY IF EXISTS "Allow public insert contact_history" ON public.contact_history;
DROP POLICY IF EXISTS "Allow public update contact_history" ON public.contact_history;
DROP POLICY IF EXISTS "Allow public delete contact_history" ON public.contact_history;

DROP POLICY IF EXISTS "Allow public read company_data" ON public.company_data;
DROP POLICY IF EXISTS "Allow public insert company_data" ON public.company_data;
DROP POLICY IF EXISTS "Allow public update company_data" ON public.company_data;
DROP POLICY IF EXISTS "Allow public delete company_data" ON public.company_data;

DROP POLICY IF EXISTS "Allow public read pots" ON public.pots;
DROP POLICY IF EXISTS "Allow public insert pots" ON public.pots;
DROP POLICY IF EXISTS "Allow public update pots" ON public.pots;
DROP POLICY IF EXISTS "Allow public delete pots" ON public.pots;

DROP POLICY IF EXISTS "Allow public read ai_prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "Allow public insert ai_prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "Allow public update ai_prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "Allow public delete ai_prompts" ON public.ai_prompts;

DROP POLICY IF EXISTS "Allow public read ai_scripts" ON public.ai_scripts;
DROP POLICY IF EXISTS "Allow public insert ai_scripts" ON public.ai_scripts;
DROP POLICY IF EXISTS "Allow public update ai_scripts" ON public.ai_scripts;
DROP POLICY IF EXISTS "Allow public delete ai_scripts" ON public.ai_scripts;

DROP POLICY IF EXISTS "Allow public read ai_credits_usage" ON public.ai_credits_usage;
DROP POLICY IF EXISTS "Allow public insert ai_credits_usage" ON public.ai_credits_usage;
DROP POLICY IF EXISTS "Allow public update ai_credits_usage" ON public.ai_credits_usage;
DROP POLICY IF EXISTS "Allow public delete ai_credits_usage" ON public.ai_credits_usage;

DROP POLICY IF EXISTS "Allow public read ai_credits_settings" ON public.ai_credits_settings;
DROP POLICY IF EXISTS "Allow public insert ai_credits_settings" ON public.ai_credits_settings;
DROP POLICY IF EXISTS "Allow public update ai_credits_settings" ON public.ai_credits_settings;
DROP POLICY IF EXISTS "Allow public delete ai_credits_settings" ON public.ai_credits_settings;

DROP POLICY IF EXISTS "Allow public read ai_auto_generate_settings" ON public.ai_auto_generate_settings;
DROP POLICY IF EXISTS "Allow public insert ai_auto_generate_settings" ON public.ai_auto_generate_settings;
DROP POLICY IF EXISTS "Allow public update ai_auto_generate_settings" ON public.ai_auto_generate_settings;
DROP POLICY IF EXISTS "Allow public delete ai_auto_generate_settings" ON public.ai_auto_generate_settings;

DROP POLICY IF EXISTS "Allow public read calcom_settings" ON public.calcom_settings;
DROP POLICY IF EXISTS "Allow public insert calcom_settings" ON public.calcom_settings;
DROP POLICY IF EXISTS "Allow public update calcom_settings" ON public.calcom_settings;
DROP POLICY IF EXISTS "Allow public delete calcom_settings" ON public.calcom_settings;

DROP POLICY IF EXISTS "Allow public read calendly_settings" ON public.calendly_settings;
DROP POLICY IF EXISTS "Allow public insert calendly_settings" ON public.calendly_settings;
DROP POLICY IF EXISTS "Allow public update calendly_settings" ON public.calendly_settings;
DROP POLICY IF EXISTS "Allow public delete calendly_settings" ON public.calendly_settings;

DROP POLICY IF EXISTS "Allow public read webhook_settings" ON public.webhook_settings;
DROP POLICY IF EXISTS "Allow public insert webhook_settings" ON public.webhook_settings;
DROP POLICY IF EXISTS "Allow public update webhook_settings" ON public.webhook_settings;
DROP POLICY IF EXISTS "Allow public delete webhook_settings" ON public.webhook_settings;

DROP POLICY IF EXISTS "Allow public read seller_company" ON public.seller_company;
DROP POLICY IF EXISTS "Allow public insert seller_company" ON public.seller_company;
DROP POLICY IF EXISTS "Allow public update seller_company" ON public.seller_company;
DROP POLICY IF EXISTS "Allow public delete seller_company" ON public.seller_company;

DROP POLICY IF EXISTS "Allow public read seller_custom_fields" ON public.seller_custom_fields;
DROP POLICY IF EXISTS "Allow public insert seller_custom_fields" ON public.seller_custom_fields;
DROP POLICY IF EXISTS "Allow public update seller_custom_fields" ON public.seller_custom_fields;
DROP POLICY IF EXISTS "Allow public delete seller_custom_fields" ON public.seller_custom_fields;

DROP POLICY IF EXISTS "Allow public read custom_contact_fields" ON public.custom_contact_fields;
DROP POLICY IF EXISTS "Allow public insert custom_contact_fields" ON public.custom_contact_fields;
DROP POLICY IF EXISTS "Allow public update custom_contact_fields" ON public.custom_contact_fields;
DROP POLICY IF EXISTS "Allow public delete custom_contact_fields" ON public.custom_contact_fields;

DROP POLICY IF EXISTS "Allow public read company_fields" ON public.company_fields;
DROP POLICY IF EXISTS "Allow public insert company_fields" ON public.company_fields;
DROP POLICY IF EXISTS "Allow public update company_fields" ON public.company_fields;
DROP POLICY IF EXISTS "Allow public delete company_fields" ON public.company_fields;

DROP POLICY IF EXISTS "Allow public read qualifying_questions" ON public.qualifying_questions;
DROP POLICY IF EXISTS "Allow public insert qualifying_questions" ON public.qualifying_questions;
DROP POLICY IF EXISTS "Allow public update qualifying_questions" ON public.qualifying_questions;
DROP POLICY IF EXISTS "Allow public delete qualifying_questions" ON public.qualifying_questions;

DROP POLICY IF EXISTS "Allow public read outcome_options" ON public.outcome_options;
DROP POLICY IF EXISTS "Allow public insert outcome_options" ON public.outcome_options;
DROP POLICY IF EXISTS "Allow public update outcome_options" ON public.outcome_options;
DROP POLICY IF EXISTS "Allow public delete outcome_options" ON public.outcome_options;

DROP POLICY IF EXISTS "Allow public read static_scripts" ON public.static_scripts;
DROP POLICY IF EXISTS "Allow public insert static_scripts" ON public.static_scripts;
DROP POLICY IF EXISTS "Allow public update static_scripts" ON public.static_scripts;
DROP POLICY IF EXISTS "Allow public delete static_scripts" ON public.static_scripts;

DROP POLICY IF EXISTS "Allow public read static_script_settings" ON public.static_script_settings;
DROP POLICY IF EXISTS "Allow public insert static_script_settings" ON public.static_script_settings;
DROP POLICY IF EXISTS "Allow public update static_script_settings" ON public.static_script_settings;
DROP POLICY IF EXISTS "Allow public delete static_script_settings" ON public.static_script_settings;

DROP POLICY IF EXISTS "Allow public read contact_card_section_order" ON public.contact_card_section_order;
DROP POLICY IF EXISTS "Allow public insert contact_card_section_order" ON public.contact_card_section_order;
DROP POLICY IF EXISTS "Allow public update contact_card_section_order" ON public.contact_card_section_order;
DROP POLICY IF EXISTS "Allow public delete contact_card_section_order" ON public.contact_card_section_order;

DROP POLICY IF EXISTS "Allow public read prompt_refinements" ON public.prompt_refinements;
DROP POLICY IF EXISTS "Allow public insert prompt_refinements" ON public.prompt_refinements;
DROP POLICY IF EXISTS "Allow public update prompt_refinements" ON public.prompt_refinements;
DROP POLICY IF EXISTS "Allow public delete prompt_refinements" ON public.prompt_refinements;

-- ============================================
-- PHASE 6: Create New Organization-Scoped RLS Policies
-- ============================================

-- Organizations policies
CREATE POLICY "Users can view their organization"
ON public.organizations FOR SELECT TO authenticated
USING (id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update their organization"
ON public.organizations FOR UPDATE TO authenticated
USING (id = public.get_user_organization_id(auth.uid()));

-- Profiles policies
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- User roles policies
CREATE POLICY "Users can view roles in their organization"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id IN (
    SELECT id FROM profiles WHERE organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Admins can manage roles in their organization"
ON public.user_roles FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') AND
    user_id IN (SELECT id FROM profiles WHERE organization_id = public.get_user_organization_id(auth.uid()))
);

-- Contacts policies
CREATE POLICY "Users can view contacts in their organization"
ON public.contacts FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert contacts in their organization"
ON public.contacts FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update contacts in their organization"
ON public.contacts FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete contacts in their organization"
ON public.contacts FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Contact history policies
CREATE POLICY "Users can view contact_history in their organization"
ON public.contact_history FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert contact_history in their organization"
ON public.contact_history FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update contact_history in their organization"
ON public.contact_history FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete contact_history in their organization"
ON public.contact_history FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Company data policies
CREATE POLICY "Users can view company_data in their organization"
ON public.company_data FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert company_data in their organization"
ON public.company_data FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update company_data in their organization"
ON public.company_data FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete company_data in their organization"
ON public.company_data FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Pots policies
CREATE POLICY "Users can view pots in their organization"
ON public.pots FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert pots in their organization"
ON public.pots FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update pots in their organization"
ON public.pots FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete pots in their organization"
ON public.pots FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- AI prompts policies
CREATE POLICY "Users can view ai_prompts in their organization"
ON public.ai_prompts FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert ai_prompts in their organization"
ON public.ai_prompts FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update ai_prompts in their organization"
ON public.ai_prompts FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete ai_prompts in their organization"
ON public.ai_prompts FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- AI scripts policies
CREATE POLICY "Users can view ai_scripts in their organization"
ON public.ai_scripts FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert ai_scripts in their organization"
ON public.ai_scripts FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update ai_scripts in their organization"
ON public.ai_scripts FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete ai_scripts in their organization"
ON public.ai_scripts FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- AI credits usage policies
CREATE POLICY "Users can view ai_credits_usage in their organization"
ON public.ai_credits_usage FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert ai_credits_usage in their organization"
ON public.ai_credits_usage FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update ai_credits_usage in their organization"
ON public.ai_credits_usage FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete ai_credits_usage in their organization"
ON public.ai_credits_usage FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- AI credits settings policies
CREATE POLICY "Users can view ai_credits_settings in their organization"
ON public.ai_credits_settings FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert ai_credits_settings in their organization"
ON public.ai_credits_settings FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update ai_credits_settings in their organization"
ON public.ai_credits_settings FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete ai_credits_settings in their organization"
ON public.ai_credits_settings FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- AI auto generate settings policies
CREATE POLICY "Users can view ai_auto_generate_settings in their organization"
ON public.ai_auto_generate_settings FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert ai_auto_generate_settings in their organization"
ON public.ai_auto_generate_settings FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update ai_auto_generate_settings in their organization"
ON public.ai_auto_generate_settings FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete ai_auto_generate_settings in their organization"
ON public.ai_auto_generate_settings FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Calcom settings policies
CREATE POLICY "Users can view calcom_settings in their organization"
ON public.calcom_settings FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert calcom_settings in their organization"
ON public.calcom_settings FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update calcom_settings in their organization"
ON public.calcom_settings FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete calcom_settings in their organization"
ON public.calcom_settings FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Calendly settings policies
CREATE POLICY "Users can view calendly_settings in their organization"
ON public.calendly_settings FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert calendly_settings in their organization"
ON public.calendly_settings FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update calendly_settings in their organization"
ON public.calendly_settings FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete calendly_settings in their organization"
ON public.calendly_settings FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Webhook settings policies
CREATE POLICY "Users can view webhook_settings in their organization"
ON public.webhook_settings FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert webhook_settings in their organization"
ON public.webhook_settings FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update webhook_settings in their organization"
ON public.webhook_settings FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete webhook_settings in their organization"
ON public.webhook_settings FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Seller company policies
CREATE POLICY "Users can view seller_company in their organization"
ON public.seller_company FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert seller_company in their organization"
ON public.seller_company FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update seller_company in their organization"
ON public.seller_company FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete seller_company in their organization"
ON public.seller_company FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Seller custom fields policies
CREATE POLICY "Users can view seller_custom_fields in their organization"
ON public.seller_custom_fields FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert seller_custom_fields in their organization"
ON public.seller_custom_fields FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update seller_custom_fields in their organization"
ON public.seller_custom_fields FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete seller_custom_fields in their organization"
ON public.seller_custom_fields FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Custom contact fields policies
CREATE POLICY "Users can view custom_contact_fields in their organization"
ON public.custom_contact_fields FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert custom_contact_fields in their organization"
ON public.custom_contact_fields FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update custom_contact_fields in their organization"
ON public.custom_contact_fields FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete custom_contact_fields in their organization"
ON public.custom_contact_fields FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Company fields policies
CREATE POLICY "Users can view company_fields in their organization"
ON public.company_fields FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert company_fields in their organization"
ON public.company_fields FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update company_fields in their organization"
ON public.company_fields FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete company_fields in their organization"
ON public.company_fields FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Qualifying questions policies
CREATE POLICY "Users can view qualifying_questions in their organization"
ON public.qualifying_questions FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert qualifying_questions in their organization"
ON public.qualifying_questions FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update qualifying_questions in their organization"
ON public.qualifying_questions FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete qualifying_questions in their organization"
ON public.qualifying_questions FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Outcome options policies
CREATE POLICY "Users can view outcome_options in their organization"
ON public.outcome_options FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert outcome_options in their organization"
ON public.outcome_options FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update outcome_options in their organization"
ON public.outcome_options FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete outcome_options in their organization"
ON public.outcome_options FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Static scripts policies
CREATE POLICY "Users can view static_scripts in their organization"
ON public.static_scripts FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert static_scripts in their organization"
ON public.static_scripts FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update static_scripts in their organization"
ON public.static_scripts FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete static_scripts in their organization"
ON public.static_scripts FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Static script settings policies
CREATE POLICY "Users can view static_script_settings in their organization"
ON public.static_script_settings FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert static_script_settings in their organization"
ON public.static_script_settings FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update static_script_settings in their organization"
ON public.static_script_settings FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete static_script_settings in their organization"
ON public.static_script_settings FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Contact card section order policies
CREATE POLICY "Users can view contact_card_section_order in their organization"
ON public.contact_card_section_order FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert contact_card_section_order in their organization"
ON public.contact_card_section_order FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update contact_card_section_order in their organization"
ON public.contact_card_section_order FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete contact_card_section_order in their organization"
ON public.contact_card_section_order FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Prompt refinements policies
CREATE POLICY "Users can view prompt_refinements in their organization"
ON public.prompt_refinements FOR SELECT TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert prompt_refinements in their organization"
ON public.prompt_refinements FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update prompt_refinements in their organization"
ON public.prompt_refinements FOR UPDATE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete prompt_refinements in their organization"
ON public.prompt_refinements FOR DELETE TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- ============================================
-- PHASE 7: Add updated_at trigger to new tables
-- ============================================

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
