import React, { useState, useEffect } from 'react'
import { format, parseISO, addYears, addMonths } from 'date-fns'
import { Calendar, CheckCircle2, RotateCw } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DomainServerAsset } from '../types/domainServer.types'

interface RenewModalProps {
  isOpen: boolean
  onClose: () => void
  asset: DomainServerAsset | null
  onRenew: (args: { id: string; newExpiryDate: string; renewalCost?: number }) => Promise<any>
}

export const RenewModal: React.FC<RenewModalProps> = ({
  isOpen,
  onClose,
  asset,
  onRenew,
}) => {
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [renewalCost, setRenewalCost] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (asset) {
      // Default to +1 year from existing expiry date
      try {
        const baseDate = parseISO(asset.expiry_date)
        const nextYear = addYears(baseDate, 1)
        setNewExpiryDate(format(nextYear, 'yyyy-MM-dd'))
      } catch {
        const nextYear = addYears(new Date(), 1)
        setNewExpiryDate(format(nextYear, 'yyyy-MM-dd'))
      }
      setRenewalCost(asset.renewal_cost || 0)
    }
  }, [asset, isOpen])

  if (!asset) return null

  const handleQuickAddYears = (years: number) => {
    try {
      const base = parseISO(asset.expiry_date)
      // If current expiry is already in the past, renew from today
      const startDate = base.getTime() < Date.now() ? new Date() : base
      const target = addYears(startDate, years)
      setNewExpiryDate(format(target, 'yyyy-MM-dd'))
    } catch {
      const target = addYears(new Date(), years)
      setNewExpiryDate(format(target, 'yyyy-MM-dd'))
    }
  }

  const handleQuickAddMonths = (months: number) => {
    try {
      const base = parseISO(asset.expiry_date)
      const startDate = base.getTime() < Date.now() ? new Date() : base
      const target = addMonths(startDate, months)
      setNewExpiryDate(format(target, 'yyyy-MM-dd'))
    } catch {
      const target = addMonths(new Date(), months)
      setNewExpiryDate(format(target, 'yyyy-MM-dd'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpiryDate) return
    setIsSubmitting(true)
    try {
      await onRenew({
        id: asset.id,
        newExpiryDate,
        renewalCost: Number(renewalCost),
      })
      onClose()
    } catch (err: any) {
      alert(err.message || 'Failed to renew asset')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Asset Renewal"
      description={`Extend expiry and update billing record for ${asset.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Current Expiry Date</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {asset.expiry_date}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium">Provider</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">
              {asset.provider}
            </p>
          </div>
        </div>

        {/* Quick extension shortcuts */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Quick Extension
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickAddYears(1)}
              className="py-1.5 px-2 bg-brand-50 text-brand-700 text-xs font-semibold rounded-lg border border-brand-200 hover:bg-brand-100 transition-colors"
            >
              + 1 Year
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddYears(2)}
              className="py-1.5 px-2 bg-brand-50 text-brand-700 text-xs font-semibold rounded-lg border border-brand-200 hover:bg-brand-100 transition-colors"
            >
              + 2 Years
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddMonths(1)}
              className="py-1.5 px-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors"
            >
              + 1 Month
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddMonths(3)}
              className="py-1.5 px-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors"
            >
              + 3 Months
            </button>
          </div>
        </div>

        {/* New Expiry Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            New Expiry Date *
          </label>
          <div className="relative">
            <input
              type="date"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
        </div>

        {/* Renewal Cost */}
        <Input
          label={`Renewal Cost (${asset.currency})`}
          type="number"
          step="any"
          value={renewalCost}
          onChange={(e) => setRenewalCost(Number(e.target.value))}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !newExpiryDate}>
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            {isSubmitting ? 'Saving Renewal...' : 'Confirm Renewal'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
