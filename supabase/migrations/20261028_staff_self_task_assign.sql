-- Migration: 20261028_staff_self_task_assign.sql
-- Adds can_self_assign_tasks permission to profiles
-- Updates admin_create_staff to support can_self_assign_tasks
-- Updates RLS policies and triggers on work_items to allow staff self-assignment with full field permissions
-- Enforces that staff can only edit or delete tasks they created themselves

-- 1. Add can_self_assign_tasks column to public.profiles (defaults to true)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS can_self_assign_tasks BOOLEAN NOT NULL DEFAULT true;

-- 2. Update public.admin_create_staff RPC functions
CREATE OR REPLACE FUNCTION public.admin_create_staff(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_department TEXT,
  p_designation TEXT,
  p_phone TEXT,
  p_can_self_assign_tasks BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_clean_email TEXT := LOWER(TRIM(p_email));
  v_hashed_password TEXT;
BEGIN
  -- 1. Authorization check: caller must be an active admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can create staff accounts';
  END IF;

  -- 2. Validation
  IF v_clean_email IS NULL OR v_clean_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
    RAISE EXCEPTION 'A user with email % already exists', v_clean_email;
  END IF;

  -- 3. Hash password with standard 10-round bcrypt and generate user id
  v_user_id := gen_random_uuid();
  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  -- 4. Insert into auth.users with empty string tokens
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    phone_change,
    phone_change_token,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    is_anonymous,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_clean_email,
    v_hashed_password,
    NOW(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_clean_email,
      'full_name', p_full_name,
      'role', p_role,
      'department', p_department,
      'designation', p_designation,
      'phone', p_phone,
      'can_self_assign_tasks', p_can_self_assign_tasks,
      'email_verified', true,
      'phone_verified', false
    ),
    false,
    false,
    NOW(),
    NOW()
  );

  -- 5. Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_clean_email,
      'full_name', p_full_name,
      'role', p_role,
      'department', p_department,
      'designation', p_designation,
      'phone', p_phone,
      'can_self_assign_tasks', p_can_self_assign_tasks,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    v_user_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- 6. Upsert into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    department,
    designation,
    can_self_assign_tasks,
    active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_clean_email,
    p_full_name,
    p_phone,
    p_role,
    p_department,
    p_designation,
    p_can_self_assign_tasks,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    designation = EXCLUDED.designation,
    can_self_assign_tasks = EXCLUDED.can_self_assign_tasks,
    active = true,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_clean_email,
    'full_name', p_full_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_staff(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Overload 7-parameter version to call the 8-parameter version
CREATE OR REPLACE FUNCTION public.admin_create_staff(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT DEFAULT 'staff',
  p_department TEXT DEFAULT NULL,
  p_designation TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  RETURN public.admin_create_staff(
    p_email,
    p_password,
    p_full_name,
    p_role,
    p_department,
    p_designation,
    p_phone,
    true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_staff(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 3. Update work_items RLS INSERT policy
ALTER POLICY work_items_insert_policy ON public.work_items
WITH CHECK (
  public.is_admin() OR (
    assigned_staff_id = auth.uid() AND
    COALESCE(created_by, auth.uid()) = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND active = true
        AND can_self_assign_tasks = true
    )
  )
);

-- 4. Update work_items RLS DELETE policy (allow admin or creator of self-assigned task)
ALTER POLICY work_items_delete_policy ON public.work_items
USING (
  public.is_admin() OR (
    created_by = auth.uid() AND
    assigned_staff_id = auth.uid()
  )
);

-- 5. Update trigger check_staff_work_item_update on public.work_items
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
     NEW.billing_status IS DISTINCT FROM OLD.billing_status THEN
    RAISE EXCEPTION 'Access denied: Staff members are not permitted to edit work item details for tasks assigned by others.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update trg_work_item_assigned_notification to skip notification when self-assigned
CREATE OR REPLACE FUNCTION public.trg_work_item_assigned_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_start_date_text TEXT;
BEGIN
  -- Only notify if assigned to someone else (skip if self-created)
  IF (TG_OP = 'INSERT' AND NEW.assigned_staff_id IS NOT NULL AND (NEW.created_by IS NULL OR NEW.created_by != NEW.assigned_staff_id)) OR
     (TG_OP = 'UPDATE' AND NEW.assigned_staff_id IS NOT NULL AND (OLD.assigned_staff_id IS NULL OR OLD.assigned_staff_id != NEW.assigned_staff_id)) THEN
     
    SELECT company_name INTO v_client_name
    FROM public.clients
    WHERE id = NEW.client_id;

    IF NEW.start_date IS NOT NULL THEN
      v_start_date_text := ' (Start: ' || to_char(NEW.start_date, 'Mon DD') || ', Due: ' || to_char(NEW.due_date, 'Mon DD, YYYY') || ')';
    ELSE
      v_start_date_text := ' (Due: ' || to_char(NEW.due_date, 'Mon DD, YYYY') || ')';
    END IF;

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
