import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Palette,
  Film,
  Building2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Edit2,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EnrichedDMWorkItem } from '../hooks/useDMCalendar'
import { Profile } from '@/types/database.types'
import { formatDate } from '@/lib/formatters'
import { useNavigate } from 'react-router-dom'

interface DMDeliverableDetailModalProps {
  isOpen: boolean
  onClose: () => void
  deliverable: EnrichedDMWorkItem | null
  staffList: Profile[]
  onUpdate: (id: string, updates: any) => Promise<any>
  onDelete: (id: string) => Promise<any>
  onToggleStatus: (item: EnrichedDMWorkItem) => Promise<any>
}

export const DMDeliverableDetailModal: React.FC<DMDeliverableDetailModalProps> = ({
  isOpen,
  onClose,
  deliverable,
  staffList,
  onUpdate,
  onDelete,
  onToggleStatus,
}) => {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (deliverable) {
      setTitle(deliverable.title)
      setStartDate(deliverable.start_date || deliverable.assigned_date)
      setDueDate(deliverable.due_date)
      setAssignedStaffId(deliverable.assigned_staff_id)
      setStatus(deliverable.status)
      setPriority(deliverable.priority)
      setRemarks(deliverable.remarks || '')
      setIsEditing(false)
    }
  }, [deliverable])

  if (!isOpen || !deliverable) return null

  const isPoster = deliverable.deliverable_type === 'poster'
  const isVideo =
    deliverable.deliverable_type === 'video' || deliverable.deliverable_type === 'reel'

  const assignedStaff = staffList.find((s) => s.id === deliverable.assigned_staff_id)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(deliverable.id, {
        title,
        start_date: startDate,
        due_date: dueDate,
        assigned_date: startDate,
        assigned_staff_id: assignedStaffId,
        status,
        priority,
        remarks,
      })
      setIsEditing(false)
      onClose()
    } catch (err) {
      console.error('Failed to update deliverable:', err)
      alert('Error saving updates')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to remove "${deliverable.title}"?`)) {
      await onDelete(deliverable.id)
      onClose()
    }
  }

  const handleToggle = async () => {
    await onToggleStatus(deliverable)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deliverable Details"
      description="View schedule, work starting date, assigned staff, and progress status."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Header Badge & Title */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                  isPoster
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : isVideo
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isPoster ? <Palette className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                {deliverable.deliverable_type}
              </span>

              <Badge
                variant={
                  deliverable.status === 'completed'
                    ? 'success'
                    : deliverable.status === 'in_progress'
                    ? 'warning'
                    : 'default'
                }
              >
                {deliverable.status.replace('_', ' ')}
              </Badge>
            </div>

            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base font-bold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 w-full mt-2"
              />
            ) : (
              <h2 className="text-base font-bold text-slate-900 mt-1">{deliverable.title}</h2>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{deliverable.clients?.company_name || 'Client'}</span>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs h-8"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </Button>
        </div>

        {/* Schedule & Assignee Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Work Starting Date
            </label>
            {isEditing ? (
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium"
              />
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>{formatDate(deliverable.start_date || deliverable.assigned_date)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Submission / Due Date
            </label>
            {isEditing ? (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium"
              />
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Calendar className="w-4 h-4 text-rose-600" />
                <span>{formatDate(deliverable.due_date)}</span>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Assigned Staff
            </label>
            {isEditing ? (
              <select
                value={assignedStaffId}
                onChange={(e) => setAssignedStaffId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.designation || 'Staff'})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px]">
                  {assignedStaff?.full_name?.slice(0, 2).toUpperCase() || 'UN'}
                </div>
                <span>{assignedStaff?.full_name || 'Unassigned'}</span>
                {assignedStaff?.designation && (
                  <span className="text-slate-400 text-[11px]">
                    ({assignedStaff.designation})
                  </span>
                )}
              </div>
            )}
          </div>

          {isEditing && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium"
              >
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          {isEditing && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete deliverable"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose()
                navigate('/work')
              }}
              className="text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              View in Work Table
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                Save Changes
              </Button>
            ) : (
              <Button
                size="sm"
                variant={deliverable.status === 'completed' ? 'outline' : 'primary'}
                onClick={handleToggle}
                className={
                  deliverable.status !== 'completed'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : ''
                }
              >
                {deliverable.status === 'completed' ? (
                  <span>Re-open Work</span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Completed</span>
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
