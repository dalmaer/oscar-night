-- Update create_room to accept an optional custom code
create or replace function create_room(host_name text, custom_code text default null)
returns json as $$
declare
  new_code char(4);
  new_room_id uuid;
  new_participant_id uuid;
begin
  if custom_code is not null and length(custom_code) = 4 then
    -- Validate characters (same charset as generate_room_code)
    if upper(custom_code) !~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$' then
      raise exception 'Invalid room code. Use letters A-Z (excluding O, I, L) and digits 2-9.';
    end if;
    -- Check if already taken
    if exists (select 1 from rooms where code = upper(custom_code)) then
      raise exception 'Room code already taken';
    end if;
    new_code := upper(custom_code);
  else
    new_code := generate_room_code();
  end if;

  new_participant_id := uuid_generate_v4();

  insert into rooms (code, host_id)
  values (new_code, new_participant_id)
  returning id into new_room_id;

  insert into participants (id, room_id, name, is_host)
  values (new_participant_id, new_room_id, host_name, true);

  return json_build_object(
    'roomId', new_room_id,
    'roomCode', new_code,
    'participantId', new_participant_id
  );
end;
$$ language plpgsql;
