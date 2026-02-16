# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Oscar Night is a real-time collaborative voting app where friends predict Oscar winners together and compete on a leaderboard during the ceremony.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + real-time subscriptions)
- **Testing**: Vitest + React Testing Library
- **Nominations Data**: `data/nominations-2026.json` - All 24 Oscar categories with nominees

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Type check + production build
npm run lint     # Run ESLint
npm run test     # Run tests in watch mode
npm run test:run # Run tests once
```

## Key Documentation

- **Full Specification**: `docs/SPEC.md` - Complete app specification including data models, Supabase schema, user flows, and API design

## Screen Designs

Reference designs with HTML/Tailwind implementations in `screens/`:

| Directory | Purpose | Files |
|-----------|---------|-------|
| `join_the_party/` | Landing page - join with code or host | `screen.png`, `code.html` |
| `cast_your_votes/` | Voting ballot - select winners per category | `screen.png`, `code.html` |
| `host_room_view/` | Host dashboard - manage room, view guests | `screen.png`, `code.html` |
| `live_leaderboard_&_results/` | Live mode - leaderboard & announced winners | `screen.png`, `code.html` |

**Design System:**
- Tailwind CSS with custom gold accent colors (#D4AF37)
- Plus Jakarta Sans font
- Dark theme for all screens
- Material Symbols icons

## Core Concepts

- **Room**: A voting session with a 4-char alphanumeric code (e.g., `A1B2`)
- **Host**: Creates room, controls phases, declares winners
- **Participant**: Joins via code, submits predictions, views leaderboard

## Application Phases

1. **VOTING**: Participants submit predictions (host can close voting)
2. **LIVE**: Ceremony in progress, host declares winners, leaderboard updates in real-time
3. **CLOSED**: Ceremony complete, final results displayed

## Room Code Rules

- 4 characters, uppercase alphanumeric
- Excludes ambiguous chars: `0, O, I, L, 1`
- Valid charset: `ABCDEFGHJKMNPQRSTUVWXYZ23456789`

## License

Apache 2.0
