# Credit Card Manager — Personal Finance App
## Complete Product Specification for Lovable

---

## 1. Overview

A personal credit card management app to track multiple credit cards, their billing cycles, cashback/reward policies, installments, transactions, and auto-sync transaction data from Gmail bank notifications.

**Tech Stack (Lovable default):** React + TypeScript + Tailwind CSS + Supabase (PostgreSQL, Auth, Edge Functions, Storage)

**Auth:** Google OAuth (required for Gmail integration)

---

## 2. User Stories

### Cards
- As a user, I can add/edit/delete credit cards with full details (bank, card name, network, credit limit, statement date, due date, expiry, annual fee info)
- As a user, I can view all my cards in a dashboard with key metrics (total limit, total balance, available credit)
- As a user, I can see each card's detail page with all related data (cashback policies, installments, transactions)

### Cashback & Reward Policies
- As a user, I can add/edit/delete multiple cashback policies per card
- Each policy has: spending category, cashback %, monthly cap, minimum spend condition, and notes
- As a user, I can view a "Smart Spend Guide" that suggests which card to use for each spending category to maximize cashback

### Installments
- As a user, I can add/edit/delete installment plans per card
- Each installment has: description, monthly amount, total months, remaining months, start date
- Dashboard shows total monthly installment obligations across all cards

### Transactions
- As a user, I can manually add/edit/delete transactions
- Each transaction has: card, amount, merchant, category, date, note
- As a user, I can view transactions filtered by card, category, date range
- As a user, I can see monthly spending breakdown by card and by category

### Gmail Sync
- As a user, I can connect my Gmail account via Google OAuth
- The app scans emails from bank senders and parses transaction data
- Parsed transactions appear in a "Review" queue where I can confirm/edit/reject before saving
- As a user, I can configure email parsing templates per bank (sender email, parsing rules)
- As a user, I can trigger manual sync or set auto-sync interval

### Calendar & Reminders
- As a user, I can see a calendar view showing: statement dates, payment due dates, annual fee dates, installment payments
- As a user, I can enable push/email reminders N days before due dates
- Optional: sync reminders to Google Calendar

### Settings
- As a user, I can manage spending categories (add/edit/delete)
- As a user, I can set default currency (VND)
- As a user, I can export data to CSV

---

## 3. Database Schema (Supabase PostgreSQL)

### `profiles`
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id)
email TEXT
display_name TEXT
default_currency TEXT DEFAULT 'VND'
gmail_connected BOOLEAN DEFAULT FALSE
gmail_refresh_token TEXT -- encrypted
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

### `cards`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
bank_name TEXT NOT NULL
card_name TEXT NOT NULL
card_network TEXT -- 'JCB', 'Visa', 'Mastercard', etc.
credit_limit NUMERIC NOT NULL DEFAULT 0
current_balance NUMERIC DEFAULT 0
statement_day INTEGER -- day of month (1-31)
due_day INTEGER -- day of month (1-31)
expiry_date DATE
annual_fee_amount NUMERIC DEFAULT 0
annual_fee_month INTEGER -- month when fee is charged (1-12)
annual_fee_waiver_condition TEXT
card_color TEXT -- for UI display
notes TEXT
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

### `cashback_policies`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
card_id UUID REFERENCES cards(id) ON DELETE CASCADE
category TEXT NOT NULL -- references spending_categories or free text
cashback_percentage NUMERIC NOT NULL -- e.g. 1.5 for 1.5%
monthly_cap NUMERIC -- max cashback per month, NULL = unlimited
min_spend NUMERIC -- minimum spend to qualify, NULL = none
conditions TEXT -- other conditions
valid_from DATE
valid_to DATE -- NULL = ongoing
notes TEXT
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

### `installments`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
card_id UUID REFERENCES cards(id) ON DELETE CASCADE
description TEXT NOT NULL
monthly_amount NUMERIC NOT NULL
total_months INTEGER NOT NULL
remaining_months INTEGER NOT NULL
start_date DATE NOT NULL
notes TEXT
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

