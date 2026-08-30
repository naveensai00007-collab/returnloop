# ReturnLoop

> **Never lose money to a missed return window.**

ReturnLoop is a high-conviction, consumer money-recovery tool built with **Next.js 14 (App Router)**, **TypeScript (Strict)**, **Supabase (PostgreSQL with RLS & Auth)**, **Tailwind CSS**, and **Zod**.

---

## 🎯 The Problem
Online shopping has inconsistent, fragmented return windows (14 to 90+ days). Receipts get buried in inboxes, and customers lose hundreds of dollars simply because return deadlines slip by. ReturnLoop captures purchases with near-zero friction, calculates exact deadlines, sends timely reminders, and tracks recovered funds.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: Next.js 14+ (App Router, Server Actions, API Routes)
- **Language**: TypeScript (Strict mode enabled, `noImplicitAny: true`, zero `any`)
- **Database & Storage**: Supabase Postgres (Strict Row Level Security) + Supabase Storage (`receipts`)
- **Authentication**: Supabase SSR Magic Link (passwordless, cookie-based session management)
- **Validation**: Zod schema validation on client forms and server endpoints
- **Styling & UI**: Tailwind CSS (Custom design system tokens) + Lucide React
- **AI Infrastructure**: OpenRouter / Groq Vision Models (for receipt parsing with mandatory human-in-the-loop review)
- **Email Delivery**: Resend (Idempotent cron-triggered deadline reminders)
- **Testing**: Node.js Test Runner / Unit test suite for date math, urgency sorting, and RLS rules

---

## 🔒 Security & Engineering Standards

- **Row Level Security (RLS)**: Every single table (`profiles`, `purchases`, `reminders`, `ai_extractions`) is guarded with strict RLS policies. User A can never query or mutate User B's data.
- **Service Role Isolation**: The Supabase service role key is strictly confined to server-side cron triggers and never exposed in browser bundles.
- **Date-Only Precision**: Deadlines use pure calendar date math (`YYYY-MM-DD`) to eliminate timezone drift and boundary edge cases.
- **No-Slop Design**: Built with quiet, trustworthy typography and visual restraint—no purple AI gradients, no fake metrics, no decorative noise.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/returnloop.git
cd returnloop
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your Supabase credentials:
```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENROUTER_API_KEY=
RESEND_API_KEY=
CRON_SECRET=your-random-cron-secret
```

### 4. Setup Database Schema
Execute [`DATABASE_SCHEMA.sql`](./DATABASE_SCHEMA.sql) in your Supabase SQL Editor.

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🧪 Testing
Run the test suite:
```bash
npm test
```

---

## 📄 License
MIT License. Built with precision and care.
