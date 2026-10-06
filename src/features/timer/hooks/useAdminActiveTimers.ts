import { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'

export interface StaffActiveTimer {
  entryId: string
  staffId: string
  staffName: string
  staffAvatarUrl?: string
  staffDesignation?: string
  workItemId: string
  workItemTitle: string
  clientName?: string
  startedAt: string
  elapsedSeconds: number
}

export function useAdminActiveTimers() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [nowMs, setNowMs] = useState<number>(Date.now())

  // Query all running timers across all staff (Admins have full SELECT permission)
  const { data: rawEntries = [], refetch, isLoading } = useQuery({
    queryKey: ['admin-active-timers'],
    queryFn: async () => {
      if (!isAdmin) return []
      const { data, error } = await supabase
        .from('work_time_entries')
        .select(`
          id,
          work_item_id,
          staff_id,
          started_at,
          profiles (
            id,
            full_name,
            avatar_url,
            designation
          ),
          work_items (
            id,
            title,
            clients (
              company_name
            )
          )
        `)
        .is('stopped_at', null)
        .order('started_at', { ascending: false })

      if (error) {
        console.error('Error fetching admin active timers:', error)
        return []
      }
      return data || []
    },
    enabled: !!isAdmin,
    refetchInterval: 30000, // Background sync every 30s
  })

  // Realtime subscription: Invalidate query immediately whenever a timer is started or stopped
  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel('realtime:admin_work_time_entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_time_entries',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-active-timers'] })
          queryClient.invalidateQueries({ queryKey: ['work-items'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin, queryClient])

  // Smooth local 1-second ticker (0 API requests)
  useEffect(() => {
    if (!rawEntries || rawEntries.length === 0) return

    const interval = setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [rawEntries.length])

  // Process raw entries into strongly-typed StaffActiveTimer objects with live elapsedSeconds
  const activeTimers = useMemo<StaffActiveTimer[]>(() => {
    return rawEntries.map((entry: any) => {
      const startMs = new Date(entry.started_at).getTime()
      const elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000))

      return {
        entryId: entry.id,
        staffId: entry.staff_id,
        staffName: entry.profiles?.full_name || 'Staff Member',
        staffAvatarUrl: entry.profiles?.avatar_url,
        staffDesignation: entry.profiles?.designation || 'Staff',
        workItemId: entry.work_item_id,
        workItemTitle: entry.work_items?.title || 'Deliverable',
        clientName: entry.work_items?.clients?.company_name || 'Client',
        startedAt: entry.started_at,
        elapsedSeconds: elapsed,
      }
    })
  }, [rawEntries, nowMs])

  // Quick lookup mappings by staffId and by workItemId
  const activeTimersByStaffId = useMemo<Record<string, StaffActiveTimer>>(() => {
    const map: Record<string, StaffActiveTimer> = {}
    for (const timer of activeTimers) {
      map[timer.staffId] = timer
    }
    return map
  }, [activeTimers])

  const activeTimersByWorkItemId = useMemo<Record<string, StaffActiveTimer>>(() => {
    const map: Record<string, StaffActiveTimer> = {}
    for (const timer of activeTimers) {
      map[timer.workItemId] = timer
    }
    return map
  }, [activeTimers])

  return {
    activeTimers,
    activeTimersByStaffId,
    activeTimersByWorkItemId,
    activeCount: activeTimers.length,
    isLoading,
    refetch,
  }
}