### `transactions`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
card_id UUID REFERENCES cards(id) ON DELETE CASCADE
amount NUMERIC NOT NULL
merchant TEXT
category TEXT
transaction_date DATE NOT NULL
description TEXT
cashback_earned NUMERIC DEFAULT 0
source TEXT DEFAULT 'manual' -- 'manual', 'gmail_sync'
gmail_message_id TEXT -- for dedup
status TEXT DEFAULT 'confirmed' -- 'pending_review', 'confirmed', 'rejected'
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

### `spending_categories`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
name TEXT NOT NULL
icon TEXT -- emoji or icon name
color TEXT
sort_order INTEGER DEFAULT 0
created_at TIMESTAMPTZ DEFAULT now()
```

### `bank_email_templates`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
bank_name TEXT NOT NULL
sender_emails TEXT[] -- array of possible sender emails
subject_patterns TEXT[] -- patterns to match email subjects
parsing_method TEXT DEFAULT 'llm' -- 'regex', 'llm'
regex_patterns JSONB -- {amount: "regex", merchant: "regex", date: "regex"}
sample_email TEXT -- for LLM context
is_active BOOLEAN DEFAULT TRUE
notes TEXT
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

### `gmail_sync_logs`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
synced_at TIMESTAMPTZ DEFAULT now()
emails_scanned INTEGER DEFAULT 0
transactions_created INTEGER DEFAULT 0
transactions_pending INTEGER DEFAULT 0
errors JSONB
status TEXT -- 'success', 'partial', 'failed'
```

### Row Level Security (RLS)
All tables must have RLS enabled. Policy: users can only access their own data (`user_id = auth.uid()` or via card ownership chain).

---

## 4. Pages & Navigation

### Sidebar Navigation
```
📊 Dashboard
💳 Cards
📝 Transactions
📧 Gmail Sync
📅 Calendar
💰 Smart Spend Guide
⚙️ Settings
```

### Page Details

#### 4.1 Dashboard (`/`)
- **Total Credit Summary**: total limit, total balance, total available, utilization %
- **Cards Overview**: grid of card widgets showing bank, name, balance/limit, next due date with color-coded urgency (green >7 days, yellow 3-7 days, red <3 days)
- **Monthly Spending Chart**: bar chart by category (current month)
- **Upcoming Payments**: next 7 days — due dates, installment payments, annual fees
- **Monthly Installment Total**: sum of all active installment monthly amounts
- **Recent Transactions**: last 10 transactions across all cards

#### 4.2 Cards (`/cards`)
- **List View**: all cards with key info, toggle active/inactive
- **Add Card** (`/cards/new`): form with all card fields
- **Card Detail** (`/cards/:id`): tabbed interface
  - **Info Tab**: card details, edit button
  - **Cashback Tab**: list of cashback policies, add/edit/delete
  - **Installments Tab**: list of installments, add/edit/delete, progress bars
  - **Transactions Tab**: filtered transactions for this card
  - **Stats Tab**: monthly spending chart, cashback earned, category breakdown

#### 4.3 Transactions (`/transactions`)
- **Table View**: sortable, filterable (by card, category, date range, source, status)
- **Add Transaction**: modal form
- **Pending Review Queue**: transactions from Gmail sync awaiting confirmation
- **Bulk Actions**: confirm all, reject selected
- **Monthly Summary**: collapsible section with totals by card and category

#### 4.4 Gmail Sync (`/gmail-sync`)
- **Connection Status**: connected/disconnected, connect button (Google OAuth)
- **Bank Templates**: list of configured bank email templates
  - Add/edit template: sender email, subject patterns, parsing method (regex/LLM), sample email
