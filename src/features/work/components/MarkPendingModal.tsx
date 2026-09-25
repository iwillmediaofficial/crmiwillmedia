import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const pendingSchema = z.object({
  pending_reason: z.string().min(1, 'Reason for pending status is required'),
  pending_expected_resume_date: z.string().min(1, 'Expected resume date is required'),
  remarks: z.string().optional(),
})

type PendingFormValues = z.infer<typeof pendingSchema>

interface MarkPendingModalProps {
  isOpen: boolean
  onClose: () => void
  taskTitle: string
  onSubmit: (values: PendingFormValues) => Promise<any>
}

export const MarkPendingModal: React.FC<MarkPendingModalProps> = ({
  isOpen,
  onClose,
  taskTitle,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PendingFormValues>({
    resolver: zodResolver(pendingSchema),
    defaultValues: {
      pending_reason: '',
      pending_expected_resume_date: '',
      remarks: '',
    },
  })

  const handleFormSubmit = async (values: PendingFormValues) => {
    await onSubmit(values)
    reset()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Work as Pending"
      description={`Pause work on "${taskTitle}" and document the blocker or dependency.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Reason for Hold / Blocker"
          placeholder="e.g. Waiting for client design assets / API credentials"
          error={errors.pending_reason?.message}
          {...register('pending_reason')}
        />

        <Input
          label="Expected Resumption Date"
          type="date"
          error={errors.pending_expected_resume_date?.message}
          {...register('pending_expected_resume_date')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Additional Remarks
          </label>
          <textarea
            rows={3}
            placeholder="Details about client communication or next steps..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            {...register('remarks')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={isSubmitting}>
            Mark Pending
          </Button>
        </div>
      </form>
    </Modal>
  )
}
