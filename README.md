# 🏠 BudgetWise — Family Expense Tracker

> **AI-powered family expense tracking app** with real-time sync, receipt scanning, and smart financial advice.

[![Live Demo](https://img.shields.io/badge/Live-Demo-C85A2A?style=for-the-badge)](https://yourusername.github.io/budgetwise)
[![Built with Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Powered by Groq](https://img.shields.io/badge/AI-Groq-F55036?style=for-the-badge)](https://groq.com)
[![Powered by Claude](https://img.shields.io/badge/AI-Claude-D97757?style=for-the-badge)](https://claude.ai)
[![Hosted on Vercel](https://img.shields.io/badge/Hosted-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)
---

## 📸 Screenshots

> Dashboard · Expenses · AI Advisor · Mobile

<!-- Add screenshots here after deployment -->

---

## ✨ Features

### Core
- **Multi-member families** — Create or join a family with an invite code
- **Expense tracking** — Add, edit, delete with search, filter, and pagination
- **Real-time sync** — Supabase Realtime: expense added on one device appears instantly on all others
- **Optimistic UI** — Changes appear instantly, roll back automatically on failure

### AI Features (Groq API)
- **AI Financial Advisor** — Chat with Llama 3.3 70B using your real expense data as context
- **Receipt Scanner** — Upload a photo → Groq Vision reads it → auto-fills the expense form
- **Personalized insights** — Ask "Where am I overspending?" and get data-aware answers

### Analytics & Budgets
- **Dashboard** — KPI cards, daily spending chart, budget overview, category donut
- **Analytics** — 4 charts: category breakdown, monthly trend, distribution, top spending days
- **Budget tracking** — Set limits per category, visual progress bars, over-budget warnings
- **Recurring bills** — Manage subscriptions with status (active/paused), cycle, next due date
- **Calendar view** — See daily spending in a monthly grid, click for day detail
- **PDF + CSV export** — Full monthly report with charts embedded

### UX & Mobile
- **Mobile-first responsive** — Hamburger sidebar, bottom nav bar, floating action button
- **Dark mode** — Fully functional, persisted in localStorage
- **Loading skeletons** — Animated shimmer placeholders while data loads
- **Toast notifications** — Success/error/undo feedback on all actions
- **Voice assistant** — Navigate tabs by voice (Web Speech API)
- **Demo mode** — Try the full app without signing up

### Security
- **Row Level Security (RLS)** — Database-level isolation per household
- **No cross-household leaks** — Users cannot read other families' data even with direct API calls
- **Safe key management** — Supabase keys in `.env` (gitignored), Groq key in localStorage

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS (ES Modules), HTML5, CSS3 |
| Build tool | Vite |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| AI Chat | Groq — Llama 3.3 70B |
| Receipt Scan | Groq — llama-4-scout (Vision) |
| Charts | Chart.js |
| PDF Export | jsPDF |
| Hosting | Vercel |
| CI/CD | Vercel Deployments |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- A [Groq](https://console.groq.com) API key (free)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/budgetwise.git
cd budgetwise
npm install
```

### 2. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `schema.sql` → **Run**
3. Go to **Authentication** → **Providers** → Enable **Email** → turn OFF "Confirm email"
4. Go to **Project Settings** → **API** → copy your keys

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_APP_NAME=BudgetWise
VITE_APP_VERSION=1.0.0
```

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

### 5. Add Groq API key (in-app)
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create a free API key
3. In the app → sidebar bottom → ⚙️ Settings → paste key → Save

---

## 📁 Project Structure

```
budgetwise/
├── index.html                  ← Login / Signup page
├── app.html                    ← Main application shell
├── schema.sql                  ← Supabase DB + RLS setup
├── .env.example                ← Environment template
├── vite.config.js              ← Multi-page Vite config
├── .github/workflows/
│   └── deploy.yml              ← Auto-deploy to GitHub Pages
│
├── css/                        ← 11 CSS files (no framework)
│   ├── design-system.css       ← Variables, dark mode, skeletons
│   ├── layout.css              ← Sidebar, topbar, mobile nav
│   ├── components.css          ← Cards, modals, toasts, forms
│   └── ...                     ← Per-view stylesheets
│
└── js/                         ← 20 JS modules
    ├── app.js                  ← Bootstrap entry point
    ├── supabase.js             ← DB operations + Realtime
    ├── store.js                ← Global state + optimistic UI
    ├── ai-chat.js              ← Groq AI advisor
    ├── receipt.js              ← Groq Vision scanner
    ├── export.js               ← PDF + CSV export
    └── views/                  ← One file per tab
        ├── dashboard.js
        ├── expenses.js
        ├── calendar.js
        ├── analytics.js
        ├── budget.js
        └── recurring.js
```

---

## 🌐 Deployment

#### Vercel Deployment

1. Push to GitHub:
```bash
git add .
git commit -m "feat: initial BudgetWise deployment"
git push origin main
```

2. Import the repository into Vercel

3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Deploy the project

**Live URL:** `budgetwise-zys3.vercel.app`

---

## 👨‍👩‍👧 How Families Use It

1. One person **signs up** and creates a family workspace
2. BudgetWise generates an **invite code** (e.g. `BWS-4821`)
3. Other family members sign up and **join** using the code
4. Everyone sees the **same expenses in real time**
5. Each member can add, edit, or delete their own expenses

---

## 🔒 Security

- **RLS policies** ensure users can only access their household's data
- **Supabase anon key** is safe to expose (RLS enforces access control)
- **Groq API key** is stored in `localStorage` only — never in code
- **`.env` is gitignored** — secrets never reach GitHub

---

## 🤖 Interview Talking Points

- *"Implemented Supabase Row Level Security — database-level household isolation that cannot be bypassed even with direct API calls"*
- *"Built real-time cross-device sync using Supabase Realtime subscriptions"*
- *"Integrated Groq Vision (llama-4-scout) for receipt scanning — base64 encoded image → API → auto-fill expense form"*
- *"Used optimistic UI — expenses appear instantly before DB confirmation, with automatic rollback on failure"*
- *"Built PDF export using jsPDF — captures Chart.js canvas as images and assembles a formatted monthly report"*
*"Deployed production build on Vercel with automatic CI/CD and environment variable management"*- *"Designed mobile-first layout with hamburger sidebar, bottom nav, and floating action button"*

---

## 🗺️ Future Roadmap (v2)

- [ ] Income tracking & net savings
- [ ] Push notifications for over-budget warnings
- [ ] WhatsApp expense entry via Twilio
- [ ] Bank statement CSV import + auto-categorize
- [ ] Savings goals tracker
- [ ] Member spending leaderboard

---

## 📄 License

MIT — feel free to use for your own portfolio!

---

<div align="center">
  Built with ❤️ using Supabase + Groq + Vite + Claude 
  BY VEDANT 
</div>
