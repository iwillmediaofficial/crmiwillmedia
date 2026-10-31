-- Migration: 20261031_timer_auto_cutoff.sql
-- Description: Provision auto cut-off limit on staff timers and automatic sweep RPC

-- 1. Ensure default timer_settings record in public.app_settings
INSERT INTO public.app_settings (setting_key, setting_value, updated_at)
VALUES (
  'timer_settings',
  '{"enabled": true, "max_duration_hours": 8, "daily_cutoff_enabled": false, "daily_cutoff_time": "20:00"}'::jsonb,
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Create function to sweep and auto cut-off overdue timers
CREATE OR REPLACE FUNCTION public.auto_cutoff_work_timers()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings JSONB;
  v_enabled BOOLEAN := true;
  v_max_hours NUMERIC := 8;
  v_daily_cutoff_enabled BOOLEAN := false;
  v_daily_cutoff_time TEXT := '20:00';
  v_max_seconds INTEGER;
  v_entry RECORD;
  v_cutoff_time TIMESTAMPTZ;
  v_calc_duration INTEGER;
  v_count INTEGER := 0;
  v_reason TEXT;
  v_daily_cutoff_ts TIMESTAMPTZ;
BEGIN
  -- Read settings from app_settings
  SELECT setting_value INTO v_settings
  FROM public.app_settings
  WHERE setting_key = 'timer_settings';

  IF v_settings IS NOT NULL THEN
    v_enabled := COALESCE((v_settings->>'enabled')::boolean, true);
    v_max_hours := COALESCE((v_settings->>'max_duration_hours')::numeric, 8);
    v_daily_cutoff_enabled := COALESCE((v_settings->>'daily_cutoff_enabled')::boolean, false);
    v_daily_cutoff_time := COALESCE(v_settings->>'daily_cutoff_time', '20:00');
  END IF;

  IF NOT v_enabled THEN
    RETURN jsonb_build_object('success', true, 'affected_count', 0, 'message', 'Auto cut-off disabled');
  END IF;

  v_max_seconds := ROUND(v_max_hours * 3600);

  -- Iterate through active running timers
  FOR v_entry IN
    SELECT 
      wte.id, 
      wte.staff_id, 
      wte.work_item_id, 
      wte.started_at,
      wte.remarks,
      wi.title AS work_item_title
    FROM public.work_time_entries wte
    LEFT JOIN public.work_items wi ON wi.id = wte.work_item_id
    WHERE wte.stopped_at IS NULL
  LOOP
    v_cutoff_time := NULL;
    v_reason := NULL;

    -- 1. Check max duration limit
    IF EXTRACT(EPOCH FROM (NOW() - v_entry.started_at)) >= v_max_seconds THEN
      v_cutoff_time := v_entry.started_at + (v_max_seconds * INTERVAL '1 second');
      v_calc_duration := v_max_seconds;
      v_reason := 'Auto cut-off: Reached maximum limit of ' || v_max_hours || 'h';
    END IF;

    -- 2. Check daily cutoff time if enabled (office closing time, evaluated in local timezone)
    IF v_daily_cutoff_enabled AND v_daily_cutoff_time IS NOT NULL AND v_daily_cutoff_time <> '' THEN
      BEGIN
        v_daily_cutoff_ts := (
          (v_entry.started_at AT TIME ZONE 'Asia/Kolkata')::date::text || ' ' || v_daily_cutoff_time
        )::timestamp AT TIME ZONE 'Asia/Kolkata';

        IF NOW() >= v_daily_cutoff_ts AND v_entry.started_at < v_daily_cutoff_ts THEN
          IF v_cutoff_time IS NULL OR v_daily_cutoff_ts < v_cutoff_time THEN
            v_cutoff_time := v_daily_cutoff_ts;
            v_calc_duration := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (v_daily_cutoff_ts - v_entry.started_at))));
            v_reason := 'Auto cut-off: Daily office closing limit reached (' || v_daily_cutoff_time || ')';
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;

    -- If cutoff condition met, update entry and notify staff
    IF v_cutoff_time IS NOT NULL THEN
      IF v_cutoff_time > NOW() THEN
        v_cutoff_time := NOW();
        v_calc_duration := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (v_cutoff_time - v_entry.started_at))));
      END IF;

      UPDATE public.work_time_entries
      SET
        stopped_at = v_cutoff_time,
        duration_seconds = v_calc_duration,
        remarks = CASE 
          WHEN v_entry.remarks IS NULL OR v_entry.remarks = '' THEN v_reason 
          ELSE v_entry.remarks || ' | ' || v_reason 
        END
      WHERE id = v_entry.id AND stopped_at IS NULL;

      -- Send in-app notification to staff
      BEGIN
        INSERT INTO public.notifications (
          user_id,
          title,
          message,
          type,
          is_read,
          link_url
        ) VALUES (
          v_entry.staff_id,
          'Timer Auto Cut-off',
          'Your timer for "' || COALESCE(v_entry.work_item_title, 'task') || '" was automatically stopped (' || v_reason || ').',
          'warning',
          false,
          '/work'
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 
    'affected_count', v_count,
    'message', 'Auto cut-off sweep completed successfully'
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.auto_cutoff_work_timers() TO authenticated;

-- 3. Update start_work_timer to cap previous timer when stopping it
CREATE OR REPLACE FUNCTION public.start_work_timer(p_work_item_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id UUID := auth.uid();
  v_new_entry RECORD;
  v_settings JSONB;
  v_enabled BOOLEAN := true;
  v_max_hours NUMERIC := 8;
  v_max_seconds INTEGER;
  v_active_entry RECORD;
  v_calc_duration INTEGER;
  v_cutoff_time TIMESTAMPTZ;
  v_reason TEXT;
BEGIN
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Read auto cut-off settings
  SELECT setting_value INTO v_settings
  FROM public.app_settings
  WHERE setting_key = 'timer_settings';

  IF v_settings IS NOT NULL THEN
    v_enabled := COALESCE((v_settings->>'enabled')::boolean, true);
    v_max_hours := COALESCE((v_settings->>'max_duration_hours')::numeric, 8);
  END IF;

  v_max_seconds := ROUND(v_max_hours * 3600);

  -- 1. Stop any currently running timer for this user with cap
  FOR v_active_entry IN
    SELECT id, started_at, remarks
    FROM public.work_time_entries
    WHERE staff_id = v_staff_id AND stopped_at IS NULL
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

  -- 2. Insert new running timer session
  INSERT INTO public.work_time_entries (
    work_item_id,
    staff_id,
    started_at
  ) VALUES (
    p_work_item_id,
    v_staff_id,
    NOW()
  )
  RETURNING * INTO v_new_entry;

  -- 3. Also update work_item status to in_progress if currently assigned or pending
  UPDATE public.work_items
  SET status = 'in_progress', updated_at = NOW()
  WHERE id = p_work_item_id AND status IN ('assigned', 'pending');

  RETURN to_jsonb(v_new_entry);
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_work_timer(UUID) TO authenticated;

-- 4. Update stop_work_timer to enforce duration capping
CREATE OR REPLACE FUNCTION public.stop_work_timer(p_entry_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id UUID := auth.uid();
  v_stopped_entry RECORD;
  v_settings JSONB;
  v_enabled BOOLEAN := true;
  v_max_hours NUMERIC := 8;
  v_max_seconds INTEGER;
  v_active_entry RECORD;
  v_cutoff_time TIMESTAMPTZ;
  v_calc_duration INTEGER;
  v_reason TEXT;
BEGIN
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, started_at, staff_id, remarks INTO v_active_entry
  FROM public.work_time_entries
  WHERE id = p_entry_id 
    AND (staff_id = v_staff_id OR public.is_admin())
    AND stopped_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Timer entry not found or already stopped';
  END IF;

  -- Read auto cut-off settings
  SELECT setting_value INTO v_settings
  FROM public.app_settings
  WHERE setting_key = 'timer_settings';

  IF v_settings IS NOT NULL THEN
    v_enabled := COALESCE((v_settings->>'enabled')::boolean, true);
    v_max_hours := COALESCE((v_settings->>'max_duration_hours')::numeric, 8);
  END IF;

  v_max_seconds := ROUND(v_max_hours * 3600);
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
  WHERE id = p_entry_id
  RETURNING * INTO v_stopped_entry;

  RETURN to_jsonb(v_stopped_entry);
END;
$$;

GRANT EXECUTE ON FUNCTION public.stop_work_timer(UUID) TO authenticated;

-- 5. Enable pg_cron and schedule background sweep every 15 minutes (if supported)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule(
    'timer-auto-cutoff-job',
    '*/15 * * * *',
    'SELECT public.auto_cutoff_work_timers()'
  );
EXCEPTION WHEN OTHERS THEN
  NULL; -- Gracefully proceed if pg_cron is not permitted
END;
$$;

