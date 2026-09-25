import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Lead } from '@/types/database.types'
import { useAuth } from '@/features/auth/AuthContext'

export interface LeadFilterParams {
  search?: string
  status?: string
  staffId?: string
  followUpFilter?: 'all' | 'today' | 'upcoming' | 'overdue'
}

export function useLeads(filters: LeadFilterParams = {}) {
  const { user, isAdmin } = useAuth()
  const queryClient = useQueryClient()

  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['leads', filters, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          profiles!leads_assigned_staff_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      // RLS naturally enforces staff isolation, but we can also filter explicitly
      if (!isAdmin && user?.id) {
        query = query.eq('assigned_staff_id', user.id)
      } else if (filters.staffId && filters.staffId !== 'all') {
        query = query.eq('assigned_staff_id', filters.staffId)
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.search) {
        const term = `%${filters.search.trim()}%`
        query = query.or(`name.ilike.${term},phone.ilike.${term},email.ilike.${term}`)
      }

      const today = new Date().toISOString().split('T')[0]
      if (filters.followUpFilter === 'today') {
        query = query
          .gte('follow_up_date', `${today}T00:00:00`)
          .lte('follow_up_date', `${today}T23:59:59`)
      } else if (filters.followUpFilter === 'overdue') {
        query = query.lt('follow_up_date', `${today}T00:00:00`).neq('status', 'won').neq('status', 'lost')
      } else if (filters.followUpFilter === 'upcoming') {
        query = query.gt('follow_up_date', `${today}T23:59:59`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as (Lead & { profiles?: { id: string; full_name: string; email: string; avatar_url: string | null } | null })[]
    },
    enabled: !!user?.id,
  })

  // Create lead mutation
  const createLead = useMutation({
    mutationFn: async (payload: Partial<Lead>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...payload, created_by: user?.id }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['active-clients-select'] })
    },
  })

  // Update lead mutation
  const updateLead = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['active-clients-select'] })
    },
  })

  // Delete lead mutation (Admin only)
  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['active-clients-select'] })
    },
  })

  // Explicit convert lead to client mutation
  const convertLeadToClient = useMutation({
    mutationFn: async ({ leadId, companyName, contactPerson }: { leadId: string; companyName?: string; contactPerson?: string }) => {
      const { data, error } = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: leadId,
        p_company_name: companyName || null,
        p_contact_person: contactPerson || null,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['active-clients-select'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })

  return {
    leads: leads || [],
    isLoading,
    error,
    createLead: createLead.mutateAsync,
    updateLead: updateLead.mutateAsync,
    deleteLead: deleteLead.mutateAsync,
    convertLeadToClient: convertLeadToClient.mutateAsync,
    isCreating: createLead.isPending,
    isUpdating: updateLead.isPending,
    isDeleting: deleteLead.isPending,
    isConverting: convertLeadToClient.isPending,
  }
}
