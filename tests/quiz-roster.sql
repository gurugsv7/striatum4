-- Synthetic rosters only; no orders, payments, or attendee records are created.
do $$
declare a text; b text; c text; team jsonb; accepted boolean; expected boolean; total int := 0;
begin
  foreach a in array array['2023','2024','2025'] loop
    foreach b in array array['2023','2024','2025'] loop
      foreach c in array array['2023','2024','2025'] loop
        team := jsonb_build_object('participants', jsonb_build_array(
          jsonb_build_object('name','Synthetic A','year_of_study',a,'college','Test College'),
          jsonb_build_object('name','Synthetic B','year_of_study',b,'college','Test College'),
          jsonb_build_object('name','Synthetic C','year_of_study',c,'college','Test College')));
        expected := (a='2023')::int + (b='2023')::int + (c='2023')::int <= 1;
        accepted := true;
        begin perform public.validate_roster('s4-11',team,'OCEANIC ODYSSEY');
        exception when sqlstate 'P0001' then accepted := false; end;
        if accepted <> expected then raise exception 'Oceanic mismatch: % % %',a,b,c; end if;
        total := total+1;
      end loop;
    end loop;
  end loop;
  foreach a in array array['2021','2022','2023','2024','2025'] loop
    foreach b in array array['2021','2022','2023','2024','2025'] loop
      foreach c in array array['2021','2022','2023','2024','2025'] loop
        team := jsonb_build_object('participants', jsonb_build_array(
          jsonb_build_object('name','Synthetic A','year_of_study',a,'college','Test College'),
          jsonb_build_object('name','Synthetic B','year_of_study',b,'college','Test College'),
          jsonb_build_object('name','Synthetic C','year_of_study',c,'college','Test College')));
        expected := (a='2021')::int + (b='2021')::int + (c='2021')::int <= 1
          and (a='2022')::int + (b='2022')::int + (c='2022')::int <= 2;
        accepted := true;
        begin perform public.validate_roster('s4-12',team,'AQUAQUEST');
        exception when sqlstate 'P0001' then accepted := false; end;
        if accepted <> expected then raise exception 'Aquaquest mismatch: % % %',a,b,c; end if;
        total := total+1;
      end loop;
    end loop;
  end loop;
  -- Missing batch, ineligible batch, wrong size, and mixed colleges must fail.
  foreach team in array array[
    '{"participants":[{"name":"A","college":"X"},{"name":"B","college":"X","year_of_study":"2024"},{"name":"C","college":"X","year_of_study":"2025"}]}'::jsonb,
    '{"participants":[{"name":"A","college":"X","year_of_study":"2022"},{"name":"B","college":"X","year_of_study":"2024"},{"name":"C","college":"X","year_of_study":"2025"}]}'::jsonb,
    '{"participants":[]}'::jsonb,
    '{"participants":[{"name":"A","college":"X","year_of_study":"2024"},{"name":"B","college":"Y","year_of_study":"2024"},{"name":"C","college":"X","year_of_study":"2025"}]}'::jsonb
  ] loop
    accepted := true;
    begin perform public.validate_roster('s4-11',team,'OCEANIC ODYSSEY');
    exception when sqlstate 'P0001' then accepted := false; end;
    if accepted then raise exception 'Invalid roster accepted: %',team; end if;
    total := total+1;
  end loop;
  if total <> 156 then raise exception 'Unexpected case count %', total; end if;
end;
$$;
select '156 roster cases passed' as result;
