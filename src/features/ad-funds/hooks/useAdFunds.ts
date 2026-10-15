import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Client,
  AdFundTransaction,
  ClientAdFundPayment,
  ClientAdFundAdjustment,
  AdPlatform,
  AdFundPaymentType,
  AdFundStatus,
} from '@/types/database.types'
import { startOfMonth, endOfMonth, format, parseISO, subMonths } from 'date-fns'

export interface ClientAdFundSummary {
  client: Client
  monthly_ad_fund: number
  original_ad_fund: number
  prev_unused_amount: number
  all_prev_unused_amount: number
  available_unused_fund: number
  accumulated_unused_spent: number
  uploaded_amount: number
  client_paid_amount: number
  need_collection_amount: number
  remaining_amount: number
  last_upload_date: string | null
  platforms: string[]
  status: AdFundStatus | string
}

export interface AdFundDashboardStats {
  totalAssigned: number
  totalOriginalFund: number
  totalPrevUnused: number
  totalUploaded: number
  totalRemaining: number
  totalClientPaid: number
  totalNeedCollection: number
  clientCount: number
}

export interface TransactionWithStaff extends AdFundTransaction {
  recorder?: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

export interface PaymentWithStaff extends ClientAdFundPayment {
  recorder?: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

export interface AdjustmentWithStaff extends ClientAdFundAdjustment {
  recorder?: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

export function useAdFunds(selectedYearMonth: string) {
  const queryClient = useQueryClient()

  // Derive date bounds for the selected month (e.g. "2026-10")
  const parsedDate = parseISO(`${selectedYearMonth}-01`)
  const monthStartStr = format(startOfMonth(parsedDate), 'yyyy-MM-dd')
  const monthEndStr = format(endOfMonth(parsedDate), 'yyyy-MM-dd')

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ad-funds-dashboard', selectedYearMonth],
    queryFn: async () => {
      // 1. Fetch clients
      const { data: clientsData, error: clientErr } = await supabase
        .from('clients')
        .select('*')
        .order('company_name', { ascending: true })

      if (clientErr) throw clientErr

      // 2. Fetch all ad fund transactions within the selected month
      const { data: monthTxData, error: txErr } = await supabase
        .from('ad_fund_transactions')
        .select('*')
        .gte('transaction_date', monthStartStr)
        .lte('transaction_date', monthEndStr)
        .order('transaction_date', { ascending: false })

      if (txErr) throw txErr

      // 2b. Fetch all manual adjustments up to the selected month (starting from October 2026)
      const { data: adjustmentsData } = await supabase
        .from('client_ad_fund_adjustments')
        .select('*')
        .gte('year_month', '2026-10')
        .lte('year_month', selectedYearMonth)

      const clientAdjustmentSumMap: Record<string, number> = {}
      adjustmentsData?.forEach((adj) => {
        const amt = Number(adj.amount || 0)
        clientAdjustmentSumMap[adj.client_id] = (clientAdjustmentSumMap[adj.client_id] || 0) + amt
      })

      // 2c. Fetch all historical transactions prior to selected month (starting from October 2026)
      const { data: pastTxData } = await supabase
        .from('ad_fund_transactions')
        .select('client_id, amount, transaction_date')
        .gte('transaction_date', '2026-10-01')
        .lt('transaction_date', monthStartStr)

      // Group past transactions by client and by month (YYYY-MM)
      const clientPastMonthTxMap: Record<string, Record<string, number>> = {}
      pastTxData?.forEach((tx) => {
        const monthKey = tx.transaction_date.substring(0, 7)
        if (!clientPastMonthTxMap[tx.client_id]) {
          clientPastMonthTxMap[tx.client_id] = {}
        }
        clientPastMonthTxMap[tx.client_id][monthKey] =
          (clientPastMonthTxMap[tx.client_id][monthKey] || 0) + Number(tx.amount || 0)
      })

      // Calculate past months auto-unused (only for months >= 2026-10 where transactions existed)
      const clientPastAutoUnusedMap: Record<string, number> = {}
      Object.entries(clientPastMonthTxMap).forEach(([clientId, monthsMap]) => {
        const cl = clientsData?.find((c) => c.id === clientId)
        const budget = Number(cl?.monthly_ad_fund || 0)
        let totalPastUnused = 0
        Object.entries(monthsMap).forEach(([_, spent]) => {
          totalPastUnused += Math.max(0, budget - spent)
        })
        clientPastAutoUnusedMap[clientId] = totalPastUnused
      })

      // 3. Fetch all client payments received within the selected month
      const { data: monthPaymentsData, error: payErr } = await supabase
        .from('client_ad_fund_payments')
        .select('*')
        .gte('payment_date', monthStartStr)
        .lte('payment_date', monthEndStr)
        .order('payment_date', { ascending: false })

      if (payErr) throw payErr

      // 4. Fetch latest upload date overall per client
      const { data: allTxData, error: allTxErr } = await supabase
        .from('ad_fund_transactions')
        .select('client_id, transaction_date')
        .order('transaction_date', { ascending: false })

      if (allTxErr) throw allTxErr

      const latestUploadMap: Record<string, string> = {}
      allTxData?.forEach((tx) => {
        if (!latestUploadMap[tx.client_id]) {
          latestUploadMap[tx.client_id] = tx.transaction_date
        }
      })

      // Aggregate upload amounts by payment type
      const clientTxSumMap: Record<string, number> = {}
      const clientDirectSumMap: Record<string, number> = {}
      const clientUnusedSpentMap: Record<string, number> = {}
      const clientAgencyUploadMap: Record<string, number> = {}

      monthTxData?.forEach((tx) => {
        const amt = Number(tx.amount || 0)
        clientTxSumMap[tx.client_id] = (clientTxSumMap[tx.client_id] || 0) + amt
        if (tx.payment_type === 'client') {
          clientDirectSumMap[tx.client_id] = (clientDirectSumMap[tx.client_id] || 0) + amt
        } else if (tx.payment_type === 'unused_fund') {
          clientUnusedSpentMap[tx.client_id] = (clientUnusedSpentMap[tx.client_id] || 0) + amt
        } else {
          // 'company' or 'personal' (agency money)
          clientAgencyUploadMap[tx.client_id] = (clientAgencyUploadMap[tx.client_id] || 0) + amt
        }
      })

      // Aggregate payments received from clients
      const clientPaySumMap: Record<string, number> = {}
      monthPaymentsData?.forEach((pay) => {
        const amt = Number(pay.amount || 0)
        clientPaySumMap[pay.client_id] = (clientPaySumMap[pay.client_id] || 0) + amt
      })

      // Filter to relevant DM clients only
      const dmClients = (clientsData || []).filter((c) => c.is_dm_client === true)
      const nonDmClients = (clientsData || []).filter((c) => !c.is_dm_client)

      let totalAssigned = 0
      let totalOriginalFund = 0
      let totalPrevUnused = 0
      let totalUploaded = 0
      let totalClientPaid = 0
      let totalNeedCollection = 0

      const clientSummaries: ClientAdFundSummary[] = dmClients.map((client) => {
        const monthlyBudget = Number(client.monthly_ad_fund || 0)
        const manualAdjustments = clientAdjustmentSumMap[client.id] || 0
        const autoPastUnused = clientPastAutoUnusedMap[client.id] || 0
        const allPrevUnusedRaw = manualAdjustments + autoPastUnused

        const uploaded = clientTxSumMap[client.id] || 0
        const unusedFundSpent = clientUnusedSpentMap[client.id] || 0
        const agencyUploaded = clientAgencyUploadMap[client.id] || 0

        const paymentsReceived = clientPaySumMap[client.id] || 0
        const directClientUpload = clientDirectSumMap[client.id] || 0
        const clientPaid = paymentsReceived + directClientUpload

        // To collect only applies to agency money (company/personal) minus what client has paid
        const toCollect = Math.max(0, agencyUploaded - clientPaid)

        // Remaining un-used funds after current month's deductions
        const availableUnused = Math.max(0, allPrevUnusedRaw - unusedFundSpent)

        // Original Ad Fund: starts as Monthly Budget + all previously un-used amount, and reduces as unused fund is chosen
        const originalAdFund = Math.max(0, (monthlyBudget + allPrevUnusedRaw) - unusedFundSpent)

        const remaining = Math.max(0, monthlyBudget - uploaded)

        totalAssigned += monthlyBudget
        totalOriginalFund += originalAdFund
        totalPrevUnused += allPrevUnusedRaw
        totalUploaded += uploaded
        totalClientPaid += clientPaid
        totalNeedCollection += toCollect

        return {
          client,
          monthly_ad_fund: monthlyBudget,
          original_ad_fund: originalAdFund,
          prev_unused_amount: allPrevUnusedRaw,
          all_prev_unused_amount: allPrevUnusedRaw,
          available_unused_fund: availableUnused,
          accumulated_unused_spent: unusedFundSpent,
          uploaded_amount: uploaded,
          client_paid_amount: clientPaid,
          need_collection_amount: toCollect,
          remaining_amount: remaining,
          last_upload_date: latestUploadMap[client.id] || null,
          platforms: client.ad_platforms && client.ad_platforms.length > 0 ? client.ad_platforms : ['meta'],
          status: client.ad_fund_status || 'active',
        }
      })

      // Sort client summaries by monthly_ad_fund descending, then name
      clientSummaries.sort(
        (a, b) =>
          b.monthly_ad_fund - a.monthly_ad_fund ||
          a.client.company_name.localeCompare(b.client.company_name)
      )

      const stats: AdFundDashboardStats = {
        totalAssigned,
        totalOriginalFund,
        totalPrevUnused,
        totalUploaded,
        totalRemaining: Math.max(0, totalAssigned - totalUploaded),
        totalClientPaid,
        totalNeedCollection,
        clientCount: clientSummaries.length,
      }

      return {
        summaries: clientSummaries,
        stats,
        allClients: clientsData || [],
        dmClients,
        nonDmClients,
      }
    },
  })

