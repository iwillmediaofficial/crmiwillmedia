import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  subDays,
  isBefore,
} from 'date-fns'
import { DMClientDeliverablePlan, WorkItem, DeliverableType } from '@/types/database.types'

export interface GeneratedDeliverablePreview {
  tempId: string
  client_id: string
  deliverable_type: DeliverableType
  title: string
  description?: string
  start_date: string
  due_date: string
  assigned_staff_id: string
  priority: string
  dm_plan_id?: string
}

/**
 * Distributes a specific count of deliverables evenly across matching weekdays of the target month.
 */
export function generateMonthDeliverablesSchedule({
  clientId,
  clientName,
  targetMonthDate,
  plans,
}: {
  clientId: string
  clientName: string
  targetMonthDate: Date
  plans: (DMClientDeliverablePlan | any)[]
}): GeneratedDeliverablePreview[] {
  const monthStart = startOfMonth(targetMonthDate)
  const monthEnd = endOfMonth(targetMonthDate)
  const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const generatedItems: GeneratedDeliverablePreview[] = []

  plans.forEach((plan) => {
    if (!plan.is_active || plan.monthly_count <= 0) return

    const count = plan.monthly_count
    const leadDays = plan.start_lead_days ?? 2
    const preferredDays: number[] =
      plan.preferred_days && plan.preferred_days.length > 0
        ? plan.preferred_days
        : [2, 5] // Default to Tuesday & Friday

    // Find all days in the month that match preferred weekdays (date-fns getDay: 0=Sun, 1=Mon, ..., 6=Sat)
    // Convert 7=Sun to 0 if 1-7 ISO format is used
    const normalizedPreferred = preferredDays.map((d) => (d === 7 ? 0 : d))
    const eligibleDates = allDaysInMonth.filter((day) =>
      normalizedPreferred.includes(getDay(day))
    )

    let chosenDueDates: Date[] = []

    if (eligibleDates.length >= count) {
      // Pick `count` dates evenly spaced from eligible dates
      if (eligibleDates.length === count) {
        chosenDueDates = eligibleDates
      } else {
        const step = eligibleDates.length / count
        for (let i = 0; i < count; i++) {
          const index = Math.min(Math.floor(i * step), eligibleDates.length - 1)
          chosenDueDates.push(eligibleDates[index])
        }
      }
    } else {
      // Fallback: If not enough preferred days (e.g. 15 items), evenly space across all days of the month
      const step = allDaysInMonth.length / count
      for (let i = 0; i < count; i++) {
        const index = Math.min(Math.floor(i * step), allDaysInMonth.length - 1)
        chosenDueDates.push(allDaysInMonth[index])
      }
    }

    // Sort due dates chronologically
    chosenDueDates.sort((a, b) => a.getTime() - b.getTime())

    // Ensure distinct dates if possible
    const uniqueDueDates: Date[] = []
    chosenDueDates.forEach((d) => {
      if (!uniqueDueDates.some((u) => format(u, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'))) {
        uniqueDueDates.push(d)
      } else {
        // Find adjacent free day in allDaysInMonth
        const nextFree = allDaysInMonth.find(
          (cand) => !uniqueDueDates.some((u) => format(u, 'yyyy-MM-dd') === format(cand, 'yyyy-MM-dd'))
        )
        if (nextFree) uniqueDueDates.push(nextFree)
        else uniqueDueDates.push(d)
      }
    })
    uniqueDueDates.sort((a, b) => a.getTime() - b.getTime())

    // Build staff pool for alternating assignment
    const staffPool: string[] =
      plan.assigned_staff_ids && plan.assigned_staff_ids.length > 0
        ? plan.assigned_staff_ids
        : plan.default_staff_id
        ? [plan.default_staff_id]
        : []

    // Create deliverable items
    uniqueDueDates.slice(0, count).forEach((dueDate, idx) => {
      const itemNumber = idx + 1
      const titleTemplate = plan.title_template || `${plan.deliverable_type} #{n}`
      const itemTitle = `${clientName} - ${titleTemplate.replace('#{n}', `${itemNumber}`)}`

      // Work starting date = due_date - leadDays
      let startDate = subDays(dueDate, leadDays)
      // If start date is before month start, keep it reasonable (don't push too far back)
      if (isBefore(startDate, monthStart) && leadDays > 0) {
        startDate = monthStart
      }

      // Alternate staff members across the items (round-robin)
      const assignedStaff =
        staffPool.length > 0 ? staffPool[idx % staffPool.length] : ''

      generatedItems.push({
        tempId: `${plan.id || plan.deliverable_type}-${itemNumber}-${Date.now()}`,
        client_id: clientId,
        deliverable_type: plan.deliverable_type as DeliverableType,
        title: itemTitle,
        description: `Monthly ${plan.deliverable_type} deliverable #${itemNumber} for ${clientName}`,
        start_date: format(startDate, 'yyyy-MM-dd'),
        due_date: format(dueDate, 'yyyy-MM-dd'),
        assigned_staff_id: assignedStaff,
        priority: 'normal',
        dm_plan_id: plan.id,
      })
    })
  })

  // Sort overall generated schedule by due_date
  return generatedItems.sort((a, b) => a.due_date.localeCompare(b.due_date))
}
