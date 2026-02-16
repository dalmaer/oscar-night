-- Oscar Night Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Rooms table
create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  code char(4) unique not null,
  host_id uuid not null,
  phase text not null default 'VOTING' check (phase in ('VOTING', 'LIVE', 'CLOSED')),
  current_category_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists rooms_code_idx on rooms (code);

-- Participants table
create table if not exists participants (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade,
  name text not null,
  is_host boolean default false,
  joined_at timestamptz default now(),

  unique(room_id, name)
);

create index if not exists participants_room_idx on participants (room_id);

-- Predictions table
create table if not exists predictions (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid references participants(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  category_id text not null,
  nominee_id text not null,
  updated_at timestamptz default now(),

  unique(participant_id, category_id)
);

create index if not exists predictions_participant_idx on predictions (participant_id);
create index if not exists predictions_room_idx on predictions (room_id);

-- Winners table (announced by host)
create table if not exists winners (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade,
  category_id text not null,
  nominee_id text not null,
  announced_at timestamptz default now(),

  unique(room_id, category_id)
);

create index if not exists winners_room_idx on winners (room_id);

-- Function to generate unique room code
create or replace function generate_room_code()
returns char(4) as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result char(4) := '';
  i integer;
begin
  loop
    result := '';
    for i in 1..4 loop
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    -- Check if code already exists
    if not exists (select 1 from rooms where code = result) then
      return result;
    end if;
  end loop;
end;
$$ language plpgsql;

-- Function to create a room with host
create or replace function create_room(host_name text)
returns json as $$
declare
  new_code char(4);
  new_room_id uuid;
  new_participant_id uuid;
begin
  new_code := generate_room_code();
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

-- Function to join a room
create or replace function join_room(room_code text, participant_name text)
returns json as $$
declare
  found_room_id uuid;
  found_phase text;
  new_participant_id uuid;
  existing_participant_id uuid;
begin
  -- Find the room
  select id, phase into found_room_id, found_phase
  from rooms
  where code = upper(room_code);

  if found_room_id is null then
    raise exception 'Room not found';
  end if;

  -- Check if name already exists in room
  select id into existing_participant_id
  from participants
  where room_id = found_room_id and name = participant_name;

  if existing_participant_id is not null then
    -- Return existing participant (rejoin)
    return json_build_object(
      'roomId', found_room_id,
      'participantId', existing_participant_id,
      'phase', found_phase,
      'isRejoin', true
    );
  end if;

  -- Create new participant
  insert into participants (room_id, name, is_host)
  values (found_room_id, participant_name, false)
  returning id into new_participant_id;

  return json_build_object(
    'roomId', found_room_id,
    'participantId', new_participant_id,
    'phase', found_phase,
    'isRejoin', false
  );
end;
$$ language plpgsql;

-- Function to get leaderboard
create or replace function get_leaderboard(target_room_id uuid)
returns table (
  participant_id uuid,
  name text,
  is_host boolean,
  predictions_count bigint,
  score bigint
) as $$
begin
  return query
  select
    p.id as participant_id,
    p.name,
    p.is_host,
    count(distinct pred.id) as predictions_count,
    count(case when pred.nominee_id = w.nominee_id then 1 end) as score
  from participants p
  left join predictions pred on pred.participant_id = p.id
  left join winners w on w.room_id = p.room_id and w.category_id = pred.category_id
  where p.room_id = target_room_id
  group by p.id, p.name, p.is_host
  order by score desc, predictions_count desc, p.name asc;
end;
$$ language plpgsql;

-- Enable Row Level Security
alter table rooms enable row level security;
alter table participants enable row level security;
alter table predictions enable row level security;
alter table winners enable row level security;

-- RLS Policies

-- Rooms: Anyone can read
create policy "Rooms are viewable by everyone"
  on rooms for select
  using (true);

-- Rooms: Anyone can create
create policy "Anyone can create rooms"
  on rooms for insert
  with check (true);

-- Rooms: Only via function (host updates)
create policy "Rooms can be updated"
  on rooms for update
  using (true);

-- Participants: Anyone can view
create policy "Participants viewable by everyone"
  on participants for select
  using (true);

-- Participants: Anyone can join
create policy "Anyone can join a room"
  on participants for insert
  with check (true);

-- Predictions: Anyone can view in same room
create policy "Predictions viewable by room members"
  on predictions for select
  using (true);

-- Predictions: Participants can insert their own
create policy "Participants can insert predictions"
  on predictions for insert
  with check (true);

-- Predictions: Participants can update their own during voting
create policy "Participants can update own predictions"
  on predictions for update
  using (true);

-- Winners: Anyone can view
create policy "Winners are viewable by everyone"
  on winners for select
  using (true);

-- Winners: Can be inserted (host check done in app)
create policy "Winners can be declared"
  on winners for insert
  with check (true);

-- Enable realtime for all tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table predictions;
alter publication supabase_realtime add table winners;