  // Mutation to add new fund upload transaction
  const addFundMutation = useMutation({
    mutationFn: async (payload: {
      client_id: string
      amount: number
      platform: AdPlatform | string
      payment_type: AdFundPaymentType | string
      payer_name?: string | null
      transaction_date: string
      notes?: string | null
    }) => {
      const { data: authData } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('ad_fund_transactions')
        .insert({
          client_id: payload.client_id,
          amount: payload.amount,
          platform: payload.platform,
          payment_type: payload.payment_type,
          payer_name:
            payload.payment_type === 'personal'
              ? payload.payer_name?.trim() || 'Anonymous'
              : null,
          transaction_date: payload.transaction_date,
          notes: payload.notes?.trim() || null,
          currency: 'INR',
          recorded_by: authData?.user?.id || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-funds-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['client-ad-history'] })
    },
  })

  // Mutation to delete transaction
  const deleteFundMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('ad_fund_transactions')
        .delete()
        .eq('id', transactionId)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-funds-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['client-ad-history'] })
    },
  })

  // Mutation to record client payment / fund release
  const recordClientPaymentMutation = useMutation({
    mutationFn: async (payload: {
      client_id: string
      amount: number
      payment_date: string
      payment_method?: string
      reference_no?: string | null
      notes?: string | null
    }) => {
      const { data: authData } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('client_ad_fund_payments')
        .insert({
          client_id: payload.client_id,
          amount: payload.amount,
          payment_date: payload.payment_date,
          payment_method: payload.payment_method || 'bank_transfer',
          reference_no: payload.reference_no?.trim() || null,
          notes: payload.notes?.trim() || null,
          currency: 'INR',
          recorded_by: authData?.user?.id || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-funds-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['client-ad-history'] })
    },
  })

  // Mutation to delete client payment
  const deleteClientPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('client_ad_fund_payments')
        .delete()
        .eq('id', paymentId)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-funds-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['client-ad-history'] })
    },
  })

  // Mutation to update client ad settings
  const updateClientAdSettingsMutation = useMutation({
    mutationFn: async (payload: {
      client_id: string
      monthly_ad_fund: number
      ad_platforms: string[]
      ad_fund_status: string
      is_dm_client?: boolean
    }) => {
      const updateData: Record<string, any> = {
        monthly_ad_fund: payload.monthly_ad_fund,
        ad_platforms: payload.ad_platforms,
        ad_fund_status: payload.ad_fund_status,
      }
      if (typeof payload.is_dm_client === 'boolean') {
        updateData.is_dm_client = payload.is_dm_client
      }

      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', payload.client_id)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-funds-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  // Mutation to enroll a client as DM client
  const enrollDmClientMutation = useMutation({
    mutationFn: async (payload: {
      client_id: string
      monthly_ad_fund: number
      ad_platforms: string[]
      ad_fund_status?: string
    }) => {
      const { error } = await supabase
        .from('clients')
        .update({
          is_dm_client: true,
          monthly_ad_fund: payload.monthly_ad_fund,
          ad_platforms: payload.ad_platforms,
          ad_fund_status: payload.ad_fund_status || 'active',
        })
        .eq('id', payload.client_id)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-funds-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  // Mutation to remove a client from DM clients
  const removeDmClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .update({
          is_dm_client: false,
        })
        .eq('id', clientId)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-funds-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  // Mutation: Add manual unused fund adjustment (CRUD - Create)
  const addAdjustmentMutation = useMutation({
    mutationFn: async (payload: {
      client_id: string
      amount: number
      year_month: string
      adjustment_type?: string
      notes?: string
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('client_ad_fund_adjustments')
        .insert({
          client_id: payload.client_id,
          amount: payload.amount,
          year_month: payload.year_month,
          adjustment_type: payload.adjustment_type || 'manual_unused',
          notes: payload.notes || null,
          recorded_by: user?.id || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ad-funds-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['client-ad-history', variables.client_id] })
    },
  })

  // Mutation: Update manual unused fund adjustment (CRUD - Update)
  const updateAdjustmentMutation = useMutation({
    mutationFn: async (payload: {
      id: string
      client_id: string
      amount: number
      year_month?: string
      adjustment_type?: string
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('client_ad_fund_adjustments')
        .update({
          amount: payload.amount,
          year_month: payload.year_month,
          adjustment_type: payload.adjustment_type,
          notes: payload.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ad-funds-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['client-ad-history', variables.client_id] })
    },
  })

  // Mutation: Delete manual unused fund adjustment (CRUD - Delete)
  const deleteAdjustmentMutation = useMutation({
    mutationFn: async (payload: { id: string; client_id: string }) => {
      const { error } = await supabase
        .from('client_ad_fund_adjustments')
        .delete()
        .eq('id', payload.id)

      if (error) throw error
      return true
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ad-funds-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['client-ad-history', variables.client_id] })
    },
  })

  return {
    summaries: data?.summaries || [],
    stats: data?.stats || {
      totalAssigned: 0,
      totalOriginalFund: 0,
      totalPrevUnused: 0,
      totalUploaded: 0,
      totalRemaining: 0,
      totalClientPaid: 0,
      totalNeedCollection: 0,
      clientCount: 0,
    },
    allClients: data?.allClients || [],
    dmClients: data?.dmClients || [],
    nonDmClients: data?.nonDmClients || [],
    isLoading,
    error,
    refetch,
    addFund: addFundMutation.mutateAsync,
    isAddingFund: addFundMutation.isPending,
    deleteFund: deleteFundMutation.mutateAsync,
    isDeletingFund: deleteFundMutation.isPending,
    recordClientPayment: recordClientPaymentMutation.mutateAsync,
    isRecordingPayment: recordClientPaymentMutation.isPending,
    deleteClientPayment: deleteClientPaymentMutation.mutateAsync,
    isDeletingPayment: deleteClientPaymentMutation.isPending,
    addAdjustment: addAdjustmentMutation.mutateAsync,
    isAddingAdjustment: addAdjustmentMutation.isPending,
    updateAdjustment: updateAdjustmentMutation.mutateAsync,
    isUpdatingAdjustment: updateAdjustmentMutation.isPending,
    deleteAdjustment: deleteAdjustmentMutation.mutateAsync,
    isDeletingAdjustment: deleteAdjustmentMutation.isPending,
    updateClientSettings: updateClientAdSettingsMutation.mutateAsync,
    isUpdatingSettings: updateClientAdSettingsMutation.isPending,
    enrollDmClient: enrollDmClientMutation.mutateAsync,
    isEnrollingDmClient: enrollDmClientMutation.isPending,
    removeDmClient: removeDmClientMutation.mutateAsync,
    isRemovingDmClient: removeDmClientMutation.isPending,
  }
}

// Hook specifically for a client's detailed transaction & payment history
export function useClientAdFundHistory(clientId: string | null, selectedYearMonth?: string) {
  return useQuery({
    queryKey: ['client-ad-history', clientId, selectedYearMonth],
    enabled: !!clientId,
    queryFn: async () => {
      if (!clientId)
        return {
          transactions: [],
          payments: [],
          adjustments: [],
          allTimeUploaded: 0,
          monthUploaded: 0,
          allTimeClientPaid: 0,
          monthClientPaid: 0,
          toCollectMonth: 0,
          allPreviouslyUnused: 0,
          remainingUnused: 0,
          originalAdFund: 0,
          unusedFundSpentThisMonth: 0,
        }

      // 1. Fetch Uploads (from October 2026 onwards)
      const { data: txData, error: txError } = await supabase
        .from('ad_fund_transactions')
        .select(`
          *,
          recorder:profiles!ad_fund_transactions_recorded_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('client_id', clientId)
        .gte('transaction_date', '2026-10-01')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (txError) throw txError

      // 2. Fetch Client Payments (from October 2026 onwards)
      const { data: payData, error: payError } = await supabase
        .from('client_ad_fund_payments')
        .select(`
          *,
          recorder:profiles!client_ad_fund_payments_recorded_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('client_id', clientId)
        .gte('payment_date', '2026-10-01')
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (payError) throw payError

      // 3. Fetch Manual Adjustments (CRUD - Read, from October 2026 onwards)
      const { data: adjData, error: adjError } = await supabase
        .from('client_ad_fund_adjustments')
        .select(`
          *,
          recorder:profiles!client_ad_fund_adjustments_recorded_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('client_id', clientId)
        .gte('year_month', '2026-10')
        .order('year_month', { ascending: false })
        .order('created_at', { ascending: false })

      if (adjError) throw adjError

      const transactions = (txData || []) as TransactionWithStaff[]
      const payments = (payData || []) as PaymentWithStaff[]
      const adjustments = (adjData || []) as AdjustmentWithStaff[]

      // Fetch client record to get monthly_ad_fund
      const { data: clientRecord } = await supabase
        .from('clients')
        .select('monthly_ad_fund')
        .eq('id', clientId)
        .single()
      const monthlyBudget = Number(clientRecord?.monthly_ad_fund || 0)

      // Calculations
      const allTimeUploaded = transactions.reduce((acc, tx) => acc + Number(tx.amount || 0), 0)
      const allTimeClientDirect = transactions
        .filter((tx) => tx.payment_type === 'client')
        .reduce((acc, tx) => acc + Number(tx.amount || 0), 0)
      const allTimePayments = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
      const allTimeClientPaid = allTimePayments + allTimeClientDirect

      let monthUploaded = 0
      let monthClientPaid = 0

      if (selectedYearMonth) {
        monthUploaded = transactions
          .filter((tx) => tx.transaction_date.startsWith(selectedYearMonth))
          .reduce((acc, tx) => acc + Number(tx.amount || 0), 0)

        const monthDirect = transactions
          .filter((tx) => tx.payment_type === 'client' && tx.transaction_date.startsWith(selectedYearMonth))
          .reduce((acc, tx) => acc + Number(tx.amount || 0), 0)

        const monthPayments = payments
          .filter((p) => p.payment_date.startsWith(selectedYearMonth))
          .reduce((acc, p) => acc + Number(p.amount || 0), 0)

        monthClientPaid = monthPayments + monthDirect
      } else {
        monthUploaded = allTimeUploaded
        monthClientPaid = allTimeClientPaid
      }

      // To collect only applies to agency money (company/personal) minus what client has paid
      const monthAgencyUploaded = transactions
        .filter(
          (tx) =>
            (tx.payment_type === 'company' || tx.payment_type === 'personal') &&
            (selectedYearMonth ? tx.transaction_date.startsWith(selectedYearMonth) : true)
        )
        .reduce((acc, tx) => acc + Number(tx.amount || 0), 0)

      const toCollectMonth = Math.max(0, monthAgencyUploaded - monthClientPaid)

      // Calculate all previously un-used amount
      // 1. Manual adjustments for months <= selectedYearMonth (or all if not specified)
      const manualAdjustments = adjustments
        .filter((a) => (selectedYearMonth ? a.year_month <= selectedYearMonth : true))
        .reduce((acc, a) => acc + Number(a.amount || 0), 0)

      // 2. Historical auto-unused from past months with transactions (starting from 2026-10 onwards)
      let autoPastUnused = 0
      if (selectedYearMonth && selectedYearMonth > '2026-10') {
        const pastTx = transactions.filter(
          (t) =>
            t.transaction_date >= '2026-10-01' &&
            t.transaction_date.substring(0, 7) < selectedYearMonth
        )
        const pastMonthMap: Record<string, number> = {}
        pastTx.forEach((tx) => {
          const m = tx.transaction_date.substring(0, 7)
          pastMonthMap[m] = (pastMonthMap[m] || 0) + Number(tx.amount || 0)
        })
        Object.entries(pastMonthMap).forEach(([_, spent]) => {
          autoPastUnused += Math.max(0, monthlyBudget - spent)
        })
      }

      const allPreviouslyUnused = manualAdjustments + autoPastUnused

      // Calculate how much unused fund was drawn/spent in the selected month
      let unusedFundSpentThisMonth = 0
      if (selectedYearMonth) {
        unusedFundSpentThisMonth = transactions
          .filter((tx) => tx.transaction_date.startsWith(selectedYearMonth) && tx.payment_type === 'unused_fund')
          .reduce((acc, tx) => acc + Number(tx.amount || 0), 0)
      } else {
        unusedFundSpentThisMonth = transactions
          .filter((tx) => tx.payment_type === 'unused_fund')
          .reduce((acc, tx) => acc + Number(tx.amount || 0), 0)
      }

      const remainingUnused = Math.max(0, allPreviouslyUnused - unusedFundSpentThisMonth)
      const originalAdFund = Math.max(0, monthlyBudget + allPreviouslyUnused - unusedFundSpentThisMonth)

      return {
        transactions,
        payments,
        adjustments,
        allTimeUploaded,
        monthUploaded,
        allTimeClientPaid,
        monthClientPaid,
        toCollectMonth,
        allPreviouslyUnused,
        remainingUnused,
        originalAdFund,
        unusedFundSpentThisMonth,
      }
    },
  })
}
