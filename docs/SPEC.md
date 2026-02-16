# Oscar Night - Application Specification

## Overview

A real-time collaborative voting app where friends predict Oscar winners together and compete on a leaderboard during the ceremony.

---

## Core Concepts

### Room
A voting session identified by a 4-character alphanumeric code (e.g., `A1B2`). One room per Oscar ceremony watch party.

### Users

| Role | Description |
|------|-------------|
| **Host** | Creates the room, controls voting phases, declares winners |
| **Participant** | Joins via room code, submits predictions, views leaderboard |

### Phases

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   VOTING    │───▶│    LIVE     │───▶│   CLOSED    │
│             │    │  (ceremony) │    │  (complete) │
└─────────────┘    └─────────────┘    └─────────────┘
```

| Phase | Participants Can | Host Can |
|-------|------------------|----------|
| **VOTING** | Submit/edit predictions | Close voting, set current award |
| **LIVE** | View leaderboard, see results | Declare winners, set current award |
| **CLOSED** | View final results | Nothing (ceremony complete) |

---

## Data Models

### Room
```
{
  id: string
  code: string (4 alphanumeric, uppercase)
  hostId: string
  phase: "VOTING" | "LIVE" | "CLOSED"
  currentAwardId: string | null
  createdAt: timestamp
}
```

### Participant
```
{
  id: string
  roomId: string
  name: string (display name, chosen on first join)
  isHost: boolean
  predictions: Map<categoryId, nomineeId>  // auto-saved on each selection
  score: number (calculated from correct predictions)
  joinedAt: timestamp
}
```

### Award Result (set by host during LIVE phase)
```
{
  roomId: string
  categoryId: string
  winnerId: string (nomineeId)
  announcedAt: timestamp
}
```

---

## User Flows

### Host Flow

```
1. CREATE ROOM
   └─▶ Generate 4-char code
   └─▶ Enter display name
   └─▶ Room created in VOTING phase
   └─▶ Share code with friends

2. VOTING PHASE (waiting for participants)
   └─▶ View participant list with progress (e.g., "Sarah: 24/24", "Mike: 18/24")
   └─▶ Optionally submit own predictions
   └─▶ When ready: "Start Ceremony" → transitions to LIVE (locks all predictions)

3. LIVE PHASE (ceremony in progress)
   └─▶ Set "Current Award" being presented
   └─▶ Declare winner for each category as announced
   └─▶ View real-time leaderboard updates
   └─▶ When all winners declared: "End Ceremony" → CLOSED

4. CLOSED PHASE
   └─▶ View final leaderboard and stats
```

### Participant Flow

```
1. JOIN ROOM
   └─▶ Enter 4-char room code
   └─▶ Enter display name
   └─▶ Joined successfully

2. VOTING PHASE (if room still in voting)
   └─▶ Single scrollable list of all 24 categories
   └─▶ Tap category to select predicted winner
   └─▶ Each selection auto-saves immediately
   └─▶ Progress indicator: "15/24 complete"
   └─▶ Can change any prediction until host starts ceremony
   └─▶ No explicit "submit" - just keep picking

3. LIVE PHASE (ceremony started)
   └─▶ Predictions locked (read-only)
   └─▶ View current award being presented
   └─▶ See own predictions vs announced winners
   └─▶ Real-time leaderboard with scores
   └─▶ Celebration when prediction is correct

4. CLOSED PHASE
   └─▶ View final standings
   └─▶ See complete results breakdown
```

---

## Rules & Constraints

### Room Code
- 4 characters, alphanumeric, uppercase only
- Exclude ambiguous characters: `0, O, I, L, 1`
- Valid charset: `ABCDEFGHJKMNPQRSTUVWXYZ23456789`
- Must be unique among active rooms

### Predictions
- Each participant selects one nominee per category
- Selections auto-save immediately (no submit button)
- Predictions editable anytime during VOTING phase
- Predictions locked when host transitions to LIVE phase
- Incomplete predictions are allowed (scored only on categories with selections)
- Host can also participate (optional)

### Scoring
- +1 point for each correct prediction
- Maximum possible: 24 points
- Ties broken by: 1) more categories predicted, 2) alphabetical by name

### Phase Transitions
- Only host can transition phases
- VOTING → LIVE: Irreversible, locks all predictions
- LIVE → CLOSED: Triggered when all 24 winners declared (or manual)

### Real-time Updates (LIVE phase)
- Leaderboard updates immediately when winner declared
- All participants see current award indicator
- Winner announcements broadcast to all participants

---

## UI Designs

Design mockups and Tailwind/HTML implementations are in `screens/`:

| Screen | File | Phase | Description |
|--------|------|-------|-------------|
| Join the Party | `screens/join_the_party/` | Entry | Landing page with room code input and "Host" option |
| Cast Your Votes | `screens/cast_your_votes/` | VOTING | Scrollable ballot with all categories, progress tracker |
| Host Room View | `screens/host_room_view/` | VOTING | Host dashboard with guest list, room code, activity feed |
| Live Leaderboard | `screens/live_leaderboard_&_results/` | LIVE | Real-time leaderboard, winner announcements, vote breakdown |

Each directory contains:
- `screen.png` - Visual design mockup
- `code.html` - Complete HTML/Tailwind implementation

### Design System
- **Colors**: Dark theme with gold accents (#D4AF37, #C5A059)
- **Font**: Plus Jakarta Sans
- **Icons**: Material Symbols Outlined
- **Framework**: Tailwind CSS

---

## API Endpoints (Reference)

### Rooms
- `POST /rooms` - Create room (returns code)
- `GET /rooms/:code` - Get room by code
- `PATCH /rooms/:code/phase` - Update phase (host only)
- `PATCH /rooms/:code/current-award` - Set current award (host only)

### Participants
- `POST /rooms/:code/join` - Join room with name
- `GET /rooms/:code/participants` - List participants
- `GET /rooms/:code/participants/:id` - Get participant details

### Predictions
- `PUT /rooms/:code/predictions/:categoryId` - Save single prediction (auto-save)
- `GET /rooms/:code/predictions` - Get own predictions

### Results
- `POST /rooms/:code/winners` - Declare winner (host only)
- `GET /rooms/:code/winners` - Get all declared winners
- `GET /rooms/:code/leaderboard` - Get current standings

### Real-time (WebSocket/SSE)
- Subscribe to room updates: phase changes, winner announcements, leaderboard updates

---

## Database (Supabase)

### Tables

#### `rooms`
```sql
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code char(4) unique not null,
  host_id uuid not null,
  phase text not null default 'VOTING' check (phase in ('VOTING', 'LIVE', 'CLOSED')),
  current_category_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index rooms_code_idx on rooms (code);
