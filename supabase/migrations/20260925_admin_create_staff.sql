-- Migration: 05_admin_create_staff_rpc.sql
-- Function to allow administrators to directly create staff accounts in auth.users and public.profiles
-- Bypasses GoTrue email confirmations to eliminate 'over_email_send_rate_limit' on Supabase free tier

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

  -- 3. Hash password and generate user id
  v_user_id := gen_random_uuid();
  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- 4. Insert into auth.users (Confirmed immediately so no confirmation email is triggered)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
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
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', p_full_name,
      'role', p_role,
      'department', p_department,
      'designation', p_designation,
      'phone', p_phone,
      'email_verified', true
    ),
    NOW(),
    NOW()
  );

  -- 5. Insert into auth.identities (omitting generated column 'email')
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
      'email_verified', true
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

GRANT EXECUTE ON FUNCTION public.admin_create_staff TO authenticated;
