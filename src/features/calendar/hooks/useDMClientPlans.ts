import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { DMClientDeliverablePlan, DMClientDeliverablePlanInsert } from '@/types/database.types'

export function useDMClientPlans(clientId?: string) {
  const queryClient = useQueryClient()

  // Fetch plans for a specific client or all active DM clients
  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: ['dm-client-plans', clientId || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('dm_client_deliverable_plans')
        .select(`
          *,
          clients (
            id,
            company_name
          ),
          profiles:default_staff_id (
            id,
            full_name,
            designation,
            avatar_url
          )
        `)
        .order('created_at', { ascending: true })

      if (clientId && clientId !== 'all') {
        query = query.eq('client_id', clientId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as (DMClientDeliverablePlan & { clients?: any; profiles?: any })[]
    },
    enabled: true,
  })

  // Create plan
  const createPlan = useMutation({
    mutationFn: async (payload: DMClientDeliverablePlanInsert) => {
      const { data, error } = await supabase
        .from('dm_client_deliverable_plans')
        .insert([payload])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-client-plans'] })
      queryClient.invalidateQueries({ queryKey: ['dm-work-items'] })
    },
  })

  // Update plan
  const updatePlan = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DMClientDeliverablePlan> }) => {
      const { data, error } = await supabase
        .from('dm_client_deliverable_plans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-client-plans'] })
      queryClient.invalidateQueries({ queryKey: ['dm-work-items'] })
    },
  })

  // Delete plan
  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dm_client_deliverable_plans')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-client-plans'] })
      queryClient.invalidateQueries({ queryKey: ['dm-work-items'] })
    },
  })

  // Delete all plans for a client
  const deleteAllPlansForClient = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('dm_client_deliverable_plans')
        .delete()
        .eq('client_id', clientId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-client-plans'] })
      queryClient.invalidateQueries({ queryKey: ['dm-work-items'] })
    },
  })

  // Helper to initialize standard starter plan (e.g. 8 posters + 4 videos) for a client
  const initializeStandardPackage = useMutation({
    mutationFn: async ({
      clientId,
      designerStaffId,
      videoEditorStaffId,
    }: {
      clientId: string
      designerStaffId?: string | null
      videoEditorStaffId?: string | null
    }) => {
      const standardItems: DMClientDeliverablePlanInsert[] = [
        {
          client_id: clientId,
          deliverable_type: 'poster',
          title_template: 'Poster #{n}',
          monthly_count: 8,
          default_staff_id: designerStaffId || null,
          assigned_staff_ids: designerStaffId ? [designerStaffId] : [],
          start_lead_days: 2,
          preferred_days: [2, 5], // Tuesday & Friday
          is_active: true,
        },
        {
          client_id: clientId,
          deliverable_type: 'video',
          title_template: 'Reel Video #{n}',
          monthly_count: 4,
          default_staff_id: videoEditorStaffId || null,
          assigned_staff_ids: videoEditorStaffId ? [videoEditorStaffId] : [],
          start_lead_days: 3,
          preferred_days: [6], // Saturday
          is_active: true,
        },
      ]

      const { data, error } = await supabase
        .from('dm_client_deliverable_plans')
        .insert(standardItems)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-client-plans'] })
      queryClient.invalidateQueries({ queryKey: ['dm-work-items'] })
    },
  })

  return {
    plans,
    isLoading,
    error,
    createPlan: createPlan.mutateAsync,
    updatePlan: updatePlan.mutateAsync,
    deletePlan: deletePlan.mutateAsync,
    deleteAllPlansForClient: deleteAllPlansForClient.mutateAsync,
    initializeStandardPackage: initializeStandardPackage.mutateAsync,
    isCreating: createPlan.isPending,
    isUpdating: updatePlan.isPending,
    isDeletingAll: deleteAllPlansForClient.isPending,
  }
}
