import React, { useState } from 'react'
import {
  Briefcase,
  Plus,
  Search,
  LayoutGrid,
  List,
  Filter,
  Calendar,
} from 'lucide-react'
import { useWork, WorkFilterParams } from '../hooks/useWork'
import { WorkItemModal } from '../components/WorkItemModal'
import { MarkPendingModal } from '../components/MarkPendingModal'
import { WorkDetailsModal } from '../components/WorkDetailsModal'
import { StaffWorkloadView } from '../components/StaffWorkloadView'
import { WorkTableView } from '../components/WorkTableView'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { WorkItem } from '@/types/database.types'

export const WorkPage: React.FC = () => {
  const { isAdmin } = useAuth()
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [filters, setFilters] = useState<WorkFilterParams>({
    search: '',
    status: 'all',
    priority: 'all',
    dueFilter: 'all',
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

  const handleOpenView = (item: WorkItem) => {
    setViewingItem(item)
  }

  const handleOpenEdit = (item: WorkItem) => {
    if (!isAdmin) return
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

          {isAdmin && (
            <Button onClick={handleOpenAdd} className="shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Assign Work</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
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
              value={filters.dueFilter}
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
          {isAdmin && (
            <Button onClick={handleOpenAdd} size="sm" variant="outline" className="mt-4">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Assign Work Item</span>
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
          />
        </Card>
      )}

      {/* View Task Details Modal */}
      {viewingItem && (
        <WorkDetailsModal
          isOpen={Boolean(viewingItem)}
          onClose={() => setViewingItem(null)}
          workItem={viewingItem}
        />
      )}

      {/* Add / Edit Work Modal */}
      <WorkItemModal
        isOpen={isWorkModalOpen}
        onClose={() => setIsWorkModalOpen(false)}
        initialWorkItem={editingItem}
        onSubmit={async (payload) => {
          if (editingItem) {
            if (!isAdmin) return
            await updateWorkItem({ id: editingItem.id, updates: payload })
          } else {
            await createWorkItem(payload)
          }
        }}
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
