import React, { useState } from 'react'
import {
  Clock,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  RotateCcw,
  ChevronDown,
  Eye,
} from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatTimeSeconds } from '@/lib/formatters'
import { WorkItem } from '@/types/database.types'
import { useTimer } from '@/features/timer/hooks/useTimer'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'

interface StaffWorkloadViewProps {
  workItems: any[]
  onOpenView: (item: any) => void
  onOpenEdit: (item: any) => void
  onOpenPending: (item: any) => void
  onResumeWork: (item: any) => void
  onMarkCompleted: (id: string) => void
}

type FilterType = 'all' | 'active' | 'ongoing' | 'pending' | 'done'

interface StaffCardProps {
  staff: any
  items: any[]
  activeTimer: any
  isStarting: boolean
  isStopping: boolean
  startTimer: (workItemId: string) => Promise<any>
  stopTimer: (timerEntryId?: string) => Promise<any>
  onOpenView: (item: any) => void
  onOpenEdit: (item: any) => void
  onOpenPending: (item: any) => void
  onResumeWork: (item: any) => void
  onMarkCompleted: (id: string) => void
}

const StaffCardSection: React.FC<StaffCardProps> = ({
  staff,
  items,
  activeTimer,
  isStarting,
  isStopping,
  startTimer,
  stopTimer,
  onOpenView,
  onOpenEdit,
  onOpenPending,
  onResumeWork,
  onMarkCompleted,
}) => {
  const { isAdmin } = useAuth()
  const [statusFilter, setStatusFilter] = useState<FilterType>('all')
  const [visibleCount, setVisibleCount] = useState<number>(5)

  // Status-specific counts
  const assignedCount = items.filter((i) => i.status === 'assigned').length
  const ongoingCount = items.filter((i) => i.status === 'in_progress').length
  const pendingCount = items.filter((i) => i.status === 'pending').length
  const completedCount = items.filter((i) => i.status === 'completed').length

  // Filter items based on active button
  const filteredItems = items.filter((item) => {
    if (statusFilter === 'active') return item.status === 'assigned'
    if (statusFilter === 'ongoing') return item.status === 'in_progress'
    if (statusFilter === 'pending') return item.status === 'pending'
    if (statusFilter === 'done') return item.status === 'completed'
    return true
  })

  // Sliced items for 5-at-a-time pagination
  const displayedItems = filteredItems.slice(0, visibleCount)
  const hasMore = filteredItems.length > visibleCount

  const handleFilterChange = (newFilter: FilterType) => {
    setStatusFilter(newFilter)
    setVisibleCount(5) // Reset pagination to initial 5 items on filter switch
  }

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Staff profile summary */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
            {staff.full_name ? staff.full_name.slice(0, 2).toUpperCase() : 'IW'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">{staff.full_name}</h3>
            <p className="text-[11px] text-slate-500">{staff.designation || 'Staff Member'}</p>
          </div>
        </div>

        {/* Filter buttons: All, Active, On going, Pending, Done */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95',
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            )}
            title="Show all works"
          >
            <span>All</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
              )}
            >
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('active')}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95',
              statusFilter === 'active'
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200'
            )}
            title="Show assigned/waiting works"
          >
            <span>Active</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                statusFilter === 'active' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-800'
              )}
            >
              {assignedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('ongoing')}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95',
              statusFilter === 'ongoing'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
            )}
            title="Show works currently in progress"
          >
            <span>On going</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                statusFilter === 'ongoing' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
              )}
            >
              {ongoingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('pending')}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95',
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200'
            )}
            title="Show works on hold / blocked"
          >
            <span>Pending</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                statusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
              )}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('done')}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95',
              statusFilter === 'done'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
            )}
            title="Show completed works"
          >
            <span>Done</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                statusFilter === 'done' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'
              )}
            >
              {completedCount}
            </span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3 flex-1">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {statusFilter === 'all'
              ? 'No work items assigned to this staff member.'
              : `No ${
                  statusFilter === 'ongoing'
                    ? 'on going'
                    : statusFilter === 'done'
                    ? 'completed'
                    : statusFilter
                } work items found.`}
          </div>
        ) : (
          <>
            {displayedItems.map((item) => {
              const isItemTimerRunning = activeTimer?.entry?.work_item_id === item.id
              const isOverdue =
                new Date(item.due_date) < new Date() && item.status !== 'completed'

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isItemTimerRunning
                      ? 'border-brand-400 bg-brand-50/30 shadow-sm'
                      : isOverdue
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onOpenView(item)}
                          className="font-semibold text-slate-900 text-xs sm:text-sm hover:text-brand-600 transition-colors text-left cursor-pointer"
                          title="Click to view task details"
                        >
                          {item.title}
                        </button>
                        <Badge
                          variant={
                            item.priority === 'urgent'
                              ? 'danger'
                              : item.priority === 'high'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {item.priority}
                        </Badge>
                        {item.is_billable && (
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                              item.billing_status === 'billed'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                            title={
                              isAdmin && item.billable_amount
                                ? `Billable: ${item.currency || 'INR'} ${item.billable_amount}`
                                : 'Billable'
                            }
                          >
                            {item.billing_status === 'billed' ? 'Billed' : 'Billable'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {item.clients?.company_name || 'Client'}
                        </span>
                        <span>•</span>
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue ? 'text-rose-600 font-semibold' : ''
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          Due {formatDate(item.due_date, 'MMM dd')}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono font-medium text-slate-600">
                          <Clock className="w-3 h-3" />
                          {formatTimeSeconds(item.totalDurationSeconds || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div>
                      {item.status === 'completed' && <Badge variant="success">Completed</Badge>}
                      {item.status === 'in_progress' && <Badge variant="purple">In Progress</Badge>}
                      {item.status === 'pending' && <Badge variant="warning">Pending</Badge>}
                      {item.status === 'assigned' && <Badge variant="info">Assigned</Badge>}
                    </div>
                  </div>

                  {/* Blocker explanation if pending */}
                  {item.status === 'pending' && item.pending_reason && (
                    <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200/70 text-[11px] text-amber-800">
                      <p className="font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Hold Reason: {item.pending_reason}</span>
                      </p>
                      {item.pending_expected_resume_date && (
                        <p className="text-amber-700 mt-0.5">
                          Expected Resume: {formatDate(item.pending_expected_resume_date)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.status !== 'completed' && (
                        <>
                          {isItemTimerRunning ? (
                            <button
                              onClick={() => stopTimer()}
                              disabled={isStopping}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-all active:scale-95 shadow-sm"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop Timer</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => startTimer(item.id)}
                              disabled={isStarting}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-semibold transition-all active:scale-95 shadow-sm"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Start Timer</span>
                            </button>
                          )}

                          {item.status === 'pending' ? (
                            <button
                              onClick={() => onResumeWork(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-semibold transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Resume Work</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenPending(item)}
                              className="text-[11px] text-slate-500 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded transition-colors"
                            >
                              Mark Pending
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenView(item)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-brand-600 font-medium cursor-pointer"
                        title="View Task Details"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Task</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onOpenEdit(item)}
                          className="text-[11px] text-slate-500 hover:text-brand-600 font-medium cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                      {item.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => onMarkCompleted(item.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Load More Button */}
            {hasMore ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 5)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99] cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Load More ({filteredItems.length - visibleCount} remaining)</span>
                </button>
              </div>
            ) : filteredItems.length > 5 ? (
              <p className="text-center text-[11px] text-slate-400 pt-1 pb-0.5">
                Showing all {filteredItems.length} work items
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export const StaffWorkloadView: React.FC<StaffWorkloadViewProps> = ({
  workItems,
  onOpenView,
  onOpenEdit,
  onOpenPending,
  onResumeWork,
  onMarkCompleted,
}) => {
  const { activeTimer, startTimer, stopTimer, isStarting, isStopping } = useTimer()

  // Group work items by assigned staff
  const staffMap = workItems.reduce((acc: Record<string, { staff: any; items: any[] }>, item) => {
    const staffId = item.assigned_staff_id || 'unassigned'
    if (!acc[staffId]) {
      acc[staffId] = {
        staff: item.profiles || { full_name: 'Unassigned', designation: 'General Queue' },
        items: [],
      }
    }
    acc[staffId].items.push(item)
    return acc
  }, {})

  const staffGroups = Object.values(staffMap)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {staffGroups.map(({ staff, items }) => (
        <StaffCardSection
          key={staff.id || 'unassigned'}
          staff={staff}
          items={items}
          activeTimer={activeTimer}
          isStarting={isStarting}
          isStopping={isStopping}
          startTimer={startTimer}
          stopTimer={stopTimer}
          onOpenView={onOpenView}
          onOpenEdit={onOpenEdit}
          onOpenPending={onOpenPending}
          onResumeWork={onResumeWork}
          onMarkCompleted={onMarkCompleted}
        />
      ))}
    </div>
  )
}