- **Sync Controls**: manual sync button, last sync time
- **Sync History**: log of past syncs with stats (emails scanned, transactions created, errors)
- **Preview & Test**: paste an email to test parsing before saving template

#### 4.5 Calendar (`/calendar`)
- **Monthly Calendar View**: visual calendar with event dots
  - 🔵 Statement dates
  - 🔴 Payment due dates
  - 🟡 Annual fee dates
  - 🟢 Installment payment dates
- **List View Toggle**: chronological list of upcoming events
- **Click event**: shows detail card with amount, card info, action button

#### 4.6 Smart Spend Guide (`/smart-spend`)
- **Category List**: for each spending category, show the best card to use
  - Shows: recommended card, cashback %, conditions, monthly cap remaining
- **Comparison Table**: all cards × all categories matrix showing cashback rates
- **Logic**: rank by cashback % → then by remaining monthly cap → then by conditions

#### 4.7 Settings (`/settings`)
- **Profile**: display name, email
- **Spending Categories**: CRUD list with icon and color picker
- **Default Categories Seed**: on first use, pre-populate common categories (Dining, Shopping, Online, Transport, Groceries, Bills, Healthcare, Education, Travel, Entertainment, Other)
- **Data Export**: download all data as CSV (cards, transactions, policies)
- **Danger Zone**: delete all data

---

## 5. Gmail Sync — Technical Design

### 5.1 OAuth Flow
1. User clicks "Connect Gmail" → Google OAuth consent screen
2. Request scopes: `gmail.readonly`
3. Store refresh token in `profiles.gmail_refresh_token` (encrypted via Supabase Vault)
4. Use refresh token to get access tokens for Gmail API calls

### 5.2 Sync Flow (Supabase Edge Function)
```
1. Get user's bank_email_templates
2. For each template, build Gmail search query:
   - from:{sender_emails} after:{last_sync_date}
3. Fetch matching emails via Gmail API
4. For each email:
   a. Check gmail_message_id not already in transactions (dedup)
   b. Parse email body:
      - If parsing_method = 'regex': apply regex_patterns
      - If parsing_method = 'llm': call Claude API with email body + instructions
   c. Extract: amount, merchant, date, card (match by bank_name)
   d. Create transaction with status = 'pending_review'
5. Log results to gmail_sync_logs
```

### 5.3 LLM Parsing Prompt (Claude API via Edge Function)
```
Extract transaction details from this bank notification email.
Return JSON: { amount: number, merchant: string, date: "YYYY-MM-DD", card_last_four: string, type: "purchase" | "payment" | "refund" }
If not a transaction email, return: { type: "not_transaction" }

Email body:
{email_content}
```

### 5.4 Edge Functions Needed
- `gmail-sync`: main sync function (triggered manually or by cron)
- `gmail-callback`: OAuth callback handler
- `parse-email`: LLM-based email parsing

---

## 6. UI/UX Guidelines

### Design System
- **Theme**: dark mode default, light mode toggle
- **Colors**: each card gets a distinct color (user-selectable or auto-assigned)
- **Typography**: clean, readable, Vietnamese-friendly font (Inter or Noto Sans)
- **Currency Format**: Vietnamese format — `100.000.000 ₫` (dots as thousand separator)
- **Date Format**: `DD/MM/YYYY` (Vietnamese standard)
- **Language**: Vietnamese primary, English labels for technical terms

### Responsive
- Desktop: sidebar navigation
- Mobile: bottom tab navigation, card stacks instead of grids

### Key UX Patterns
- **Card Widgets**: rounded cards with bank logo/color, show balance bar (used/available)
- **Due Date Urgency**: color-coded badges (red/yellow/green) based on days remaining
- **Quick Actions**: FAB (floating action button) on mobile for "Add Transaction"
- **Empty States**: friendly illustrations + CTA when no cards/transactions exist
- **Loading States**: skeleton screens, not spinners
- **Toast Notifications**: for CRUD confirmations
- **Confirmation Dialogs**: for delete actions

