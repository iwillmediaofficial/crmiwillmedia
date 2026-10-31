import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { differenceInDays, parseISO, startOfDay } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import {
  DomainServerAsset,
  DomainServerFilterParams,
  DomainServerStatsData,
} from '../types/domainServer.types'

export function useDomainsServers(filters: DomainServerFilterParams = {}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // 1. Fetch assets
  const {
    data: rawAssets = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['domains-servers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domains_servers')
        .select(`
          *,
          clients (
            id,
            company_name,
            contact_person
          )
        `)
        .order('expiry_date', { ascending: true })

      if (error) {
        console.error('Error fetching domains and servers:', error)
        throw error
      }
      return (data || []) as DomainServerAsset[]
    },
    enabled: !!user?.id,
  })

  // 2. Compute live expiry metrics & stats
  const today = startOfDay(new Date())

  const processedAssets = useMemo(() => {
    return rawAssets.map((asset) => {
      const expDate = parseISO(asset.expiry_date)
      const daysUntilExpiry = differenceInDays(expDate, today)

      let urgencyLevel: 'safe' | 'soon' | 'critical' | 'expired' = 'safe'
      if (daysUntilExpiry < 0 || asset.status === 'expired') {
        urgencyLevel = 'expired'
      } else if (daysUntilExpiry <= 7) {
        urgencyLevel = 'critical'
      } else if (daysUntilExpiry <= 30) {
        urgencyLevel = 'soon'
      }

      return {
        ...asset,
        daysUntilExpiry,
        urgencyLevel,
      }
    })
  }, [rawAssets, today])

  // 3. Stats summary across all assets
  const stats: DomainServerStatsData = useMemo(() => {
    let domainsCount = 0
    let serversCount = 0
    let expiringIn30Days = 0
    let criticalIn7Days = 0
    let expiredCount = 0
    let totalAnnualCost = 0

    processedAssets.forEach((asset) => {
      if (asset.asset_type === 'domain') domainsCount += 1
      if (asset.asset_type === 'server' || asset.asset_type === 'hosting') serversCount += 1

      if (asset.urgencyLevel === 'expired') {
        expiredCount += 1
      } else if (asset.urgencyLevel === 'critical') {
        criticalIn7Days += 1
        expiringIn30Days += 1
      } else if (asset.urgencyLevel === 'soon') {
        expiringIn30Days += 1
      }

      // Normalize cost to annual equivalent for reporting
      const cost = Number(asset.renewal_cost) || 0
      if (asset.billing_cycle === 'monthly') {
        totalAnnualCost += cost * 12
      } else if (asset.billing_cycle === 'quarterly') {
        totalAnnualCost += cost * 4
      } else if (asset.billing_cycle === 'semi_annual') {
        totalAnnualCost += cost * 2
      } else if (asset.billing_cycle === 'biennial') {
        totalAnnualCost += cost / 2
      } else {
        totalAnnualCost += cost
      }
    })

    return {
      totalCount: processedAssets.length,
      domainsCount,
      serversCount,
      expiringIn30Days,
      criticalIn7Days,
      expiredCount,
      totalAnnualCost: Math.round(totalAnnualCost),
    }
  }, [processedAssets])

  // 4. Apply client-side filters and sorting
  const filteredAssets = useMemo(() => {
    return processedAssets.filter((asset) => {
      // Search
      if (filters.search && filters.search.trim()) {
        const term = filters.search.toLowerCase().trim()
        const matchesName = asset.name.toLowerCase().includes(term)
        const matchesProvider = asset.provider.toLowerCase().includes(term)
        const matchesClient = asset.clients?.company_name?.toLowerCase().includes(term)
        const matchesIp = asset.ip_address?.toLowerCase().includes(term)
        if (!matchesName && !matchesProvider && !matchesClient && !matchesIp) {
          return false
        }
      }

      // Asset Type
      if (filters.assetType && filters.assetType !== 'all') {
        if (asset.asset_type !== filters.assetType) {
          return false
        }
      }

      // Client
      if (filters.clientId && filters.clientId !== 'all') {
        if (filters.clientId === 'internal') {
          if (asset.client_id !== null) return false
        } else if (asset.client_id !== filters.clientId) {
          return false
        }
      }

      // Urgency
      if (filters.urgency && filters.urgency !== 'all') {
        if (filters.urgency === 'critical' && asset.urgencyLevel !== 'critical') return false
        if (filters.urgency === 'soon' && !['critical', 'soon'].includes(asset.urgencyLevel)) return false
        if (filters.urgency === 'month' && asset.daysUntilExpiry > 60) return false
        if (filters.urgency === 'expired' && asset.urgencyLevel !== 'expired') return false
        if (filters.urgency === 'active' && asset.urgencyLevel === 'expired') return false
      }

      return true
    }).sort((a, b) => {
      if (filters.sortBy === 'name_asc') {
        return a.name.localeCompare(b.name)
      }
      if (filters.sortBy === 'expiry_desc') {
        return new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime()
      }
      if (filters.sortBy === 'cost_desc') {
        return (Number(b.renewal_cost) || 0) - (Number(a.renewal_cost) || 0)
      }
      // Default: expiry_asc (nearest deadline first)
      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
    })
  }, [processedAssets, filters])

  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: async (payload: Partial<DomainServerAsset>) => {
      const { data, error } = await supabase
        .from('domains_servers')
        .insert([{ ...payload, created_by: user?.id }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains-servers'] })
    },
  })

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DomainServerAsset> }) => {
      const { data, error } = await supabase
        .from('domains_servers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains-servers'] })
    },
  })

  const renewAssetMutation = useMutation({
    mutationFn: async ({
      id,
      newExpiryDate,
      renewalCost,
    }: {
      id: string
      newExpiryDate: string
      renewalCost?: number
    }) => {
      const updates: any = {
        expiry_date: newExpiryDate,
        status: 'active',
        updated_at: new Date().toISOString(),
      }
      if (typeof renewalCost === 'number') {
        updates.renewal_cost = renewalCost
      }

      const { data, error } = await supabase
        .from('domains_servers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains-servers'] })
    },
  })

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('domains_servers')
        .delete()
        .eq('id', id)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains-servers'] })
    },
  })

  return {
    assets: filteredAssets,
    allAssets: processedAssets,
    stats,
    isLoading,
    error,
    refetch,
    createAsset: createAssetMutation.mutateAsync,
    isCreating: createAssetMutation.isPending,
    updateAsset: updateAssetMutation.mutateAsync,
    isUpdating: updateAssetMutation.isPending,
    renewAsset: renewAssetMutation.mutateAsync,
    isRenewing: renewAssetMutation.isPending,
    deleteAsset: deleteAssetMutation.mutateAsync,
    isDeleting: deleteAssetMutation.isPending,
  }
}
