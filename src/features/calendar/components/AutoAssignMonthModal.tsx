import React, { useState, useEffect, useMemo } from 'react'
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Film,
  Palette,
  Repeat,
  Calendar,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Client, Profile, DMClientDeliverablePlan, DeliverableType } from '@/types/database.types'
import { generateMonthDeliverablesSchedule, GeneratedDeliverablePreview } from '../utils/dmScheduler'
import { useDMClientPlans } from '../hooks/useDMClientPlans'
import { format, addMonths } from 'date-fns'

interface AutoAssignMonthModalProps {
  isOpen: boolean
  onClose: () => void
  dmClients: Client[]
  staffList: Profile[]
  allPlans?: DMClientDeliverablePlan[]
  initialClientId?: string
  initialDate?: Date
  onConfirmAssign: (deliverables: any[]) => Promise<any>
  onSetAutoRecurring?: (clientId: string, enabled: boolean) => Promise<any>
  onOpenPlansManager?: (clientId: string) => void
}

export const AutoAssignMonthModal: React.FC<AutoAssignMonthModalProps> = ({
  isOpen,
  onClose,
  dmClients,
  staffList,
  allPlans = [],
  initialClientId,
  initialDate = new Date(),
  onConfirmAssign,
  onSetAutoRecurring,
  onOpenPlansManager,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId && initialClientId !== 'all' ? initialClientId : dmClients[0]?.id || ''
  )
  const [targetMonth, setTargetMonth] = useState<string>(format(initialDate, 'yyyy-MM'))
  const [scheduleDurationMonths, setScheduleDurationMonths] = useState<number>(1)
  const [isAutoRecurringEnabled, setIsAutoRecurringEnabled] = useState<boolean>(true)
  const [previewItems, setPreviewItems] = useState<GeneratedDeliverablePreview[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Direct fetch for currently selected client to avoid stale cache
  const { plans: directPlans = [], isLoading: isLoadingPlans } = useDMClientPlans(selectedClientId)

  // Keep selected client synced
  useEffect(() => {
    if (initialClientId && initialClientId !== 'all') {
      setSelectedClientId(initialClientId)
    } else if (dmClients.length > 0 && !selectedClientId) {
      setSelectedClientId(dmClients[0].id)
    }
  }, [initialClientId, dmClients])

  const selectedClient = useMemo(() => {
    return dmClients.find((c) => c.id === selectedClientId)
  }, [dmClients, selectedClientId])

  // Sync client's current recurring status
  useEffect(() => {
    if (selectedClient) {
      setIsAutoRecurringEnabled(selectedClient.dm_auto_assign_recurring !== false)
    }
  }, [selectedClient])

  // Get active plans for this client (direct fetch prioritized)
  const clientPlans = useMemo(() => {
    if (directPlans.length > 0) {
      return directPlans.filter((p) => p.is_active)
    }
    return (allPlans || []).filter((p) => p.client_id === selectedClientId && p.is_active)
  }, [directPlans, allPlans, selectedClientId])

  // Generate preview across 1, 2, or 3 months
  const handleRegenerate = () => {
    if (!selectedClient) return

    const [year, month] = targetMonth.split('-').map(Number)
    const baseTargetDate = new Date(year, month - 1, 1)

    // Only generate schedule if client has saved recurring plans
    if (clientPlans.length === 0) {
      setPreviewItems([])
      return
    }

    const allGenerated: GeneratedDeliverablePreview[] = []

    for (let m = 0; m < scheduleDurationMonths; m++) {
      const currentMonthTarget = addMonths(baseTargetDate, m)
      const monthDeliverables = generateMonthDeliverablesSchedule({
        clientId: selectedClient.id,
        clientName: selectedClient.company_name,
        targetMonthDate: currentMonthTarget,
        plans: clientPlans,
      })
      allGenerated.push(...monthDeliverables)
    }

    setPreviewItems(allGenerated)
  }

  // Auto-generate on open, client change, duration change, or when plans load
  useEffect(() => {
    if (isOpen && selectedClientId && !isLoadingPlans) {
      handleRegenerate()
    }
  }, [isOpen, selectedClientId, targetMonth, scheduleDurationMonths, clientPlans, isLoadingPlans])

  // Inline preview item updates
  const handleUpdateItem = (index: number, field: keyof GeneratedDeliverablePreview, value: any) => {
    setPreviewItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleDeleteItem = (index: number) => {
    setPreviewItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddItem = (type: DeliverableType = 'poster') => {
    if (!selectedClient) return
    const [year, month] = targetMonth.split('-').map(Number)
    const defaultDate = `${year}-${String(month).padStart(2, '0')}-15`

    const newItem: GeneratedDeliverablePreview = {
      tempId: `custom-${Date.now()}`,
      client_id: selectedClient.id,
      deliverable_type: type,
      title: `${selectedClient.company_name} - Extra ${type.toUpperCase()}`,
      description: `Custom ${type} deliverable for ${selectedClient.company_name}`,
      start_date: defaultDate,
      due_date: defaultDate,
      assigned_staff_id: staffList[0]?.id || '',
      priority: 'normal',
    }

    setPreviewItems((prev) => [...prev, newItem])
  }

  const handleSubmit = async () => {
    if (previewItems.length === 0) return
    setIsSubmitting(true)
    try {
      // 1. If setAutoRecurring callback is provided, update client's recurring status
      if (onSetAutoRecurring && selectedClientId) {
        await onSetAutoRecurring(selectedClientId, isAutoRecurringEnabled)
      }

      // 2. Insert all deliverables
      const payload = previewItems.map((item) => ({
        client_id: item.client_id,
        deliverable_type: item.deliverable_type,
        title: item.title,
        description: item.description,
        start_date: item.start_date,
        due_date: item.due_date,
        assigned_date: item.start_date,
        assigned_staff_id: item.assigned_staff_id,
        priority: item.priority,
        dm_plan_id: item.dm_plan_id || null,
        status: 'assigned',
      }))

      await onConfirmAssign(payload)
      onClose()
    } catch (err) {
      console.error('Failed to auto-assign month deliverables:', err)
      alert('Error creating deliverables. Please check all fields.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Count summaries
  const postersCount = previewItems.filter((i) => i.deliverable_type === 'poster').length
  const videosCount = previewItems.filter(
    (i) => i.deliverable_type === 'video' || i.deliverable_type === 'reel'
  ).length

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Auto-Assign Month Work (DM Deliverables)"
      description="Automatically generate, space out, and assign posters and videos across the calendar with start dates and recurring options."
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Step 1: Client and Target Month Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select DM Client
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              {dmClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Starting Month
            </label>
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Schedule Duration
            </label>
            <select
              value={scheduleDurationMonths}
              onChange={(e) => setScheduleDurationMonths(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value={1}>1 Month (Standard)</option>
              <option value={2}>2 Months Ahead</option>
              <option value={3}>3 Months Ahead (Quarter)</option>
            </select>
          </div>
        </div>

        {/* Recurring Option Box (The Key Feature Requested) */}
        <div className="flex items-start gap-3 p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50/60 rounded-xl border border-purple-200">
          <input
            type="checkbox"
            id="auto_recurring_toggle"
            checked={isAutoRecurringEnabled}
            onChange={(e) => setIsAutoRecurringEnabled(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
          <div className="flex-1">
            <label
              htmlFor="auto_recurring_toggle"
              className="text-xs font-bold text-purple-950 flex items-center gap-1.5 cursor-pointer"
            >
              <Repeat className="w-3.5 h-3.5 text-purple-600" />
              <span>Mark as Recurring Every Month (Auto-Assign Active)</span>
            </label>
            <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
              When checked, this client is marked for automatic monthly recurrence. The CRM can
              auto-generate each upcoming month&apos;s deliverable schedule and notify staff without
              requiring manual setup.
            </p>
          </div>
        </div>

        {/* Plan Status Banner */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
          clientPlans.length > 0 ? 'bg-brand-50/70 border-brand-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <Sparkles className={`w-5 h-5 shrink-0 ${clientPlans.length > 0 ? 'text-brand-600' : 'text-slate-400'}`} />
            <div>
              {isLoadingPlans ? (
                <p className="text-xs font-semibold text-slate-500">
                  Checking recurring packages for {selectedClient?.company_name}...
                </p>
              ) : clientPlans.length > 0 ? (
                <>
                  <p className="text-xs font-bold text-brand-950">
                    Configured Packages: {postersCount} Posters &bull; {videosCount} Videos
                    {scheduleDurationMonths > 1 && ` (x${scheduleDurationMonths} months)`}
                  </p>
                  <p className="text-[11px] text-brand-700">
                    Based on {clientPlans.length} active recurring package{clientPlans.length > 1 ? 's' : ''} configured for {selectedClient?.company_name}.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-800">
                    No recurring packages configured for {selectedClient?.company_name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Configure deliverable packages in &ldquo;Recurring Packages&rdquo; or add custom deliverables manually below.
                  </p>
                </>
              )}
            </div>
          </div>

          {onOpenPlansManager && selectedClientId && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenPlansManager(selectedClientId)
              }}
              className="text-xs font-semibold text-brand-700 hover:text-brand-900 underline whitespace-nowrap ml-3"
            >
              {clientPlans.length > 0 ? 'Edit Packages' : 'Configure Packages'}
            </button>
          )}
        </div>

        {/* Step 2: Interactive Preview Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Scheduled Deliverables Preview ({previewItems.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleAddItem('poster')}
                className="text-[11px] h-7 px-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Poster
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleAddItem('video')}
                className="text-[11px] h-7 px-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Video
              </Button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Deliverable Title</th>
                  <th className="py-2.5 px-3">Work Starting Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Assigned Staff</th>
                  <th className="py-2.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoadingPlans ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                      <Sparkles className="w-5 h-5 text-brand-600 animate-spin mx-auto mb-2" />
                      <span>Loading deliverables for {selectedClient?.company_name}...</span>
                    </td>
                  </tr>
                ) : previewItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                      <Sparkles className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <span className="font-semibold block text-slate-700">No deliverables to assign</span>
                      <span className="text-[11px] text-slate-400">
                        {clientPlans.length === 0
                          ? 'Configure recurring deliverable packages or click "+ Add Poster" / "+ Add Video" above.'
                          : 'All deliverables have been cleared.'}
                      </span>
                    </td>
                  </tr>
                ) : (
                  previewItems.map((item, idx) => {
                  const isPoster = item.deliverable_type === 'poster'
                  const isVideo =
                    item.deliverable_type === 'video' || item.deliverable_type === 'reel'

                  return (
                    <tr key={item.tempId} className="hover:bg-slate-50 transition-colors">
                      {/* Type Badge */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isPoster
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : isVideo
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isPoster ? <Palette className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                          {item.deliverable_type.toUpperCase()}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                          className="w-full text-xs font-medium text-slate-900 border border-transparent hover:border-slate-300 focus:border-brand-500 rounded px-1.5 py-1 bg-transparent focus:bg-white"
                        />
                      </td>

                      {/* Work Starting Date */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <input
                          type="date"
                          value={item.start_date}
                          onChange={(e) => handleUpdateItem(idx, 'start_date', e.target.value)}
                          className="text-xs text-slate-700 border border-slate-200 rounded px-2 py-1 bg-white focus:border-brand-500"
                        />
                      </td>

                      {/* Due Date */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <input
                          type="date"
                          value={item.due_date}
                          onChange={(e) => handleUpdateItem(idx, 'due_date', e.target.value)}
                          className="text-xs font-semibold text-slate-900 border border-slate-200 rounded px-2 py-1 bg-white focus:border-brand-500"
                        />
                      </td>

                      {/* Assigned Staff */}
                      <td className="py-2 px-3">
                        <select
                          value={item.assigned_staff_id}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'assigned_staff_id', e.target.value)
                          }
                          className="w-full text-xs text-slate-800 border border-slate-200 rounded px-2 py-1 bg-white focus:border-brand-500"
                        >
                          <option value="">-- Assign Staff --</option>
                          {staffList.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.full_name} ({staff.designation || 'Staff'})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Delete */}
                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                }))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notification Alert Notice */}
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            When you confirm, each assigned staff member will receive an instant notification with
            their <strong>work starting date</strong>, client name, and due date.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={previewItems.length === 0 || isSubmitting}
            className="shadow-md shadow-brand-500/20 bg-brand-600 hover:bg-brand-700 text-white"
          >
            {isSubmitting ? (
              <span>Assigning & Notifying...</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Assign {previewItems.length} Deliverables</span>
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
