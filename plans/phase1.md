Vento — Local LLM Chat App Refactor Plan

 Context

 Refactor the stock Expo tabs template into Vento, a fast, lightweight local chat app that runs Gemma 4 E2B
 on-device using Google's LiteRT-LM runtime. No cloud. No API keys. Chat history persists across sessions.
 Users can open multiple independent chats. The name "Vento" (Italian for wind) sets the design tone: airy,
 minimal, fluid.

 Constraints:
 - Android ARM64 only (API 26+); no web or iOS for now
 - React Native New Architecture (already enabled in SDK 54)
 - Strict TypeScript throughout
 - pnpm package manager

 ---
 Stack additions

 ┌────────────────────────────┬───────────────────────────────────────────────────┐
 │          Package           │                      Purpose                      │
 ├────────────────────────────┼───────────────────────────────────────────────────┤
 │ react-native-litert-lm     │ On-device Gemma 4 inference via LiteRT-LM + Nitro │
 ├────────────────────────────┼───────────────────────────────────────────────────┤
 │ react-native-nitro-modules │ Required peer for litert-lm                       │
 ├────────────────────────────┼───────────────────────────────────────────────────┤
 │ expo-sqlite                │ SQLite-backed chat + message persistence          │
 ├────────────────────────────┼───────────────────────────────────────────────────┤
 │ expo-file-system           │ Model file existence checks, import staging       │
 ├────────────────────────────┼───────────────────────────────────────────────────┤
 │ expo-document-picker       │ "Use local file" import flow                      │
 └────────────────────────────┴───────────────────────────────────────────────────┘

 Install command:
 pnpm add react-native-litert-lm react-native-nitro-modules expo-sqlite expo-file-system expo-document-picker

 ---
 Model

 - HuggingFace repo: litert-community/gemma-4-E2B-it-litert-lm
 - Format: .litertlm (~2.58 GB: 0.79 GB decoder + 1.1 GB embeddings)
 - Download URL:
 https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/<filename>.litertlm
   - Confirm exact filename by checking the HF repo files tab before implementing
 - Cache path: react-native-litert-lm caches to Android app-private files/models/ automatically via
 loadModel(url)
 - AI Edge Gallery sharing: Android sandboxing prevents cross-app file access. Instead, offer document picker
 so users can pick a .litertlm file they already have anywhere on-device (e.g. copied from Downloads)

 ---
 File structure changes

 Delete (template noise)

 app/(tabs)/               ← entire directory replaced by stack
 app/modal.tsx
 components/EditScreenInfo.tsx
 components/StyledText.tsx
 components/__tests__/

 New/rewritten files

 app/
 ├── _layout.tsx           ← rewrite: Stack nav, wrap with ModelProvider + ChatProvider
 ├── index.tsx             ← rewrite: Chat list (home screen)
 └── chat/
     └── [id].tsx          ← new: individual chat screen

 components/
 ├── ChatBubble.tsx        ← new: user/assistant message bubble
 ├── ChatInput.tsx         ← new: text input + send/stop button
 └── ModelDownloadGate.tsx ← new: full-screen download/import UI shown before ready

 hooks/
 ├── useLLM.ts             ← new: LLM load, generate, stream, download progress
 └── useChats.ts           ← new: CRUD for chats + messages via SQLite

 store/
 └── db.ts                 ← new: SQLite schema init + typed query helpers

 constants/
 └── Colors.ts             ← update: Vento airy palette (keep same shape)

 Keep unchanged

 app/+not-found.tsx
 app/+html.tsx
 components/Themed.tsx       (pattern stays; color tokens updated via Colors.ts)
 components/ExternalLink.tsx
 components/useColorScheme.ts/.web.ts
 components/useClientOnlyValue.ts/.web.ts

 ---
 app.json changes

 {
   "expo": {
     "plugins": [
       "expo-router",
       "expo-sqlite",
       "react-native-litert-lm"
     ],
     "android": {
       "minSdkVersion": 26
     }
   }
 }

 ---
 SQLite schema (store/db.ts)

 CREATE TABLE IF NOT EXISTS chats (
   id TEXT PRIMARY KEY,
   title TEXT NOT NULL,
   created_at INTEGER NOT NULL,
   updated_at INTEGER NOT NULL
 );

 CREATE TABLE IF NOT EXISTS messages (
   id TEXT PRIMARY KEY,
   chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
   role TEXT NOT NULL,   -- 'user' | 'assistant'
   content TEXT NOT NULL,
   created_at INTEGER NOT NULL
 );

 Exports: initDb(), createChat(), deleteChat(), listChats(), addMessage(), listMessages(chatId).

 ---
 useLLM hook (hooks/useLLM.ts)

 type LLMStatus = 'idle' | 'downloading' | 'loading' | 'ready' | 'generating' | 'error';

 // Wraps react-native-litert-lm's createLLM()
 // Exposes:
 //   status: LLMStatus
 //   downloadProgress: number (0–1)
 //   loadFromUrl(url: string): Promise<void>
 //   loadFromLocalFile(path: string): Promise<void>
 //   generate(messages: ChatMessage[], onToken: (t: string) => void): Promise<void>
 //   stop(): void
 //   errorMessage: string | null

 ---
 Screen designs

 Home (app/index.tsx)

 - Header: "Vento" wordmark (left) + "+" new-chat icon (right)
 - FlatList of chat rows: title + last message preview + relative timestamp
 - Swipe-to-delete on each row
 - Empty state: logo + "Start a conversation"

 Chat (app/chat/[id].tsx)

 - Header: auto-title (first 40 chars of first user message) + back chevron
 - FlatList (inverted) of ChatBubble items
 - Streaming assistant response shown in real-time as tokens arrive
 - Three animated dots while loading first token
 - ChatInput bar: TextInput (multiline, grows) + Send/Stop button
 - Input disabled + Stop button shown during generation

 ModelDownloadGate (components/ModelDownloadGate.tsx)

 - Shown full-screen when model not yet loaded
 - "Vento" logo + brief description
 - Primary: "Download Gemma 4 E2B (2.6 GB)" → progress bar with MB/total
 - Secondary: "Use local file…" → opens document picker for .litertlm
 - Error state with retry button

 ---
 Vento color palette (constants/Colors.ts)

 // Same shape as current (text, background, tint, tabIconDefault, tabIconSelected)
 // plus new tokens added for chat UI:
 //   surface, userBubble, assistantBubble, inputBorder

 light: {
   text: '#1A1A2E',
   background: '#F8F9FA',
   tint: '#4F8EF7',
   surface: '#FFFFFF',
   userBubble: '#4F8EF7',
   assistantBubble: '#FFFFFF',
   inputBorder: '#E5E7EB',
   ...
 }
 dark: {
   text: '#F1F5F9',
   background: '#0F172A',
   tint: '#60A5FA',
       inputBorder: '#334155',
       ...
     }

     ---
     Root layout (app/_layout.tsx)

     - Keep font loading + splash screen pattern
     - Replace <Tabs> with <Stack> (already a Stack, just remove the (tabs) group)
     - Wrap children in ModelProvider (React Context holding LLM status/instance)
     - ModelProvider renders <ModelDownloadGate> overlay when status ≠ 'ready'

     ---
     Chat context (hooks/useChats.ts)

     - Thin React Context + SQLite-backed hooks
     - useChats() → { chats, createChat, deleteChat }
     - useMessages(chatId) → { messages, addMessage }
     - Auto-titles new chat from first user message (truncated to 40 chars)

     ---
     EAS build

     No changes needed — existing eas.json development profile works. Run:
     eas build --profile development --platform android
     (Expo Go won't work; native modules require dev client build)

     ---
     Verification

     1. tsc --noEmit — zero errors
     2. eas build --profile development --platform android — builds successfully
     3. On ARM64 device:
       - First launch shows ModelDownloadGate
       - Download starts and progress bar advances
       - "Use local file" picker opens and accepts a .litertlm file
       - After model loads, home screen shows empty state
       - Tapping "+" creates a new chat
       - Typing a message and sending triggers streaming response
       - Tokens appear in real-time; Stop button works
       - Chat title auto-sets to first message
       - Back → home shows the chat in the list
       - Creating a second chat works independently
       - Swipe-to-delete removes a chat and its messages
       - Kill + reopen app: chats and history persist


---

Everything is in place. Here's a summary of what was built:

  ---
  Vento is implemented. tsc --noEmit passes clean. To build and run:
     
  eas build --profile development --platform android
     
  What was built:

  File: store/db.ts
  Purpose: SQLite schema + typed helpers for chats & messages                     
  ────────────────────────────────────────
  File: hooks/useLLM.ts 
  Purpose: LLM lifecycle: download with progress, load, stream, reset
  ────────────────────────────────────────
  File: hooks/useChats.ts
  Purpose: Chat CRUD backed by SQLite
  ────────────────────────────────────────
  File: components/ModelDownloadGate.tsx
  Purpose: Full-screen gate: download from HuggingFace or import local .litertlm
  ────────────────────────────────────────
  File: components/ChatBubble.tsx
  Purpose: User/assistant bubbles with streaming cursor
  ────────────────────────────────────────
  File: components/ChatInput.tsx
  Purpose: Multiline input + send/stop button
  ────────────────────────────────────────
  File: app/index.tsx
  Purpose: Chat list with "Vento" header, new chat button, long-press delete
  ────────────────────────────────────────
  File: app/chat/[id].tsx
  Purpose: Chat screen with real-time streaming, auto-title from first message
     
  Key notes for testing:
  - Requires an ARM64 Android device — no x86 emulator support
  - First launch shows the download gate (2.6 GB — keep Wi-Fi on)
  - "Use local file…" lets you pick a .litertlm already on the device (e.g. from Downloads)
  - The AI's conversation context resets when you return to an old chat, but the message history is always
  preserved visually`
