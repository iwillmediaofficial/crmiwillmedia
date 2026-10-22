import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { WorkItem, Client, Profile } from '@/types/database.types'
import { useAuth } from '@/features/auth/AuthContext'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
} from 'date-fns'
import { generateMonthDeliverablesSchedule } from '../utils/dmScheduler'

export interface DMCalendarFilters {
  clientId?: string
  staffId?: string
  deliverableType?: string
  search?: string
  scope?: 'configured' | 'all'
}

export type EnrichedDMWorkItem = WorkItem & {
  clients?: {
    id: string
    company_name: string
    contact_person: string
    logo_url: string | null
    is_dm_client?: boolean
    dm_auto_assign_recurring?: boolean
  }
  profiles?: {
    id: string
    full_name: string
    designation: string | null
    avatar_url: string | null
  }
}

export function useDMCalendar(initialDate: Date = new Date()) {
  const { user, isAdmin } = useAuth()
  const queryClient = useQueryClient()

  const [currentDate, setCurrentDate] = useState<Date>(initialDate)
  const [filters, setFilters] = useState<DMCalendarFilters>({
    clientId: 'all',
    staffId: 'all',
    deliverableType: 'all',
    search: '',
    scope: 'configured',
  })

  // Date intervals
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const startDateStr = format(calendarStart, 'yyyy-MM-dd')
  const endDateStr = format(calendarEnd, 'yyyy-MM-dd')
  const currentMonthStr = format(monthStart, 'yyyy-MM')

  // 1. Fetch active DM clients
  const { data: dmClients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['dm-active-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_dm_client', true)
        .eq('status', 'active')
        .order('company_name')
      if (error) throw error
      return (data || []) as Client[]
    },
  })

  // 2. Fetch active staff list
  const { data: staffList = [] } = useQuery({
    queryKey: ['active-staff-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, designation, role, avatar_url')
        .eq('active', true)
        .order('full_name')
      if (error) throw error
      return (data || []) as Profile[]
    },
  })

  // 3. Fetch recurring deliverable plans for target DM clients
  const { data: clientPlans = [] } = useQuery({
    queryKey: ['dm-client-plans', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dm_client_deliverable_plans')
        .select('*')
        .eq('is_active', true)
      if (error) throw error
      return data || []
    },
  })

  // 4. Fetch DM work deliverables within the calendar window
  const { data: deliverables = [], isLoading: isLoadingDeliverables } = useQuery({
    queryKey: ['dm-work-items', startDateStr, endDateStr, filters, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('work_items')
        .select(`
          *,
          clients!inner (
            id,
            company_name,
            contact_person,
            logo_url,
            is_dm_client,
            dm_auto_assign_recurring
          ),
          profiles:assigned_staff_id (
            id,
            full_name,
            designation,
            avatar_url
          )
        `)
        .eq('clients.is_dm_client', true)
        .gte('due_date', startDateStr)
        .lte('due_date', endDateStr)
        .order('due_date', { ascending: true })

      // Role filter for non-admins
      if (!isAdmin && user?.id) {
        query = query.eq('assigned_staff_id', user.id)
      } else if (filters.staffId && filters.staffId !== 'all') {
        query = query.eq('assigned_staff_id', filters.staffId)
      }

      // Scope filter: by default show only configured monthly deliverables
      if (filters.scope !== 'all') {
        query = query.or('dm_plan_id.not.is.null,deliverable_type.neq.general')
      }

      if (filters.clientId && filters.clientId !== 'all') {
        query = query.eq('client_id', filters.clientId)
      }

      if (filters.deliverableType && filters.deliverableType !== 'all') {
        query = query.eq('deliverable_type', filters.deliverableType)
      }

      if (filters.search) {
        const term = `%${filters.search.trim()}%`
        query = query.ilike('title', term)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as EnrichedDMWorkItem[]
    },
    enabled: !!user?.id,
  })

  // Group deliverables by due_date
  const deliverablesByDueDate = useMemo(() => {
    return (deliverables || []).reduce((acc: Record<string, EnrichedDMWorkItem[]>, item) => {
      const d = item.due_date
      if (!acc[d]) acc[d] = []
      acc[d].push(item)
      return acc
    }, {})
  }, [deliverables])

  // Group deliverables by start_date
  const deliverablesByStartDate = useMemo(() => {
    return (deliverables || []).reduce((acc: Record<string, EnrichedDMWorkItem[]>, item) => {
      const s = item.start_date || item.assigned_date
      if (!acc[s]) acc[s] = []
      acc[s].push(item)
      return acc
    }, {})
  }, [deliverables])

  // Month Quotas and Metrics calculation
  const monthlyMetrics = useMemo(() => {
    // Current month deliverables only
    const monthItems = deliverables.filter((item) => item.due_date.startsWith(currentMonthStr))

    const totalScheduled = monthItems.length
    const completed = monthItems.filter((i) => i.status === 'completed').length
    const inProgress = monthItems.filter((i) => i.status === 'in_progress').length
    const pending = monthItems.filter((i) => i.status === 'pending' || i.status === 'assigned').length

    const posters = monthItems.filter((i) => i.deliverable_type === 'poster')
    const videos = monthItems.filter(
      (i) => i.deliverable_type === 'video' || i.deliverable_type === 'reel'
    )
    const carousels = monthItems.filter(
      (i) => i.deliverable_type === 'carousel' || i.deliverable_type === 'story'
    )
    const others = monthItems.filter(
      (i) =>
        i.deliverable_type !== 'poster' &&
        i.deliverable_type !== 'video' &&
        i.deliverable_type !== 'reel' &&
        i.deliverable_type !== 'carousel' &&
        i.deliverable_type !== 'story'
    )

    // Planned targets from client plans
    const relevantPlans = clientPlans.filter((p) => {
      if (filters.clientId && filters.clientId !== 'all') {
        return p.client_id === filters.clientId
      }
      return true
    })

    const targetPosters = relevantPlans
      .filter((p) => p.deliverable_type === 'poster')
      .reduce((sum, p) => sum + p.monthly_count, 0)

    const targetVideos = relevantPlans
      .filter((p) => p.deliverable_type === 'video' || p.deliverable_type === 'reel')
      .reduce((sum, p) => sum + p.monthly_count, 0)

    return {
      totalScheduled,
      completed,
      inProgress,
      pending,
      posters: {
        scheduled: posters.length,
        completed: posters.filter((p) => p.status === 'completed').length,
        target: targetPosters || posters.length,
      },
      videos: {
        scheduled: videos.length,
        completed: videos.filter((v) => v.status === 'completed').length,
        target: targetVideos || videos.length,
      },
      carousels: {
        scheduled: carousels.length,
        completed: carousels.filter((c) => c.status === 'completed').length,
      },
      others: {
        scheduled: others.length,
        completed: others.filter((o) => o.status === 'completed').length,
      },
    }
  }, [deliverables, clientPlans, currentMonthStr, filters.clientId])

  // Bulk create work items mutation (Auto-assign 1-month work)
  const bulkCreateWorkItems = useMutation({
    mutationFn: async (items: Partial<WorkItem>[]) => {
      const recordsToInsert = items.map((item) => ({
        ...item,
        created_by: user?.id,
        status: item.status || 'assigned',
        priority: item.priority || 'normal',
        billing_status: item.billing_status || 'unbilled',
        is_billable: item.is_billable ?? false,
        billable_amount: item.billable_amount ?? 0,
        currency: item.currency || 'INR',
      }))

      const { data, error } = await supabase
        .from('work_items')
        .insert(recordsToInsert)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-work-items'] })
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
    },
  })

  // Toggle client auto-recurring mutation
  const toggleClientAutoRecurring = useMutation({
    mutationFn: async ({ clientId, enabled }: { clientId: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('clients')
        .update({
          dm_auto_assign_recurring: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-active-clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['dm-work-items'] })
    },
  })

  // Quick update work item mutation
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
      queryClient.invalidateQueries({ queryKey: ['dm-work-items'] })
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
    },
  })

  // Quick delete mutation
  const deleteWorkItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('work_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-work-items'] })
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
    },
  })

  // Quick toggle status helper
  const quickToggleStatus = async (item: EnrichedDMWorkItem) => {
    let nextStatus = 'assigned'
    let completedAt: string | null = null

    if (item.status === 'assigned') {
      nextStatus = 'in_progress'
    } else if (item.status === 'in_progress') {
      nextStatus = 'completed'
      completedAt = new Date().toISOString()
    } else if (item.status === 'completed') {
      nextStatus = 'assigned'
    }

    await updateWorkItem.mutateAsync({
      id: item.id,
      updates: {
        status: nextStatus,
        completed_at: completedAt,
      },
    })
  }

  // Quick reassign staff helper
  const quickReassignStaff = async (itemId: string, newStaffId: string) => {
    await updateWorkItem.mutateAsync({
      id: itemId,
      updates: { assigned_staff_id: newStaffId },
    })
  }

  // Reschedule deliverable dates helper
  const rescheduleDeliverable = async (
    itemId: string,
    newStartDate: string,
    newDueDate: string
  ) => {
    await updateWorkItem.mutateAsync({
      id: itemId,
      updates: {
        start_date: newStartDate,
        due_date: newDueDate,
        assigned_date: newStartDate,
      },
    })
  }

  // Auto-recurring: Find which DM clients with auto-recurring enabled have missing deliverables this month
  const unassignedRecurringClients = useMemo(() => {
    return dmClients.filter((client) => {
      if (client.dm_auto_assign_recurring === false) return false

      const hasPlans = clientPlans.some((p) => p.client_id === client.id && p.is_active)
      if (!hasPlans) return false

      // Check if already has deliverables scheduled for this month
      const count = deliverables.filter(
        (d) => d.client_id === client.id && d.due_date.startsWith(currentMonthStr)
      ).length

      return count === 0
    })
  }, [dmClients, clientPlans, deliverables, currentMonthStr])

  // Batch auto-assign for all unassigned recurring clients in this month
  const autoAssignUnassignedRecurringClients = async () => {
    let totalGenerated = 0
    for (const client of unassignedRecurringClients) {
      const plans = clientPlans.filter((p) => p.client_id === client.id && p.is_active)
      if (plans.length > 0) {
        const schedule = generateMonthDeliverablesSchedule({
          clientId: client.id,
          clientName: client.company_name,
          targetMonthDate: monthStart,
          plans,
        })
        if (schedule.length > 0) {
          await bulkCreateWorkItems.mutateAsync(schedule)
          totalGenerated += schedule.length
        }
      }
    }
    return totalGenerated
  }

  // Navigation functions
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  return {
    currentDate,
    setCurrentDate,
    monthStart,
    days,
    deliverables,
    deliverablesByDueDate,
    deliverablesByStartDate,
    monthlyMetrics,
    dmClients,
    staffList,
    clientPlans,
    filters,
    setFilters,
    isLoading: isLoadingClients || isLoadingDeliverables,
    nextMonth,
    prevMonth,
    goToToday,
    bulkCreateWorkItems: bulkCreateWorkItems.mutateAsync,
    updateWorkItem: updateWorkItem.mutateAsync,
    deleteWorkItem: deleteWorkItem.mutateAsync,
    quickToggleStatus,
    quickReassignStaff,
    rescheduleDeliverable,
    isBulkCreating: bulkCreateWorkItems.isPending,
    // Auto-recurring features
    unassignedRecurringClients,
    autoAssignUnassignedRecurringClients,
    toggleClientAutoRecurring: toggleClientAutoRecurring.mutateAsync,
  }
}
