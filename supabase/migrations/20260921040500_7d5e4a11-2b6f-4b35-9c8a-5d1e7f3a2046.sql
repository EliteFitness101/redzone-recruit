-- Harden candidate verification trigger search_path.
-- Additive/no route or table changes.
create or replace function public.touch_candidate_verification_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
