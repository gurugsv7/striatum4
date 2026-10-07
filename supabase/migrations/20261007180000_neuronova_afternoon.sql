-- NEURONOVA moved to the afternoon session on the 28 Oct – 1 Nov schedule.
-- Its old 9:00 AM start no longer holds and no new time has been given.
update public.events
   set start_time = null,
       updated_at = now()
 where id = 's4-18';
