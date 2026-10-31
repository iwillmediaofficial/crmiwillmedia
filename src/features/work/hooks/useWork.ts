import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { WorkItem } from '@/types/database.types'
import { useAuth } from '@/features/auth/AuthContext'

export interface WorkFilterParams {
  search?: string
  status?: string
  priority?: string
  staffId?: string
  clientId?: string
  dueFilter?: 'all' | 'today' | 'overdue' | 'upcoming'
  dateField?: 'due_date' | 'start_date'
  startDate?: string
  endDate?: string
}

export function useWork(filters: WorkFilterParams = {}) {
  const { user, isAdmin } = useAuth()
  const queryClient = useQueryClient()

  // Fetch work items with client and assigned staff joins + sum of timer entries
  const { data: workItems = [], isLoading, error } = useQuery({
    queryKey: ['work-items', filters, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('work_items')
        .select(`
          *,
          clients (
            id,
            company_name,
            contact_person
          ),
          profiles!work_items_assigned_staff_id_fkey (
            id,
            full_name,
            designation,
            avatar_url
          ),
          creator:profiles!work_items_created_by_fkey (
            id,
            full_name,
            role,
            designation
          ),
          work_time_entries (
            id,
            duration_seconds,
            stopped_at
          )
        `)
        .order('due_date', { ascending: true })

      if (!isAdmin && user?.id) {
        query = query.eq('assigned_staff_id', user.id)
      } else if (filters.staffId && filters.staffId !== 'all') {
        query = query.eq('assigned_staff_id', filters.staffId)
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority)
      }

      if (filters.clientId && filters.clientId !== 'all') {
        query = query.eq('client_id', filters.clientId)
      }

      if (filters.search) {
        const term = `%${filters.search.trim()}%`
        query = query.or(`title.ilike.${term},description.ilike.${term}`)
      }

      // 1. Original Deadlines Filter (Untouched)
      const today = new Date().toISOString().split('T')[0]
      if (filters.dueFilter === 'today') {
        query = query.eq('due_date', today)
      } else if (filters.dueFilter === 'overdue') {
        query = query.lt('due_date', today).neq('status', 'completed')
      } else if (filters.dueFilter === 'upcoming') {
        query = query.gt('due_date', today)
      }

      // 2. New Dedicated Date Range Filter (From / To)
      const targetDateField = filters.dateField || 'due_date'
      if (filters.startDate) {
        query = query.gte(targetDateField, filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte(targetDateField, filters.endDate)
      }

      const { data, error } = await query
      if (error) throw error

      // Compute total duration_seconds per work item
      const mapped = (data || []).map((item: any) => {
        const totalDuration = (item.work_time_entries || []).reduce(
          (sum: number, entry: any) => sum + (entry.duration_seconds || 0),
          0
        )
        const hasActiveTimer = (item.work_time_entries || []).some(
          (entry: any) => entry.stopped_at === null
        )
        return {
          ...item,
          totalDurationSeconds: totalDuration,
          hasActiveTimer,
        }
      })

      // Sort items intelligently:
      // 1. Items with active timer first
      // 2. Status priority: in_progress (1), assigned (2), pending (3), completed (4), cancelled (5)
      // 3. For active items: due_date ascending, then created_at descending
      // 4. For completed items: completed_at / updated_at descending
      const statusWeight: Record<string, number> = {
        in_progress: 1,
        assigned: 2,
        pending: 3,
        completed: 4,
        cancelled: 5,
      }

      return mapped.sort((a: any, b: any) => {
        if (a.hasActiveTimer && !b.hasActiveTimer) return -1
        if (!a.hasActiveTimer && b.hasActiveTimer) return 1

        const weightA = statusWeight[a.status] || 99
        const weightB = statusWeight[b.status] || 99
        if (weightA !== weightB) return weightA - weightB

        if (a.status !== 'completed' && a.due_date && b.due_date) {
          const dueDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          if (dueDiff !== 0) return dueDiff
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    },
    enabled: !!user?.id,
  })

  // Mutation to create work item
  const createWorkItemMutation = useMutation({
    mutationFn: async (payload: Partial<WorkItem>) => {
      const { data, error } = await supabase
        .from('work_items')
        .insert([{ ...payload, created_by: user?.id }])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
    },
  })

  // Mutation to update work item
  const updateWorkItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WorkItem> }) => {
      const { data, error } = await supabase
        .from('work_items')
        .update(updates)
        .eq('id', id)
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
    },
  })

  // Mutation to mark work item completed
  const markCompletedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('mark_work_item_completed', {
        p_work_item_id: id,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['billing-records'] })
    },
  })

  // Mutation to delete work item (Admins only)
  const deleteWorkItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('work_items').delete().eq('id', id)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
    },
  })

  return {
    workItems,
    isLoading,
    error,
    createWorkItem: createWorkItemMutation.mutateAsync,
    updateWorkItem: updateWorkItemMutation.mutateAsync,
    markCompleted: markCompletedMutation.mutateAsync,
    deleteWorkItem: deleteWorkItemMutation.mutateAsync,
    isCreating: createWorkItemMutation.isPending,
    isUpdating: updateWorkItemMutation.isPending,
    isCompleting: markCompletedMutation.isPending,
  }
}