```

#### `participants`
```sql
create table participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  name text not null,
  is_host boolean default false,
  joined_at timestamptz default now(),

  unique(room_id, name)
);

create index participants_room_idx on participants (room_id);
```

#### `predictions`
```sql
create table predictions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  category_id text not null,
  nominee_id text not null,
  updated_at timestamptz default now(),

  unique(participant_id, category_id)
);

create index predictions_participant_idx on predictions (participant_id);
create index predictions_room_idx on predictions (room_id);
```

#### `winners`
```sql
create table winners (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  category_id text not null,
  nominee_id text not null,
  announced_at timestamptz default now(),

  unique(room_id, category_id)
);

create index winners_room_idx on winners (room_id);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
alter table rooms enable row level security;
alter table participants enable row level security;
alter table predictions enable row level security;
alter table winners enable row level security;

-- Rooms: Anyone can read, only host can update
create policy "Rooms are viewable by everyone"
  on rooms for select using (true);

create policy "Host can update room"
  on rooms for update using (
    host_id = (select id from participants where id = auth.uid())
  );

-- Participants: Anyone in room can view participants
create policy "Participants viewable by room members"
  on participants for select using (true);

create policy "Anyone can join a room"
  on participants for insert with check (true);

-- Predictions: Own predictions only (read/write)
create policy "Users can view own predictions"
  on predictions for select using (participant_id = auth.uid());

create policy "Users can insert own predictions"
  on predictions for insert with check (participant_id = auth.uid());

create policy "Users can update own predictions during voting"
  on predictions for update using (
    participant_id = auth.uid() and
    (select phase from rooms where id = room_id) = 'VOTING'
  );

-- Winners: Anyone can view, only host can insert
create policy "Winners are viewable by everyone"
  on winners for select using (true);

create policy "Host can declare winners"
  on winners for insert with check (
    room_id in (
      select r.id from rooms r
      join participants p on p.id = r.host_id
      where p.id = auth.uid()
    )
  );
```

### Real-time Subscriptions

Enable real-time on these tables for live updates:

```sql
-- In Supabase Dashboard > Database > Replication
-- Enable for: rooms, participants, predictions, winners
```

Client subscribes to:
```javascript
// Room phase changes & current award
supabase.channel('room:A1B2')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'rooms',
    filter: 'code=eq.A1B2'
  }, handleRoomUpdate)

// New participants joining
supabase.channel('participants:A1B2')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'participants',
    filter: 'room_id=eq.{roomId}'
  }, handleNewParticipant)

// Winner announcements (LIVE phase)
supabase.channel('winners:A1B2')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'winners',
    filter: 'room_id=eq.{roomId}'
  }, handleWinnerAnnounced)
```

### Leaderboard Query

```sql
-- Get leaderboard for a room
select
  p.id,
  p.name,
  p.is_host,
  count(pred.id) as predictions_count,
  count(case when pred.nominee_id = w.nominee_id then 1 end) as score
from participants p
left join predictions pred on pred.participant_id = p.id
left join winners w on w.room_id = p.room_id and w.category_id = pred.category_id
where p.room_id = $1
group by p.id, p.name, p.is_host
order by score desc, predictions_count desc, p.name asc;
```

### Database Functions

```sql
-- Generate unique room code
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

-- Create room with host
create or replace function create_room(host_name text)
returns json as $$
declare
  new_code char(4);
  new_room_id uuid;
  new_participant_id uuid;
begin
  new_code := generate_room_code();
  new_participant_id := gen_random_uuid();

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
```

### Environment Variables

```
VITE_SUPABASE_URL=https://ovzaeezddnydvbdljogi.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## Technical Notes

### State Management
- Room phase is source of truth for UI state
- Predictions auto-save on each selection during VOTING phase
- Predictions become immutable when room transitions to LIVE
- Leaderboard computed from predictions + declared winners

### Persistence
- Rooms expire after 48 hours of inactivity
- No authentication required (name-based identity per room)
- Room code lookup should be case-insensitive

### Local Storage (Session Recovery)
Store in localStorage to allow page refresh/recovery:
```
{
  "oscarNight": {
    "participantId": "abc123",
    "roomCode": "A1B2",
    "isHost": true
  }
}
```
- On page load, check localStorage for existing session
- If session exists, attempt to rejoin room automatically
- Clear localStorage when room transitions to CLOSED or expires

### Edge Cases
- Participant joins during LIVE phase: Can view leaderboard but cannot predict
- Host refreshes/disconnects: Auto-rejoin via localStorage, retains host privileges
- Participant refreshes: Auto-rejoin via localStorage, predictions preserved
- Duplicate names: Append number suffix (e.g., "Mike", "Mike 2")
- localStorage cleared/new device: Must rejoin manually (predictions still on server)
