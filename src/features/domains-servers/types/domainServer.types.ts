export type AssetType = 'domain' | 'server' | 'hosting' | 'ssl' | 'other'

export type BillingCycle =
  | 'monthly'
  | 'quarterly'
  | 'semi_annual'
  | 'yearly'
  | 'biennial'
  | 'multi_year'
  | 'one_time'

export type AssetStatus = 'active' | 'pending_renewal' | 'expired' | 'transferred' | 'cancelled'

export interface DomainServerAsset {
  id: string
  asset_type: AssetType
  name: string
  client_id: string | null
  provider: string
  registration_date: string | null
  expiry_date: string
  renewal_cost: number
  currency: string
  billing_cycle: BillingCycle
  auto_renew: boolean
  status: AssetStatus
  ip_address: string | null
  nameservers: string | null
  admin_url: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  clients?: {
    id: string
    company_name: string
    contact_person: string | null
  } | null
  daysUntilExpiry?: number
  urgencyLevel?: 'safe' | 'soon' | 'critical' | 'expired'
}

export type ExpiryUrgency = 'all' | 'critical' | 'soon' | 'month' | 'expired' | 'active'

export interface DomainServerFilterParams {
  search?: string
  assetType?: 'all' | AssetType
  urgency?: ExpiryUrgency
  clientId?: string
  sortBy?: 'expiry_asc' | 'expiry_desc' | 'name_asc' | 'cost_desc'
}

export interface DomainServerStatsData {
  totalCount: number
  domainsCount: number
  serversCount: number
  expiringIn30Days: number
  criticalIn7Days: number
  expiredCount: number
  totalAnnualCost: number
}
