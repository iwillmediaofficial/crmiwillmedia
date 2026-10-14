-- Migration: 20261014_client_paid_and_collections.sql
-- Allow 'client' as payment_type in ad_fund_transactions
-- Create client_ad_fund_payments table for tracking daily/weekly/monthly fund releases by clients

ALTER TABLE public.ad_fund_transactions 
DROP CONSTRAINT IF EXISTS ad_fund_transactions_payment_type_check;

ALTER TABLE public.ad_fund_transactions 
ADD CONSTRAINT ad_fund_transactions_payment_type_check 
CHECK (payment_type IN ('company', 'personal', 'client'));

CREATE TABLE IF NOT EXISTS public.client_ad_fund_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  reference_no TEXT NULL,
  notes TEXT NULL,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_ad_fund_payments_client ON public.client_ad_fund_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_ad_fund_payments_date ON public.client_ad_fund_payments(payment_date);

ALTER TABLE public.client_ad_fund_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view client ad fund payments" ON public.client_ad_fund_payments;
CREATE POLICY "Admins can view client ad fund payments"
ON public.client_ad_fund_payments
FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert client ad fund payments" ON public.client_ad_fund_payments;
CREATE POLICY "Admins can insert client ad fund payments"
ON public.client_ad_fund_payments
FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update client ad fund payments" ON public.client_ad_fund_payments;
CREATE POLICY "Admins can update client ad fund payments"
ON public.client_ad_fund_payments
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete client ad fund payments" ON public.client_ad_fund_payments;
CREATE POLICY "Admins can delete client ad fund payments"
ON public.client_ad_fund_payments
FOR DELETE TO authenticated USING (public.is_admin());
