import React, { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Sparkles,
  Palette,
  Film,
  Clock,
  User,
  Users,
  Repeat,
  CheckCircle2,
  PauseCircle,
  Building2,
  Edit2,
  X,
  Save,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Client, Profile, DeliverableType, DMClientDeliverablePlan } from '@/types/database.types'
import { useDMClientPlans } from '../hooks/useDMClientPlans'

interface AlternatingStaffPickerProps {
  staffIds: string[]
  onChange: (ids: string[]) => void
  staffList: Profile[]
  label?: string
}

const AlternatingStaffPicker: React.FC<AlternatingStaffPickerProps> = ({
  staffIds,
  onChange,
  staffList,
  label = 'Assigned Staff (Alternates sequentially if multiple)',
}) => {
  const handleAdd = (id: string) => {
    if (!id || staffIds.includes(id)) return
    onChange([...staffIds, id])
  }

  const handleRemove = (idToRemove: string) => {
    onChange(staffIds.filter((id) => id !== idToRemove))
  }

  const availableStaff = staffList.filter((s) => !staffIds.includes(s.id))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-semibold text-slate-700">
          {label}
        </label>
        {staffIds.length > 1 && (
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Users className="w-3 h-3 text-purple-600" />
            <span>Alternates between {staffIds.length} staff</span>
          </span>
        )}
      </div>

      {staffIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[42px] items-center">
          {staffIds.map((id, index) => {
            const staff = staffList.find((s) => s.id === id)
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-800 shadow-2xs"
              >
                <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <span>{staff?.full_name || 'Staff Member'}</span>
                {staff?.designation && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({staff.designation})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(id)}
                  className="text-slate-400 hover:text-rose-600 ml-0.5 p-0.5 transition-colors"
                  title="Remove staff from rotation"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 italic p-2 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
          No staff selected yet. Work items will be unassigned unless selected below.
        </div>
      )}

      {availableStaff.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            handleAdd(e.target.value)
            e.target.value = ''
          }}
          className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
        >
          <option value="">
            {staffIds.length === 0
              ? '+ Choose Staff Assignee...'
              : '+ Add Another Staff to Alternate (e.g. Rahul, Bibin...)'}
          </option>
          {availableStaff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name} ({s.designation || 'Staff'})
            </option>
          ))}
        </select>
      )}

      <p className="text-[10px] text-slate-500">
        {staffIds.length > 1
          ? 'Deliverables will alternate evenly: 1st → #1, 2nd → #2, 3rd → #1, etc.'
          : staffIds.length === 1
          ? 'All deliverables in this package will be assigned to this staff member.'
          : 'Choose one or more staff. If multiple, deliverables alternate evenly.'}
      </p>
    </div>
  )
}

interface DMDeliverablePlansModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
  dmClients?: Client[]
  staffList: Profile[]
  onSelectClient?: (clientId: string) => void
  onToggleAutoRecurring?: (clientId: string, enabled: boolean) => Promise<any>
}

