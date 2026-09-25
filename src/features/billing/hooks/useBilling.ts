import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BillingRecord, RecurringBill } from '@/types/database.types'
import { useAuth } from '@/features/auth/AuthContext'

export interface BillingFilterParams {
  search?: string
  status?: string
  currency?: string
  clientId?: string
}

export function useBilling(filters: BillingFilterParams = {}) {
  const { user, isAdmin } = useAuth()
  const queryClient = useQueryClient()

  // Fetch billing records (one-off bills + materialized bills)
  const { data: bills, isLoading, error } = useQuery({
    queryKey: ['billing-records', filters, user?.id],
    queryFn: async () => {
      // Auto-ensure recurring retainers have their bills generated for current month
      try {
        const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
        await supabase.rpc('generate_billing_occurrences', { p_due_month: currentMonth })
      } catch {
        // Non-blocking for staff
      }

      let query = supabase
        .from('billing_records')
        .select(`
          *,
          clients (
            id,
            company_name
          ),
          profiles!billing_records_assigned_staff_id_fkey (
            id,
            full_name
          )
        `)
        .order('due_date', { ascending: false })

      if (!isAdmin && user?.id) {
        query = query.eq('assigned_staff_id', user.id)
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.currency && filters.currency !== 'all') {
        query = query.eq('currency', filters.currency)
      }

      if (filters.clientId && filters.clientId !== 'all') {
        query = query.eq('client_id', filters.clientId)
      }

      if (filters.search) {
        const term = `%${filters.search.trim()}%`
        query = query.or(`bill_title.ilike.${term},description.ilike.${term}`)
      }

      const { data, error } = await query
      if (error) throw error

      const todayStr = new Date().toISOString().split('T')[0]
      return (data || []).map((bill) => {
        const isOverdue = bill.due_date < todayStr && bill.status === 'pending'
        return {
          ...bill,
          displayStatus: isOverdue ? 'overdue' : bill.status,
        }
      })
    },
    enabled: !!user?.id,
  })

  // Fetch recurring bills
  const { data: recurringBills, isLoading: isRecurringLoading } = useQuery({
    queryKey: ['recurring-bills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_bills')
        .select(`
          *,
          clients (
            id,
            company_name
          ),
          profiles!recurring_bills_assigned_staff_id_fkey (
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: isAdmin,
  })

  // Create Bill mutation
  const createBill = useMutation({
    mutationFn: async (payload: Partial<BillingRecord>) => {
      const { data, error } = await supabase
        .from('billing_records')
        .insert([{ ...payload, created_by: user?.id }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-records'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-bills'] })
    },
  })

  // Update Bill mutation
  const updateBill = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BillingRecord> }) => {
      const { data, error } = await supabase
        .from('billing_records')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-records'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-bills'] })
    },
  })

  // Mark Paid mutation
  const markPaid = useMutation({
    mutationFn: async ({ id, paidDate }: { id: string; paidDate?: string }) => {
      const today = paidDate || new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('billing_records')
        .update({
          status: 'paid',
          paid_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-records'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-bills'] })
    },
  })

  // Delete Bill mutation
  const deleteBill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('billing_records').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-records'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-bills'] })
    },
  })

  // Create Recurring Retainer Schedule
  const createRecurringBill = useMutation({
    mutationFn: async (payload: Partial<RecurringBill>) => {
      const { data, error } = await supabase
        .from('recurring_bills')
        .insert([{ ...payload, created_by: user?.id }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] })
      queryClient.invalidateQueries({ queryKey: ['billing-records'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-bills'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })

  // Toggle Recurring Active/Paused
  const toggleRecurringActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('recurring_bills')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] })
      queryClient.invalidateQueries({ queryKey: ['billing-records'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-bills'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })

  // Generate Occurrences RPC
  const generateOccurrences = useMutation({
    mutationFn: async (targetMonth: string) => {
      const { data, error } = await supabase.rpc('generate_billing_occurrences', {
        p_due_month: targetMonth,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-records'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-bills'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] })
    },
  })

  return {
    bills: bills || [],
    recurringBills: recurringBills || [],
    isLoading,
    isRecurringLoading,
    createBill: createBill.mutateAsync,
    updateBill: updateBill.mutateAsync,
    markPaid: markPaid.mutateAsync,
    deleteBill: deleteBill.mutateAsync,
    createRecurringBill: createRecurringBill.mutateAsync,
    toggleRecurringActive: toggleRecurringActive.mutateAsync,
    generateOccurrences: generateOccurrences.mutateAsync,
  }
}
