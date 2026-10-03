# CMIFF Activity Tracker — Cape Maclear International Film Festival 2026

Real-time festival control room with Telegram bot notifications, AI-assisted drafting, and live schedule coordination.

## 🎬 About

This app is the operational heartbeat for CMIFF 2026 — a 3-day film festival in Cape Maclear, Malawi (Oct 15-17, 2026). It tracks:

- **35 activities** across 7 venues and 6 pillars
- **31 crew members** (7 LEAD, 10 TECH, 14 VOL)
- **Real-time simulation** with speed controls
- **Telegram bot integration** for instant crew notifications
- **AI-powered schedule parsing** from PDFs/spreadsheets

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A Telegram bot token (from @BotFather)
- Optional: AI API key (OpenAI or compatible)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/cmiff-activity-tracker.git
cd cmiff-activity-tracker

# Install dependencies
npm install

# Copy environment file
copy .env.local.example .env.local

# Edit .env.local and add your tokens
```

### Environment Variables

Edit `.env.local`:

```env
# Telegram Bot (required)
TELEGRAM_BOT_TOKEN=your-bot-token-here

# AI/LLM (optional - for smart drafting)
API_KEY=your-api-key-here
BASE_URL=https://api.openai.com/v1
MODEL=gpt-4o-mini

# Convex (optional - for production deployment)
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### Run Locally

```bash
npm run dev
```

Open http://localhost:3000

## 📱 Features

### Program View
- 3-day festival schedule
- Filter by venue, pillar, status
- Search functionality
- Interactive timeline

### Ops Board
- Visual rundown by day
- Color-coded status pills
- Real-time simulation (1×, 60× speeds)
- Quick actions: Start, Late, Wrap, Flag

### Crew View
- Grid of all 31 team members
- Role badges (LEAD/TECH/VOL)
- Venue assignments
- Next duty display

### Telegram Bot
- **Send broadcasts** to all or targeted crew
- **AI drafting** for professional messages
- **/connect command** for crew linking
- Real-time message logging

### Admin Panel
- Broadcast composer with priority levels
- AI draft assistant
- Crew account management
- Telegram link deep-links

### AI Schedule Parser
- Paste text from PDFs/emails
- Auto-detect times, venues, pillars
- Preview before saving
- Bulk import to any day

## 🔧 Telegram Bot Setup

### 1. Create Bot
1. Message @BotFather on Telegram
2. Send `/newbot`
3. Name your bot (e.g., "CMIFF Ops Bot")
4. Get the API token
5. Add token to `.env.local`

### 2. Set Webhook (for production)
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
  -d '{"url": "https://your-domain.com/telegram/webhook"}'
```

### 3. Local Testing
Use [ngrok](https://ngrok.com/) for local webhook testing:
```bash
ngrok http 3000
# Then set webhook to: https://xxx.ngrok.io/telegram/webhook
```

### 4. Crew Connection
Share these deep links with crew:
```
t.me/cmiffBot?start=cmiff-grace
t.me/cmiffBot?start=cmiff-timothy
...
```

When crew taps the link and sends `/connect cmiff-grace`, they're linked.

## 🗄️ Data Structure

### Crew Members (31)
```typescript
interface CrewMember {
  _id: string;
  name: string;
  role: "LEAD" | "TECH" | "VOL";
  venue: string;  // arena, hub, tent, theatre, main, dj, bonfire
  telegramHandle: string;
  linked: boolean;
  token: string;  // e.g., "cmiff-grace"
  telegramChatId?: string;
}
```

### Activities (35+)
```typescript
interface Activity {
  _id: string;
  day: number;           // 1, 2, or 3
  start: number;         // minutes from midnight
  end: number;
  title: string;
  venue: string;
  pillar: string;
  status: "CONF" | "TBC" | "PEND" | "PROG";
  details?: string;
  gear?: string;
  quiet?: boolean;
}
```

## 📊 Venues & Pillars

### Venues
- **arena** — Beach Sports Arena
- **hub** — Learn & Connect Hub
- **tent** — Film Screening Tent
- **theatre** — Theatre & Spoken Word Stage
- **main** — Main Stage
- **dj** — DJ Lounge / Sundowner Deck
- **bonfire** — Beach & Bonfire

### Pillars
- **sports** — Beach Sports
- **learn** — Learn
- **connect** — Connect
- **film** — Film
- **theatre** — Theatre & Spoken Word
- **music** — Music · DJs · Dance
- **general** — General

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Self-Hosted
```bash
npm run build
npm start
```

## 🔐 Security Notes

- Never commit `.env.local` — it's in `.gitignore`
- Rotate Telegram bot tokens if compromised
- Use strong AI API keys
- Consider adding authentication for production

## 📝 Development

### Add New Activities
Edit `src/app/api/seed/route.ts` and restart the server.

### Update Crew
Same file — update the `CREW` array.

### AI Integration
The app uses OpenAI-compatible APIs. Change `BASE_URL` and `MODEL` in `.env.local` to use:
- OpenAI: `https://api.openai.com/v1`
- Azure: Your endpoint URL
- Ollama: `http://localhost:11434/v1`
- Any compatible provider

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Private — Created for CMIFF 2026 operations team.

## 🙏 Credits

- **Festival**: Cape Maclear International Film Festival 2026
- **Location**: Mangochi, Lake Malawi
- **Dates**: October 15-17, 2026
- **Data Source**: CMIFF26 OPERATIONS WORK PLAN.pdf

---

**Built with ❤️ for the CMIFF operations team**
