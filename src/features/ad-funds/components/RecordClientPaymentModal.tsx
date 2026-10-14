import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Client } from '@/types/database.types'
import { IndianRupee, Calendar, CreditCard, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { format } from 'date-fns'

interface RecordClientPaymentModalProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  uploadedThisMonth: number
  alreadyPaidThisMonth: number
  selectedYearMonth: string
  onSubmit: (payload: {
    client_id: string
    amount: number
    payment_date: string
    payment_method: string
    reference_no?: string | null
    notes?: string | null
  }) => Promise<any>
}

export const RecordClientPaymentModal: React.FC<RecordClientPaymentModalProps> = ({
  client,
  isOpen,
  onClose,
  uploadedThisMonth,
  alreadyPaidThisMonth,
  selectedYearMonth,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer')
  const [referenceNo, setReferenceNo] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const toCollect = Math.max(0, uploadedThisMonth - alreadyPaidThisMonth)

  useEffect(() => {
    if (isOpen) {
      setAmount(toCollect > 0 ? String(toCollect) : '')
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'))
      setPaymentMethod('bank_transfer')
      setReferenceNo('')
      setNotes('')
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen, toCollect])

  if (!isOpen || !client) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.')
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit({
        client_id: client.id,
        amount: numAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_no: referenceNo.trim() || null,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to record client payment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Fund Release: ${client.company_name}`}
      description={`Log ad funds received from the client for ${selectedYearMonth}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Current Month Balance Summary */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Uploaded (Ads)
            </span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
              {formatCurrency(uploadedThisMonth, 'INR')}
            </span>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Already Paid
            </span>
            <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
              {formatCurrency(alreadyPaidThisMonth, 'INR')}
            </span>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              To Collect
            </span>
            <span
              className={`text-xs font-bold mt-0.5 block ${
                toCollect > 0 ? 'text-rose-600' : 'text-slate-500'
              }`}
            >
              {formatCurrency(toCollect, 'INR')}
            </span>
          </div>
        </div>

        {/* Amount Received */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Amount Received / Released (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <IndianRupee className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          {/* Quick preset pills */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-slate-400">Quick set:</span>
            {toCollect > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(toCollect))}
                className="px-2 py-0.5 text-[11px] rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors border border-rose-200"
              >
                Full Due (₹{toCollect.toLocaleString('en-IN')})
              </button>
            )}
            <button
              type="button"
              onClick={() => setAmount('10000')}
              className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              ₹10,000
            </button>
            <button
              type="button"
              onClick={() => setAmount('25000')}
              className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              ₹25,000
            </button>
          </div>
        </div>

        {/* Date and Payment Mode */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
            >
              <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="upi">UPI / GPay / PhonePe</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Reference / UTR Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Transaction Reference / UTR <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <CreditCard className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="e.g. UTR # or UPI Reference ID"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Remarks / Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Note / Installment Details <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute top-2.5 left-3 text-slate-400">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Weekly fund release for Meta ads campaign..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
            Save Client Payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}
