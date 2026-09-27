-- Harden CY Farm tenant-aware reads and complete command-center realtime coverage.
drop policy if exists "farm_units_select_authorized" on public.farm_units;
create policy "farm_units_select_authorized"
on public.farm_units
for select to authenticated
using (public.farm_access_allowed(client_id));

drop policy if exists "farm_positions_select_authorized" on public.farm_positions;
create policy "farm_positions_select_authorized"
on public.farm_positions
for select to authenticated
using (public.farm_access_allowed(client_id));

drop policy if exists "farm_audit_client_select" on public.farm_audit_log;
create policy "farm_audit_client_select"
on public.farm_audit_log
for select to authenticated
using (client_id is not null and public.farm_access_allowed(client_id));

do $$
declare t text;
begin
  foreach t in array array[
    'farm_workers','farm_units','farm_positions','farm_workforce_requirements',
    'farm_commercial_authorizations','farm_commercial_policies','farm_performance_reviews',
    'farm_placement_fees','farm_recruitment_assurance','farm_client_preferences','farm_audit_log'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
