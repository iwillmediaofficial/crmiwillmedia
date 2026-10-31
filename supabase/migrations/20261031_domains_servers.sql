-- Migration: 20261031_domains_servers.sql
-- Description: Create domains_servers table for tracking domains, servers, hostings, and expiry dates

CREATE TABLE IF NOT EXISTS public.domains_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL DEFAULT 'domain' CHECK (asset_type IN ('domain', 'server', 'hosting', 'ssl', 'other')),
  name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  registration_date DATE,
  expiry_date DATE NOT NULL,
  renewal_cost NUMERIC(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  billing_cycle TEXT DEFAULT 'yearly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'semi_annual', 'yearly', 'biennial', 'multi_year', 'one_time')),
  auto_renew BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_renewal', 'expired', 'transferred', 'cancelled')),
  ip_address TEXT,
  nameservers TEXT,
  admin_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying & deadline sorting
CREATE INDEX IF NOT EXISTS idx_domains_servers_expiry ON public.domains_servers (expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_domains_servers_client ON public.domains_servers (client_id);
CREATE INDEX IF NOT EXISTS idx_domains_servers_type ON public.domains_servers (asset_type);

-- Enable Row Level Security
ALTER TABLE public.domains_servers ENABLE ROW LEVEL SECURITY;

-- Policies:
-- 1. All authenticated team members can view domains and servers
DROP POLICY IF EXISTS domains_servers_select_policy ON public.domains_servers;
CREATE POLICY domains_servers_select_policy ON public.domains_servers
  FOR SELECT TO authenticated USING (true);

-- 2. Authenticated users can insert
DROP POLICY IF EXISTS domains_servers_insert_policy ON public.domains_servers;
CREATE POLICY domains_servers_insert_policy ON public.domains_servers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Authenticated users can update
DROP POLICY IF EXISTS domains_servers_update_policy ON public.domains_servers;
CREATE POLICY domains_servers_update_policy ON public.domains_servers
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- 4. Admins can delete
DROP POLICY IF EXISTS domains_servers_delete_policy ON public.domains_servers;
CREATE POLICY domains_servers_delete_policy ON public.domains_servers
  FOR DELETE TO authenticated USING (is_admin());
