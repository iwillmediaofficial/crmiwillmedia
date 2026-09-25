import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Profile } from '@/types/database.types'
import { StaffFormPayload } from '../hooks/useStaff'

const staffSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  role: z.string().min(1, 'Role is required'),
})

type StaffFormValues = z.infer<typeof staffSchema>

interface StaffModalProps {
  isOpen: boolean
  onClose: () => void
  initialStaff?: Profile | null
  onSubmit: (values: StaffFormPayload) => Promise<any>
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  initialStaff,
  onSubmit,
}) => {
  const isEditing = !!initialStaff

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone: '',
      department: 'Development',
      designation: '',
      role: 'staff',
    },
  })

  useEffect(() => {
    if (initialStaff) {
      reset({
        full_name: initialStaff.full_name,
        email: initialStaff.email,
        password: '',
        phone: initialStaff.phone || '',
        department: initialStaff.department || 'Development',
        designation: initialStaff.designation || '',
        role: initialStaff.role,
      })
    } else {
      reset({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        department: 'Development',
        designation: '',
        role: 'staff',
      })
    }
  }, [initialStaff, reset, isOpen])

  const handleFormSubmit = async (values: StaffFormValues) => {
    await onSubmit({
      full_name: values.full_name,
      email: values.email,
      password: values.password || undefined,
      phone: values.phone || undefined,
      department: values.department,
      designation: values.designation,
      role: values.role,
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Staff Profile' : 'Add New Staff Member'}
      description={
        isEditing
          ? 'Update employee permissions, department, and role.'
          : 'Provision a new team member account with credentials.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. Rahul Sharma"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="rahul@iwillmedia.com"
            disabled={isEditing}
            error={errors.email?.message}
            {...register('email')}
          />

          {!isEditing ? (
            <Input
              label="Temporary Password"
              type="password"
              placeholder="Min 6 characters"
              error={errors.password?.message}
              {...register('password')}
            />
          ) : (
            <Input
              label="Contact Phone"
              placeholder="+91 98765 00000"
              error={errors.phone?.message}
              {...register('phone')}
            />
          )}
        </div>

        {!isEditing && (
          <Input
            label="Contact Phone"
            placeholder="+91 98765 00000"
            error={errors.phone?.message}
            {...register('phone')}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Department
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              {...register('department')}
            >
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Accounts">Accounts</option>
              <option value="Management">Management</option>
            </select>
          </div>

          <Input
            label="Designation"
            placeholder="e.g. Senior Frontend Dev"
            error={errors.designation?.message}
            {...register('designation')}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            System Access Role
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            {...register('role')}
          >
            <option value="staff">Staff (Standard Task & Lead Access)</option>
            <option value="admin">Admin (Full System & Financial Access)</option>
            <option value="manager">Manager (Work & Team Oversight)</option>
            <option value="sales">Sales (Leads & CRM Outreach)</option>
            <option value="designer">Designer (Creative Deliverables)</option>
            <option value="digital_marketing">Digital Marketing (Campaigns & Retainers)</option>
            <option value="accounts">Accounts (Invoicing & Billing)</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
