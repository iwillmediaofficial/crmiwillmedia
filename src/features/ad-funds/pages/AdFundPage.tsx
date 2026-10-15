import React, { useState } from 'react'
import {
  Wallet,
  Upload,
  Hourglass,
  Plus,
  Search,
  Calendar,
  ChevronDown,
  Building2,
  Settings,
  UserPlus,
  Coins,
  CreditCard,
} from 'lucide-react'
import { useAdFunds, ClientAdFundSummary } from '../hooks/useAdFunds'
import { AddFundModal } from '../components/AddFundModal'
import { AddDmClientModal } from '../components/AddDmClientModal'
import { RecordClientPaymentModal } from '../components/RecordClientPaymentModal'
import { AdFundHistoryDrawer } from '../components/AdFundHistoryDrawer'
import { ClientAdFundSettingsModal } from '../components/ClientAdFundSettingsModal'
import { PlatformBadges } from '../components/PlatformIcons'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Client } from '@/types/database.types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { format, subMonths, addMonths } from 'date-fns'

export const AdFundPage: React.FC = () => {
  // Current month default in format "yyyy-MM", starting from October 2026
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(() => {
    const cur = format(new Date(), 'yyyy-MM')
    return cur < '2026-10' ? '2026-10' : cur
  })

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')

  // Modals & Drawer State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedClientForFund, setSelectedClientForFund] = useState<Client | null>(null)

  const [isAddDmModalOpen, setIsAddDmModalOpen] = useState(false)

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedSummaryForPayment, setSelectedSummaryForPayment] = useState<ClientAdFundSummary | null>(null)

  const [drawerClient, setDrawerClient] = useState<Client | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [settingsClient, setSettingsClient] = useState<Client | null>(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  // Fetch ad funds data
  const {
    summaries,
    stats,
    allClients,
    dmClients,
    nonDmClients,
    isLoading,
    addFund,
    recordClientPayment,
    updateClientSettings,
    enrollDmClient,
    removeDmClient,
  } = useAdFunds(selectedYearMonth)

  // Month selector options: only from October 2026 onwards
  const monthOptions = React.useMemo(() => {
    const list = []
    const startDate = new Date('2026-10-01')
    for (let i = 0; i <= 5; i++) {
      const d = addMonths(startDate, i)
      list.push({
        value: format(d, 'yyyy-MM'),
        label: format(d, 'MMMM yyyy'),
      })
    }
    // Ensure selected is in list
    if (!list.some((o) => o.value === selectedYearMonth)) {
      list.push({
        value: selectedYearMonth,
        label: format(new Date(`${selectedYearMonth}-01`), 'MMMM yyyy'),
      })
    }
    return list
  }, [selectedYearMonth])

  // Map of client ID to their available un-used fund
  const clientUnusedMap = React.useMemo(() => {
    const map: Record<string, number> = {}
    summaries.forEach((s) => {
      map[s.client.id] = s.available_unused_fund
    })
    return map
  }, [summaries])

  // Filter summaries
  const filteredSummaries = summaries.filter((item) => {
    const matchesSearch =
      item.client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.client.contact_person &&
        item.client.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus =
      statusFilter === 'all' ||
      (item.status || 'active').toLowerCase() === statusFilter.toLowerCase()

    const matchesPlatform =
      platformFilter === 'all' ||
      (item.platforms || []).some(
        (p) => p.toLowerCase() === platformFilter.toLowerCase()
      )

    return matchesSearch && matchesStatus && matchesPlatform
  })

  // Handlers
  const handleOpenGlobalAdd = () => {
    setSelectedClientForFund(null)
    setIsAddModalOpen(true)
  }

  const handleOpenClientAdd = (client: Client, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedClientForFund(client)
    setIsAddModalOpen(true)
  }

  const handleOpenClientHistory = (client: Client) => {
    setDrawerClient(client)
    setIsDrawerOpen(true)
  }

  const handleOpenClientSettings = (client: Client, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSettingsClient(client)
    setIsSettingsModalOpen(true)
  }

  const handleOpenRecordPayment = (item: ClientAdFundSummary, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedSummaryForPayment(item)
    setIsPaymentModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            Active
          </span>
        )
      case 'paused':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            Paused
          </span>
        )
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
            Pending
          </span>
        )
      case 'low_fund':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            Low Fund
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status || 'Active'}
          </span>
        )
    }
  }

  // Generate pleasant avatar background color from initials
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-indigo-600 text-white',
      'bg-slate-900 text-white',
      'bg-cyan-600 text-white',
      'bg-blue-600 text-white',
      'bg-purple-600 text-white',
      'bg-amber-600 text-white',
    ]
    const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length
    return colors[idx]
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>IWILLMEDIA CRM</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Ad Fund Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Ad Fund Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track social media ad funds, uploads and spending for all live digital marketing clients.
          </p>
        </div>

        {/* Month Dropdown & Primary Action */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4 text-brand-600" />
            </div>
            <select
              value={selectedYearMonth}
              onChange={(e) => setSelectedYearMonth(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsAddDmModalOpen(true)}
            className="text-xs font-semibold px-3 py-2 border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm shrink-0 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 text-brand-600" />
            <span>Add DM Client</span>
          </Button>

          <Button
            onClick={handleOpenGlobalAdd}
            className="shadow-sm bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fund Upload</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assigned Ad Fund */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center p-3 text-brand-600 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Total Assigned Ad Fund
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 block">
              {formatCurrency(stats.totalAssigned, 'INR')}
            </span>
            {stats.totalPrevUnused > 0 && (
              <span className="text-[11px] font-medium text-indigo-600 block mt-0.5">
                ₹{stats.totalPrevUnused.toLocaleString('en-IN')} unused from prev month
              </span>
            )}
          </div>
        </div>

        {/* Total Uploaded */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center p-3 text-blue-600 shrink-0">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Total Uploaded
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 block">
              {formatCurrency(stats.totalUploaded, 'INR')}
            </span>
          </div>
        </div>

        {/* Remaining to Upload */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center p-3 text-amber-600 shrink-0">
            <Hourglass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Remaining to Upload
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 block">
              {formatCurrency(stats.totalRemaining, 'INR')}
            </span>
          </div>
        </div>

        {/* Funds Need to be Collected */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center p-3 text-rose-600 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Funds Need to be Collected
            </span>
            <span className="text-2xl font-black text-rose-600 tracking-tight mt-0.5 block">
              {formatCurrency(stats.totalNeedCollection, 'INR')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50/50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status & Platform Dropdowns */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="pending">Pending</option>
              <option value="low_fund">Low Fund</option>
            </select>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Platforms</option>
              <option value="meta">Meta Ads</option>
              <option value="google_ads">Google Ads</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Ad Funds Clients Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading ad fund dashboard...</div>
        ) : filteredSummaries.length === 0 ? (
          <div className="p-16 text-center">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No digital marketing clients found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add a client from your main CRM directory into Digital Marketing to start managing ad funds.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button onClick={() => setIsAddDmModalOpen(true)} size="sm" className="shadow-sm">
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                <span>Add DM Client</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-2 w-7 text-center whitespace-nowrap">#</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Client</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Platform</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap">Monthly Fund</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap" title="Base Monthly Fund + Available Un-used Carryover">Original Ad Fund</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap">Uploaded</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap">Client Paid</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap">To Collect</th>
                  <th className="py-3 px-2 text-right whitespace-nowrap">Remaining</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">Last Upload</th>
                  <th className="py-3 px-2.5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSummaries.map((item, idx) => {
                  const client = item.client
                  const hasRemaining = item.remaining_amount > 0

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenClientHistory(client)}
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-2 text-center font-semibold text-slate-400 whitespace-nowrap">
                        {idx + 1}
                      </td>

                      {/* Client Avatar + Clickable Name */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs ${getAvatarColor(
                              client.company_name
                            )}`}
                          >
                            {client.company_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-xs block truncate max-w-[150px]">
                              {client.company_name}
                            </span>
                            <span className="text-[10px] text-slate-400 block -mt-0.5 truncate max-w-[150px]">
                              {client.contact_person || 'Client Account'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Advertising Platforms */}
                      <td className="py-2.5 px-2 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <PlatformBadges platforms={item.platforms} />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Monthly Ad Fund Budget */}
                      <td className="py-2.5 px-2 font-semibold text-slate-900 whitespace-nowrap text-right">
                        {formatCurrency(item.monthly_ad_fund, 'INR')}
                      </td>

                      {/* Original Ad Fund (Monthly Fund + Available Unused) */}
                      <td className="py-2.5 px-2 font-semibold whitespace-nowrap text-right">
                        <span
                          className="text-indigo-600 font-bold"
                          title={`Base Monthly: ₹${item.monthly_ad_fund.toLocaleString('en-IN')} + Unused Remaining: ₹${item.available_unused_fund.toLocaleString('en-IN')} (Initial: ₹${item.prev_unused_amount.toLocaleString('en-IN')})`}
                        >
                          {formatCurrency(item.original_ad_fund, 'INR')}
                        </span>
                        {item.available_unused_fund > 0 && (
                          <span className="text-[10px] text-indigo-500/80 block -mt-0.5">
                            +₹{item.available_unused_fund.toLocaleString('en-IN')} unused
                          </span>
                        )}
                      </td>

                      {/* Uploaded by Us (This Month) */}
                      <td className="py-2.5 px-2 font-semibold text-slate-700 whitespace-nowrap text-right">
                        {formatCurrency(item.uploaded_amount, 'INR')}
                      </td>

                      {/* Client Paid */}
                      <td className="py-2.5 px-2 font-semibold whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <span className="font-bold text-emerald-700">
                            {formatCurrency(item.client_paid_amount, 'INR')}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleOpenRecordPayment(item, e)}
                            title="Record funds released from client"
                            className="w-4 h-4 rounded flex items-center justify-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all hover:scale-110 shrink-0"
                          >
                            <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </td>

                      {/* To Collect */}
                      <td className="py-2.5 px-2 font-bold whitespace-nowrap text-right">
                        <span className={item.need_collection_amount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400 font-normal'}>
                          {formatCurrency(item.need_collection_amount, 'INR')}
                        </span>
                      </td>

                      {/* Remaining to Upload */}
                      <td className="py-2.5 px-2 font-bold whitespace-nowrap text-right">
                        <span className={hasRemaining ? 'text-rose-600 font-bold' : 'text-slate-400 font-normal'}>
                          {formatCurrency(item.remaining_amount, 'INR')}
                        </span>
                      </td>

                      {/* Last Upload Date */}
                      <td className="py-2.5 px-2 text-slate-500 text-xs whitespace-nowrap text-center">
                        {item.last_upload_date
                          ? formatDate(item.last_upload_date, 'dd MMM yyyy')
                          : '—'}
                      </td>

                      {/* Action Button */}
                      <td className="py-2.5 px-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => handleOpenClientSettings(client, e)}
                            title="Configure monthly ad fund target & platforms"
                            className="h-7 w-7 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50/50 flex items-center justify-center transition-all shadow-2xs hover:scale-105 shrink-0"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <Button
                            size="sm"
                            onClick={(e) => handleOpenClientAdd(client, e)}
                            className="h-7 px-2.5 text-[11px] bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-sm font-semibold rounded-md shrink-0 whitespace-nowrap gap-1"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>Add Fund</span>
                          </Button>
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

      {/* Add DM Client Modal */}
      <AddDmClientModal
        isOpen={isAddDmModalOpen}
        onClose={() => setIsAddDmModalOpen(false)}
        nonDmClients={nonDmClients}
        onEnroll={async (payload) => {
          await enrollDmClient(payload)
        }}
      />

      {/* Add Fund Modal */}
      <AddFundModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        clients={dmClients.length > 0 ? dmClients : allClients}
        initialClientId={selectedClientForFund?.id || null}
        clientUnusedMap={clientUnusedMap}
        onSubmit={async (payload) => {
          await addFund(payload)
        }}
      />

      {/* Client Detailed History Drawer */}
      <AdFundHistoryDrawer
        client={drawerClient}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedYearMonth={selectedYearMonth}
        onAddFund={(c) => {
          setSelectedClientForFund(c)
          setIsAddModalOpen(true)
        }}
        onRecordClientPayment={(c) => {
          const summary = summaries.find((s) => s.client.id === c.id)
          if (summary) {
            handleOpenRecordPayment(summary)
          } else {
            setSelectedSummaryForPayment({
              client: c,
              monthly_ad_fund: c.monthly_ad_fund,
              original_ad_fund: c.monthly_ad_fund,
              prev_unused_amount: 0,
              all_prev_unused_amount: 0,
              available_unused_fund: 0,
              accumulated_unused_spent: 0,
              uploaded_amount: 0,
              client_paid_amount: 0,
              need_collection_amount: 0,
              remaining_amount: 0,
              last_upload_date: null,
              platforms: c.ad_platforms || [],
              status: c.ad_fund_status || 'active',
            })
            setIsPaymentModalOpen(true)
          }
        }}
        onEditSettings={(c) => {
          setSettingsClient(c)
          setIsSettingsModalOpen(true)
        }}
      />

      {/* Record Client Payment Modal */}
      <RecordClientPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        client={selectedSummaryForPayment?.client || null}
        uploadedThisMonth={selectedSummaryForPayment?.uploaded_amount || 0}
        alreadyPaidThisMonth={selectedSummaryForPayment?.client_paid_amount || 0}
        selectedYearMonth={selectedYearMonth}
        onSubmit={async (payload) => {
          await recordClientPayment(payload)
        }}
      />

      {/* Client Budget / Settings Modal */}
      <ClientAdFundSettingsModal
        client={settingsClient}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={async (payload) => {
          await updateClientSettings(payload)
        }}
        onRemoveFromDm={async (clientId) => {
          await removeDmClient(clientId)
        }}
      />
    </div>
  )
}
export default AdFundPage
