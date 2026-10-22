-- Migration: 20261022_dm_work_assign_calendar.sql
-- Digital Marketing Work Assign Calendar:
-- 1. Adds start_date, deliverable_type, and dm_plan_id to work_items
-- 2. Creates dm_client_deliverable_plans for monthly recurring deliverables (e.g. 8 posters, 4 videos)
-- 3. Updates work assignment notification trigger to include work start date

-- 1. Add columns to work_items if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'work_items' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.work_items ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
    -- Backfill start_date with assigned_date for existing rows
    UPDATE public.work_items SET start_date = assigned_date WHERE start_date IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'work_items' AND column_name = 'deliverable_type'
  ) THEN
    ALTER TABLE public.work_items ADD COLUMN deliverable_type TEXT DEFAULT 'general';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'work_items' AND column_name = 'dm_plan_id'
  ) THEN
    ALTER TABLE public.work_items ADD COLUMN dm_plan_id UUID NULL;
  END IF;
END $$;

-- 2. Create dm_client_deliverable_plans table
CREATE TABLE IF NOT EXISTS public.dm_client_deliverable_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deliverable_type TEXT NOT NULL CHECK (deliverable_type IN ('poster', 'video', 'reel', 'carousel', 'story', 'other')),
  title_template TEXT NOT NULL,
  monthly_count INTEGER NOT NULL DEFAULT 4 CHECK (monthly_count > 0),
  default_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_lead_days INTEGER NOT NULL DEFAULT 2 CHECK (start_lead_days >= 0),
  preferred_days INTEGER[] DEFAULT ARRAY[2, 5]::INTEGER[], -- 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign key for dm_plan_id in work_items if not added yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'work_items_dm_plan_id_fkey'
  ) THEN
    ALTER TABLE public.work_items
    ADD CONSTRAINT work_items_dm_plan_id_fkey
    FOREIGN KEY (dm_plan_id) REFERENCES public.dm_client_deliverable_plans(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dm_client_plans_client_id ON public.dm_client_deliverable_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_work_items_start_date ON public.work_items(start_date);
CREATE INDEX IF NOT EXISTS idx_work_items_deliverable_type ON public.work_items(deliverable_type);

-- Trigger for dm_client_deliverable_plans updated_at
CREATE OR REPLACE FUNCTION public.handle_dm_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_dm_client_deliverable_plans_updated_at ON public.dm_client_deliverable_plans;
CREATE TRIGGER set_dm_client_deliverable_plans_updated_at
BEFORE UPDATE ON public.dm_client_deliverable_plans
FOR EACH ROW
EXECUTE FUNCTION public.handle_dm_plans_updated_at();

-- 3. Row Level Security for dm_client_deliverable_plans
ALTER TABLE public.dm_client_deliverable_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view dm plans" ON public.dm_client_deliverable_plans;
CREATE POLICY "Authenticated users can view dm plans"
ON public.dm_client_deliverable_plans
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert dm plans" ON public.dm_client_deliverable_plans;
CREATE POLICY "Admins can insert dm plans"
ON public.dm_client_deliverable_plans
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update dm plans" ON public.dm_client_deliverable_plans;
CREATE POLICY "Admins can update dm plans"
ON public.dm_client_deliverable_plans
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete dm plans" ON public.dm_client_deliverable_plans;
CREATE POLICY "Admins can delete dm plans"
ON public.dm_client_deliverable_plans
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 4. Update the assignment notification trigger to include the work starting date
CREATE OR REPLACE FUNCTION public.trg_work_item_assigned_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_start_date_text TEXT;
BEGIN
  -- Trigger on INSERT with an assignee, or on UPDATE when the assigned staff changes
  IF (TG_OP = 'INSERT' AND NEW.assigned_staff_id IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.assigned_staff_id IS NOT NULL AND (OLD.assigned_staff_id IS NULL OR OLD.assigned_staff_id != NEW.assigned_staff_id)) THEN
     
    -- Get client company name
    SELECT company_name INTO v_client_name
    FROM public.clients
    WHERE id = NEW.client_id;

    -- Format start date if available
    IF NEW.start_date IS NOT NULL THEN
      v_start_date_text := ' (Start: ' || to_char(NEW.start_date, 'Mon DD') || ', Due: ' || to_char(NEW.due_date, 'Mon DD, YYYY') || ')';
    ELSE
      v_start_date_text := ' (Due: ' || to_char(NEW.due_date, 'Mon DD, YYYY') || ')';
    END IF;

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
      'You have been assigned: "' || NEW.title || '" for ' || COALESCE(v_client_name, 'Client') || v_start_date_text,
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
AFTER INSERT OR UPDATE OF assigned_staff_id, title, due_date, start_date ON public.work_items
FOR EACH ROW
EXECUTE FUNCTION public.trg_work_item_assigned_notification();
