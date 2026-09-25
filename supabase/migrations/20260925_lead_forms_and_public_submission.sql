-- 1. Create lead_forms table
CREATE TABLE IF NOT EXISTS public.lead_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Intro / Branding
  cover_image_url TEXT,
  greeting_headline TEXT NOT NULL DEFAULT 'Get a Free Consultation',
  greeting_description TEXT DEFAULT 'Fill out the form below and our team will get in touch to discuss your goals.',
  bullet_points JSONB DEFAULT '["Guaranteed ROI-driven marketing campaigns", "Full-stack design & development team", "Dedicated account manager & weekly reporting"]'::jsonb,

  -- Field Toggles & Custom Questions
  enabled_fields JSONB DEFAULT '{"email": true, "company_name": true, "city": false}'::jsonb,
  custom_questions JSONB DEFAULT '[
    {
      "id": "service_needed",
      "type": "multiple_choice",
      "title": "What service are you looking for?",
      "required": true,
      "options": ["Meta & Google Ads Management", "Custom Web & App Development", "Full Digital Branding & Design", "SEO & Content Marketing"]
    },
    {
      "id": "monthly_budget",
      "type": "multiple_choice",
      "title": "What is your estimated monthly marketing budget?",
      "required": false,
      "options": ["Under ₹25,000", "₹25,000 - ₹50,000", "₹50,000 - ₹1,00,000", "₹1,00,000+"]
    }
  ]'::jsonb,

  -- Privacy & Compliance
  privacy_policy_url TEXT DEFAULT 'https://iwillmedia.com/privacy',

  -- Completion / Thank You Card
  thank_you_headline TEXT DEFAULT 'Thanks, you are all set!',
  thank_you_description TEXT DEFAULT 'We have received your inquiry. Click below to chat directly with our strategy team on WhatsApp.',
  cta_type TEXT DEFAULT 'whatsapp',
  cta_label TEXT DEFAULT 'Chat with us on WhatsApp',
  cta_url TEXT,
  whatsapp_number TEXT NOT NULL DEFAULT '919745334644',
  whatsapp_default_message TEXT DEFAULT 'Hi IWILLMEDIA, I just submitted an inquiry on your Meta ad form.',

  -- Assigned Staff (routing)
  assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.lead_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_forms_public_read_policy" ON public.lead_forms;
CREATE POLICY "lead_forms_public_read_policy" ON public.lead_forms
  FOR SELECT
  USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "lead_forms_admin_write_policy" ON public.lead_forms;
CREATE POLICY "lead_forms_admin_write_policy" ON public.lead_forms
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 3. Update leads check constraint to allow meta_ads
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_lead_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_lead_source_check
  CHECK (lead_source = ANY (ARRAY['facebook'::text, 'instagram'::text, 'meta_ads'::text, 'website'::text, 'referral'::text, 'direct'::text, 'other'::text]));

-- 4. Create submit_public_lead RPC
CREATE OR REPLACE FUNCTION public.submit_public_lead(
  p_slug TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_answers JSONB DEFAULT '{}'::jsonb,
  p_utm_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_form public.lead_forms%ROWTYPE;
  v_lead_id UUID;
  v_remarks TEXT := '';
  v_campaign_info TEXT;
  v_key TEXT;
  v_val TEXT;
  v_source TEXT := 'meta_ads';
BEGIN
  -- 1. Find active form
  SELECT * INTO v_form FROM public.lead_forms WHERE slug = p_slug AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Form not found or currently inactive.';
  END IF;

  -- 2. Validate mandatory contact fields
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Name is required.';
  END IF;
  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RAISE EXCEPTION 'Phone number is required.';
  END IF;

  -- 3. Construct formatted remarks from custom answers
  v_remarks := '📋 Meta Form: ' || v_form.title || E'\n';
  IF p_company_name IS NOT NULL AND trim(p_company_name) != '' THEN
    v_remarks := v_remarks || '• Company: ' || trim(p_company_name) || E'\n';
  END IF;
  IF p_city IS NOT NULL AND trim(p_city) != '' THEN
    v_remarks := v_remarks || '• City/Location: ' || trim(p_city) || E'\n';
  END IF;

  -- Loop through custom answers if provided
  IF p_answers IS NOT NULL AND jsonb_typeof(p_answers) = 'object' THEN
    FOR v_key, v_val IN SELECT * FROM jsonb_each_text(p_answers) LOOP
      IF v_val IS NOT NULL AND trim(v_val) != '' THEN
        v_remarks := v_remarks || '• ' || v_key || ': ' || v_val || E'\n';
      END IF;
    END LOOP;
  END IF;

  -- Check UTM source
  IF p_utm_data IS NOT NULL AND jsonb_typeof(p_utm_data) = 'object' THEN
    IF (p_utm_data->>'utm_source') ILIKE '%instagram%' THEN
      v_source := 'instagram';
    ELSIF (p_utm_data->>'utm_source') ILIKE '%facebook%' THEN
      v_source := 'facebook';
    END IF;

    IF p_utm_data ? 'utm_campaign' THEN
      v_remarks := v_remarks || '• Campaign: ' || (p_utm_data->>'utm_campaign') || E'\n';
    END IF;
    IF p_utm_data ? 'utm_source' THEN
      v_remarks := v_remarks || '• Source: ' || (p_utm_data->>'utm_source') || E'\n';
    END IF;
    IF p_utm_data ? 'utm_medium' THEN
      v_remarks := v_remarks || '• Medium: ' || (p_utm_data->>'utm_medium') || E'\n';
    END IF;
    IF p_utm_data ? 'ad_id' THEN
      v_remarks := v_remarks || '• Ad ID: ' || (p_utm_data->>'ad_id') || E'\n';
    END IF;
  END IF;

  -- Construct campaign details
  v_campaign_info := v_form.title;
  IF p_utm_data ? 'utm_campaign' THEN
    v_campaign_info := v_campaign_info || ' (' || (p_utm_data->>'utm_campaign') || ')';
  END IF;

  -- 4. Insert lead directly into public.leads
  INSERT INTO public.leads (
    name,
    phone,
    email,
    lead_source,
    campaign_details,
    assigned_staff_id,
    status,
    remarks
  ) VALUES (
    trim(p_name),
    trim(p_phone),
    NULLIF(trim(p_email), ''),
    v_source,
    v_campaign_info,
    v_form.assigned_staff_id,
    'new',
    trim(v_remarks)
  ) RETURNING id INTO v_lead_id;

  -- 5. Send in-app notification if assigned to staff (using valid type 'assignment')
  IF v_form.assigned_staff_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      link_url,
      is_read
    ) VALUES (
      v_form.assigned_staff_id,
      'New Meta Lead Received! 🚀',
      'New lead ' || trim(p_name) || ' (' || trim(p_phone) || ') submitted via ' || v_form.title,
      'assignment',
      '/leads',
      false
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'thank_you_headline', v_form.thank_you_headline,
    'thank_you_description', v_form.thank_you_description,
    'whatsapp_number', v_form.whatsapp_number,
    'whatsapp_default_message', v_form.whatsapp_default_message,
    'cta_label', v_form.cta_label,
    'cta_url', v_form.cta_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.submit_public_lead TO anon, authenticated;
