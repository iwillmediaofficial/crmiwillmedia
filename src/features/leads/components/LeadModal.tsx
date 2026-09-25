import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Lead } from '@/types/database.types'
import { useAuth } from '@/features/auth/AuthContext'

const leadSchema = z.object({
  name: z.string().min(1, 'Lead name is required'),
  phone: z.string().min(5, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').or(z.literal('')),
  lead_source: z.string().min(1, 'Source is required'),
  campaign_details: z.string().optional(),
  assigned_staff_id: z.string().nullable().optional(),
  status: z.string().min(1, 'Status is required'),
  follow_up_date: z.string().nullable().optional(),
  remarks: z.string().optional(),
})

type LeadFormValues = z.infer<typeof leadSchema>

interface LeadModalProps {
  isOpen: boolean
  onClose: () => void
  initialLead?: Lead | null
  onSubmit: (values: Partial<Lead>) => Promise<any>
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  initialLead,
  onSubmit,
}) => {
  const { isAdmin } = useAuth()

  // Query staff profiles for assignment dropdown
  const { data: staffList } = useQuery({
    queryKey: ['staff-profiles-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('active', true)
        .order('full_name')
      if (error) throw error
      return data
    },
    enabled: isOpen && isAdmin,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      lead_source: 'website',
      campaign_details: '',
      assigned_staff_id: null,
      status: 'new',
      follow_up_date: null,
      remarks: '',
    },
  })

  useEffect(() => {
    if (initialLead) {
      reset({
        name: initialLead.name,
        phone: initialLead.phone,
        email: initialLead.email || '',
        lead_source: initialLead.lead_source,
        campaign_details: initialLead.campaign_details || '',
        assigned_staff_id: initialLead.assigned_staff_id,
        status: initialLead.status,
        follow_up_date: initialLead.follow_up_date ? initialLead.follow_up_date.slice(0, 16) : null,
        remarks: initialLead.remarks || '',
      })
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        lead_source: 'website',
        campaign_details: '',
        assigned_staff_id: null,
        status: 'new',
        follow_up_date: null,
        remarks: '',
      })
    }
  }, [initialLead, reset, isOpen])

  const handleFormSubmit = async (values: LeadFormValues) => {
    const payload: Partial<Lead> = {
      ...values,
      email: values.email ? values.email : null,
      assigned_staff_id: values.assigned_staff_id || null,
      follow_up_date: values.follow_up_date ? new Date(values.follow_up_date).toISOString() : null,
      campaign_details: values.campaign_details || null,
      remarks: values.remarks || null,
    }
    await onSubmit(payload)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialLead ? 'Edit Lead' : 'Add New Lead'}
      description="Capture prospect details, assign team members, and set scheduled follow-ups."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Prospect / Company Name"
            placeholder="John Doe / TechCorp"
            error={errors.name?.message}
            disabled={!isAdmin && !!initialLead}
            {...register('name')}
          />

          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            error={errors.phone?.message}
            disabled={!isAdmin && !!initialLead}
            {...register('phone')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="john@example.com"
            error={errors.email?.message}
            disabled={!isAdmin && !!initialLead}
            {...register('email')}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Lead Source
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              disabled={!isAdmin && !!initialLead}
              {...register('lead_source')}
            >
              <option value="facebook">Facebook Ads</option>
              <option value="instagram">Instagram Ads</option>
              <option value="website">Website Form</option>
              <option value="referral">Referral</option>
              <option value="direct">Direct Outreach</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Lead Status
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register('status')}
            >
              <option value="new">New Inquiry</option>
              <option value="follow_up">Follow-up Required</option>
              <option value="interested">Interested</option>
              <option value="won">Won / Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Assigned Staff
            </label>
            {isAdmin ? (
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                {...register('assigned_staff_id')}
              >
                <option value="">Unassigned</option>
                {staffList?.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name} ({staff.role})
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
                Assigned to you
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Campaign / Source Details"
            placeholder="e.g. Diwalipromo_FB_v2"
            disabled={!isAdmin && !!initialLead}
            {...register('campaign_details')}
          />

          <Input
            label="Scheduled Follow-up Date & Time"
            type="datetime-local"
            {...register('follow_up_date')}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Discussion Remarks / Notes
          </label>
          <textarea
            rows={3}
            placeholder="Notes from calls, client requirements, budget range, and next steps..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-slate-400"
            {...register('remarks')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialLead ? 'Save Changes' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
