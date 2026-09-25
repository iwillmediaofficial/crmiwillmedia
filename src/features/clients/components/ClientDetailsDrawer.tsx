import React, { useState } from 'react'
import {
  X,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Receipt,
  Repeat,
  Calendar,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types/database.types'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface ClientDetailsDrawerProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
}

export const ClientDetailsDrawer: React.FC<ClientDetailsDrawerProps> = ({
  client,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'work' | 'billing' | 'recurring'>('overview')

  // Fetch client's linked work items
  const { data: clientWork } = useQuery({
    queryKey: ['client-work', client?.id],
    queryFn: async () => {
      if (!client?.id) return []
      const { data, error } = await supabase
        .from('work_items')
        .select('id, title, status, priority, due_date, billing_status')
        .eq('client_id', client.id)
        .order('due_date', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: isOpen && !!client?.id && activeTab === 'work',
  })

  // Fetch client's linked billing records
  const { data: clientBilling } = useQuery({
    queryKey: ['client-billing', client?.id],
    queryFn: async () => {
      if (!client?.id) return []
      const { data, error } = await supabase
        .from('billing_records')
        .select('*')
        .eq('client_id', client.id)
        .order('due_date', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: isOpen && !!client?.id && activeTab === 'billing',
  })

  // Fetch client's linked recurring retainers
  const { data: clientRecurring } = useQuery({
    queryKey: ['client-recurring', client?.id],
    queryFn: async () => {
      if (!client?.id) return []
      const { data, error } = await supabase
        .from('recurring_bills')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: isOpen && !!client?.id && activeTab === 'recurring',
  })

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-500/20">
                {client.company_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{client.company_name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={client.status === 'active' ? 'success' : 'default'} size="sm">
                    {client.status}
                  </Badge>
                  <span className="text-xs text-slate-500">Contact: {client.contact_person}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 px-6 gap-6 bg-white text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview', icon: Building2 },
              { id: 'work', label: 'Work Items', icon: Briefcase },
              { id: 'billing', label: 'Billing Records', icon: Receipt },
              { id: 'recurring', label: 'Retainers', icon: Repeat },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Drawer Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Email Address
                    </span>
                    <span className="text-slate-800 font-medium break-all">
                      {client.email || '—'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Phone Number
                    </span>
                    <span className="text-slate-800 font-medium">
                      {client.phone || '—'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Website URL
                  </span>
                  {client.website ? (
                    <a
                      href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline flex items-center gap-1.5 font-medium"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{client.website}</span>
                    </a>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Physical / Billing Address
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {client.address || 'No address specified.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Account Notes & Contract Specs
                  </span>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {client.notes || 'No notes added.'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'work' && (
              <div className="space-y-3">
                {!clientWork || clientWork.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No work items currently registered for this client.
                  </div>
                ) : (
                  clientWork.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-xs">{item.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Due {formatDate(item.due_date)} • Priority: {item.priority}
                        </p>
                      </div>
                      <Badge
                        variant={item.status === 'completed' ? 'success' : 'neutral'}
                        size="sm"
                        className="capitalize"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-3">
                {!clientBilling || clientBilling.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No billing records or invoices found for this client.
                  </div>
                ) : (
                  clientBilling.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-xs">{bill.bill_title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Due {formatDate(bill.due_date)}
                          {bill.paid_date && ` • Paid on ${formatDate(bill.paid_date)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 text-xs">
                          {formatCurrency(bill.amount, bill.currency)}
                        </p>
                        <Badge
                          variant={bill.status === 'paid' ? 'success' : 'warning'}
                          size="sm"
                          className="capitalize mt-0.5"
                        >
                          {bill.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'recurring' && (
              <div className="space-y-3">
                {!clientRecurring || clientRecurring.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No recurring retainer contracts active for this client.
                  </div>
                ) : (
                  clientRecurring.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-xs">{rec.bill_name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {rec.frequency.toUpperCase()} • Billing Day {rec.billing_day}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 text-xs">
                          {formatCurrency(rec.amount, rec.currency)}
                        </p>
                        <Badge
                          variant={rec.is_active ? 'success' : 'danger'}
                          size="sm"
                          className="mt-0.5"
                        >
                          {rec.is_active ? 'Active Schedule' : 'Paused'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