export const DMDeliverablePlansModal: React.FC<DMDeliverablePlansModalProps> = ({
  isOpen,
  onClose,
  client,
  dmClients = [],
  staffList,
  onSelectClient,
  onToggleAutoRecurring,
}) => {
  const currentClient = client
  const {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    deleteAllPlansForClient,
    initializeStandardPackage,
  } = useDMClientPlans(currentClient?.id)

  // Add new plan state
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newType, setNewType] = useState<DeliverableType>('poster')
  const [newTitle, setNewTitle] = useState('Poster #{n}')
  const [newCount, setNewCount] = useState(8)
  const [newStaffIds, setNewStaffIds] = useState<string[]>([])
  const [newLeadDays, setNewLeadDays] = useState(2)
  const [newPreferredDays, setNewPreferredDays] = useState<number[]>([2, 5]) // Tue, Fri
  const [isUpdatingRecurring, setIsUpdatingRecurring] = useState(false)

  // Edit existing plan state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editType, setEditType] = useState<DeliverableType>('poster')
  const [editTitle, setEditTitle] = useState('')
  const [editCount, setEditCount] = useState(8)
  const [editStaffIds, setEditStaffIds] = useState<string[]>([])
  const [editLeadDays, setEditLeadDays] = useState(2)
  const [editPreferredDays, setEditPreferredDays] = useState<number[]>([2, 5])
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Reset edit state when client changes
  useEffect(() => {
    setEditingPlanId(null)
    setIsAddingNew(false)
  }, [client?.id])

  if (!isOpen || !currentClient) return null

  const isAutoRecurring = currentClient.dm_auto_assign_recurring !== false

  const handleToggleRecurring = async () => {
    if (!onToggleAutoRecurring || !currentClient) return
    setIsUpdatingRecurring(true)
    try {
      await onToggleAutoRecurring(currentClient.id, !isAutoRecurring)
    } finally {
      setIsUpdatingRecurring(false)
    }
  }

  const daysOfWeek = [
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
    { label: 'Sun', value: 7 },
  ]

  const toggleDay = (val: number, isEdit = false) => {
    if (isEdit) {
      if (editPreferredDays.includes(val)) {
        setEditPreferredDays(editPreferredDays.filter((d) => d !== val))
      } else {
        setEditPreferredDays([...editPreferredDays, val])
      }
    } else {
      if (newPreferredDays.includes(val)) {
        setNewPreferredDays(newPreferredDays.filter((d) => d !== val))
      } else {
        setNewPreferredDays([...newPreferredDays, val])
      }
    }
  }

  const handleTypeChange = (type: DeliverableType) => {
    setNewType(type)
    if (type === 'poster') {
      setNewTitle('Poster #{n}')
      setNewCount(8)
      setNewLeadDays(2)
      setNewPreferredDays([2, 5])
    } else if (type === 'video' || type === 'reel') {
      setNewTitle('Reel Video #{n}')
      setNewCount(4)
      setNewLeadDays(3)
      setNewPreferredDays([6])
    } else if (type === 'carousel') {
      setNewTitle('Carousel Post #{n}')
      setNewCount(2)
      setNewLeadDays(2)
      setNewPreferredDays([3])
    }
  }

  const handleStartEdit = (p: DMClientDeliverablePlan) => {
    setEditingPlanId(p.id)
    setEditType((p.deliverable_type as DeliverableType) || 'poster')
    setEditTitle(p.title_template)
    setEditCount(p.monthly_count)
    const existingStaffIds =
      p.assigned_staff_ids && p.assigned_staff_ids.length > 0
        ? p.assigned_staff_ids
        : p.default_staff_id
        ? [p.default_staff_id]
        : []
    setEditStaffIds(existingStaffIds)
    setEditLeadDays(p.start_lead_days ?? 2)
    setEditPreferredDays(p.preferred_days || [2, 5])
    setIsAddingNew(false)
  }

  const handleCancelEdit = () => {
    setEditingPlanId(null)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlanId) return
    setIsSavingEdit(true)
    try {
      await updatePlan({
        id: editingPlanId,
        updates: {
          deliverable_type: editType,
          title_template: editTitle,
          monthly_count: editCount,
          assigned_staff_ids: editStaffIds,
          default_staff_id: editStaffIds[0] || null,
          start_lead_days: editLeadDays,
          preferred_days: editPreferredDays,
        },
      })
      setEditingPlanId(null)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentClient) return

    await createPlan({
      client_id: currentClient.id,
      deliverable_type: newType,
      title_template: newTitle,
      monthly_count: newCount,
      assigned_staff_ids: newStaffIds,
      default_staff_id: newStaffIds[0] || null,
      start_lead_days: newLeadDays,
      preferred_days: newPreferredDays,
      is_active: true,
    })

    setIsAddingNew(false)
    setNewStaffIds([])
  }

  const handleSeedStandard = async () => {
    if (!currentClient) return

    const designer = staffList.find(
      (s) =>
        s.designation?.toLowerCase().includes('graphic') ||
        s.designation?.toLowerCase().includes('design')
    )?.id
    const videoEditor = staffList.find(
      (s) =>
        s.designation?.toLowerCase().includes('video') ||
        s.designation?.toLowerCase().includes('edit')
    )?.id

    await initializeStandardPackage({
      clientId: currentClient.id,
      designerStaffId: designer || null,
      videoEditorStaffId: videoEditor || null,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Monthly Recurring Packages"
      description="Define and customize the recurring deliverables (posters, videos, etc.) that automatically assign every month."
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Company Dropdown Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-100 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Select Client Company
              </span>
              <span className="text-xs font-bold text-slate-900">
                {currentClient.company_name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={currentClient.id}
              onChange={(e) => onSelectClient?.(e.target.value)}
              className="w-full sm:w-64 text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs cursor-pointer"
            >
              {dmClients.length > 0 ? (
                dmClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))
              ) : (
                <option value={currentClient.id}>{currentClient.company_name}</option>
              )}
            </select>
          </div>
        </div>

        {/* Recurring Auto-Assign Status Banner */}
        <div
          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
            isAutoRecurring
              ? 'bg-purple-50/80 border-purple-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                isAutoRecurring
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Monthly Auto-Recurring Assignment
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    isAutoRecurring
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isAutoRecurring ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isAutoRecurring
                  ? `CRM automatically queues and assigns ${currentClient.company_name}’s deliverable package for each new month.`
                  : 'Automatic monthly recurring assignment is paused. You can auto-assign on demand.'}
              </p>
            </div>
          </div>

          {onToggleAutoRecurring && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleRecurring}
              disabled={isUpdatingRecurring}
              className="text-xs shrink-0 ml-3 bg-white shadow-xs"
            >
              {isAutoRecurring ? (
                <span className="flex items-center gap-1 text-slate-700">
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Pause Auto</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-purple-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Activate Auto</span>
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Existing Plans List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Configured Monthly Deliverables ({plans.length})
            </h3>
            {!isAddingNew && !editingPlanId && (
              <div className="flex items-center gap-2">
                {plans.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (
                        window.confirm(
                          `Remove all ${plans.length} configured deliverable packages for ${currentClient.company_name}?`
                        )
                      ) {
                        await deleteAllPlansForClient(currentClient.id)
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-500" />
                    <span>Clear All Packages</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingNew(true)}
                  className="text-xs bg-brand-50 border-brand-300 text-brand-700 hover:bg-brand-100"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Deliverable Package</span>
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading packages...</div>
          ) : plans.length === 0 && !isAddingNew ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Sparkles className="w-8 h-8 text-brand-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900">
                No recurring package set for {currentClient.company_name}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Define the recurring deliverables (posters, videos, reels, etc.) you want for this client, and assign one or multiple staff to alternate work.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <Button
                  onClick={() => setIsAddingNew(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>+ Set Up Deliverable Package</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSeedStandard}
                  className="text-xs bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  size="sm"
                >
                  <span>Quick-fill 8 Posters + 4 Videos</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((p) => {
                const isPoster = p.deliverable_type === 'poster'
                const isVideo = p.deliverable_type === 'video' || p.deliverable_type === 'reel'
                const staff = staffList.find((s) => s.id === p.default_staff_id)
                const isThisEditing = editingPlanId === p.id

                if (isThisEditing) {
                  return (
                    <form
                      key={p.id}
                      onSubmit={handleSaveEdit}
                      className="p-4 rounded-xl border-2 border-brand-500 bg-white space-y-3.5 shadow-md"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Deliverable Package</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Deliverable Type
                          </label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as DeliverableType)}
                            className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium"
                          >
                            <option value="poster">Poster</option>
                            <option value="video">Promo Video</option>
                            <option value="reel">Reel / Short Video</option>
                            <option value="carousel">Carousel Post</option>
                            <option value="story">Story</option>
                            <option value="other">Other Deliverable</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Monthly Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={editCount}
                            onChange={(e) => setEditCount(Number(e.target.value))}
                            className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Title Template
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="e.g. Poster #{n}"
                            className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Lead Time (Start before due)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="14"
                            value={editLeadDays}
                            onChange={(e) => setEditLeadDays(Number(e.target.value))}
                            className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium"
                          />
                          <span className="text-[10px] text-slate-400">
                            Starts {editLeadDays} days prior to due date
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Preferred Days of Week
                        </label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {daysOfWeek.map((day) => {
                            const active = editPreferredDays.includes(day.value)
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDay(day.value, true)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                                  active
                                    ? 'bg-brand-600 text-white border-brand-600'
                                    : 'bg-white text-slate-600 border-slate-300'
                                }`}
                              >
                                {day.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Multi-Staff Alternating Picker for Edit */}
                      <div className="pt-2 border-t border-slate-100">
                        <AlternatingStaffPicker
                          staffIds={editStaffIds}
                          onChange={setEditStaffIds}
                          staffList={staffList}
                          label="Assigned Staff (Alternates evenly across month deliverables)"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={isSavingEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSavingEdit}
                          className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                          <Save className="w-3.5 h-3.5 mr-1" />
                          <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                        </Button>
                      </div>
                    </form>
                  )
                }

                const planStaffIds: string[] =
                  p.assigned_staff_ids && p.assigned_staff_ids.length > 0
                    ? p.assigned_staff_ids
                    : p.default_staff_id
                    ? [p.default_staff_id]
                    : []
                const assignedStaffMembers = planStaffIds
                  .map((id) => staffList.find((s) => s.id === id))
                  .filter(Boolean) as Profile[]

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand-200 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isPoster
                            ? 'bg-purple-100 text-purple-700'
                            : isVideo
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isPoster ? <Palette className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {p.monthly_count}x {p.title_template}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {p.deliverable_type}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          {assignedStaffMembers.length > 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>
                                Alternating ({assignedStaffMembers.length}): {assignedStaffMembers.map((s) => s.full_name).join(' ⇄ ')}
                              </span>
                            </span>
                          ) : assignedStaffMembers.length === 1 ? (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <User className="w-3 h-3 text-slate-400" />
                              {assignedStaffMembers[0].full_name}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400 italic">
                              <User className="w-3 h-3 text-slate-400" />
                              No staff assigned
                            </span>
                          )}
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {p.start_lead_days} days lead time
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(p)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-700 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 transition-colors"
                        title="Edit deliverable configuration"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePlan(p.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                        title="Delete package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add New Plan Form */}
        {isAddingNew && (
          <form
            onSubmit={handleCreatePlan}
            className="p-4 rounded-xl border border-brand-200 bg-brand-50/40 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-brand-100 pb-2">
              <h4 className="text-xs font-bold text-brand-950 uppercase tracking-wider">
                New Recurring Deliverable Package
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deliverable Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => handleTypeChange(e.target.value as DeliverableType)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium"
                >
                  <option value="poster">Poster</option>
                  <option value="video">Promo Video</option>
                  <option value="reel">Reel / Short Video</option>
                  <option value="carousel">Carousel Post</option>
                  <option value="story">Story</option>
                  <option value="other">Other Deliverable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={newCount}
                  onChange={(e) => setNewCount(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title Template
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Poster #{n}"
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium"
                  required
                />
                <span className="text-[10px] text-slate-500">
                  #{'{n}'} is replaced by the item number (1, 2, 3...)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Starting Lead Days
                </label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={newLeadDays}
                  onChange={(e) => setNewLeadDays(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium"
                />
                <span className="text-[10px] text-slate-500">
                  Staff work starts {newLeadDays} days before completion due date
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Posting Days
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {daysOfWeek.map((day) => {
                  const active = newPreferredDays.includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                        active
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Multi-Staff Alternating Picker for Add New */}
            <div className="pt-2 border-t border-brand-100">
              <AlternatingStaffPicker
                staffIds={newStaffIds}
                onChange={setNewStaffIds}
                staffList={staffList}
                label="Assign Staff (Alternates evenly across month deliverables)"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingNew(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-brand-600 hover:bg-brand-700 text-white">
                Save Package
              </Button>
            </div>
          </form>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
