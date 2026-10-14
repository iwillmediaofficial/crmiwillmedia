import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Client, AdPlatform, AdFundPaymentType } from '@/types/database.types'
import { MetaIcon, GoogleAdsIcon } from './PlatformIcons'
import { Building2, User, Calendar, IndianRupee, FileText, Briefcase } from 'lucide-react'
import { format } from 'date-fns'

interface AddFundModalProps {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
  initialClientId?: string | null
  onSuccess?: () => void
  onSubmit: (payload: {
    client_id: string
    amount: number
    platform: AdPlatform | string
    payment_type: AdFundPaymentType | string
    payer_name?: string | null
    transaction_date: string
    notes?: string | null
  }) => Promise<any>
}

export const AddFundModal: React.FC<AddFundModalProps> = ({
  isOpen,
  onClose,
  clients,
  initialClientId,
  onSubmit,
}) => {
  const [clientId, setClientId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [platform, setPlatform] = useState<AdPlatform>('meta')
  const [paymentType, setPaymentType] = useState<AdFundPaymentType>('company')
  const [payerName, setPayerName] = useState<string>('')
  const [transactionDate, setTransactionDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Reset or preset form when opened
  useEffect(() => {
    if (isOpen) {
      setClientId(initialClientId || (clients[0]?.id || ''))
      setAmount('')
      setPlatform('meta')
      setPaymentType('company')
      setPayerName('')
      setTransactionDate(format(new Date(), 'yyyy-MM-dd'))
      setNotes('')
      setFormError(null)
      setIsSubmitting(false)
    }
  }, [isOpen, initialClientId, clients])

  const quickAmounts = [5000, 10000, 20000, 50000]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!clientId) {
      setFormError('Please select a client.')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid deposit amount greater than ₹0.')
      return
    }

    if (paymentType === 'personal' && !payerName.trim()) {
      setFormError('Please specify the name of the person who made the personal payment.')
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit({
        client_id: clientId,
        amount: numAmount,
        platform,
        payment_type: paymentType,
        payer_name: paymentType === 'personal' ? payerName.trim() : null,
        transaction_date: transactionDate,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (err: any) {
      setFormError(err?.message || 'Failed to record ad fund upload.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === clientId)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Ad Fund Upload"
      description="Log social media ad fund deposits, specify payer entity, and track client balance."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
            <span className="font-semibold shrink-0">Error:</span>
            <span>{formError}</span>
          </div>
        )}

        {/* Client Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Client Account <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={!!initialClientId && clients.some((c) => c.id === initialClientId)}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-600"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} {c.monthly_ad_fund > 0 ? `(Monthly: ₹${Number(c.monthly_ad_fund).toLocaleString('en-IN')})` : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedClient && (
            <p className="text-[11px] text-slate-500 mt-1">
              Contact: {selectedClient.contact_person || 'N/A'} • Status:{' '}
              <span className="capitalize font-medium text-slate-700">{selectedClient.ad_fund_status || 'active'}</span>
            </p>
          )}
        </div>

        {/* Deposit Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Ad Fund Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <IndianRupee className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 25000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          {/* Quick preset amount pills */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-slate-400">Quick set:</span>
            {quickAmounts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(q))}
                className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 font-medium transition-colors"
              >
                +₹{q.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        {/* Advertising Platform */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Advertising Platform <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPlatform('meta')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                platform === 'meta'
                  ? 'border-blue-500 bg-blue-50/70 text-blue-800 shadow-sm font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <MetaIcon className="w-4 h-4" />
              <span>Meta Ads</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatform('google_ads')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                platform === 'google_ads'
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 shadow-sm font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <GoogleAdsIcon className="w-4 h-4" />
              <span>Google Ads</span>
            </button>
          </div>
        </div>

        {/* Date of Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Upload Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
        </div>

        {/* WHO PAID: Company vs Personal vs Client */}
        <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-3">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Who Paid the Ad Fund? <span className="text-rose-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Company Option */}
            <label
              onClick={() => setPaymentType('company')}
              className={`relative flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                paymentType === 'company'
                  ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-1 ring-brand-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="paymentType"
                value="company"
                checked={paymentType === 'company'}
                onChange={() => setPaymentType('company')}
                className="sr-only"
              />
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  paymentType === 'company'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">
                  Company
                </span>
                <span className="block text-[10px] text-slate-500 leading-tight">
                  Agency account
                </span>
              </div>
            </label>

            {/* Personal Option */}
            <label
              onClick={() => setPaymentType('personal')}
              className={`relative flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                paymentType === 'personal'
                  ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-1 ring-brand-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="paymentType"
                value="personal"
                checked={paymentType === 'personal'}
                onChange={() => setPaymentType('personal')}
                className="sr-only"
              />
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  paymentType === 'personal'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">
                  Personal
                </span>
                <span className="block text-[10px] text-slate-500 leading-tight">
                  By staff/director
                </span>
              </div>
            </label>

            {/* Client Option */}
            <label
              onClick={() => setPaymentType('client')}
              className={`relative flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                paymentType === 'client'
                  ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-1 ring-brand-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="paymentType"
                value="client"
                checked={paymentType === 'client'}
                onChange={() => setPaymentType('client')}
                className="sr-only"
              />
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  paymentType === 'client'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">
                  Client
                </span>
                <span className="block text-[10px] text-slate-500 leading-tight">
                  Direct by client
                </span>
              </div>
            </label>
          </div>

          {/* Conditional Input: If Personal, enter the name of the person */}
          {paymentType === 'personal' && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Name of the Person Who Paid <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-brand-600" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. John Doe, Director, or Marketing Lead"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-brand-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  autoFocus
                  required={paymentType === 'personal'}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                This name will be saved and visibly recorded in the client&apos;s ad fund history ledger.
              </p>
            </div>
          )}
        </div>

        {/* Optional Notes / Transaction Reference */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reference / Transaction Note <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute top-2.5 left-3 text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              rows={2}
              placeholder="e.g. UPI Ref / UTR / Campaign budget details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
            className="shadow-sm min-w-[120px]"
          >
            Record Fund
          </Button>
        </div>
      </form>
    </Modal>
  )
}
