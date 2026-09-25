-- Prevent staff members from updating core deliverable properties (only Admins can edit)
CREATE OR REPLACE FUNCTION public.check_staff_work_item_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Admins can update any field
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Non-admins (staff) are restricted from editing core deliverable properties
  IF NEW.title IS DISTINCT FROM OLD.title OR
     NEW.description IS DISTINCT FROM OLD.description OR
     NEW.client_id IS DISTINCT FROM OLD.client_id OR
     NEW.assigned_staff_id IS DISTINCT FROM OLD.assigned_staff_id OR
     NEW.priority IS DISTINCT FROM OLD.priority OR
     NEW.due_date IS DISTINCT FROM OLD.due_date OR
     NEW.is_billable IS DISTINCT FROM OLD.is_billable OR
     NEW.billable_amount IS DISTINCT FROM OLD.billable_amount OR
     NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'Access denied: Staff members are not permitted to edit work item details.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_staff_work_item_edit ON public.work_items;

CREATE TRIGGER trg_prevent_staff_work_item_edit
BEFORE UPDATE ON public.work_items
FOR EACH ROW
EXECUTE FUNCTION public.check_staff_work_item_update();
