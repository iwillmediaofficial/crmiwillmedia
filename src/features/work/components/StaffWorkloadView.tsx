import React from 'react'
import {
  Clock,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  RotateCcw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, formatTimeSeconds } from '@/lib/formatters'
import { WorkItem } from '@/types/database.types'
import { useTimer } from '@/features/timer/hooks/useTimer'

interface StaffWorkloadViewProps {
  workItems: any[]
  onOpenEdit: (item: any) => void
  onOpenPending: (item: any) => void
  onResumeWork: (item: any) => void
  onMarkCompleted: (id: string) => void
}

export const StaffWorkloadView: React.FC<StaffWorkloadViewProps> = ({
  workItems,
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
      {staffGroups.map(({ staff, items }) => {
        const activeCount = items.filter((i) => i.status === 'in_progress' || i.status === 'assigned').length
        const pendingCount = items.filter((i) => i.status === 'pending').length
        const completedCount = items.filter((i) => i.status === 'completed').length

        return (
          <Card key={staff.id || 'unassigned'} className="flex flex-col justify-between">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {staff.full_name ? staff.full_name.slice(0, 2).toUpperCase() : 'IW'}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{staff.full_name}</h3>
                  <p className="text-[11px] text-slate-500">{staff.designation || 'Staff Member'}</p>
                </div>
              </div>

              {/* Workload metric counters */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-semibold border border-violet-200">
                  {activeCount} Active
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                  {pendingCount} Pending
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {completedCount} Done
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3 flex-1">
              {items.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No work items assigned to this staff member.
                </div>
              ) : (
                items.map((item) => {
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
                            <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                              {item.title}
                            </span>
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
                                  item.billable_amount
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
                            onClick={() => onOpenEdit(item)}
                            className="text-[11px] text-slate-500 hover:text-brand-600 font-medium"
                          >
                            Edit
                          </button>
                          {item.status !== 'completed' && (
                            <button
                              onClick={() => onMarkCompleted(item.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
