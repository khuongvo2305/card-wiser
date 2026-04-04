export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  default_currency: string
  gmail_connected: boolean
  gmail_refresh_token: string | null
  last_gmail_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  user_id: string
  card_name: string
  bank_name: string
  last_four_digits: string | null
  credit_limit: number
  current_balance: number
  available_credit: number
  statement_date: number
  due_date: number
  issue_date: string | null
  expiry_date: string | null
  annual_fee_amount: number
  annual_fee_month: number | null
  annual_fee_waiver_condition: string | null
  card_color: string
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SpendingCategory {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  budget_limit: number | null
  is_system: boolean
  created_at: string
}

export interface CashbackPolicy {
  id: string
  card_id: string
  user_id: string
  category_id: string | null
  category_name: string | null
  cashback_percentage: number
  cap_amount: number | null
  min_spend: number | null
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  notes: string | null
  created_at: string
}

export interface Transaction {
  id: string
  card_id: string
  user_id: string
  category_id: string | null
  amount: number
  merchant_name: string | null
  description: string | null
  transaction_date: string
  transaction_time: string | null
  is_installment: boolean
  installment_id: string | null
  source: 'manual' | 'email' | 'import'
  status: 'pending_review' | 'confirmed' | 'rejected'
  email_message_id: string | null
  cashback_earned: number
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  card?: Card
  category?: SpendingCategory
}

export interface Installment {
  id: string
  card_id: string
  user_id: string
  original_amount: number
  total_months: number
  monthly_payment: number
  interest_rate: number
  remaining_months: number
  remaining_balance: number
  merchant_name: string | null
  description: string | null
  start_date: string
  next_payment_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields
  card?: Card
}

export interface BankEmailTemplate {
  id: string
  user_id: string
  bank_name: string
  sender_email: string
  subject_pattern: string | null
  amount_regex: string | null
  merchant_regex: string | null
  date_regex: string | null
  card_regex: string | null
  is_active: boolean
  created_at: string
}

export interface GmailSyncLog {
  id: string
  user_id: string
  sync_started_at: string
  sync_completed_at: string | null
  emails_processed: number
  transactions_created: number
  errors: string[] | null
  status: 'pending' | 'running' | 'completed' | 'failed'
}

// Dashboard summary types
export interface CardSummary {
  card: Card
  upcomingDueDate: Date | null
  daysUntilDue: number | null
  utilizationPercent: number
  urgencyLevel: 'critical' | 'warning' | 'normal'
}

export interface SpendingSummary {
  totalSpent: number
  totalCashback: number
  categoryBreakdown: {
    category: SpendingCategory | null
    amount: number
    percentage: number
  }[]
  dailySpending: {
    date: string
    amount: number
  }[]
}

export interface SmartSpendRecommendation {
  card: Card
  category: SpendingCategory | null
  cashbackPolicy: CashbackPolicy
  reason: string
}
