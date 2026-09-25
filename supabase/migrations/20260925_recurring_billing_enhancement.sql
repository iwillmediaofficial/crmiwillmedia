-- Migration: 06_recurring_billing_enhancement.sql
-- Fixes recurring billing so that occurrences generate corresponding billing_records invoices,
-- adds auto-generation triggers on recurring_bills creation/updates,
-- and adds status synchronization between billing_records and billing_occurrences.

CREATE OR REPLACE FUNCTION public.generate_billing_occurrences(p_due_month DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_bill RECORD;
  v_count INTEGER := 0;
  v_target_due_date DATE;
  v_month_start DATE := date_trunc('month', p_due_month)::date;
  v_month_end DATE := (date_trunc('month', p_due_month) + interval '1 month - 1 day')::date;
  v_day_clamped INTEGER;
  v_occurrence_id UUID;
BEGIN
  -- Allow active admins or internal trigger executions (when auth.uid() is null or is_admin() is true)
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can generate billing occurrences';
  END IF;

  FOR v_bill IN 
    SELECT * FROM public.recurring_bills 
    WHERE is_active = true 
      AND start_date <= v_month_end
  LOOP
    -- Clamp billing day to month days (e.g. 31st clamped to 28 for February)
    v_day_clamped := LEAST(v_bill.billing_day, EXTRACT(DAY FROM v_month_end)::INTEGER);
    v_target_due_date := v_month_start + (v_day_clamped - 1) * INTERVAL '1 day';

    -- Insert or update occurrence for this due_date
    INSERT INTO public.billing_occurrences (
      recurring_bill_id,
      client_id,
      period_start_date,
      period_end_date,
      due_date,
      amount,
      currency,
      status
    ) VALUES (
      v_bill.id,
      v_bill.client_id,
      v_month_start,
      v_month_end,
      v_target_due_date,
      v_bill.amount,
      v_bill.currency,
      'pending'
    )
    ON CONFLICT (recurring_bill_id, due_date) DO UPDATE
      SET amount = EXCLUDED.amount, currency = EXCLUDED.currency
    RETURNING id INTO v_occurrence_id;

    -- If existing occurrence without returning id
    IF v_occurrence_id IS NULL THEN
      SELECT id INTO v_occurrence_id 
      FROM public.billing_occurrences 
      WHERE recurring_bill_id = v_bill.id AND due_date = v_target_due_date;
    END IF;

    -- Now ensure corresponding invoice exists in billing_records
    IF v_occurrence_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.billing_records WHERE recurring_occurrence_id = v_occurrence_id
      ) THEN
        INSERT INTO public.billing_records (
          client_id,
          bill_title,
          description,
          amount,
          currency,
          due_date,
          assigned_staff_id,
          status,
          recurring_occurrence_id,
          created_by
        ) VALUES (
          v_bill.client_id,
          v_bill.bill_name,
          'Monthly Retainer (' || to_char(v_month_start, 'Mon YYYY') || ')',
          v_bill.amount,
          v_bill.currency,
          v_target_due_date,
          v_bill.assigned_staff_id,
          'pending',
          v_occurrence_id,
          v_bill.created_by
        );

        v_count := v_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_billing_occurrences TO authenticated;

-- Trigger to auto-generate occurrences whenever recurring bills are created or modified
CREATE OR REPLACE FUNCTION public.trg_auto_generate_recurring_occurrences()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    PERFORM public.generate_billing_occurrences(CURRENT_DATE);
    IF date_trunc('month', NEW.start_date) > date_trunc('month', CURRENT_DATE) THEN
      PERFORM public.generate_billing_occurrences(NEW.start_date);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recurring_bill_upsert ON public.recurring_bills;
CREATE TRIGGER trg_recurring_bill_upsert
AFTER INSERT OR UPDATE OF is_active, amount, billing_day, start_date ON public.recurring_bills
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_generate_recurring_occurrences();

-- Trigger to sync billing_records status to billing_occurrences
CREATE OR REPLACE FUNCTION public.sync_billing_record_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recurring_occurrence_id IS NOT NULL THEN
    UPDATE public.billing_occurrences
    SET status = NEW.status
    WHERE id = NEW.recurring_occurrence_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_billing_record_status ON public.billing_records;
CREATE TRIGGER trg_sync_billing_record_status
AFTER UPDATE OF status ON public.billing_records
FOR EACH ROW
EXECUTE FUNCTION public.sync_billing_record_status();
