# 🏠 BudgetWise — Family Expense Tracker

> **AI-powered family expense tracking app** with real-time sync, receipt scanning, and smart financial advice.

[![Live App](https://img.shields.io/badge/Live%20App-Launch-C85A2A?style=for-the-badge)](https://budgetwise-zys3.vercel.app)
[![Built with Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Powered by Groq](https://img.shields.io/badge/AI-Groq-F55036?style=for-the-badge)](https://groq.com)
[![Powered by Claude](https://img.shields.io/badge/AI-Claude-D97757?style=for-the-badge)](https://claude.ai)
[![Hosted on Vercel](https://img.shields.io/badge/Hosted-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)

---

## 📸 Screenshots

> Dashboard · Expenses · Analytics · Calendar · AI Advisor · Mobile

<!-- Add screenshots here after deployment -->

---

## ✨ Features

### Core
- **Multi-member families** — Create a family workspace or join one with an invite code (e.g. `BWS-4821`)
- **Real-time member sync** — Member count and expenses update live across all devices via Supabase Realtime
- **Expense tracking** — Add, edit, delete with search, filter by category/member/month, and pagination
- **Optimistic UI** — Changes appear instantly, roll back automatically on failure

### AI Features (Groq API)
- **AI Financial Advisor** — Chat with Llama 3.3 70B using your real expense data as context
- **Receipt Scanner** — Upload a photo → Groq Vision reads it → auto-fills the expense form
- **Personalized insights** — Ask "Where am I overspending?" and get data-aware answers
- **Suggested prompts** — Quick-start chips for common financial questions

### Analytics & Budgets
- **Dashboard** — KPI cards (monthly spend, daily average, budget used, recurring), daily spending chart with recent expenses, budget overview, category donut
- **Analytics** — 4 charts: category breakdown, monthly trend, spending distribution, top spending days + summary stats (total transactions, average, largest expense, top category, top spender)
- **Budget tracking** — Set limits per category, visual progress bars, over-budget warnings
- **Recurring bills** — Manage subscriptions with status (active/paused), cycle, next due date
- **Calendar view** — See daily spending in a monthly grid, click any day for expense detail
- **PDF + CSV export** — Full monthly report with charts embedded

### UX & Mobile
- **Mobile-first responsive** — Hamburger sidebar, bottom nav bar, floating action button
- **Dark mode** — Fully functional, persisted in localStorage
- **Loading skeletons** — Animated shimmer placeholders while data loads
- **Toast notifications** — Success/error/undo feedback on all actions
- **Voice assistant** — Navigate tabs by voice (Web Speech API)

### Security
- **Row Level Security (RLS)** — Supabase RLS policies enforce household-level data isolation
- **Households table** — Open SELECT policy so invite code lookup works for authenticated users
- **Profiles table** — Members can view all profiles in their own household; users always see their own profile
- **Safe key management** — Supabase keys in `.env` (gitignored), Groq key stored in localStorage only

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
- A [Groq](https://console.groq.com) API key (free, needed for AI features)

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
5. Run these RLS policies in SQL Editor:

```sql
-- Allow authenticated users to look up households by invite code
CREATE POLICY "Allow invite code lookup"
ON households FOR SELECT
USING (true);

-- Allow members to see profiles in their household
CREATE POLICY "Members can view household profiles"
ON profiles FOR SELECT
USING (
  id = auth.uid()
  OR
  household_id = (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  )
);

-- Enable realtime on profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

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

> **Note:** The AI Advisor and Receipt Scanner features require a Groq API key. All other features work without it.

---

## 📁 Project Structure

```
budgetwise/
├── index.html                  ← Login / Signup / Join Family page
├── app.html                    ← Main application shell
├── schema.sql                  ← Supabase DB + RLS setup
├── .env.example                ← Environment template
├── vite.config.js              ← Multi-page Vite config
│
├── css/                        ← 11 CSS files (no framework)
│   ├── design-system.css       ← Variables, dark mode, skeletons
│   ├── layout.css              ← Sidebar, topbar, mobile nav
│   ├── components.css          ← Cards, modals, toasts, forms
│   ├── dashboard.css           ← KPI cards, charts, recent expenses
│   ├── expenses.css            ← Table, filters, pagination
│   ├── analytics.css           ← 4 charts + summary stats
│   ├── budget.css              ← Category progress bars
│   ├── calendar.css            ← Monthly grid + day detail
│   ├── recurring.css           ← Subscriptions table
│   ├── ai-chat.css             ← Chat bubbles, input bar
│   └── auth.css                ← Login/signup + family setup
│
└── js/                         ← 20 JS modules
    ├── app.js                  ← Bootstrap entry point + shell render
    ├── supabase.js             ← DB operations + Realtime
    ├── store.js                ← Global state + optimistic UI helpers
    ├── router.js               ← Tab navigation + mobile nav
    ├── config.js               ← Environment config
    ├── utils.js                ← Formatting, helpers, categories
    ├── charts.js               ← Chart.js wrappers
    ├── ai-chat.js              ← Groq AI advisor
    ├── receipt.js              ← Groq Vision scanner
    ├── export.js               ← PDF + CSV export
    ├── voice.js                ← Web Speech API navigation
    └── views/                  ← One file per tab
        ├── dashboard.js        ← KPI + charts + recent expenses
        ├── expenses.js         ← Full CRUD expense table
        ├── calendar.js         ← Monthly calendar + day detail
        ├── analytics.js        ← 4 charts + stats summary
        ├── budget.js           ← Category budget management
        └── recurring.js        ← Subscription management
```

---

## 🌐 Deployment

### Vercel Deployment

1. Push to GitHub:
```bash
git add .
git commit -m "feat: initial BudgetWise deployment"
git push origin main
```

2. Import the repository into [Vercel](https://vercel.com)

3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Deploy — Vercel auto-detects Vite and builds correctly

**Live URL:** `budgetwise-zys3.vercel.app`

---

## 👨‍👩‍👧 How Families Use It

1. One person **signs up** and creates a family workspace — gets an invite code
2. BudgetWise generates an **invite code** (e.g. `BWS-2512`)
3. Other family members sign up and click **Join Family** → enter the code
4. Everyone sees the **same expenses in real time** — member count updates live
5. Each member can add, edit, or delete expenses; all changes sync instantly

---

## 🔒 Security

- **RLS policies** on `expenses`, `budgets`, `recurring` — users only access their household's data
- **Households** — open SELECT so invite code lookup works; INSERT is restricted to authenticated users
- **Profiles** — members can read all profiles in their household; isolated from other households
- **Supabase anon key** is safe to expose — RLS enforces access control at the database level
- **Groq API key** is stored in `localStorage` only — never in code or environment variables
- **`.env` is gitignored** — Supabase secrets never reach GitHub

---

## 🤖 Interview Talking Points

- *"Implemented Supabase Row Level Security — database-level household isolation that cannot be bypassed even with direct API calls"*
- *"Built real-time cross-device sync using Supabase Realtime — expenses and member count update live without polling"*
- *"Integrated Groq Vision (llama-4-scout) for receipt scanning — base64 encoded image → API → auto-fill expense form"*
- *"Used optimistic UI — expenses appear instantly before DB confirmation, with automatic rollback on failure"*
- *"Built PDF export using jsPDF — captures Chart.js canvas as images and assembles a formatted monthly report"*
- *"Deployed production build on Vercel with automatic CI/CD and environment variable management"*
- *"Designed mobile-first layout with hamburger sidebar, bottom nav, and floating action button"*
- *"Debugged and fixed complex RLS permission issues — households needed open SELECT for invite code lookup, profiles needed a self-OR-household policy to allow both login and member visibility"*

---

## 🗺️ Future Roadmap (v2)

- [ ] Income tracking & net savings
- [ ] Push notifications for over-budget warnings
- [ ] WhatsApp expense entry via Twilio
- [ ] Bank statement CSV import + auto-categorize
- [ ] Savings goals tracker
- [ ] Member spending leaderboard
- [ ] Multi-currency support

---

## 📄 License

MIT — feel free to use for your own portfolio!

---

<div align="center">
  Built with ❤️ using Supabase + Groq + Vite + Claude
  <br/>
  BY VEDANT
</div>