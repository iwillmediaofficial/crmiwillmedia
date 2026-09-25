import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BillingRecord } from '@/types/database.types'

const billSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  bill_title: z.string().min(1, 'Bill title is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().min(1, 'Currency is required'),
  due_date: z.string().min(1, 'Due date is required'),
  assigned_staff_id: z.string().nullable().optional(),
  status: z.string().min(1, 'Status is required'),
  remarks: z.string().optional(),
})

type BillFormValues = z.infer<typeof billSchema>

interface BillModalProps {
  isOpen: boolean
  onClose: () => void
  initialBill?: BillingRecord | null
  onSubmit: (values: Partial<BillingRecord>) => Promise<any>
}

export const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  onClose,
  initialBill,
  onSubmit,
}) => {
  const isEditing = !!initialBill

  // Active clients
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

  // Active staff
  const { data: staffList } = useQuery({
    queryKey: ['active-staff-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
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
  } = useForm<BillFormValues>({
    resolver: zodResolver(billSchema) as any,
    defaultValues: {
      client_id: '',
      bill_title: '',
      description: '',
      amount: 0,
      currency: 'INR',
      due_date: '',
      assigned_staff_id: null,
      status: 'pending',
      remarks: '',
    },
  })

  useEffect(() => {
    if (initialBill) {
      reset({
        client_id: initialBill.client_id,
        bill_title: initialBill.bill_title,
        description: initialBill.description || '',
        amount: Number(initialBill.amount),
        currency: initialBill.currency,
        due_date: initialBill.due_date,
        assigned_staff_id: initialBill.assigned_staff_id,
        status: initialBill.status,
        remarks: initialBill.remarks || '',
      })
    } else {
      reset({
        client_id: '',
        bill_title: '',
        description: '',
        amount: 0,
        currency: 'INR',
        due_date: new Date().toISOString().split('T')[0],
        assigned_staff_id: null,
        status: 'pending',
        remarks: '',
      })
    }
  }, [initialBill, reset, isOpen])

  const handleFormSubmit = async (values: BillFormValues) => {
    await onSubmit({
      ...values,
      assigned_staff_id: values.assigned_staff_id || null,
      description: values.description || null,
      remarks: values.remarks || null,
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Invoice / Bill' : 'Create Invoice / Bill'}
      description="Record client payment obligations, due dates, and currency requirements."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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

          <Input
            label="Invoice / Bill Title"
            placeholder="e.g. Website Design - Milestone 1"
            error={errors.bill_title?.message}
            {...register('bill_title')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="50000"
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Currency
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register('currency')}
            >
              <option value="INR">INR (₹)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          <Input
            label="Payment Due Date"
            type="date"
            error={errors.due_date?.message}
            {...register('due_date')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Assigned Account Manager
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register('assigned_staff_id')}
            >
              <option value="">Unassigned</option>
              {staffList?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Payment Status
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register('status')}
            >
              <option value="pending">Pending Payment</option>
              <option value="paid">Paid & Settled</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <Input
          label="Payment Notes / Invoice Details"
          placeholder="PO Number, bank wire ref, or client billing terms..."
          {...register('description')}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Bill'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
