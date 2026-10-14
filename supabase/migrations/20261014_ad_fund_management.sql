-- Migration: 20261014_ad_fund_management.sql
-- Ad Fund Management: Client ad configurations and transaction ledger restricted to Admins

-- 1. Add ad fund columns to public.clients if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'monthly_ad_fund'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN monthly_ad_fund NUMERIC NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'ad_platforms'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN ad_platforms TEXT[] NOT NULL DEFAULT ARRAY['meta']::TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'ad_fund_status'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN ad_fund_status TEXT NOT NULL DEFAULT 'active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'is_dm_client'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN is_dm_client BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Create ad_fund_transactions table
CREATE TABLE IF NOT EXISTS public.ad_fund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  platform TEXT NOT NULL DEFAULT 'meta' CHECK (platform IN ('meta', 'instagram', 'google_ads', 'other')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('company', 'personal')),
  payer_name TEXT NULL, -- Required if payment_type = 'personal'
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT NULL,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_ad_fund_transactions_client_id ON public.ad_fund_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_ad_fund_transactions_date ON public.ad_fund_transactions(transaction_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_ad_fund_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ad_fund_transactions_updated_at ON public.ad_fund_transactions;
CREATE TRIGGER set_ad_fund_transactions_updated_at
BEFORE UPDATE ON public.ad_fund_transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_ad_fund_updated_at();

-- 3. Row Level Security (RLS) - Admin ONLY access
ALTER TABLE public.ad_fund_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view ad fund transactions" ON public.ad_fund_transactions;
CREATE POLICY "Admins can view ad fund transactions"
ON public.ad_fund_transactions
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert ad fund transactions" ON public.ad_fund_transactions;
CREATE POLICY "Admins can insert ad fund transactions"
ON public.ad_fund_transactions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update ad fund transactions" ON public.ad_fund_transactions;
CREATE POLICY "Admins can update ad fund transactions"
ON public.ad_fund_transactions
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete ad fund transactions" ON public.ad_fund_transactions;
CREATE POLICY "Admins can delete ad fund transactions"
ON public.ad_fund_transactions
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 4. Set initial sample ad fund data for existing clients if monthly_ad_fund is all 0
DO $$
DECLARE
  v_admin_id UUID;
  v_visat_id UUID;
  v_lunespace_id UUID;
  v_nexdoor_id UUID;
  v_credtax_id UUID;
  v_alfa_id UUID;
  v_delicious_id UUID;
  v_client RECORD;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' AND active = true LIMIT 1;

  -- Configure known clients if found or active clients
  FOR v_client IN SELECT id, company_name FROM public.clients WHERE status = 'active' LIMIT 10 LOOP
    IF v_client.company_name ILIKE '%VISAT%' THEN
      UPDATE public.clients SET monthly_ad_fund = 50000, ad_platforms = ARRAY['meta', 'instagram'], ad_fund_status = 'active' WHERE id = v_client.id;
      v_visat_id := v_client.id;
    ELSIF v_client.company_name ILIKE '%LuneSpace%' THEN
      UPDATE public.clients SET monthly_ad_fund = 40000, ad_platforms = ARRAY['meta', 'google_ads'], ad_fund_status = 'active' WHERE id = v_client.id;
      v_lunespace_id := v_client.id;
    ELSIF v_client.company_name ILIKE '%NEXDOOR%' THEN
      UPDATE public.clients SET monthly_ad_fund = 20000, ad_platforms = ARRAY['meta'], ad_fund_status = 'active' WHERE id = v_client.id;
      v_nexdoor_id := v_client.id;
    ELSIF v_client.company_name ILIKE '%CredTax%' THEN
      UPDATE public.clients SET monthly_ad_fund = 15000, ad_platforms = ARRAY['meta'], ad_fund_status = 'paused' WHERE id = v_client.id;
      v_credtax_id := v_client.id;
    ELSIF v_client.company_name ILIKE '%ALFA%' THEN
      UPDATE public.clients SET monthly_ad_fund = 25000, ad_platforms = ARRAY['meta', 'google_ads'], ad_fund_status = 'active' WHERE id = v_client.id;
      v_alfa_id := v_client.id;
    ELSIF v_client.company_name ILIKE '%Delicious%' THEN
      UPDATE public.clients SET monthly_ad_fund = 15000, ad_platforms = ARRAY['meta'], ad_fund_status = 'low_fund' WHERE id = v_client.id;
      v_delicious_id := v_client.id;
    END IF;
  END LOOP;

  -- If those exact names weren't present, populate the first few active clients so the screen is immediately populated
  IF NOT EXISTS (SELECT 1 FROM public.clients WHERE monthly_ad_fund > 0) THEN
    UPDATE public.clients 
    SET monthly_ad_fund = CASE 
      WHEN row_num = 1 THEN 50000
      WHEN row_num = 2 THEN 40000
      WHEN row_num = 3 THEN 20000
      WHEN row_num = 4 THEN 15000
      WHEN row_num = 5 THEN 25000
      WHEN row_num = 6 THEN 30000
      WHEN row_num = 7 THEN 20000
      WHEN row_num = 8 THEN 15000
      WHEN row_num = 9 THEN 10000
      WHEN row_num = 10 THEN 20000
      ELSE 0 END,
    ad_platforms = CASE
      WHEN row_num IN (1, 10) THEN ARRAY['meta', 'instagram']
      WHEN row_num IN (2, 5) THEN ARRAY['meta', 'google_ads']
      ELSE ARRAY['meta'] END,
    ad_fund_status = CASE
      WHEN row_num = 4 THEN 'paused'
      WHEN row_num = 6 THEN 'pending'
      WHEN row_num = 8 THEN 'low_fund'
      ELSE 'active' END
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY company_name) as row_num 
      FROM public.clients 
      WHERE status = 'active'
    ) numbered
    WHERE public.clients.id = numbered.id AND numbered.row_num <= 10;
  END IF;
END $$;
