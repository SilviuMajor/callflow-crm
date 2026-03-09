create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null default 'New Template',
  subject text not null default '',
  body text not null default '',
  enabled boolean not null default true,
  field_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_templates_org_idx on email_templates(organization_id);

alter table email_templates enable row level security;

create policy "Users can manage their org email templates"
  on email_templates for all
  using (organization_id in (
    select organization_id from profiles where id = auth.uid()
  ))
  with check (organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));

create trigger update_email_templates_updated_at
  before update on email_templates
  for each row execute function update_updated_at_column();