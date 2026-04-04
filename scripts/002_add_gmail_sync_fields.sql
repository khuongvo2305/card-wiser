-- Migration: Add Gmail sync fields
-- Run this in the Supabase SQL editor

-- 1. Add status column to transactions (default 'confirmed' for existing rows)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';

-- 2. Add last_gmail_sync_at to profiles for tracking sync cursor
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_gmail_sync_at TIMESTAMPTZ;

-- 3. Unique index on email_message_id to prevent duplicate Gmail imports
CREATE UNIQUE INDEX IF NOT EXISTS transactions_email_message_id_unique
  ON public.transactions (email_message_id)
  WHERE email_message_id IS NOT NULL;
