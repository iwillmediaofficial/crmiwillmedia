import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Client } from '@/types/database.types'
import { MetaIcon, GoogleAdsIcon } from './PlatformIcons'
import { Building2, Search, IndianRupee, AlertCircle } from 'lucide-react'

interface AddDmClientModalProps {
  isOpen: boolean
  onClose: () => void
  nonDmClients: Client[]
  onEnroll: (payload: {
    client_id: string
    monthly_ad_fund: number
    ad_platforms: string[]
    ad_fund_status: string
  }) => Promise<any>
}

export const AddDmClientModal: React.FC<AddDmClientModalProps> = ({
  isOpen,
  onClose,
  nonDmClients,
  onEnroll,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [monthlyBudget, setMonthlyBudget] = useState('25000')
  const [platforms, setPlatforms] = useState<string[]>(['meta'])
  const [status, setStatus] = useState('active')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setSelectedClientId(nonDmClients[0]?.id || '')
      setMonthlyBudget('25000')
      setPlatforms(['meta'])
      setStatus('active')
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen, nonDmClients])

  const filteredClients = nonDmClients.filter(
    (c) =>
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_person && c.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      if (platforms.length === 1) return
      setPlatforms(platforms.filter((item) => item !== p))
    } else {
      setPlatforms([...platforms, p])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedClientId) {
      setError('Please select a client from the list.')
      return
    }

    const budgetNum = parseFloat(monthlyBudget)
    if (isNaN(budgetNum) || budgetNum < 0) {
      setError('Please enter a valid monthly budget amount (>= 0).')
      return
    }

    try {
      setIsSubmitting(true)
      await onEnroll({
        client_id: selectedClientId,
        monthly_ad_fund: budgetNum,
        ad_platforms: platforms,
        ad_fund_status: status,
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to add client to Digital Marketing list.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickBudgets = [15000, 25000, 50000, 100000]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Digital Marketing (DM) Client"
      description="Select an existing client from your main CRM directory to activate ad fund management."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        {nonDmClients.length === 0 ? (
          <div className="py-8 text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">All clients are currently enrolled</h4>
            <p className="text-xs text-slate-500 mt-1">
              Every client in your CRM directory is already added to Ad Fund Management.
            </p>
          </div>
        ) : (
          <>
            {/* Search and Select Client */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Client Account <span className="text-rose-500">*</span>
              </label>

              {/* Quick search input */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter available clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Clients selector listbox */}
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-inner">
                {filteredClients.map((client) => {
                  const isSelected = client.id === selectedClientId
                  return (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-brand-50/70 text-brand-900 border-l-4 border-brand-600'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {client.company_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold block">{client.company_name}</span>
                          <span className="text-[11px] text-slate-400 block -mt-0.5">
                            Contact: {client.contact_person || 'N/A'} {client.email ? `• ${client.email}` : ''}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[11px] font-semibold text-brand-600 bg-brand-100/60 px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Monthly Budget */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Monthly Ad Fund (₹) <span className="text-rose-500">*</span>
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

              {/* Quick budget pills */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-slate-400">Quick set:</span>
                {quickBudgets.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setMonthlyBudget(String(b))}
                    className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 font-medium transition-colors"
                  >
                    ₹{b.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Platforms */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Active Advertising Platforms
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <label
                  onClick={() => togglePlatform('meta')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer select-none text-xs font-medium transition-all ${
                    platforms.includes('meta')
                      ? 'border-blue-500 bg-blue-50/80 text-blue-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <MetaIcon className="w-4 h-4 shrink-0" />
                  <span>Meta Ads</span>
                </label>

                <label
                  onClick={() => togglePlatform('google_ads')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer select-none text-xs font-medium transition-all ${
                    platforms.includes('google_ads')
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <GoogleAdsIcon className="w-4 h-4 shrink-0" />
                  <span>Google Ads</span>
                </label>
              </div>
            </div>

            {/* Campaign Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Campaign Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
              >
                <option value="active">Active (Campaigns live)</option>
                <option value="paused">Paused (On hold)</option>
                <option value="pending">Pending (Awaiting setup)</option>
                <option value="low_fund">Low Fund (Requires recharge)</option>
              </select>
            </div>
          </>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
            disabled={nonDmClients.length === 0}
            className="shadow-sm"
          >
            Add to DM Clients
          </Button>
        </div>
      </form>
    </Modal>
  )
}
