# Credit Card Manager — Personal Finance App

## What This Is
A personal credit card management app for tracking multiple credit cards, billing cycles, cashback/rewards, installments, transactions, and auto-syncing transaction data from Gmail bank notifications. Designed to be **mobile-first** — the primary use case is managing finances on the phone, with calendar sync and notification support.

## Core Value Proposition
- **Mobile usage**: user manages cards and finances primarily from their phone
- **Calendar sync**: statement dates, due dates, annual fees, installment payments synced to calendar
- **Notifications/reminders**: push/email reminders N days before due dates

## Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **Backend**: Supabase (PostgreSQL, Auth via Google OAuth, Edge Functions, Vault)
- **Charts**: Recharts
- **Forms**: react-hook-form + zod
- **Date utils**: date-fns
- **Package manager**: pnpm

## Project Structure
```
app/              # Next.js App Router pages
  (dashboard)/    # Dashboard layout group
  auth/           # Auth pages
components/       # React components
  ui/             # shadcn/ui primitives
  cards/          # Card-related components
  categories/     # Category components
  dashboard/      # Dashboard widgets
  installments/   # Installment components
  transactions/   # Transaction components
hooks/            # Custom React hooks
lib/              # Utilities, types, Supabase client
  supabase/       # Supabase client config
scripts/          # SQL migration scripts
```

## Key Conventions
- **Currency**: Vietnamese Dong (VND) — format as `100.000.000 ₫` (dots as thousand separator)
- **Date format**: `DD/MM/YYYY` (Vietnamese standard)
- **Language**: Vietnamese primary, English for technical terms
- **Theme**: dark mode default, light mode toggle
- **Mobile**: bottom tab nav on mobile, sidebar on desktop

## Database
7 tables in Supabase PostgreSQL: `profiles`, `cards`, `cashback_policies`, `installments`, `transactions`, `spending_categories`, `bank_email_templates`, `gmail_sync_logs`. All have RLS enabled — users can only access their own data. See `plan.md` section 3 for full schema.

## Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
```

## Build Phases (see plan.md section 10)
1. Foundation (schema, layout, auth)
2. Cards CRUD
3. Transactions & Categories
4. Dashboard & Smart Spend Guide
5. Calendar
6. Gmail Sync (Edge Functions + Claude API for email parsing)
