-- Migration: Create client_ad_fund_adjustments table for manual CRUD of unused ad funds & adjustments
CREATE TABLE IF NOT EXISTS public.client_ad_fund_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    year_month VARCHAR(7) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL DEFAULT 'manual_unused',
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_ad_fund_adjustments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'client_ad_fund_adjustments' AND policyname = 'Admins can view client ad fund adjustments'
    ) THEN
        CREATE POLICY "Admins can view client ad fund adjustments"
            ON public.client_ad_fund_adjustments FOR SELECT
            TO authenticated
            USING (is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'client_ad_fund_adjustments' AND policyname = 'Admins can insert client ad fund adjustments'
    ) THEN
        CREATE POLICY "Admins can insert client ad fund adjustments"
            ON public.client_ad_fund_adjustments FOR INSERT
            TO authenticated
            WITH CHECK (is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'client_ad_fund_adjustments' AND policyname = 'Admins can update client ad fund adjustments'
    ) THEN
        CREATE POLICY "Admins can update client ad fund adjustments"
            ON public.client_ad_fund_adjustments FOR UPDATE
            TO authenticated
            USING (is_admin())
            WITH CHECK (is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'client_ad_fund_adjustments' AND policyname = 'Admins can delete client ad fund adjustments'
    ) THEN
        CREATE POLICY "Admins can delete client ad fund adjustments"
            ON public.client_ad_fund_adjustments FOR DELETE
            TO authenticated
            USING (is_admin());
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ad_fund_adj_client_month 
    ON public.client_ad_fund_adjustments (client_id, year_month);
