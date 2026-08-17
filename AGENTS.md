<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Root Web App - Squad Matcher

This project is the frontend for **root**, specifically focusing on the "Squad Matcher de Eventos".
The application is built with **Next.js** (App Router) and **TypeScript**.

## Project Logic & Domain Context
- **Squad Matcher:** A system to discover events and form small groups (Squads of 3-5 people) via a Swipe mechanism.
- **Matchmaking Engine:** Users swipe on events. A squad is formed when 3+ people with similar `departureZone`, `partyStyle`, and `verifiedKycOnly` match on the same event.
- **Vibe Profile:** Users have affinities (`favoriteGenres`, `departureZone`, `partyStyle`).

## UX & Design Aesthetics
- **Cinematic Experience:** UI should have a dark, cinematic gradient feel.
- **Gestures:** The Swipe Deck uses touch gestures (Swipe Left/Right, Super Swipe) and floating action buttons.
- **Fluid & Responsive:** Micro-animations (acid-lime accents) and responsive layouts are critical.

## Key Files & Documentation
- `Specs.md`: Main product specifications, user flow, and architecture.
- `API_Specs.md`: Backend API definitions.
- `DB_Schema.md`: Database models.

## AI Agent Instructions
- **Architecture:** Keep UI components under `src/components/match/` and pages under `src/app/match/` or `src/app/chat/`.
- **Typing:** Strictly type all components using interfaces such as `UserVibeProfile`, `EventSwipeAction`, `EventSquad`, and `SquadMember`.
- **Aesthetics:** Adhere to "Function-Driven Design", prioritize visual excellence, avoid dashboard-overuse and cliché tropes (no purple on dark, no grid backgrounds). Keep it minimal but premium.
