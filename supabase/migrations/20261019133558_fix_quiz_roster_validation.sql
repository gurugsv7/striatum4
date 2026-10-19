-- Match the current frontend and final brochure without applying unrelated programme changes.
update public.event_registration_rules
set year_limits = '[{"year":"2023","max":1}]'::jsonb
where event_id = 's4-11';
update public.event_registration_rules
set year_limits = '[{"year":"2021","max":1},{"year":"2022","max":2}]'::jsonb
where event_id = 's4-12';

create or replace function public.validate_roster(
  p_event_id text,
  p_team jsonb,
  p_event_name text
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rule    public.event_registration_rules%rowtype;
  v_people  jsonb := coalesce(p_team -> 'participants', '[]'::jsonb);
  v_count   integer := jsonb_array_length(v_people);
  v_limit   jsonb;
  v_person  jsonb;
  v_colleges integer;
begin
  select * into v_rule from public.event_registration_rules where event_id = p_event_id;
  if not found then
    -- No published team rule: a single participant is still required so that
    -- an order can never be a registration with nobody in it.
    if v_count < 1 then
      raise exception 'Add at least one participant for %', p_event_name using errcode = 'P0001';
    end if;
    return;
  end if;

  if v_count < v_rule.min_members or v_count > v_rule.max_members then
    if v_rule.min_members = v_rule.max_members then
      raise exception '% needs exactly % participant(s)', p_event_name, v_rule.min_members
        using errcode = 'P0001';
    else
      raise exception '% takes between % and % members', p_event_name, v_rule.min_members, v_rule.max_members
        using errcode = 'P0001';
    end if;
  end if;

  -- Everyone needs a name.
  if exists (
    select 1 from jsonb_array_elements(v_people) p
     where coalesce(btrim(p ->> 'name'), '') = ''
  ) then
    raise exception 'Every participant for % needs a name', p_event_name using errcode = 'P0001';
  end if;

  -- One college for the whole team, where the brochure says so.
  if v_rule.same_college then
    select count(distinct lower(btrim(coalesce(p ->> 'college', ''))))
      into v_colleges
      from jsonb_array_elements(v_people) p;
    if v_colleges <> 1 or exists (
      select 1 from jsonb_array_elements(v_people) p
       where coalesce(btrim(p ->> 'college'), '') = ''
    ) then
      raise exception 'All members of a % team must be from the same college', p_event_name
        using errcode = 'P0001';
    end if;
  end if;

  -- Eligible years.
  if v_rule.allowed_years is not null then
    for v_person in select * from jsonb_array_elements(v_people)
    loop
      if coalesce(btrim(v_person ->> 'year_of_study'), '') = ''
         or not (v_person ->> 'year_of_study') = any (v_rule.allowed_years) then
        raise exception '% is not eligible for %', v_person ->> 'year_of_study', p_event_name
          using errcode = 'P0001';
      end if;
    end loop;
  end if;

  -- Per-team year caps.
  for v_limit in select * from jsonb_array_elements(v_rule.year_limits)
  loop
    if (select count(*) from jsonb_array_elements(v_people) p
         where p ->> 'year_of_study' = v_limit ->> 'year') > (v_limit ->> 'max')::int then
      raise exception '%: at most % participant(s) from batch % per team. Edit the team details.', p_event_name, v_limit ->> 'max', v_limit ->> 'year'
        using errcode = 'P0001';
    end if;
  end loop;
end;
$$;

-- Preserve the internal-only helper boundary.
revoke all on function public.validate_roster(text,jsonb,text) from public, anon, authenticated;
