import React, { useState } from 'react'
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Building2,
  User,
  IndianRupee,
  Settings,
  AlertCircle,
  FileText,
  Briefcase,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'
import { Client } from '@/types/database.types'
import { useClientAdFundHistory, useAdFunds } from '../hooks/useAdFunds'
import { PlatformBadges } from './PlatformIcons'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface AdFundHistoryDrawerProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  onAddFund: (client: Client) => void
  onRecordClientPayment: (client: Client) => void
  onEditSettings: (client: Client) => void
  selectedYearMonth: string
}

export const AdFundHistoryDrawer: React.FC<AdFundHistoryDrawerProps> = ({
  client,
  isOpen,
  onClose,
  onAddFund,
  onRecordClientPayment,
  onEditSettings,
  selectedYearMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'uploads' | 'payments'>('uploads')
  const [viewScope, setViewScope] = useState<'month' | 'all'>('month')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { deleteFund, deleteClientPayment } = useAdFunds(selectedYearMonth)

  const { data, isLoading } = useClientAdFundHistory(
    client?.id || null,
    viewScope === 'month' ? selectedYearMonth : undefined
  )

  if (!isOpen || !client) return null

  const monthlyBudget = Number(client.monthly_ad_fund || 0)
  const monthUploaded = data?.monthUploaded || 0
  const monthClientPaid = data?.monthClientPaid || 0
  const toCollect = data?.toCollectMonth || 0

  const allTimeUploaded = data?.allTimeUploaded || 0
  const allTimeClientPaid = data?.allTimeClientPaid || 0

  const percentComplete =
    monthlyBudget > 0 ? Math.min(100, Math.round((monthUploaded / monthlyBudget) * 100)) : 100

  const transactions = data?.transactions || []
  const filteredTransactions =
    viewScope === 'month'
      ? transactions.filter((t) => t.transaction_date.startsWith(selectedYearMonth))
      : transactions

  const payments = data?.payments || []
  const filteredPayments =
    viewScope === 'month'
      ? payments.filter((p) => p.payment_date.startsWith(selectedYearMonth))
      : payments

  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm('Are you sure you want to delete this ad fund transaction record?')) {
      return
    }
    try {
      setDeletingId(txId)
      await deleteFund(txId)
    } catch (err: any) {
      alert(err?.message || 'Failed to delete transaction.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this client payment record?')) {
      return
    }
    try {
      setDeletingId(paymentId)
      await deleteClientPayment(paymentId)
    } catch (err: any) {
      alert(err?.message || 'Failed to delete client payment.')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'paused':
        return <Badge variant="warning">Paused</Badge>
      case 'pending':
        return <Badge variant="info">Pending</Badge>
      case 'low_fund':
        return <Badge variant="danger">Low Fund</Badge>
      default:
        return <Badge variant="neutral">{status || 'Active'}</Badge>
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-500/20 shrink-0">
                {client.company_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900">{client.company_name}</h2>
                  {getStatusBadge(client.ad_fund_status || 'active')}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Contact: {client.contact_person || 'N/A'}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <span>Platforms:</span>
                    <PlatformBadges platforms={client.ad_platforms || ['meta']} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEditSettings(client)}
                title="Configure client monthly ad budget and platforms"
                className="text-xs h-8 px-2.5"
              >
                <Settings className="w-3.5 h-3.5 mr-1" />
                <span>Budget</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRecordClientPayment(client)}
                className="text-xs h-8 px-2.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>+ Client Paid</span>
              </Button>
              <Button
                size="sm"
                onClick={() => onAddFund(client)}
                className="text-xs h-8 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Fund</span>
              </Button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar (Budget, Uploaded, Client Paid, To Collect) */}
          <div className="p-5 bg-white border-b border-slate-100 grid grid-cols-4 gap-2.5">
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
              <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider block">
                Monthly Target
              </span>
              <span className="text-base font-bold text-purple-950 mt-0.5 block truncate">
                {formatCurrency(monthlyBudget, 'INR')}
              </span>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
              <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider block">
                Uploaded (Ads)
              </span>
              <span className="text-base font-bold text-blue-950 mt-0.5 block truncate">
                {formatCurrency(monthUploaded, 'INR')}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Client Paid
              </span>
              <span className="text-base font-bold text-emerald-950 mt-0.5 block truncate">
                {formatCurrency(monthClientPaid, 'INR')}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                toCollect > 0
                  ? 'bg-rose-50/70 border-rose-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider block ${
                  toCollect > 0 ? 'text-rose-700' : 'text-slate-500'
                }`}
              >
                To Collect
              </span>
              <span
                className={`text-base font-bold mt-0.5 block truncate ${
                  toCollect > 0 ? 'text-rose-600' : 'text-slate-700'
                }`}
              >
                {formatCurrency(toCollect, 'INR')}
              </span>
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="px-5 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Budget Fulfillment:</span>
              <span className="font-bold text-slate-900">{percentComplete}%</span>
            </div>
            <div className="w-48 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  percentComplete >= 100 ? 'bg-emerald-500' : 'bg-brand-600'
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Tabs & View Scope Filter */}
          <div className="px-6 py-3.5 flex items-center justify-between bg-white border-b border-slate-100">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('uploads')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'uploads'
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Ad Fund Uploads</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                  {filteredTransactions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'payments'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Client Paid Logs</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {filteredPayments.length}
                </span>
              </button>
            </div>

            {/* Scope Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewScope('month')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  viewScope === 'month'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {selectedYearMonth}
              </button>
              <button
                type="button"
                onClick={() => setViewScope('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  viewScope === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Ledger Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-slate-400">Loading ledger...</div>
            ) : activeTab === 'uploads' ? (
              /* TAB 1: Ad Fund Uploads */
              filteredTransactions.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl p-8">
                  <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">No ad fund uploads found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {viewScope === 'month'
                      ? `No funds were uploaded to ads in ${selectedYearMonth}.`
                      : 'No ad fund uploads have been recorded for this client yet.'}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddFund(client)}
                    className="mt-4"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Upload Ad Fund</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((tx) => {
                    const isPersonal = tx.payment_type === 'personal'
                    const isClient = tx.payment_type === 'client'

                    return (
                      <div
                        key={tx.id}
                        className="p-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white transition-all shadow-sm hover:shadow"
                      >
                        <div className="flex items-start justify-between">
                          {/* Left: Amount & Platform */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center font-bold text-sm shrink-0">
                              <IndianRupee className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-extrabold text-slate-900">
                                  {formatCurrency(tx.amount, 'INR')}
                                </span>
                                <PlatformBadges platforms={[tx.platform]} />
                              </div>
                              <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {formatDate(tx.transaction_date, 'dd MMM yyyy')}
                              </span>
                            </div>
                          </div>

                          {/* Right: Paid By Badge & Delete Action */}
                          <div className="flex items-center gap-3">
                            {isClient ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/80">
                                <Briefcase className="w-3 h-3 text-indigo-600" />
                                <span>Paid by Client</span>
                              </span>
                            ) : isPersonal ? (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                                  <User className="w-3 h-3 text-amber-600" />
                                  <span>Personal Payment</span>
                                </span>
                                <span className="block text-xs font-bold text-slate-900 mt-1">
                                  By: {tx.payer_name || 'Individual'}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80">
                                <Building2 className="w-3 h-3 text-blue-600" />
                                <span>Company Account</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(tx.id)}
                              disabled={deletingId === tx.id}
                              title="Delete this transaction record"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Notes / Recorder Details */}
                        {(tx.notes || tx.recorder?.full_name) && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            {tx.notes ? (
                              <span className="flex items-center gap-1.5 text-slate-700 italic">
                                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                &ldquo;{tx.notes}&rdquo;
                              </span>
                            ) : (
                              <span />
                            )}

                            {tx.recorder?.full_name && (
                              <span className="shrink-0 text-slate-400">
                                Logged by <strong className="text-slate-600">{tx.recorder.full_name}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            ) : (
              /* TAB 2: Client Payments Received */
              filteredPayments.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl p-8">
                  <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">No client payments logged yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {viewScope === 'month'
                      ? `No payments released by the client in ${selectedYearMonth}.`
                      : 'Record when the client transfers ad funds weekly, daily, or on-demand.'}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => onRecordClientPayment(client)}
                    className="mt-4 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Record Client Payment</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/50 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-sm shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-extrabold text-slate-900">
                                {formatCurrency(pay.amount, 'INR')}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                                {pay.payment_method?.replace('_', ' ') || 'Bank Transfer'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatDate(pay.payment_date, 'dd MMM yyyy')}
                              {pay.reference_no && (
                                <>
                                  <span>•</span>
                                  <span>Ref: {pay.reference_no}</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeletePayment(pay.id)}
                          disabled={deletingId === pay.id}
                          title="Delete this payment record"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Notes / Recorder Details */}
                      {(pay.notes || pay.recorder?.full_name) && (
                        <div className="mt-3 pt-3 border-t border-emerald-100/70 flex items-center justify-between text-[11px] text-slate-500">
                          {pay.notes ? (
                            <span className="flex items-center gap-1.5 text-slate-700 italic">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              &ldquo;{pay.notes}&rdquo;
                            </span>
                          ) : (
                            <span />
                          )}

                          {pay.recorder?.full_name && (
                            <span className="shrink-0 text-slate-400">
                              Received & Logged by <strong className="text-slate-600">{pay.recorder.full_name}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Total Client Paid: <strong className="text-slate-800">{formatCurrency(allTimeClientPaid, 'INR')}</strong>
            </span>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close History
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
