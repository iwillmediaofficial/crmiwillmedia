import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { WorkTimeEntry } from '@/types/database.types'
import { useTimerSettings } from './useTimerSettings'

export interface ActiveTimerInfo {
  entry: WorkTimeEntry
  workItemTitle?: string
  clientName?: string
  elapsedSeconds: number
  maxLimitSeconds: number | null
  secondsUntilCutoff: number | null
  isNearCutoff: boolean
}

export function useTimer() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tickerSeconds, setTickerSeconds] = useState<number>(0)
  const autoStoppingRef = useRef<boolean>(false)
  const { settings: timerSettings } = useTimerSettings()

  const maxLimitSeconds = timerSettings.enabled
    ? Math.round(timerSettings.max_duration_hours * 3600)
    : null

  // Query active running timer for current user
  const { data: runningEntry, refetch } = useQuery({
    queryKey: ['active-timer', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('work_time_entries')
        .select(`
          *,
          work_items (
            id,
            title,
            clients (
              company_name
            )
          )
        `)
        .eq('staff_id', user.id)
        .is('stopped_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching running timer:', error)
        return null
      }
      return data
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Sync with database every 30s to keep clock drift zero
  })

  // Start timer mutation
  const startTimerMutation = useMutation({
    mutationFn: async (workItemId: string) => {
      autoStoppingRef.current = false
      const { data, error } = await supabase.rpc('start_work_timer', {
        p_work_item_id: workItemId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-timer'] })
      queryClient.invalidateQueries({ queryKey: ['admin-active-timers'] })
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
    },
  })

  // Stop timer mutation
  const stopTimerMutation = useMutation({
    mutationFn: async (entryId?: string) => {
      const targetId = entryId || runningEntry?.id
      if (!targetId) throw new Error('No active timer to stop')
      const { data, error } = await supabase.rpc('stop_work_timer', {
        p_entry_id: targetId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      autoStoppingRef.current = false
      queryClient.invalidateQueries({ queryKey: ['active-timer'] })
      queryClient.invalidateQueries({ queryKey: ['admin-active-timers'] })
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['time-entries'] })
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
    },
  })

  // Local 1-second ticker + client-side auto cut-off threshold enforcement
  useEffect(() => {
    if (!runningEntry?.started_at) {
      setTickerSeconds(0)
      autoStoppingRef.current = false
      return
    }

    const calcElapsed = () => {
      const startMs = new Date(runningEntry.started_at).getTime()
      const nowMs = Date.now()
      return Math.max(0, Math.floor((nowMs - startMs) / 1000))
    }

    const initialElapsed = calcElapsed()

    // If timer has already surpassed the max cutoff limit, trigger auto-stop
    if (maxLimitSeconds && initialElapsed >= maxLimitSeconds) {
      setTickerSeconds(maxLimitSeconds)
      if (!autoStoppingRef.current) {
        autoStoppingRef.current = true
        stopTimerMutation.mutate(runningEntry.id)
      }
      return
    }

    setTickerSeconds(initialElapsed)

    const interval = setInterval(() => {
      const current = calcElapsed()

      if (maxLimitSeconds && current >= maxLimitSeconds) {
        setTickerSeconds(maxLimitSeconds)
        if (!autoStoppingRef.current) {
          autoStoppingRef.current = true
          stopTimerMutation.mutate(runningEntry.id)
        }
        clearInterval(interval)
        return
      }

      setTickerSeconds(current)
    }, 1000)

    return () => clearInterval(interval)
  }, [runningEntry?.id, runningEntry?.started_at, maxLimitSeconds])

  const secondsUntilCutoff = maxLimitSeconds
    ? Math.max(0, maxLimitSeconds - tickerSeconds)
    : null

  // Near cutoff if within 30 minutes of limit
  const isNearCutoff = !!(secondsUntilCutoff !== null && secondsUntilCutoff > 0 && secondsUntilCutoff <= 1800)

  const activeTimer: ActiveTimerInfo | null = runningEntry
    ? {
        entry: runningEntry as WorkTimeEntry,
        workItemTitle: (runningEntry as any).work_items?.title,
        clientName: (runningEntry as any).work_items?.clients?.company_name,
        elapsedSeconds: tickerSeconds,
        maxLimitSeconds,
        secondsUntilCutoff,
        isNearCutoff,
      }
    : null

  return {
    activeTimer,
    isRunning: !!runningEntry,
    startTimer: startTimerMutation.mutateAsync,
    stopTimer: stopTimerMutation.mutateAsync,
    isStarting: startTimerMutation.isPending,
    isStopping: stopTimerMutation.isPending,
    refetchActiveTimer: refetch,
    timerSettings,
    isNearCutoff,
    secondsUntilCutoff,
  }
}
