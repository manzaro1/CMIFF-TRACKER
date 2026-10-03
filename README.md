# CMIFF Activity Tracker — Cape Maclear International Film Festival 2026

Real-time festival control room with Telegram bot notifications, AI-assisted drafting, and live schedule coordination.

## Tech Stack
- **Frontend**: Next.js 15 + React 19
- **Backend**: Convex (real-time database + serverless functions)
- **Styling**: Original CMIFF dark amber aesthetic (CSS preserved from prototype)
- **Deployment**: Vercel

## Setup

### 1. Convex
```bash
npm install -g convex
convex init
```
Then follow the prompts to create a new Convex project.

### 2. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in:
- `CONVEX_DEPLOYMENT` — from `convex init`
- `TELEGRAM_BOT_TOKEN` — from @BotFather
- `OPENAI_API_KEY` — for AI drafting

### 3. Run
```bash
npm install
npm run dev
```

### 4. Deploy
Push to GitHub, then deploy on Vercel with the same env vars.

## Data
Festival schedule loaded from `CMIFF_2026_Master_Program.pdf` + `CMIFF 2026 Master Program DRAFT.xlsx`.
Crew roster from the prototype (33 people, 7 venues).
