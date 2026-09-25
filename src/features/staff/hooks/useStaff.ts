import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database.types'
import { useAuth } from '@/features/auth/AuthContext'

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

  // Create staff user mutation via admin_create_staff RPC (bypasses GoTrue email rate limits)
  const createStaff = useMutation({
    mutationFn: async (payload: StaffFormPayload) => {
      if (!payload.password) throw new Error('Password is required for creating a staff login')

      const { data, error } = await supabase.rpc('admin_create_staff', {
        p_email: payload.email.trim(),
        p_password: payload.password,
        p_full_name: payload.full_name.trim(),
        p_role: payload.role || 'staff',
        p_department: payload.department || null,
        p_designation: payload.designation || null,
        p_phone: payload.phone || null,
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
