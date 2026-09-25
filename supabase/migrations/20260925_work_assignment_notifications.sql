-- Migration: 08_work_assignment_notifications.sql
-- Automatically triggers notifications to staff when a work item is assigned or reassigned.

CREATE OR REPLACE FUNCTION public.trg_work_item_assigned_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
BEGIN
  -- Trigger on INSERT with an assignee, or on UPDATE when the assigned staff changes
  IF (TG_OP = 'INSERT' AND NEW.assigned_staff_id IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.assigned_staff_id IS NOT NULL AND (OLD.assigned_staff_id IS NULL OR OLD.assigned_staff_id != NEW.assigned_staff_id)) THEN
     
    -- Get client company name
    SELECT company_name INTO v_client_name
    FROM public.clients
    WHERE id = NEW.client_id;

    -- Insert notification for the assigned staff member
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      link_url,
      is_read,
      created_at
    ) VALUES (
      NEW.assigned_staff_id,
      'New Work Deliverable Assigned',
      'You have been assigned: "' || NEW.title || '" for ' || COALESCE(v_client_name, 'Client') || ' (Due: ' || to_char(NEW.due_date, 'Mon DD, YYYY') || ')',
      'assignment',
      '/work',
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_work_item_assigned_notification ON public.work_items;
CREATE TRIGGER trg_work_item_assigned_notification
AFTER INSERT OR UPDATE OF assigned_staff_id, title, due_date ON public.work_items
FOR EACH ROW
EXECUTE FUNCTION public.trg_work_item_assigned_notification();
