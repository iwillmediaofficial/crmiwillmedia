-- Migration: 07_work_item_billable_completion.sql
-- Adds is_billable, billable_amount, and currency to work_items
-- Automatically generates a pending invoice in billing_records when a billable work item is marked completed.

ALTER TABLE public.work_items
ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS billable_amount NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR' CHECK (currency IN ('INR', 'AED', 'USD'));

-- Trigger to automatically create a bill in billing_records when a billable work item is marked completed
CREATE OR REPLACE FUNCTION public.trg_work_item_completed_billing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_billable = true AND NEW.status = 'completed' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.billing_records WHERE work_item_id = NEW.id
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
        work_item_id,
        created_by
      ) VALUES (
        NEW.client_id,
        NEW.title,
        COALESCE(NEW.description, 'Completed deliverable: ' || NEW.title),
        COALESCE(NEW.billable_amount, 0),
        COALESCE(NEW.currency, 'INR'),
        COALESCE(NEW.due_date, CURRENT_DATE),
        NEW.assigned_staff_id,
        'pending',
        NEW.id,
        NEW.created_by
      );

      UPDATE public.work_items
      SET billing_status = 'billed'
      WHERE id = NEW.id AND billing_status != 'billed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_work_item_completed_billing ON public.work_items;
CREATE TRIGGER trg_work_item_completed_billing
AFTER INSERT OR UPDATE OF status, is_billable, billable_amount, currency ON public.work_items
FOR EACH ROW
EXECUTE FUNCTION public.trg_work_item_completed_billing();
