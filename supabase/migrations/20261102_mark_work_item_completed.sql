-- Migration: 20261102_mark_work_item_completed.sql
-- Description: Implement mark_work_item_completed RPC function and allow automated billing_status transition on task completion.

-- 1. Update check_staff_work_item_update trigger function to allow billing_status transition to 'billed' when completing
CREATE OR REPLACE FUNCTION public.check_staff_work_item_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Admins can update any field
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- If the task was created by the staff member themselves and assigned to themselves
  IF OLD.created_by = auth.uid() AND OLD.assigned_staff_id = auth.uid() THEN
    -- Staff members cannot reassign self-created tasks to other staff members
    IF NEW.assigned_staff_id IS DISTINCT FROM OLD.assigned_staff_id THEN
      RAISE EXCEPTION 'Access denied: Staff members cannot reassign tasks to other team members.';
    END IF;

    -- Full permission for all other fields
    RETURN NEW;
  END IF;

  -- Non-admins editing tasks created by someone else (Admin, Manager, etc.) CANNOT edit core deliverable properties or billing
  -- Exception: billing_status can transition from 'unbilled' to 'billed' when marking completed
  IF NEW.title IS DISTINCT FROM OLD.title OR
     NEW.description IS DISTINCT FROM OLD.description OR
     NEW.client_id IS DISTINCT FROM OLD.client_id OR
     NEW.assigned_staff_id IS DISTINCT FROM OLD.assigned_staff_id OR
     NEW.priority IS DISTINCT FROM OLD.priority OR
     NEW.due_date IS DISTINCT FROM OLD.due_date OR
     NEW.start_date IS DISTINCT FROM OLD.start_date OR
     NEW.deliverable_type IS DISTINCT FROM OLD.deliverable_type OR
     NEW.is_billable IS DISTINCT FROM OLD.is_billable OR
     NEW.billable_amount IS DISTINCT FROM OLD.billable_amount OR
     NEW.currency IS DISTINCT FROM OLD.currency OR
     (NEW.billing_status IS DISTINCT FROM OLD.billing_status AND NOT (OLD.billing_status = 'unbilled' AND NEW.billing_status = 'billed' AND NEW.status = 'completed')) THEN
    RAISE EXCEPTION 'Access denied: Staff members are not permitted to edit work item details for tasks assigned by others.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the missing mark_work_item_completed RPC function
CREATE OR REPLACE FUNCTION public.mark_work_item_completed(p_work_item_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item RECORD;
  v_active_entry RECORD;
  v_settings JSONB;
  v_enabled BOOLEAN := true;
  v_max_hours NUMERIC := 8;
  v_max_seconds INTEGER;
  v_calc_duration INTEGER;
  v_cutoff_time TIMESTAMPTZ;
  v_reason TEXT;
  v_updated_item RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Fetch work item
  SELECT * INTO v_item
  FROM public.work_items
  WHERE id = p_work_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work item not found';
  END IF;

  -- Authorization check: caller must be Admin, assigned staff, or task creator
  IF NOT (public.is_admin() OR v_item.assigned_staff_id = v_user_id OR v_item.created_by = v_user_id) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to complete this work item.';
  END IF;

  -- Stop any running timers for this work item
  SELECT setting_value INTO v_settings
  FROM public.app_settings
  WHERE setting_key = 'timer_settings';

  IF v_settings IS NOT NULL THEN
    v_enabled := COALESCE((v_settings->>'enabled')::boolean, true);
    v_max_hours := COALESCE((v_settings->>'max_duration_hours')::numeric, 8);
  END IF;
  v_max_seconds := ROUND(v_max_hours * 3600);

  FOR v_active_entry IN
    SELECT id, started_at, remarks
    FROM public.work_time_entries
    WHERE work_item_id = p_work_item_id AND stopped_at IS NULL
  LOOP
    v_cutoff_time := NOW();
    v_calc_duration := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (NOW() - v_active_entry.started_at))));
    v_reason := NULL;

    IF v_enabled AND v_calc_duration > v_max_seconds THEN
      v_cutoff_time := v_active_entry.started_at + (v_max_seconds * INTERVAL '1 second');
      v_calc_duration := v_max_seconds;
      v_reason := 'Auto cut-off: Reached maximum limit of ' || v_max_hours || 'h';
    END IF;

    UPDATE public.work_time_entries
    SET 
      stopped_at = v_cutoff_time,
      duration_seconds = v_calc_duration,
      remarks = CASE 
        WHEN v_reason IS NULL THEN remarks
        WHEN remarks IS NULL OR remarks = '' THEN v_reason
        ELSE remarks || ' | ' || v_reason
      END
    WHERE id = v_active_entry.id;
  END LOOP;

  -- Mark work item as completed
  UPDATE public.work_items
  SET
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_work_item_id
  RETURNING * INTO v_updated_item;

  RETURN to_jsonb(v_updated_item);
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.mark_work_item_completed(UUID) TO authenticated;
