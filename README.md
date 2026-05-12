# Vento

A privacy-first chat app that runs an LLM entirely on-device — no cloud, no accounts, no data leaving your phone.

Built with Expo (SDK 54, New Architecture) and powered by [Gemma 4 E2B](https://huggingface.co/google/gemma-3n-E2B-it-litert-preview) via `react-native-litert-lm`.

## Features

- Fully offline inference — the model runs locally via LiteRT
- Persistent chat history stored in SQLite on-device
- Download the model from HuggingFace or sideload a local file
- Light/dark theme support

## Requirements

- Node.js + pnpm
- Expo CLI (`npm i -g expo`)
- For Android builds: Android Studio + SDK
- For iOS builds: Xcode (macOS only)

## Getting started

```bash
pnpm install
pnpm start        # Expo dev server (scan QR with Expo Go or a dev build)
pnpm android      # Run on Android
pnpm ios          # Run on iOS
```

On first launch, the app prompts you to download the model (~2 GB) or pick a local `.task` file.

## Building

Uses [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
eas build --profile development   # Dev client
eas build --profile preview       # Internal preview APK
eas build --profile production    # Production build (auto-increments version)
```

## Project layout

```
app/
  _layout.tsx          # Root layout — DB init, LLM provider, navigation stack
  index.tsx            # Chat list screen
  chat/[id].tsx        # Conversation screen
components/
  ModelDownloadGate    # Blocks navigation until model is ready
  ChatBubble / ChatInput
hooks/
  useLLM.ts            # LLM lifecycle context (download → load → generate)
  useChats.ts          # Chat list state
store/
  db.ts                # SQLite helpers (chats + messages)
constants/
  Colors.ts            # Light/dark color tokens
```

## Type checking

```bash
pnpm exec tsc --noEmit
```
