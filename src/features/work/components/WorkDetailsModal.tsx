import React from 'react'
import {
  Calendar,
  Clock,
  Building2,
  User,
  AlertCircle,
  FileText,
  MessageSquare,
  CheckCircle2,
  DollarSign,
  Briefcase,
  AlertTriangle,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatTimeSeconds, formatCurrency } from '@/lib/formatters'
import { useAuth } from '@/features/auth/AuthContext'
import { WorkItem } from '@/types/database.types'

interface WorkDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  workItem: any
}

export const WorkDetailsModal: React.FC<WorkDetailsModalProps> = ({
  isOpen,
  onClose,
  workItem,
}) => {
  const { isAdmin } = useAuth()

  if (!workItem) return null

  const isOverdue =
    new Date(workItem.due_date) < new Date() && workItem.status !== 'completed'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'in_progress':
        return <Badge variant="purple">In Progress</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'assigned':
        return <Badge variant="info">Assigned</Badge>
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="danger">Urgent</Badge>
      case 'high':
        return <Badge variant="warning">High</Badge>
      case 'normal':
        return <Badge variant="info">Normal</Badge>
      case 'low':
        return <Badge variant="neutral">Low</Badge>
      default:
        return <Badge variant="neutral">{priority}</Badge>
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details"
      description={workItem.clients?.company_name ? `Deliverable for ${workItem.clients.company_name}` : 'Deliverable Overview'}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Title & Core Badges */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Task Title
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {workItem.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {getStatusBadge(workItem.status)}
              {getPriorityBadge(workItem.priority)}
            </div>
          </div>

          {/* Overdue alert if applicable */}
          {isOverdue && (
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>This task is overdue (Due date was {formatDate(workItem.due_date, 'MMM dd, yyyy')}).</span>
            </div>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Client */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Client</span>
            </span>
            <p className="text-sm font-semibold text-slate-900">
              {workItem.clients?.company_name || 'Unassigned Client'}
            </p>
            {workItem.clients?.contact_person && (
              <p className="text-xs text-slate-500 mt-0.5">
                Contact: {workItem.clients.contact_person}
              </p>
            )}
          </div>

          {/* Assigned Staff */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Assigned To</span>
            </span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                {workItem.profiles?.full_name ? workItem.profiles.full_name.slice(0, 2).toUpperCase() : 'IW'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {workItem.profiles?.full_name || 'Unassigned'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {workItem.profiles?.designation || 'Staff Member'}
                </p>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Due Date</span>
            </span>
            <p className={`text-sm font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatDate(workItem.due_date, 'MMMM dd, yyyy')}
            </p>
            {workItem.created_at && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Assigned on {formatDate(workItem.created_at, 'MMM dd, yyyy')}
              </p>
            )}
          </div>

          {/* Time Logged */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Time Tracked</span>
            </span>
            <p className="text-sm font-mono font-bold text-slate-800">
              {formatTimeSeconds(workItem.totalDurationSeconds || 0)}
            </p>
            {workItem.completed_at ? (
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Completed {formatDate(workItem.completed_at, 'MMM dd, yyyy')}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-0.5">Total duration accumulated</p>
            )}
          </div>
        </div>

        {/* Hold / Blocker Section (if pending) */}
        {workItem.status === 'pending' && (workItem.pending_reason || workItem.pending_expected_resume_date) && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Hold / Blocker Reason</span>
            </div>
            {workItem.pending_reason && (
              <p className="text-xs text-amber-900 pl-5">
                {workItem.pending_reason}
              </p>
            )}
            {workItem.pending_expected_resume_date && (
              <p className="text-[11px] text-amber-700 pl-5 font-medium">
                Expected Resumption: {formatDate(workItem.pending_expected_resume_date, 'MMMM dd, yyyy')}
              </p>
            )}
          </div>
        )}

        {/* Description / Deliverable Brief */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Description / Deliverable Scope</span>
          </span>
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[70px]">
            {workItem.description ? workItem.description : (
              <span className="text-slate-400 italic">No description provided for this work deliverable.</span>
            )}
          </div>
        </div>

        {/* Remarks / Internal Notes */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>Remarks / Notes</span>
          </span>
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[60px]">
            {workItem.remarks ? workItem.remarks : (
              <span className="text-slate-400 italic">No remarks or special notes entered.</span>
            )}
          </div>
        </div>

        {/* Billing Information — STRICTLY ADMIN ONLY (hidden for staff) */}
        {isAdmin && workItem.is_billable && (
          <div className="p-3.5 rounded-xl bg-violet-50/60 border border-violet-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-violet-800 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-violet-600" />
              <span>Billing Details (Admin Only)</span>
            </span>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-600">Billable Amount:</span>
              <span className="font-bold text-violet-900">
                {formatCurrency(workItem.billable_amount || 0, workItem.currency || 'INR')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Invoice Status:</span>
              <span className="capitalize font-semibold text-slate-800">
                {workItem.billing_status || 'Unbilled'}
              </span>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
