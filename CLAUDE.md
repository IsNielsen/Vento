# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm start          # Start Expo dev server (opens QR code + web)
pnpm android        # Start targeting Android
pnpm ios            # Start targeting iOS
pnpm web            # Start targeting web

eas build --profile development   # Build dev client
eas build --profile preview       # Build internal preview
eas build --profile production    # Build production (auto-increments version)
```

There is no lint or type-check script defined. Run `tsc --noEmit` to type-check manually.

Tests use `react-test-renderer` with no configured test runner — run tests via `pnpm exec jest` if jest is available.

## Architecture

**Vento** is an Expo app (SDK 54, New Architecture enabled) using expo-router for file-based navigation. Package manager is **pnpm**.

### Routing (`app/`)
expo-router maps the filesystem to routes:
- `app/_layout.tsx` — root Stack navigator; loads fonts (SpaceMono + FontAwesome), hides splash screen, wraps everything in `ThemeProvider`
- `app/(tabs)/` — tab group with two tabs; `_layout.tsx` defines the `<Tabs>` navigator
- `app/modal.tsx` — modal screen pushed from the tab header
- `app/+not-found.tsx` — 404 fallback
- `app/+html.tsx` — web-only HTML shell

### Theming
- `constants/Colors.ts` — single source for `light`/`dark` color tokens (`text`, `background`, `tint`, `tabIconDefault`, `tabIconSelected`)
- `components/Themed.tsx` — themed `<Text>` and `<View>` wrappers; accept `lightColor`/`darkColor` props to override per-token colors. Use these instead of bare RN primitives when color must adapt to theme.
- `components/useColorScheme.ts` — re-exports `useColorScheme` from `react-native`; the `.web.ts` sibling overrides for web hydration safety. Same pattern in `useClientOnlyValue`.

### Path alias
`@/` resolves to the project root (configured in `tsconfig.json`). Use `@/components/...`, `@/constants/...`, etc.
