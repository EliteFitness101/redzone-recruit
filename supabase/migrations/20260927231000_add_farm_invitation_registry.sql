create table if not exists public.farm_invitations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.farm_clients(id) on delete cascade,
  email text not null,
  access_role text not null check (access_role in ('owner','client','operations','supervisor','executive')),
  invited_by uuid references auth.users(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','sent','accepted','revoked','expired','failed')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists farm_invitations_pending_email_client_idx on public.farm_invitations(client_id, lower(email)) where status in ('pending','sent');
create index if not exists farm_invitations_auth_user_idx on public.farm_invitations(auth_user_id);
alter table public.farm_invitations enable row level security;
drop policy if exists "farm_invitations_admin_all" on public.farm_invitations;
create policy "farm_invitations_admin_all" on public.farm_invitations for all to authenticated using (public.has_role(auth.uid(),'admin'::app_role)) with check (public.has_role(auth.uid(),'admin'::app_role));
