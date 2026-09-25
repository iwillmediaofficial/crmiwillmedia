import React, { useState } from 'react'
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  Repeat,
  Sparkles,
  Edit2,
  Trash2,
  Power,
} from 'lucide-react'
import { useBilling, BillingFilterParams } from '../hooks/useBilling'
import { BillModal } from '../components/BillModal'
import { RecurringBillModal } from '../components/RecurringBillModal'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { BillingRecord, RecurringBill } from '@/types/database.types'

export const BillingPage: React.FC = () => {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<'invoices' | 'recurring'>('invoices')
  const [filters, setFilters] = useState<BillingFilterParams>({
    search: '',
    status: 'all',
    currency: 'all',
  })

  const [isBillModalOpen, setIsBillModalOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<BillingRecord | null>(null)

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringBill | null>(null)

  const {
    bills,
    recurringBills,
    isLoading,
    isRecurringLoading,
    createBill,
    updateBill,
    markPaid,
    deleteBill,
    createRecurringBill,
    toggleRecurringActive,
    generateOccurrences,
  } = useBilling(filters)

  const handleOpenAddBill = () => {
    setEditingBill(null)
    setIsBillModalOpen(true)
  }

  const handleOpenEditBill = (bill: BillingRecord) => {
    setEditingBill(bill)
    setIsBillModalOpen(true)
  }

  const handleMarkPaid = async (bill: any) => {
    if (confirm(`Mark invoice "${bill.bill_title}" (${formatCurrency(bill.amount, bill.currency)}) as Paid?`)) {
      await markPaid({ id: bill.id })
    }
  }

  const handleDeleteBill = async (id: string, title: string) => {
    if (confirm(`Delete bill "${title}"?`)) {
      await deleteBill(id)
    }
  }

  const handleGenerateOccurrences = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
    try {
      const count = await generateOccurrences(currentMonth)
      alert(`Success! Generated ${count} recurring billing occurrences for ${currentMonth.slice(0, 7)}.`)
    } catch (err: any) {
      alert(`Error generating occurrences: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-brand-600" />
            <span>Billing & Client Invoices</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track receivables, multi-currency invoices (INR, AED, USD), and recurring monthly retainers
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {activeTab === 'recurring' ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleGenerateOccurrences}
                  className="shadow-sm border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 text-brand-600" />
                  <span>Sync Cycles</span>
                </Button>
                <Button onClick={() => setIsRecurringModalOpen(true)} className="shadow-sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>New Retainer</span>
                </Button>
              </>
            ) : (
              <Button onClick={handleOpenAddBill} className="shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Create Bill</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices Ledger ({bills.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('recurring')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'recurring'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>Recurring Retainers ({recurringBills.length})</span>
          </button>
        )}
      </div>

      {activeTab === 'invoices' ? (
        <>
          {/* Invoices Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice title, client..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Payment</option>
                  <option value="paid">Paid & Settled</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div>
                <select
                  value={filters.currency}
                  onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="all">All Currencies</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Invoices Table */}
          <Card>
            {isLoading ? (
              <div className="p-16 text-center text-xs text-slate-400">Loading bills...</div>
            ) : bills.length === 0 ? (
              <div className="p-16 text-center">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-900">No invoices found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  There are no invoices matching your filters.
                </p>
                {isAdmin && (
                  <Button onClick={handleOpenAddBill} size="sm" variant="outline" className="mt-4">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Create Invoice</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Invoice Title</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Account Lead</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {bills.map((bill: any) => {
                      const isOverdue = bill.displayStatus === 'overdue'

                      return (
                        <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div>{bill.bill_title}</div>
                            {bill.description && (
                              <p className="text-[11px] font-normal text-slate-400 line-clamp-1 mt-0.5 max-w-xs">
                                {bill.description}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {bill.clients?.company_name || 'Client'}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                            {formatCurrency(bill.amount, bill.currency)}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`flex items-center gap-1.5 ${
                                isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(bill.due_date)}</span>
                            </span>
                            {bill.paid_date && (
                              <span className="block text-[10px] text-emerald-600 mt-0.5 font-medium">
                                Paid {formatDate(bill.paid_date)}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge
                              variant={
                                bill.status === 'paid'
                                  ? 'success'
                                  : isOverdue
                                  ? 'danger'
                                  : 'warning'
                              }
                              size="sm"
                              className="capitalize"
                            >
                              {bill.displayStatus}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            {bill.profiles?.full_name || '—'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {bill.status !== 'paid' && isAdmin && (
                                <button
                                  onClick={() => handleMarkPaid(bill)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition-colors"
                                  title="Mark as Paid"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark Paid</span>
                                </button>
                              )}

                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditBill(bill)}
                                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                                    title="Edit Bill"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBill(bill.id, bill.bill_title)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                    title="Delete Bill"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        // RECURRING RETAINERS TAB
        <Card>
          {isRecurringLoading ? (
            <div className="p-16 text-center text-xs text-slate-400">Loading retainers...</div>
          ) : recurringBills.length === 0 ? (
            <div className="p-16 text-center">
              <Repeat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">No recurring retainers active</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Set up recurring retainer contracts (e.g., ₹30,000 monthly due on the 5th) to automatically forecast cashflow.
              </p>
              <Button onClick={() => setIsRecurringModalOpen(true)} size="sm" variant="outline" className="mt-4">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>New Retainer Contract</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Retainer Package</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Cadence & Cycle Day</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Contract Status</th>
                    <th className="py-3 px-4">Account Lead</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recurringBills.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{rec.bill_name}</div>
                        {rec.remarks && (
                          <p className="text-[11px] font-normal text-slate-400 line-clamp-1 mt-0.5">
                            {rec.remarks}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {rec.clients?.company_name || 'Client'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 uppercase">
                          {rec.frequency}
                        </span>
                        <span className="text-slate-500 block text-[11px]">
                          Due every month on the {rec.billing_day}th
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {formatCurrency(rec.amount, rec.currency)}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={rec.is_active ? 'success' : 'danger'} size="sm">
                          {rec.is_active ? 'Active Cadence' : 'Paused'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {rec.profiles?.full_name || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              toggleRecurringActive({
                                id: rec.id,
                                isActive: !rec.is_active,
                              })
                            }
                            className={`p-1.5 rounded-md transition-colors ${
                              rec.is_active
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={rec.is_active ? 'Pause Retainer' : 'Resume Retainer'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <BillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        initialBill={editingBill}
        onSubmit={async (payload) => {
          if (editingBill) {
            await updateBill({ id: editingBill.id, updates: payload })
          } else {
            await createBill(payload)
          }
        }}
      />

      <RecurringBillModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        initialRecurringBill={editingRecurring}
        onSubmit={async (payload) => {
          await createRecurringBill(payload)
        }}
      />
    </div>
  )
}