---

## 7. Supabase Configuration

### Auth
- Enable Google OAuth provider
- Configure redirect URLs

### RLS Policies (apply to all tables)
```sql
-- Example for cards table
CREATE POLICY "Users can view own cards"
ON cards FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cards"
ON cards FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cards"
ON cards FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own cards"
ON cards FOR DELETE USING (user_id = auth.uid());
```

### Edge Functions
- Deploy 3 edge functions for Gmail sync
- Set up Supabase Vault for storing encrypted Gmail tokens
- Optional: Supabase Cron for auto-sync (e.g., every 6 hours)

### Realtime (optional)
- Enable realtime on `transactions` table for live updates during sync

---

## 8. Seed Data & Defaults

On first login, auto-create:
- Default spending categories (11 categories listed in Settings section)
- Sample bank email templates for popular Vietnamese banks:
  - LPBank (sender patterns)
  - UOB Vietnam
  - BIDV
  - MSB
  - Sacombank
  
  *(Templates are pre-configured but editable — NOT hardcoded. User can modify/delete/add.)*

---

## 9. Future Enhancements (Post-MVP)

- Push notifications (web + mobile PWA)
- Google Calendar sync for due dates
- Multi-currency support
- Bank account & savings tracking
- Investment portfolio tracking
- Monthly financial report (auto-generated)
- Budget planning per category
- Recurring transaction detection
- OCR receipt scanning
- PWA for mobile install

---

## 10. Lovable Prompt Strategy

### Recommended approach: build in phases

**Phase 1 — Foundation:**
> Build a credit card management app with Google auth. Create the database schema with tables: profiles, cards, cashback_policies, installments, transactions, spending_categories, bank_email_templates, gmail_sync_logs. Enable RLS on all tables. Create a sidebar layout with pages: Dashboard, Cards, Transactions, Gmail Sync, Calendar, Smart Spend Guide, Settings. Use dark mode, Vietnamese currency format (dots separator + ₫), and DD/MM/YYYY dates.

**Phase 2 — Cards CRUD:**
> Build the Cards page: list all cards as visual card widgets showing bank name, card name, network badge, balance/limit bar, next due date with color-coded urgency. Add/edit/delete cards with all fields. Card detail page with tabs: Info, Cashback Policies, Installments, Transactions, Stats. Each tab has its own CRUD.

**Phase 3 — Transactions & Categories:**
> Build Transactions page with a data table (sortable, filterable by card, category, date range, status). Add transaction modal. Pending review queue section for Gmail-synced transactions. Settings page with spending categories CRUD (icon + color picker). Seed 11 default categories on first login.

**Phase 4 — Dashboard & Smart Spend:**
> Build Dashboard with: total credit summary cards, card overview grid, monthly spending bar chart (by category using Recharts), upcoming payments list (next 7 days), recent transactions. Build Smart Spend Guide: for each category show best card by cashback %, comparison matrix table.

**Phase 5 — Calendar:**
> Build Calendar page with monthly view. Show dots for: statement dates (blue), due dates (red), annual fee dates (yellow), installment dates (green). Click to see event detail. List view toggle.

**Phase 6 — Gmail Sync:**
> Build Gmail Sync page. Google OAuth connection flow. Bank email templates CRUD. Manual sync trigger. Sync history log. Create Supabase Edge Functions for: gmail-callback, gmail-sync, parse-email. Use Claude API for LLM-based email parsing in edge function.

---

## 11. Non-Functional Requirements

- **Performance**: dashboard loads < 2s, transaction list pagination (50 per page)
- **Security**: RLS on all tables, encrypted Gmail tokens, no sensitive data in client
- **Data Integrity**: dedup Gmail transactions by message_id, optimistic UI updates
- **Accessibility**: proper ARIA labels, keyboard navigation
- **Mobile**: fully responsive, PWA-ready