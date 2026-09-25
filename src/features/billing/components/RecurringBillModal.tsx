import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RecurringBill } from '@/types/database.types'

const recurringSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  bill_name: z.string().min(1, 'Retainer title is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  start_date: z.string().min(1, 'Start date is required'),
  billing_day: z.number().min(1).max(31, 'Day must be between 1 and 31'),
  assigned_staff_id: z.string().nullable().optional(),
  remarks: z.string().optional(),
})

type RecurringFormValues = z.infer<typeof recurringSchema>

interface RecurringBillModalProps {
  isOpen: boolean
  onClose: () => void
  initialRecurringBill?: RecurringBill | null
  onSubmit: (values: Partial<RecurringBill>) => Promise<any>
}

export const RecurringBillModal: React.FC<RecurringBillModalProps> = ({
  isOpen,
  onClose,
  initialRecurringBill,
  onSubmit,
}) => {
  const isEditing = !!initialRecurringBill

  // Clients
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

  // Staff
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
  } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema) as any,
    defaultValues: {
      client_id: '',
      bill_name: '',
      amount: 0,
      currency: 'INR',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      billing_day: 5,
      assigned_staff_id: null,
      remarks: '',
    },
  })

  useEffect(() => {
    if (initialRecurringBill) {
      reset({
        client_id: initialRecurringBill.client_id,
        bill_name: initialRecurringBill.bill_name,
        amount: Number(initialRecurringBill.amount),
        currency: initialRecurringBill.currency,
        frequency: initialRecurringBill.frequency,
        start_date: initialRecurringBill.start_date,
        billing_day: initialRecurringBill.billing_day,
        assigned_staff_id: initialRecurringBill.assigned_staff_id,
        remarks: initialRecurringBill.remarks || '',
      })
    } else {
      reset({
        client_id: '',
        bill_name: '',
        amount: 0,
        currency: 'INR',
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        billing_day: 5,
        assigned_staff_id: null,
        remarks: '',
      })
    }
  }, [initialRecurringBill, reset, isOpen])

  const handleFormSubmit = async (values: RecurringFormValues) => {
    await onSubmit({
      ...values,
      assigned_staff_id: values.assigned_staff_id || null,
      remarks: values.remarks || null,
      is_active: true,
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Retainer Contract' : 'Create Recurring Retainer'}
      description="Configure recurring billing cadences for retainers, SEO packages, and maintenance contracts."
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
            label="Retainer Contract Title"
            placeholder="e.g. Monthly Digital Marketing Retainer"
            error={errors.bill_name?.message}
            {...register('bill_name')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Amount per Cycle"
            type="number"
            step="0.01"
            placeholder="30000"
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

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Frequency
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register('frequency')}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contract Start Date"
            type="date"
            error={errors.start_date?.message}
            {...register('start_date')}
          />

          <Input
            label="Billing Day of Month (1 - 31)"
            type="number"
            min={1}
            max={31}
            placeholder="5"
            error={errors.billing_day?.message}
            {...register('billing_day', { valueAsNumber: true })}
          />
        </div>

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

        <Input
          label="Contract Terms / Notes"
          placeholder="Scope: 12 social posts, 2 ad campaigns, monthly reporting..."
          {...register('remarks')}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Retainer' : 'Create Retainer Contract'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
