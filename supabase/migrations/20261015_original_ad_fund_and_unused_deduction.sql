-- Migration: 20261015_original_ad_fund_and_unused_deduction.sql
-- Allow 'unused_fund' as payment_type in ad_fund_transactions

ALTER TABLE public.ad_fund_transactions 
DROP CONSTRAINT IF EXISTS ad_fund_transactions_payment_type_check;

ALTER TABLE public.ad_fund_transactions 
ADD CONSTRAINT ad_fund_transactions_payment_type_check 
CHECK (payment_type IN ('company', 'personal', 'client', 'unused_fund'));
