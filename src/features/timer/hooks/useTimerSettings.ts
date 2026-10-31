import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface TimerSettings {
  enabled: boolean
  max_duration_hours: number
  daily_cutoff_enabled: boolean
  daily_cutoff_time: string
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  enabled: true,
  max_duration_hours: 8,
  daily_cutoff_enabled: false,
  daily_cutoff_time: '20:00',
}

export function useTimerSettings() {
  const queryClient = useQueryClient()

  // 1. Fetch current timer settings
  const { data: settings = DEFAULT_TIMER_SETTINGS, isLoading, error, refetch } = useQuery({
    queryKey: ['timer-settings'],
    queryFn: async (): Promise<TimerSettings> => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'timer_settings')
        .maybeSingle()

      if (error) {
        console.error('Error fetching timer settings:', error)
        return DEFAULT_TIMER_SETTINGS
      }

      if (!data?.setting_value) {
        return DEFAULT_TIMER_SETTINGS
      }

      const val = data.setting_value as Partial<TimerSettings>
      return {
        enabled: typeof val.enabled === 'boolean' ? val.enabled : true,
        max_duration_hours: typeof val.max_duration_hours === 'number' ? val.max_duration_hours : 8,
        daily_cutoff_enabled: typeof val.daily_cutoff_enabled === 'boolean' ? val.daily_cutoff_enabled : false,
        daily_cutoff_time: val.daily_cutoff_time || '20:00',
      }
    },
    staleTime: 60000, // Cache for 1 min
  })

  // 2. Mutation to update timer settings (Admin only)
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: TimerSettings) => {
      const { data, error } = await supabase
        .from('app_settings')
        .upsert(
          {
            setting_key: 'timer_settings',
            setting_value: newSettings as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        )
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-settings'] })
      queryClient.invalidateQueries({ queryKey: ['active-timer'] })
      queryClient.invalidateQueries({ queryKey: ['admin-active-timers'] })
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
    },
  })

  // 3. Mutation to trigger auto cut-off sweep manually
  const triggerCutoffSweepMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('auto_cutoff_work_timers')
      if (error) throw error
      return data as { success: boolean; affected_count: number; message: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-timer'] })
      queryClient.invalidateQueries({ queryKey: ['admin-active-timers'] })
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
    },
  })

  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
    triggerCutoffSweep: triggerCutoffSweepMutation.mutateAsync,
    isSweeping: triggerCutoffSweepMutation.isPending,
  }
}
