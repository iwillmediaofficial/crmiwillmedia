import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types/database.types'
import { useAuth } from '@/features/auth/AuthContext'

export function useClients(searchTerm: string = '', statusFilter: string = 'all') {
  const { user, isAdmin } = useAuth()
  const queryClient = useQueryClient()

  // Fetch clients
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .order('company_name', { ascending: true })

      if (!isAdmin) {
        query = query.eq('status', 'active')
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (searchTerm) {
        const term = `%${searchTerm.trim()}%`
        query = query.or(
          `company_name.ilike.${term},contact_person.ilike.${term},email.ilike.${term},phone.ilike.${term}`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return data as Client[]
    },
    enabled: !!user?.id,
  })

  // Create client mutation
  const createClient = useMutation({
    mutationFn: async (payload: Partial<Client>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...payload, created_by: user?.id }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['active-clients-select'] })
    },
  })

  // Update client mutation
  const updateClient = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      const { data, error } = await supabase
        .from('clients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['active-clients-select'] })
    },
  })

  return {
    clients: clients || [],
    isLoading,
    error,
    createClient: createClient.mutateAsync,
    updateClient: updateClient.mutateAsync,
    isCreating: createClient.isPending,
    isUpdating: updateClient.isPending,
  }
}
