# Nose2Floor

Push-up counter app. Place your phone on the ground, do a push-up, and touch the bull's-eye with your nose to score points.

## Setup

```bash
flutter pub get   # Fetch dependencies
flutter run       # Run on any device
```

## Before committing

```bash
dart format .                        # Auto-fix formatting
dart format --set-exit-if-changed .  # Check formatting
flutter analyze                      # Static analysis
flutter test                         # Run tests
```

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

## Contributing

Pull requests welcome. Run the full CI check before submitting:

```bash
dart format --set-exit-if-changed .
flutter analyze
flutter test
```
