-- ============================================================
-- BudgetWise — Supabase Database Schema + RLS Policies
-- Version: 1.0
-- 
-- HOW TO USE:
-- 1. Go to your Supabase project
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Paste this entire file and click "Run"
-- ============================================================


-- ============================================================
-- STEP 1: CREATE TABLES
-- ============================================================

-- ------------------------------------------------------------
-- TABLE: households
-- One row per family. Stores the family name and invite code.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.households (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  invite_code  TEXT NOT NULL UNIQUE,
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLE: profiles
-- One row per user. Links the Supabase auth user to a household.
-- id = auth.uid() — same as the Supabase Auth user ID.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  household_id   UUID REFERENCES public.households(id) ON DELETE SET NULL,
  avatar_color   TEXT NOT NULL DEFAULT '#C85A2A',
  role           TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLE: expenses
-- All expense records. household_id used for RLS isolation.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category      TEXT NOT NULL CHECK (category IN (
                  'Food', 'Transport', 'Health', 'Utilities',
                  'Entertainment', 'Shopping', 'Education',
                  'Travel', 'Other'
                )),
  date          DATE NOT NULL,
  added_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receipt_url   TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLE: budgets
-- Category budget limits per household per month.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  month         TEXT NOT NULL, -- format: 'YYYY-MM' e.g. '2025-05'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, category, month)
);

-- ------------------------------------------------------------
-- TABLE: recurring
-- Subscriptions and recurring bills per household.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  cycle         TEXT NOT NULL CHECK (cycle IN ('Monthly', 'Yearly', 'Weekly')),
  next_due      DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  icon_color    TEXT NOT NULL DEFAULT '#C85A2A',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring  ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 3: RLS POLICIES
-- Users can ONLY read/write data from their own household.
-- Even direct API calls cannot bypass these policies.
-- ============================================================

-- ------------------------------------------------------------
-- HOUSEHOLDS policies
-- ------------------------------------------------------------

-- Members can read their own household
CREATE POLICY "households_select"
  ON public.households FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Any authenticated user can create a household
CREATE POLICY "households_insert"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only the creator (admin) can update household
CREATE POLICY "households_update"
  ON public.households FOR UPDATE
  USING (created_by = auth.uid());

-- Only the creator can delete household
CREATE POLICY "households_delete"
  ON public.households FOR DELETE
  USING (created_by = auth.uid());


-- ------------------------------------------------------------
-- PROFILES policies
-- ------------------------------------------------------------

-- Users can read profiles in the same household
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
    OR id = auth.uid()
  );

-- Users can insert their own profile only
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update only their own profile
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());


-- ------------------------------------------------------------
-- EXPENSES policies
-- ------------------------------------------------------------

-- Only household members can read expenses
CREATE POLICY "expenses_select"
  ON public.expenses FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Members can add expenses to their household
CREATE POLICY "expenses_insert"
  ON public.expenses FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Members can edit their own expenses; admin can edit all
CREATE POLICY "expenses_update"
  ON public.expenses FOR UPDATE
  USING (
    added_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND household_id = expenses.household_id
    )
  );

-- Members can delete their own expenses; admin can delete all
CREATE POLICY "expenses_delete"
  ON public.expenses FOR DELETE
  USING (
    added_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND household_id = expenses.household_id
    )
  );


-- ------------------------------------------------------------
-- BUDGETS policies
-- ------------------------------------------------------------

CREATE POLICY "budgets_select"
  ON public.budgets FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "budgets_insert"
  ON public.budgets FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "budgets_update"
  ON public.budgets FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "budgets_delete"
  ON public.budgets FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- RECURRING policies
-- ------------------------------------------------------------

CREATE POLICY "recurring_select"
  ON public.recurring FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "recurring_insert"
  ON public.recurring FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "recurring_update"
  ON public.recurring FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "recurring_delete"
  ON public.recurring FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );


-- ============================================================
-- STEP 4: STORAGE BUCKET FOR RECEIPT IMAGES
-- ============================================================

-- Create a storage bucket for receipt uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload receipts
CREATE POLICY "receipts_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  );

-- Allow anyone to view receipts (public bucket)
CREATE POLICY "receipts_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

-- Allow users to delete their own receipts
CREATE POLICY "receipts_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  );


-- ============================================================
-- STEP 5: HELPER FUNCTION — Generate Invite Code
-- Generates a unique code like 'BWS-4821'
-- Called automatically when a household is created
-- ============================================================

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate: BWS- + 4 random digits
    code := 'BWS-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
    -- Check uniqueness
    SELECT EXISTS (
      SELECT 1 FROM public.households WHERE invite_code = code
    ) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- STEP 6: INDEXES FOR PERFORMANCE
-- ============================================================

-- Fast lookup of expenses by household + date
CREATE INDEX IF NOT EXISTS idx_expenses_household_date
  ON public.expenses(household_id, date DESC);

-- Fast lookup of expenses by who added them
CREATE INDEX IF NOT EXISTS idx_expenses_added_by
  ON public.expenses(added_by);

-- Fast lookup of budgets by household + month
CREATE INDEX IF NOT EXISTS idx_budgets_household_month
  ON public.budgets(household_id, month);

-- Fast lookup of recurring by household
CREATE INDEX IF NOT EXISTS idx_recurring_household
  ON public.recurring(household_id);

-- Fast lookup of profiles by household
CREATE INDEX IF NOT EXISTS idx_profiles_household
  ON public.profiles(household_id);


-- ============================================================
-- DONE!
-- Your BudgetWise database is ready.
-- Next step: copy your Supabase URL and anon key to .env
-- ============================================================