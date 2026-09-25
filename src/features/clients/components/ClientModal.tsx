import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Client } from '@/types/database.types'

const clientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_person: z.string().min(1, 'Contact person name is required'),
  email: z.string().email('Valid email is required').or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  initialClient?: Client | null
  onSubmit: (values: Partial<Client>) => Promise<any>
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  initialClient,
  onSubmit,
}) => {
  const isEditing = !!initialClient

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      status: 'active',
      notes: '',
    },
  })

  useEffect(() => {
    if (initialClient) {
      reset({
        company_name: initialClient.company_name,
        contact_person: initialClient.contact_person,
        email: initialClient.email || '',
        phone: initialClient.phone || '',
        website: initialClient.website || '',
        address: initialClient.address || '',
        status: initialClient.status,
        notes: initialClient.notes || '',
      })
    } else {
      reset({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        status: 'active',
        notes: '',
      })
    }
  }, [initialClient, reset, isOpen])

  const handleFormSubmit = async (values: ClientFormValues) => {
    await onSubmit({
      ...values,
      email: values.email || null,
      phone: values.phone || null,
      website: values.website || null,
      address: values.address || null,
      notes: values.notes || null,
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Client Record' : 'Add New Client'}
      description="Register company identity, contact points, and operational notes."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company / Brand Name"
            placeholder="e.g. Acme Global Media"
            error={errors.company_name?.message}
            {...register('company_name')}
          />

          <Input
            label="Primary Contact Person"
            placeholder="e.g. Jane Smith (Director)"
            error={errors.contact_person?.message}
            {...register('contact_person')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="billing@acme.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Phone Number"
            placeholder="+91 98765 11111"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Website URL"
            placeholder="https://acme.com"
            {...register('website')}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Account Status
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register('status')}
            >
              <option value="active">Active Client</option>
              <option value="inactive">Inactive / Archived</option>
            </select>
          </div>
        </div>

        <Input
          label="Office / Billing Address"
          placeholder="Building, Street, City, Country"
          {...register('address')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Account Notes / Contract Terms
          </label>
          <textarea
            rows={3}
            placeholder="Billing terms, retainer specifications, primary requirements..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            {...register('notes')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Client'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
