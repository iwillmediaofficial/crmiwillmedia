import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { WorkItem } from '@/types/database.types'
import { useAuth } from '@/features/auth/AuthContext'

const workItemSchema = z.object({
  title: z.string().min(1, 'Work title is required'),
  client_id: z.string().min(1, 'Client selection is required'),
  description: z.string().optional(),
  assigned_staff_id: z.string().min(1, 'Staff assignment is required'),
  due_date: z.string().min(1, 'Due date is required'),
  priority: z.string().min(1, 'Priority is required'),
  status: z.string().min(1, 'Status is required'),
  billing_status: z.string().min(1, 'Billing status is required'),
  remarks: z.string().optional(),
})

type WorkItemFormValues = z.infer<typeof workItemSchema>

interface WorkItemModalProps {
  isOpen: boolean
  onClose: () => void
  initialWorkItem?: WorkItem | null
  onSubmit: (values: Partial<WorkItem>) => Promise<any>
}

export const WorkItemModal: React.FC<WorkItemModalProps> = ({
  isOpen,
  onClose,
  initialWorkItem,
  onSubmit,
}) => {
  const { isAdmin } = useAuth()

  // Fetch active clients
  const { data: clients } = useQuery({
    queryKey: ['active-clients-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('status', 'active')
        .order('company_name')
      if (error) throw error
      return data
    },
    enabled: isOpen,
  })

  // Fetch active staff
  const { data: staffList } = useQuery({
    queryKey: ['active-staff-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, designation')
        .eq('active', true)
        .order('full_name')
      if (error) throw error
      return data
    },
    enabled: isOpen,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkItemFormValues>({
    resolver: zodResolver(workItemSchema),
    defaultValues: {
      title: '',
      client_id: '',
      description: '',
      assigned_staff_id: '',
      due_date: '',
      priority: 'normal',
      status: 'assigned',
      billing_status: 'unbilled',
      remarks: '',
    },
  })

  useEffect(() => {
    if (initialWorkItem) {
      reset({
        title: initialWorkItem.title,
        client_id: initialWorkItem.client_id,
        description: initialWorkItem.description || '',
        assigned_staff_id: initialWorkItem.assigned_staff_id,
        due_date: initialWorkItem.due_date,
        priority: initialWorkItem.priority,
        status: initialWorkItem.status,
        billing_status: initialWorkItem.billing_status,
        remarks: initialWorkItem.remarks || '',
      })
    } else {
      reset({
        title: '',
        client_id: '',
        description: '',
        assigned_staff_id: '',
        due_date: '',
        priority: 'normal',
        status: 'assigned',
        billing_status: 'unbilled',
        remarks: '',
      })
    }
  }, [initialWorkItem, reset, isOpen])

  const handleFormSubmit = async (values: WorkItemFormValues) => {
    await onSubmit({
      ...values,
      description: values.description || null,
      remarks: values.remarks || null,
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialWorkItem ? 'Edit Work Item' : 'Assign New Work'}
      description="Define task deliverables, client context, assignee, and completion deadlines."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Work Deliverable Title"
          placeholder="e.g. Website Redesign - Homepage & Checkout"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Client
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register('client_id')}
            >
              <option value="">Select Client</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="text-xs text-rose-600">{errors.client_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Assigned Staff
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              disabled={!isAdmin && !!initialWorkItem}
              {...register('assigned_staff_id')}
            >
              <option value="">Select Assignee</option>
              {staffList?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.designation || 'Staff'})
                </option>
              ))}
            </select>
            {errors.assigned_staff_id && (
              <p className="text-xs text-rose-600">{errors.assigned_staff_id.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Work Description & Specifications
          </label>
          <textarea
            rows={3}
            placeholder="Detailed instructions, scope, reference links, and milestones..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Due Date"
            type="date"
            error={errors.due_date?.message}
            {...register('due_date')}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Priority
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register('priority')}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Status
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register('status')}
            >
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Billing Status
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              disabled={!isAdmin}
              {...register('billing_status')}
            >
              <option value="unbilled">Unbilled</option>
              <option value="billed">Billed</option>
            </select>
          </div>

          <Input
            label="Internal Remarks"
            placeholder="Optional project notes"
            {...register('remarks')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialWorkItem ? 'Save Changes' : 'Assign Work'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
