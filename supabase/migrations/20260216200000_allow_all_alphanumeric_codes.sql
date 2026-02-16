-- Allow all alphanumeric characters in custom room codes
-- The restricted charset (no O, I, L, 0, 1) is only for random generation
create or replace function create_room(host_name text, custom_code text default null)
returns json as $$
declare
  new_code char(4);
  new_room_id uuid;
  new_host_id uuid;
begin
  if custom_code is not null and length(custom_code) = 4 then
    -- Allow any uppercase letter or digit for custom codes
    if upper(custom_code) !~ '^[A-Z0-9]{4}$' then
      raise exception 'Invalid room code. Use letters A-Z and digits 0-9.';
    end if;
    if exists (select 1 from rooms where code = upper(custom_code)) then
      raise exception 'Room code already taken';
    end if;
    new_code := upper(custom_code);
  else
    -- Random codes still use the unambiguous charset via generate_room_code()
    new_code := generate_room_code();
  end if;

  new_host_id := uuid_generate_v4();

  insert into rooms (code, host_id)
  values (new_code, new_host_id)
  returning id into new_room_id;

  return json_build_object(
    'roomId', new_room_id,
    'roomCode', new_code,
    'hostId', new_host_id
  );
end;
$$ language plpgsql;
