.PHONY: run pubget format ci

# Run the app locally in Chrome.
run:
	flutter run -d chrome

# Fetch dependencies.
pubget:
	flutter pub get

# Auto-fix formatting. Run before committing.
format:
	dart format .

# Full CI check. Run before pushing.
ci: pubget
	dart format --set-exit-if-changed .
	flutter analyze
	flutter test
