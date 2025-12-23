# AI Chat (Frontend Test Task)

A small **AI Chat** app built with:

- **Vue 3 + TypeScript**
- **Vite**
- **Vuetify 3**
- **Pinia**
- **Vue Router**
- **Axios**
- **LocalStorage**

## Features

- ✅ Multiple chats (create / rename / delete)
- ✅ Sidebar search
- ✅ Persist chats & settings in **LocalStorage**
- ✅ AI provider: **Cerebras Inference API** (OpenAI-compatible)
- ✅ Streaming responses (toggle in Settings)
- ✅ Abort generation (“Stop” button)
- ✅ Markdown rendering for assistant messages + syntax highlighting
- ✅ Export / import:
  - Export all data (settings + chats)
  - Export a single chat
- ✅ Theme: light / dark / system
- ✅ Responsive design (mobile friendly)

## Project structure (Feature-Sliced-ish)

```
src/
  app/            # app bootstrap, router, vuetify, global styles
  pages/          # route pages
  widgets/        # big UI blocks (sidebar, chat window)
  features/       # feature UI (message input)
  entities/       # domain state (chat, settings)
  shared/         # shared libs (storage, markdown), api, ui primitives
```

## Setup

> **Node requirement:** Vite 7 requires Node 20+.

1) Install dependencies

```bash
npm install
```

2) Create `.env.local` (recommended) and put your API key there

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
VITE_CEREBRAS_API_KEY=PASTE_YOUR_API_KEY_HERE
VITE_CEREBRAS_BASE_URL=https://api.cerebras.ai/v1
```

3) Run dev server

```bash
npm run dev
```
4) Open http://localhost:5173 in your browser
