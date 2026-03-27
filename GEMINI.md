# FluentUp - Gemini AI Context

## Project Overview
**FluentUp** is a premium AI-powered English learning platform built with React 18 + Vite (SWC). It features vocabulary building, shadowing exercises, quizzes, progress tracking, and Google authentication.

## Tech Stack
- **Framework**: React 18, Vite (SWC)
- **Styling**: Tailwind CSS with custom glassmorphism utilities
- **AI**: Groq API (`llama-3.3-70b-versatile`) via `src/utils/api.js`
- **Auth**: Google Identity Services (GSI) with FedCM disabled

## Key Files
- `src/App.jsx` — Root component: state management (useReducer), Google Auth init, sidebar, routing
- `src/utils/constants.js` — Translations (T), INITIAL_WORDS, SENTENCES
- `src/utils/api.js` — Groq API calls for vocabulary and shadowing generation
- `src/components/Icons.jsx` — Custom SVG icon components
- `src/components/Profile.jsx` — User profile management page
- `src/components/Quizzes.jsx` — Quiz engine (EN→AR, AR→EN, Mix) with 15s timer
- `.env` — `VITE_GROQ_API_KEY` and `VITE_GOOGLE_CLIENT_ID`

## State Management
Global state lives in `App.jsx` via `useReducer`. Key state fields:
- `user` — Google profile object (id, name, email, picture)
- `words` — Array of vocabulary words (with SM-2 review fields)
- `sentences` — Array of shadowing sentences
- `xp`, `streak`, `lastStudyDate` — Progress tracking
- `nudgeDismissed` — Login nudge dismissal (persisted)
- `activeTab` — Current view: `home | vocab | shadowing | quizzes | progress | profile`

## Coding Conventions
- All localStorage keys are prefixed with `fluentup_`
- RTL support: use `isAr` flag and Tailwind `rtl:` variants
- Dark mode: use Tailwind `dark:` variants (toggled via `<html>` class)
- New icons go in `Icons.jsx` as inline SVG components
- AI prompts must include existing word list to prevent duplicates

## Important Notes
- Google Auth: `use_fedcm_for_prompt: false` is intentional — do NOT remove it
- The `googleInitStarted` ref prevents double-initialization of GSI on re-renders
- Quiz options are generated locally from `state.words` — no AI call needed
- The sidebar card (user name/avatar) navigates to `activeTab: 'profile'`
