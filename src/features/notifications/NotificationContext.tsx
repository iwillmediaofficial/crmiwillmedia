import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { Notification } from '@/types/database.types'
import {
  playNotificationSound,
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from '@/utils/notificationSound'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  soundEnabled: boolean
  toggleSound: () => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  activeToast: Notification | null
  dismissToast: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(isNotificationSoundEnabled)
  const [activeToast, setActiveToast] = useState<Notification | null>(null)

  // Listen to sound toggle events
  useEffect(() => {
    const handleSoundToggle = (e: any) => {
      setSoundEnabledState(e.detail)
    }
    window.addEventListener('notification-sound-toggled', handleSoundToggle)
    return () => window.removeEventListener('notification-sound-toggled', handleSoundToggle)
  }, [])

  const toggleSound = useCallback(() => {
    const newState = !soundEnabled
    setSoundEnabledState(newState)
    setNotificationSoundEnabled(newState)
    if (newState) {
      // Play a quick test chime so user knows audio is working
      playNotificationSound()
    }
  }, [soundEnabled])

  // Fetch recent notifications for this user
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['user-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return (data || []) as Notification[]
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  })

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length
  }, [notifications])

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', user?.id] })
    },
  })

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', user?.id] })
    },
  })

  const dismissToast = useCallback(() => {
    setActiveToast(null)
  }, [])

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null)
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [activeToast])

  // Tab Title Flashing when inactive and new notification arrives
  const flashTabTitle = useCallback((msg: string) => {
    if (typeof document === 'undefined' || !document.hidden) return
    const originalTitle = document.title
    let isOriginal = false
    const interval = setInterval(() => {
      document.title = isOriginal ? originalTitle : `🔔 (1) ${msg}`
      isOriginal = !isOriginal
    }, 1200)

    const handleFocus = () => {
      clearInterval(interval)
      document.title = originalTitle
      window.removeEventListener('focus', handleFocus)
    }
    window.addEventListener('focus', handleFocus, { once: true })
  }, [])

  // Supabase Realtime WebSocket Subscription
  useEffect(() => {
    if (!user?.id) return

    const channelName = `realtime:notifications:${user.id}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          if (!newNotif) return

          // 1. Play chime sound
          playNotificationSound()

          // 2. Trigger floating popup toast
          setActiveToast(newNotif)

          // 3. Tab title alert if hidden
          flashTabTitle('New Work Assigned!')

          // 4. Invalidate notifications query to refresh badge and list
          queryClient.invalidateQueries({ queryKey: ['user-notifications', user.id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient, flashTabTitle])

  const markAsRead = async (id: string) => {
    await markAsReadMutation.mutateAsync(id)
  }

  const markAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync()
  }

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      soundEnabled,
      toggleSound,
      markAsRead,
      markAllAsRead,
      activeToast,
      dismissToast,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      soundEnabled,
      toggleSound,
      activeToast,
      dismissToast,
    ]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
