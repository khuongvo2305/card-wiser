-- Credit Card Manager Database Schema
-- Tables: profiles, cards, cashback_policies, installments, transactions, spending_categories, bank_email_templates, gmail_sync_logs

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  default_currency TEXT DEFAULT 'VND',
  gmail_connected BOOLEAN DEFAULT FALSE,
  gmail_refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 2. Cards table
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  card_name TEXT NOT NULL,
  last_four_digits TEXT,
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  available_credit NUMERIC DEFAULT 0,
  statement_date INTEGER,
  due_date INTEGER,
  billing_cycle_start INTEGER,
  billing_cycle_end INTEGER,
  issue_date DATE,
  expiry_date DATE,
  annual_fee_amount NUMERIC DEFAULT 0,
  annual_fee_month INTEGER,
  annual_fee_waiver_condition TEXT,
  card_color TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cards_select_own" ON public.cards FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "cards_insert_own" ON public.cards FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "cards_update_own" ON public.cards FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "cards_delete_own" ON public.cards FOR DELETE USING (user_id = auth.uid());

-- 3. Spending Categories table (defined before cashback_policies/transactions that reference it)
CREATE TABLE IF NOT EXISTS public.spending_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  budget_limit NUMERIC,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.spending_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spending_categories_select_own" ON public.spending_categories FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "spending_categories_insert_own" ON public.spending_categories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "spending_categories_update_own" ON public.spending_categories FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "spending_categories_delete_own" ON public.spending_categories FOR DELETE USING (user_id = auth.uid());

-- 4. Cashback Policies table
CREATE TABLE IF NOT EXISTS public.cashback_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.spending_categories(id),
  category_name TEXT,
  cashback_percentage NUMERIC NOT NULL,
  cap_amount NUMERIC,
  min_spend NUMERIC,
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cashback_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cashback_policies_select_own" ON public.cashback_policies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = cashback_policies.card_id AND cards.user_id = auth.uid())
  );
CREATE POLICY "cashback_policies_insert_own" ON public.cashback_policies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = cashback_policies.card_id AND cards.user_id = auth.uid())
  );
CREATE POLICY "cashback_policies_update_own" ON public.cashback_policies
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = cashback_policies.card_id AND cards.user_id = auth.uid())
  );
CREATE POLICY "cashback_policies_delete_own" ON public.cashback_policies
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = cashback_policies.card_id AND cards.user_id = auth.uid())
  );

-- 5. Installments table
CREATE TABLE IF NOT EXISTS public.installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_amount NUMERIC NOT NULL DEFAULT 0,
  total_months INTEGER NOT NULL,
  monthly_payment NUMERIC NOT NULL DEFAULT 0,
  interest_rate NUMERIC NOT NULL DEFAULT 0,
  remaining_months INTEGER NOT NULL,
  remaining_balance NUMERIC NOT NULL DEFAULT 0,
  merchant_name TEXT,
  description TEXT,
  start_date DATE NOT NULL,
  next_payment_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "installments_select_own" ON public.installments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = installments.card_id AND cards.user_id = auth.uid())
  );
CREATE POLICY "installments_insert_own" ON public.installments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = installments.card_id AND cards.user_id = auth.uid())
  );
CREATE POLICY "installments_update_own" ON public.installments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = installments.card_id AND cards.user_id = auth.uid())
  );
CREATE POLICY "installments_delete_own" ON public.installments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = installments.card_id AND cards.user_id = auth.uid())
  );

-- 6. Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.spending_categories(id),
  amount NUMERIC NOT NULL,
  merchant_name TEXT,
  description TEXT,
  transaction_date DATE NOT NULL,
  transaction_time TIME,
  is_installment BOOLEAN DEFAULT FALSE,
  installment_id UUID REFERENCES public.installments(id),
  cashback_earned NUMERIC DEFAULT 0,
  source TEXT DEFAULT 'manual',
  email_message_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = transactions.card_id AND cards.user_id = auth.uid())
  );
CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = transactions.card_id AND cards.user_id = auth.uid())
  );
CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = transactions.card_id AND cards.user_id = auth.uid())
  );
CREATE POLICY "transactions_delete_own" ON public.transactions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.cards WHERE cards.id = transactions.card_id AND cards.user_id = auth.uid())
  );

-- 7. Bank Email Templates table
CREATE TABLE IF NOT EXISTS public.bank_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  sender_email TEXT,
  subject_pattern TEXT,
  amount_regex TEXT,
  merchant_regex TEXT,
  date_regex TEXT,
  card_regex TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bank_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_email_templates_select_own" ON public.bank_email_templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "bank_email_templates_insert_own" ON public.bank_email_templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bank_email_templates_update_own" ON public.bank_email_templates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "bank_email_templates_delete_own" ON public.bank_email_templates FOR DELETE USING (user_id = auth.uid());

-- 8. Gmail Sync Logs table
CREATE TABLE IF NOT EXISTS public.gmail_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMPTZ DEFAULT now(),
  sync_completed_at TIMESTAMPTZ,
  emails_processed INTEGER DEFAULT 0,
  transactions_created INTEGER DEFAULT 0,
  errors TEXT[],
  status TEXT DEFAULT 'pending'
);

ALTER TABLE public.gmail_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gmail_sync_logs_select_own" ON public.gmail_sync_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "gmail_sync_logs_insert_own" ON public.gmail_sync_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "gmail_sync_logs_update_own" ON public.gmail_sync_logs FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "gmail_sync_logs_delete_own" ON public.gmail_sync_logs FOR DELETE USING (user_id = auth.uid());

-- Trigger function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
