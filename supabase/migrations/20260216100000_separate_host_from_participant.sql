-- Separate Host from Participant
-- The host is no longer stored as a participant. The host_id on rooms
-- serves as a session identifier for the host, not a FK to participants.

-- Update create_room to NOT create a participant for the host
create or replace function create_room(host_name text, custom_code text default null)
returns json as $$
declare
  new_code char(4);
  new_room_id uuid;
  new_host_id uuid;
begin
  if custom_code is not null and length(custom_code) = 4 then
    if upper(custom_code) !~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$' then
      raise exception 'Invalid room code. Use letters A-Z (excluding O, I, L) and digits 2-9.';
    end if;
    if exists (select 1 from rooms where code = upper(custom_code)) then
      raise exception 'Room code already taken';
    end if;
    new_code := upper(custom_code);
  else
    new_code := generate_room_code();
  end if;

  new_host_id := uuid_generate_v4();

  insert into rooms (code, host_id)
  values (new_code, new_host_id)
  returning id into new_room_id;

  -- Host is NOT inserted into participants table.
  -- They are identified by rooms.host_id and session.isHost on the client.

  return json_build_object(
    'roomId', new_room_id,
    'roomCode', new_code,
    'hostId', new_host_id
  );
end;
$$ language plpgsql;

-- Drop and recreate get_leaderboard (return type changed: removed is_host column)
drop function if exists get_leaderboard(uuid);

-- Recreate get_leaderboard excluding legacy host participants
create function get_leaderboard(target_room_id uuid)
returns table (
  participant_id uuid,
  name text,
  predictions_count bigint,
  score bigint
) as $$
begin
  return query
  select
    p.id as participant_id,
    p.name,
    count(distinct pred.id) as predictions_count,
    count(case when pred.nominee_id = w.nominee_id then 1 end) as score
  from participants p
  left join predictions pred on pred.participant_id = p.id
  left join winners w on w.room_id = p.room_id and w.category_id = pred.category_id
  where p.room_id = target_room_id
    and p.is_host = false
  group by p.id, p.name
  order by score desc, predictions_count desc, p.name asc;
end;
$$ language plpgsql;
