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
  Edit2,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatTimeSeconds } from '@/lib/formatters'
import { useTimer } from '@/features/timer/hooks/useTimer'
import { useAuth } from '@/features/auth/AuthContext'

interface WorkTableViewProps {
  workItems: any[]
  onOpenEdit: (item: any) => void
  onOpenPending: (item: any) => void
  onResumeWork: (item: any) => void
  onMarkCompleted: (id: string) => void
  onDelete: (id: string, title: string) => void
}

export const WorkTableView: React.FC<WorkTableViewProps> = ({
  workItems,
  onOpenEdit,
  onOpenPending,
  onResumeWork,
  onMarkCompleted,
  onDelete,
}) => {
  const { isAdmin } = useAuth()
  const { activeTimer, startTimer, stopTimer, isStarting, isStopping } = useTimer()

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="danger" size="sm">Urgent</Badge>
      case 'high':
        return <Badge variant="warning" size="sm">High</Badge>
      case 'low':
        return <Badge variant="default" size="sm">Low</Badge>
      default:
        return <Badge variant="neutral" size="sm">Normal</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>
      case 'in_progress':
        return <Badge variant="purple" size="sm">In Progress</Badge>
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>
      default:
        return <Badge variant="info" size="sm">Assigned</Badge>
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <th className="py-3 px-4">Work Deliverable</th>
            <th className="py-3 px-4">Client</th>
            <th className="py-3 px-4">Assignee</th>
            <th className="py-3 px-4">Priority</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Time Spent</th>
            <th className="py-3 px-4">Due Date</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {workItems.map((item) => {
            const isItemTimerRunning = activeTimer?.entry?.work_item_id === item.id
            const isOverdue =
              new Date(item.due_date) < new Date() && item.status !== 'completed'

            return (
              <tr
                key={item.id}
                className={`hover:bg-slate-50/80 transition-colors ${
                  isItemTimerRunning ? 'bg-brand-50/20' : ''
                }`}
              >
                <td className="py-3.5 px-4 font-semibold text-slate-900">
                  <div>{item.title}</div>
                  {item.description && (
                    <p className="text-[11px] font-normal text-slate-400 line-clamp-1 mt-0.5 max-w-xs">
                      {item.description}
                    </p>
                  )}
                  {item.status === 'pending' && item.pending_reason && (
                    <p className="text-[11px] font-medium text-amber-700 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Pending: {item.pending_reason}</span>
                    </p>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  <span className="font-medium text-slate-800">
                    {item.clients?.company_name || 'Client'}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {item.profiles?.full_name ? item.profiles.full_name.slice(0, 2).toUpperCase() : 'IW'}
                    </div>
                    <span className="font-medium text-slate-800">
                      {item.profiles?.full_name || 'Unassigned'}
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-4">{getPriorityBadge(item.priority)}</td>

                <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>

                <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatTimeSeconds(item.totalDurationSeconds || 0)}</span>
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`flex items-center gap-1.5 ${
                      isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(item.due_date, 'MMM dd')}</span>
                  </span>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Timer trigger */}
                    {item.status !== 'completed' && (
                      <>
                        {isItemTimerRunning ? (
                          <button
                            onClick={() => stopTimer()}
                            disabled={isStopping}
                            className="p-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
                            title="Stop Active Timer"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                          </button>
                        ) : (
                          <button
                            onClick={() => startTimer(item.id)}
                            disabled={isStarting}
                            className="p-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
                            title="Start Timer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}

                        {item.status === 'pending' ? (
                          <button
                            onClick={() => onResumeWork(item)}
                            className="p-1.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
                            title="Resume Work"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenPending(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Mark Pending"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onMarkCompleted(item.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Mark Completed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onOpenEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                      title="Edit Work Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => onDelete(item.id, item.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete Work Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
