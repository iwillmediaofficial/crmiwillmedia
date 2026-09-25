import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database.types'
import { useAuth } from '@/features/auth/AuthContext'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export interface StaffFormPayload {
  email: string
  password?: string
  full_name: string
  phone?: string
  department?: string
  designation?: string
  role: string
  active?: boolean
}

export function useStaff() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()

  // Query all staff profiles
  const { data: staffList, isLoading, error } = useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
    enabled: isAdmin,
  })

  // Create staff user mutation
  const createStaff = useMutation({
    mutationFn: async (payload: StaffFormPayload) => {
      if (!payload.password) throw new Error('Password is required for creating a staff login')
      
      // Use an isolated temporary client so admin's current browser session is preserved
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })

      const { data, error } = await tempClient.auth.signUp({
        email: payload.email.trim(),
        password: payload.password,
        options: {
          data: {
            full_name: payload.full_name.trim(),
            role: payload.role,
            department: payload.department,
            designation: payload.designation,
            phone: payload.phone,
          },
        },
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] })
      queryClient.invalidateQueries({ queryKey: ['staff-profiles-active'] })
    },
  })

  // Update staff profile mutation
  const updateStaff = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Profile> }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] })
      queryClient.invalidateQueries({ queryKey: ['staff-profiles-active'] })
    },
  })

  // Toggle active status mutation
  const toggleActiveStatus = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] })
      queryClient.invalidateQueries({ queryKey: ['staff-profiles-active'] })
    },
  })

  return {
    staffList: staffList || [],
    isLoading,
    error,
    createStaff: createStaff.mutateAsync,
    updateStaff: updateStaff.mutateAsync,
    toggleActiveStatus: toggleActiveStatus.mutateAsync,
    isCreating: createStaff.isPending,
    isUpdating: updateStaff.isPending,
  }
}
