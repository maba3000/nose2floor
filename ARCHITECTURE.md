# Architecture

This project uses Expo Router for navigation and keeps all app code inside `src/`.
Screens live in `app/` and depend on `src/` modules via the `@/` alias.

## Layout

- `app/`: Expo Router screens and route groups.
- `src/analytics/`: Derived stats and insight builders.
- `src/components/`: Reusable UI components.
- `src/domain/`: Pure domain types and scoring logic.
- `src/hooks/`: Reusable hooks.
- `src/persistence/`: Storage and import/export utilities.
- `src/store/`: Zustand stores for session, history, and settings.

## Data Flow

- UI reads settings and session state from zustand stores.
- Sessions are recorded in `src/store/sessionStore.ts` and saved into history.
- History is persisted via `src/persistence/storage.ts`.
- Insights are computed in `src/analytics/insights.ts` and rendered in `app/insights.tsx`.

## Flow (for MVP/MVVM background)

Think of it as:

- **View** = screen in `app/` (React component)
- **ViewModel/Presenter** = Zustand store in `src/store/`
- **Model** = `src/domain/` types + `src/persistence/` I/O

Example flow:

1. User taps the bullseye.
2. `app/index.tsx` computes score (domain logic) and calls `recordHit` on the session store.
3. `src/store/sessionStore.ts` updates state (hits, totals) and the UI re-renders automatically.
4. On stop, `app/index.tsx` creates a session object and calls `addSession` on `src/store/historyStore.ts`.
5. `src/store/historyStore.ts` persists to storage via `src/persistence/storage.ts`.
6. `app/history.tsx` and `app/insights.tsx` read history and render lists/stats.

The store is the single source of truth, and screens are thin views that bind to it.

## Conventions

- Use `@/` for all imports from `src/` to avoid `../..` paths.
- Keep domain logic free of React dependencies.
- Keep components presentational; logic lives in hooks or stores.
