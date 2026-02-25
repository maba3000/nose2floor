# Contributing

## Setup

```bash
npm install
npx expo start
```

In Expo CLI, press:

- `w` for web
- `a` for Android
- `i` for iOS

## Run commands

| Command                        | Description                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `npm start`                    | Start Expo dev server (all platforms)                            |
| `npm run web`                  | Start web target                                                 |
| `npm run android`              | Start Android target                                             |
| `npm run ios`                  | Start iOS target                                                 |
| `npm run lint`                 | Run ESLint                                                       |
| `npm test`                     | Run Jest tests                                                   |
| `npm run generate:demo-data`   | Regenerate demo import dataset (`demo/demo-import.json`)         |
| `npm run screenshots:insights` | Generate Insights screenshots for README (`assets/readme/*.png`) |
| `npm run generate:icons`       | Regenerate PNG icons from `assets/icon.svg`                      |

## Generate Insights screenshots

```bash
npm run screenshots:insights
```

This command will:

1. regenerate demo data with daily growth over time,
2. seed local storage for each Insights section variant,
3. capture fresh screenshots for `Preview`, `Activity`, and `Stats`.

Output files:

- `assets/readme/insights-preview.png`
- `assets/readme/insights-activity.png`
- `assets/readme/insights-stats.png`

Notes:

- Uses headless Chrome by default.
- If Chrome is in a custom location, set `CHROME_BIN=/path/to/chrome`.

## Code style

Formatting is enforced by **Prettier** and linting by **ESLint + TypeScript**.

| Tool       | Config file     |
| ---------- | --------------- |
| Prettier   | `.prettierrc`   |
| ESLint     | `.eslintrc.js`  |
| TypeScript | `tsconfig.json` |

Key style rules (enforced automatically):

- Single quotes, trailing commas, 100-character line width
- `react-hooks/rules-of-hooks` is an error; `exhaustive-deps` is a warning
- No unused variables or implicit `any`

## Before committing

```bash
npm run format        # auto-fix formatting with Prettier
npm run lint          # ESLint — fix any reported issues
npx tsc --noEmit      # type-check without emitting files
npm test              # run Jest tests
```

Or run all checks at once:

```bash
npm run format:check && npm run lint && npx tsc --noEmit && npm test
```

CI runs the same steps and will fail the PR if any check fails.

## Commits

Start every message with a lowercase prefix. Keep under 72 characters. One change per commit.

Prefixes: `add:`, `fix:`, `remove:`, `update:`, `rename:`, `simplify:`

```
add: bull's-eye scoring system
fix: tap-through on hold-to-stop button
remove: goal reps from settings
update: landing page to match project style
rename: NavButton to ActionButton
simplify: corner badge widget
```
