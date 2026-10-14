import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Client, AdFundStatus } from '@/types/database.types'
import { MetaIcon, GoogleAdsIcon } from './PlatformIcons'
import { IndianRupee } from 'lucide-react'

interface ClientAdFundSettingsModalProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  onSave: (payload: {
    client_id: string
    monthly_ad_fund: number
    ad_platforms: string[]
    ad_fund_status: string
  }) => Promise<any>
  onRemoveFromDm?: (clientId: string) => Promise<any>
}

export const ClientAdFundSettingsModal: React.FC<ClientAdFundSettingsModalProps> = ({
  client,
  isOpen,
  onClose,
  onSave,
  onRemoveFromDm,
}) => {
  const [monthlyBudget, setMonthlyBudget] = useState<string>('0')
  const [platforms, setPlatforms] = useState<string[]>(['meta'])
  const [status, setStatus] = useState<AdFundStatus | string>('active')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (client && isOpen) {
      setMonthlyBudget(String(client.monthly_ad_fund || 0))
      setPlatforms(client.ad_platforms && client.ad_platforms.length > 0 ? client.ad_platforms : ['meta'])
      setStatus(client.ad_fund_status || 'active')
      setError(null)
      setIsSubmitting(false)
    }
  }, [client, isOpen])

  if (!isOpen || !client) return null

  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      if (platforms.length === 1) return // Keep at least one
      setPlatforms(platforms.filter((item) => item !== p))
    } else {
      setPlatforms([...platforms, p])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const budgetNum = parseFloat(monthlyBudget)
    if (isNaN(budgetNum) || budgetNum < 0) {
      setError('Please enter a valid monthly budget amount (>= 0).')
      return
    }

    try {
      setIsSubmitting(true)
      await onSave({
        client_id: client.id,
        monthly_ad_fund: budgetNum,
        ad_platforms: platforms,
        ad_fund_status: status,
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to update client ad fund settings.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Ad Fund: ${client.company_name}`}
      description="Set target monthly advertising budget, active platforms, and campaign status."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Monthly Ad Budget */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Target Monthly Ad Fund (₹)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <IndianRupee className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="number"
              min="0"
              step="500"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Expected monthly spend allocated for this client&apos;s digital ad campaigns.
          </p>
        </div>

        {/* Active Advertising Platforms */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Active Platforms (Select all that apply)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label
              onClick={() => togglePlatform('meta')}
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer select-none text-xs font-medium transition-all ${
                platforms.includes('meta')
                  ? 'border-blue-500 bg-blue-50/80 text-blue-900 font-semibold'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <MetaIcon className="w-4 h-4 shrink-0" />
              <span>Meta Ads</span>
            </label>

            <label
              onClick={() => togglePlatform('google_ads')}
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer select-none text-xs font-medium transition-all ${
                platforms.includes('google_ads')
                  ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-semibold'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <GoogleAdsIcon className="w-4 h-4 shrink-0" />
              <span>Google Ads</span>
            </label>
          </div>
        </div>

        {/* Ad Campaign Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Ad Campaign Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
          >
            <option value="active">Active (Campaigns running)</option>
            <option value="paused">Paused (Temporarily on hold)</option>
            <option value="pending">Pending (Awaiting setup / funds)</option>
            <option value="low_fund">Low Fund (Requires immediate recharge)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {onRemoveFromDm ? (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(`Are you sure you want to remove ${client.company_name} from the Digital Marketing list? (Existing ad fund logs will remain saved)`)) {
                  setIsSubmitting(true)
                  try {
                    await onRemoveFromDm(client.id)
                    onClose()
                  } finally {
                    setIsSubmitting(false)
                  }
                }
              }}
              disabled={isSubmitting}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Remove from DM
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="shadow-sm"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
