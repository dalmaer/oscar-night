# Oscar Night

A real-time collaborative voting app where friends predict Oscar winners together and compete on a leaderboard during the ceremony.

Before the Oscars, everyone votes on who they think will win. Then, as the ceremony airs, the host declares winners category by category while a live leaderboard tracks who's getting the most right.

## How It Works

1. **Host creates a room** with a 4-character code (random or custom, like `FILM`)
2. **Friends join** by entering the code and a display name — no accounts needed
3. **Everyone votes** on all 24 Oscar categories before the ceremony
4. **Host starts Live mode** when the broadcast begins and declares winners as they're announced
5. **Leaderboard updates in real time** — when all awards are announced, confetti flies and the champion is crowned

The host account is just for running the ceremony — it doesn't vote or appear on the leaderboard. If the host wants to play too, they join on a second device as a regular participant.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (dark theme, gold accents)
- **Database**: Supabase (PostgreSQL + real-time subscriptions)
- **Hosting**: Vercel
- **Testing**: Vitest + React Testing Library

No authentication service — a host creates a room and shares the code. Participants join with just a name. Honor system.

## Project Structure

```
src/
├── pages/          Home (join/host) and Room (voting/live)
├── components/     VotingBallot, HostView, LiveLeaderboard, OscarLogo
├── hooks/          useRoom (real-time state), useSession (localStorage)
├── lib/            Supabase client, room CRUD, nominations data helpers
└── types/          TypeScript interfaces

data/               nominations-2026.json (all 24 categories + nominees)
supabase/           Database migrations and config
screens/            Reference design mockups (HTML/Tailwind)
docs/               Full app specification
```

## Development Setup

### Prerequisites

- Node.js 20+ (modern ESM stack)
- A [Supabase](https://supabase.com) project (free tier works fine)

### 1. Clone and install

```bash
git clone https://github.com/dalmaer/oscar-night.git
cd oscar-night
npm install
```

### 2. Set up Supabase

Create a new Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard), then grab your project URL and anon key from Settings > API.

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run database migrations

Install the Supabase CLI and link to your project:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
```

Push the schema:

```bash
npx supabase db push
```

This creates the `rooms`, `participants`, `predictions`, and `winners` tables along with RPC functions (`create_room`, `join_room`, `get_leaderboard`) and enables real-time subscriptions.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |

## Deploying to Vercel

1. Push your repo to GitHub
2. Import the project in [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel's project Settings > Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite and handles the rest

Every push to `main` triggers a new deployment.

## Database Schema

Four tables with real-time enabled:

- **rooms** — Room code, phase (VOTING → LIVE → CLOSED), current category
- **participants** — Name + room association (host is NOT a participant)
- **winners** — Declared by host during LIVE phase, one per category
- **predictions** — Each participant's pick per category (upsert on change)

Scoring is handled by a `get_leaderboard` RPC function that joins predictions against winners.

## Nominations Data

All 24 Oscar categories and nominees live in `data/nominations-2026.json`. To update for a new year, replace this file with the new nominations. The app reads categories, nominee names, films, and the ceremony date from this file.

## License

Apache 2.0
