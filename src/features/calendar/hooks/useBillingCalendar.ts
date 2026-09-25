import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
} from 'date-fns'

export function useBillingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const startDateStr = format(monthStart, 'yyyy-MM-dd')
  const endDateStr = format(monthEnd, 'yyyy-MM-dd')

  const { data: monthBills, isLoading } = useQuery({
    queryKey: ['calendar-bills', startDateStr, endDateStr],
    queryFn: async () => {
      // Query billing records due this month
      const { data: records, error } = await supabase
        .from('billing_records')
        .select(`
          id,
          bill_title,
          amount,
          currency,
          due_date,
          status,
          paid_date,
          remarks,
          clients (
            id,
            company_name
          )
        `)
        .gte('due_date', startDateStr)
        .lte('due_date', endDateStr)

      if (error) throw error

      const todayStr = format(new Date(), 'yyyy-MM-dd')
      return (records || []).map((b) => {
        const isOverdue = b.due_date < todayStr && b.status === 'pending'
        return {
          ...b,
          displayStatus: isOverdue ? 'overdue' : b.status,
        }
      })
    },
  })

  // Group bills by due_date
  const billsByDate = (monthBills || []).reduce((acc: Record<string, any[]>, bill) => {
    if (!acc[bill.due_date]) {
      acc[bill.due_date] = []
    }
    acc[bill.due_date].push(bill)
    return acc
  }, {})

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  return {
    currentDate,
    monthStart,
    days,
    monthBills: monthBills || [],
    billsByDate,
    isLoading,
    nextMonth,
    prevMonth,
    goToToday,
  }
}
