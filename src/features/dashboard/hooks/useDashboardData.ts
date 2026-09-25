import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { startOfDay, endOfDay, addDays, format } from 'date-fns'

export function useDashboardData() {
  const { user, isAdmin } = useAuth()
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const sevenDaysStr = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['dashboard-metrics', user?.id, isAdmin],
    queryFn: async () => {
      if (!user?.id) return null

      // Build queries with Supabase Free-Tier Head Count optimization
      if (isAdmin) {
        // ADMIN QUERIES
        const [
          leadsTotalRes,
          leadsTodayRes,
          workActiveRes,
          workPendingRes,
          workCompletedRes,
          workUnbilledRes,
          billsUpcomingRes,
          billsOverdueRes,
          deadlinesRes,
          pipelineRes,
        ] = await Promise.all([
          supabase.from('leads').select('id', { count: 'exact', head: true }),
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .gte('follow_up_date', `${todayStr}T00:00:00`)
            .lte('follow_up_date', `${todayStr}T23:59:59`),
          supabase.from('work_items').select('id', { count: 'exact', head: true }).in('status', ['assigned', 'in_progress']),
          supabase.from('work_items').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('work_items').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
          supabase.from('work_items').select('id', { count: 'exact', head: true }).eq('status', 'completed').eq('billing_status', 'unbilled'),
          supabase
            .from('billing_records')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending')
            .gte('due_date', todayStr)
            .lte('due_date', sevenDaysStr),
          supabase
            .from('billing_records')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending')
            .lt('due_date', todayStr),
          // Upcoming Deadlines (Limit to top 5)
          supabase
            .from('work_items')
            .select('id, title, due_date, priority, status, clients(company_name), profiles!work_items_assigned_staff_id_fkey(full_name)')
            .neq('status', 'completed')
            .order('due_date', { ascending: true })
            .limit(5),
          // Status breakdown
          supabase.from('leads').select('status'),
        ])

        // Calculate pipeline breakdown
        const statusMap: Record<string, number> = { new: 0, follow_up: 0, interested: 0, won: 0, lost: 0 }
        pipelineRes.data?.forEach((lead) => {
          if (statusMap[lead.status] !== undefined) statusMap[lead.status]++
        })

        return {
          leadsTotal: leadsTotalRes.count || 0,
          followupsToday: leadsTodayRes.count || 0,
          workActive: workActiveRes.count || 0,
          workPending: workPendingRes.count || 0,
          workCompleted: workCompletedRes.count || 0,
          workUnbilled: workUnbilledRes.count || 0,
          billsUpcoming: billsUpcomingRes.count || 0,
          billsOverdue: billsOverdueRes.count || 0,
          upcomingDeadlines: deadlinesRes.data || [],
          pipeline: statusMap,
        }
      } else {
        // STAFF QUERIES (Scoped strictly to current user)
        const [
          myLeadsRes,
          myFollowupsTodayRes,
          myWorkActiveRes,
          myWorkPendingRes,
          myWorkCompletedRes,
          myDeadlinesRes,
        ] = await Promise.all([
          supabase.from('leads').select('id', { count: 'exact', head: true }).eq('assigned_staff_id', user.id),
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_staff_id', user.id)
            .gte('follow_up_date', `${todayStr}T00:00:00`)
            .lte('follow_up_date', `${todayStr}T23:59:59`),
          supabase
            .from('work_items')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_staff_id', user.id)
            .in('status', ['assigned', 'in_progress']),
          supabase
            .from('work_items')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_staff_id', user.id)
            .eq('status', 'pending'),
          supabase
            .from('work_items')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_staff_id', user.id)
            .eq('status', 'completed'),
          supabase
            .from('work_items')
            .select('id, title, due_date, priority, status, clients(company_name)')
            .eq('assigned_staff_id', user.id)
            .neq('status', 'completed')
            .order('due_date', { ascending: true })
            .limit(6),
        ])

        return {
          leadsTotal: myLeadsRes.count || 0,
          followupsToday: myFollowupsTodayRes.count || 0,
          workActive: myWorkActiveRes.count || 0,
          workPending: myWorkPendingRes.count || 0,
          workCompleted: myWorkCompletedRes.count || 0,
          workUnbilled: 0,
          billsUpcoming: 0,
          billsOverdue: 0,
          upcomingDeadlines: myDeadlinesRes.data || [],
          pipeline: {},
        }
      }
    },
    enabled: !!user?.id,
  })
}
