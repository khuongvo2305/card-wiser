-- Migration: Add sort_order to spending_categories
-- Run this in the Supabase SQL editor

ALTER TABLE public.spending_categories
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
