import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { WorkItem } from '@/types/database.types'
import { useAuth } from '@/features/auth/AuthContext'

export interface WorkFilterParams {
  search?: string
  status?: string
  priority?: string
  staffId?: string
  clientId?: string
  dueFilter?: 'all' | 'today' | 'tomorrow' | 'overdue' | 'upcoming'
}

export function useWork(filters: WorkFilterParams = {}) {
  const { user, isAdmin } = useAuth()
  const queryClient = useQueryClient()

  // Fetch work items with client and assigned staff joins + sum of timer entries
  const { data: workItems, isLoading, error } = useQuery({
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

      const today = new Date().toISOString().split('T')[0]
      if (filters.dueFilter === 'today') {
        query = query.eq('due_date', today)
      } else if (filters.dueFilter === 'overdue') {
        query = query.lt('due_date', today).neq('status', 'completed')
      } else if (filters.dueFilter === 'upcoming') {
        query = query.gt('due_date', today)
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

        if (a.status === 'completed' || a.status === 'cancelled') {
          const timeA = new Date(a.completed_at || a.updated_at || a.created_at).getTime()
          const timeB = new Date(b.completed_at || b.updated_at || b.created_at).getTime()
          return timeB - timeA
        }

        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity
        if (dateA !== dateB) return dateA - dateB

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    },
    enabled: !!user?.id,
  })

  // Create work item mutation (Admin)
  const createWorkItem = useMutation({
    mutationFn: async (payload: Partial<WorkItem>) => {
      const { data, error } = await supabase
        .from('work_items')
        .insert([{ ...payload, created_by: user?.id }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })

  // Update work item mutation
  const updateWorkItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WorkItem> }) => {
      const { data, error } = await supabase
        .from('work_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['billing-records'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-bills'] })
    },
  })

  // Mark Completed mutation
  const markCompleted = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('work_items')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['billing-records'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-bills'] })
    },
  })

  // Delete work item (Admin)
  const deleteWorkItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('work_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })

  return {
    workItems: workItems || [],
    isLoading,
    error,
    createWorkItem: createWorkItem.mutateAsync,
    updateWorkItem: updateWorkItem.mutateAsync,
    markCompleted: markCompleted.mutateAsync,
    deleteWorkItem: deleteWorkItem.mutateAsync,
    isCreating: createWorkItem.isPending,
    isUpdating: updateWorkItem.isPending,
  }
}
