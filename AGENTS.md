<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Root Web App - Squad Matcher

This project is the frontend for **root**, specifically focusing on the "Squad Matcher de Eventos" and KYC Verification.
The application is built with **Next.js** (App Router) and **TypeScript**.

## Project Logic & Domain Context
- **Squad Matcher:** A system to discover events and form small groups (Squads of 3-5 people) via a Swipe mechanism.
- **Matchmaking Engine:** Users swipe on events. A squad is formed when 3+ people with similar `departureZone`, `partyStyle`, and `verifiedKycOnly` match on the same event.
- **Vibe Profile:** Users have affinities (`favoriteGenres`, `departureZone`, `partyStyle`).
- **KYC Verification:** Users must verify their identity using a custom camera flow that automatically aligns, captures, and compresses images before sending them to the backend.

## UX & Design Aesthetics
- **Cinematic Experience:** UI should have a dark, cinematic gradient feel.
- **Gestures:** The Swipe Deck uses touch gestures (Swipe Left/Right, Super Swipe) and floating action buttons.
- **Fluid & Responsive:** Micro-animations (acid-lime accents) and responsive layouts are critical.
- **Native-like Camera Flows:** Web camera interactions (KYC) must feel like a native app (continuous UI transitions, specific rear/front facing modes, direct frame capture via Canvas).

## Key Files & Documentation
- `Specs.md`: Main product specifications, user flow, and architecture.
- `API_Specs.md`: Backend API definitions.
- `DB_Schema.md`: Database models.

## AI Agent Instructions
- **Architecture:** Keep UI components under `src/components/match/` or `src/components/kyc/` and pages under `src/app/match/`, `src/app/chat/`, or `src/app/kyc/`.
- **API Requests:** Always use the custom `useMutation` hook (`src/hooks/useMutation.ts`) and the `api` Axios instance (`src/lib/api.ts`) for all network requests. Do not use raw `fetch()`.
- **Media Uploads:** Compress and convert all user-uploaded images to JPEG via HTML5 Canvas before sending them to the backend to save bandwidth and ensure format compatibility with AI models.
- **Typing:** Strictly type all components using interfaces such as `UserVibeProfile`, `EventSwipeAction`, `EventSquad`, and `SquadMember`.
- **Aesthetics:** Adhere to "Function-Driven Design", prioritize visual excellence, avoid dashboard-overuse and cliché tropes (no purple on dark, no grid backgrounds). Keep it minimal but premium.

## Recent Changes & Known Behaviors
- **Onboarding Flow:** Implemented forced profile completion for Google Auth users via `/complete-profile`. Includes real-time alias validation (`CheckUsername`).
- **Registration:** Normal registration and profile completion now require selecting a "Country" (`ISO alpha-2`).
- **Navigation (BottomNav):** 
  - Hidden completely on `/register`, `/search` and when navigating to a profile from search (`?from=search`).
  - Visible on `/login`.
  - Unauthenticated users can only see "Feed", "Eventos", and "Perfil" tabs. "Chat" and "Crews" are dynamically hidden. Clicking "Perfil" unauthenticated redirects safely to `/login`.
- **Settings:** Added a `/settings` page accessible via gear icon on the user's profile, containing a functional logout button.
