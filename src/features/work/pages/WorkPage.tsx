import React, { useState } from 'react'
import {
  Briefcase,
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  X,
  RotateCcw,
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { useWork, WorkFilterParams } from '../hooks/useWork'
import { WorkItemModal } from '../components/WorkItemModal'
import { MarkPendingModal } from '../components/MarkPendingModal'
import { WorkDetailsModal } from '../components/WorkDetailsModal'
import { StaffWorkloadView } from '../components/StaffWorkloadView'
import { WorkTableView } from '../components/WorkTableView'
import { LiveStaffActivityBar } from '../components/LiveStaffActivityBar'
import { useAdminActiveTimers } from '@/features/timer/hooks/useAdminActiveTimers'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { WorkItem } from '@/types/database.types'

export const WorkPage: React.FC = () => {
  const { isAdmin, user, canSelfAssignTasks } = useAuth()
  const { activeTimers, activeTimersByStaffId, activeTimersByWorkItemId, stopStaffTimer } = useAdminActiveTimers()
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [filters, setFilters] = useState<WorkFilterParams>({
    search: '',
    status: 'all',
    priority: 'all',
    dueFilter: 'all',
    dateField: 'due_date',
    startDate: '',
    endDate: '',
  })

  const [viewingItem, setViewingItem] = useState<WorkItem | null>(null)
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)

  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false)
  const [pendingTargetItem, setPendingTargetItem] = useState<WorkItem | null>(null)

  const {
    workItems,
    isLoading,
    createWorkItem,
    updateWorkItem,
    markCompleted,
    deleteWorkItem,
  } = useWork(filters)

  const handleOpenAdd = () => {
    setEditingItem(null)
    setIsWorkModalOpen(true)
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      dueFilter: 'all',
      dateField: 'due_date',
      startDate: '',
      endDate: '',
    })
  }

  const hasActiveFilters =
    !!filters.search?.trim() ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    (filters.dueFilter && filters.dueFilter !== 'all') ||
    !!filters.startDate ||
    !!filters.endDate

  const handleOpenView = (item: WorkItem) => {
    setViewingItem(item)
  }

  const handleOpenEdit = (item: WorkItem) => {
    if (!isAdmin && item.created_by !== user?.id) return
    setEditingItem(item)
    setIsWorkModalOpen(true)
  }

  const handleOpenPending = (item: WorkItem) => {
    setPendingTargetItem(item)
    setIsPendingModalOpen(true)
  }

  const handleResumeWork = async (item: WorkItem) => {
    await updateWorkItem({
      id: item.id,
      updates: {
        status: 'in_progress',
        pending_reason: null,
        pending_expected_resume_date: null,
      },
    })
  }

  const handleDelete = async (id: string, title: string) => {
    const item = workItems.find((w) => w.id === id)
    if (!isAdmin && item?.created_by !== user?.id) return
    if (confirm(`Are you sure you want to delete task "${title}"?`)) {
      await deleteWorkItem(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-brand-600" />
            <span>Staff Work Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track daily assignments, monitor timers, handle blockers, and deliver project milestones
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Workload Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {(isAdmin || canSelfAssignTasks) && (
            <Button onClick={handleOpenAdd} className="shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>{isAdmin ? 'Assign Work' : 'Self Assign Task'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Live Working Staff Activity Bar (Admins) */}
      {isAdmin && <LiveStaffActivityBar activeTimers={activeTimers} onStopTimer={stopStaffTimer} />}

      {/* Filter Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search deliverables, tasks..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <select
              value={filters.dueFilter || 'all'}
              onChange={(e) =>
                setFilters({ ...filters, dueFilter: e.target.value as any })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Deadlines</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
        </div>

        {/* New Date Range Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 mr-1">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Date Range:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono shadow-2xs"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0]
                  setFilters({ ...filters, startDate: today, endDate: today })
                }}
                className={`px-2 py-1 rounded border text-[11px] font-medium transition-colors cursor-pointer ${
                  filters.startDate === new Date().toISOString().split('T')[0] &&
                  filters.endDate === new Date().toISOString().split('T')[0]
                    ? 'bg-brand-50 border-brand-300 text-brand-700 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                  const end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                  setFilters({ ...filters, startDate: start, endDate: end })
                }}
                className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-600 cursor-pointer"
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  const start = format(startOfMonth(now), 'yyyy-MM-dd')
                  const end = format(endOfMonth(now), 'yyyy-MM-dd')
                  setFilters({ ...filters, startDate: start, endDate: end })
                }}
                className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-600 cursor-pointer"
              >
                This Month
              </button>
            </div>

            {/* Target Date Field */}
            <div className="flex items-center gap-1 pl-2 sm:border-l sm:border-slate-200 text-slate-500 text-[11px]">
              <span>Filter on:</span>
              <select
                value={filters.dateField || 'due_date'}
                onChange={(e) => setFilters({ ...filters, dateField: e.target.value as any })}
                className="px-1.5 py-1 rounded border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:ring-1 focus:ring-brand-500"
              >
                <option value="due_date">Due Date</option>
                <option value="start_date">Start Date</option>
              </select>
            </div>

            {(filters.startDate || filters.endDate) && (
              <button
                type="button"
                onClick={() => setFilters({ ...filters, startDate: '', endDate: '' })}
                className="px-2 py-1 rounded text-[11px] font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
                title="Clear date range"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-[11px] text-slate-400 font-medium">
              {workItems.length} deliverable{workItems.length === 1 ? '' : 's'} matching
            </span>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset all</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Work Content View */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading work deliverables...</div>
      ) : workItems.length === 0 ? (
        <Card className="p-16 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No work items found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            There are no deliverables matching your filter criteria.
          </p>
          {(isAdmin || canSelfAssignTasks) && (
            <Button onClick={handleOpenAdd} size="sm" variant="outline" className="mt-4">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>{isAdmin ? 'Assign Work Item' : 'Self Assign Task'}</span>
            </Button>
          )}
        </Card>
      ) : viewMode === 'cards' ? (
        <StaffWorkloadView
          workItems={workItems}
          onOpenView={handleOpenView}
          onOpenEdit={handleOpenEdit}
          onOpenPending={handleOpenPending}
          onResumeWork={handleResumeWork}
          onMarkCompleted={markCompleted}
          onDelete={handleDelete}
          activeTimersByStaffId={activeTimersByStaffId}
        />
      ) : (
        <Card>
          <WorkTableView
            workItems={workItems}
            onOpenView={handleOpenView}
            onOpenEdit={handleOpenEdit}
            onOpenPending={handleOpenPending}
            onResumeWork={handleResumeWork}
            onMarkCompleted={markCompleted}
            onDelete={handleDelete}
            activeTimersByWorkItemId={activeTimersByWorkItemId}
          />
        </Card>
      )}

      {/* View Task Details Modal */}
      {viewingItem && (
        <WorkDetailsModal
          isOpen={Boolean(viewingItem)}
          onClose={() => setViewingItem(null)}
          workItem={viewingItem}
          onDelete={handleDelete}
        />
      )}

      {/* Add / Edit Work Modal */}
      <WorkItemModal
        isOpen={isWorkModalOpen}
        onClose={() => setIsWorkModalOpen(false)}
        initialWorkItem={editingItem}
        onSubmit={async (payload) => {
          if (editingItem) {
            if (!isAdmin && editingItem.created_by !== user?.id) return
            await updateWorkItem({ id: editingItem.id, updates: payload })
          } else {
            await createWorkItem(payload)
          }
        }}
        onDelete={handleDelete}
      />

      {/* Mark Pending Modal */}
      {pendingTargetItem && (
        <MarkPendingModal
          isOpen={isPendingModalOpen}
          onClose={() => {
            setIsPendingModalOpen(false)
            setPendingTargetItem(null)
          }}
          taskTitle={pendingTargetItem.title}
          onSubmit={async (values) => {
            await updateWorkItem({
              id: pendingTargetItem.id,
              updates: {
                status: 'pending',
                pending_reason: values.pending_reason,
                pending_expected_resume_date: values.pending_expected_resume_date,
                remarks: values.remarks || pendingTargetItem.remarks,
              },
            })
          }}
        />
      )}
    </div>
  )
}
