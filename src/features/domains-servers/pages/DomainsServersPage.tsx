import React, { useState } from 'react'
import {
  Globe,
  Plus,
  Download,
  Search,
  Filter,
  LayoutGrid,
  List,
  Server,
  AlertTriangle,
  RotateCw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { useClients } from '@/features/clients/hooks/useClients'
import { exportToCsv } from '@/utils/exportToCsv'
import { useDomainsServers } from '../hooks/useDomainsServers'
import { DomainServerStats } from '../components/DomainServerStats'
import { DomainServerCard } from '../components/DomainServerCard'
import { DomainServerTable } from '../components/DomainServerTable'
import { DomainServerModal } from '../components/DomainServerModal'
import { RenewModal } from '../components/RenewModal'
import {
  AssetType,
  DomainServerAsset,
  DomainServerFilterParams,
  ExpiryUrgency,
} from '../types/domainServer.types'

export const DomainsServersPage: React.FC = () => {
  const { isAdmin } = useAuth()
  const { clients } = useClients()

  // State for filters
  const [filters, setFilters] = useState<DomainServerFilterParams>({
    search: '',
    assetType: 'all',
    urgency: 'all',
    clientId: 'all',
    sortBy: 'expiry_asc',
  })

  // State for view mode
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Modals state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<DomainServerAsset | null>(null)
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false)
  const [renewingAsset, setRenewingAsset] = useState<DomainServerAsset | null>(null)

  // Hook data
  const {
    assets,
    allAssets,
    stats,
    isLoading,
    createAsset,
    updateAsset,
    renewAsset,
    deleteAsset,
  } = useDomainsServers(filters)

  // Modal actions
  const handleOpenAdd = () => {
    setEditingAsset(null)
    setIsAssetModalOpen(true)
  }

  const handleOpenEdit = (asset: DomainServerAsset) => {
    setEditingAsset(asset)
    setIsAssetModalOpen(true)
  }

  const handleOpenRenew = (asset: DomainServerAsset) => {
    setRenewingAsset(asset)
    setIsRenewModalOpen(true)
  }

  const handleSaveAsset = async (payload: Partial<DomainServerAsset>) => {
    if (editingAsset) {
      await updateAsset({ id: editingAsset.id, updates: payload })
    } else {
      await createAsset(payload)
    }
  }

  const handleDeleteAsset = async (id: string) => {
    try {
      await deleteAsset(id)
    } catch (err: any) {
      alert(`Error deleting asset: ${err.message}`)
    }
  }

  const handleExportCsv = () => {
    const exportRows = allAssets.map((a) => ({
      ID: a.id,
      Name: a.name,
      Type: a.asset_type,
      Provider: a.provider,
      Client: a.clients?.company_name || 'Internal Agency',
      ExpiryDate: a.expiry_date,
      RenewalCost: a.renewal_cost,
      Currency: a.currency,
      BillingCycle: a.billing_cycle,
      AutoRenew: a.auto_renew ? 'Yes' : 'No',
      ServerIP: a.ip_address || '',
      Nameservers: a.nameservers || '',
      ManagementURL: a.admin_url || '',
      DaysUntilExpiry: a.daysUntilExpiry ?? '',
      Status: a.status,
      Notes: a.notes || '',
    }))
    exportToCsv('domains_and_servers', exportRows)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-brand-600" />
            <span>Domains & Servers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track domain registrations, VPS hosting, SSL certificates, renewal due dates, and annual spend
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          {isAdmin && (
            <Button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Domain / Server</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <DomainServerStats
        stats={stats}
        activeUrgency={filters.urgency}
        onFilterUrgency={(urgency) =>
          setFilters((prev) => ({
            ...prev,
            urgency: prev.urgency === urgency ? 'all' : urgency,
          }))
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by domain, provider, client, or IP..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Asset Type */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Type
            </label>
            <select
              value={filters.assetType}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  assetType: e.target.value as any,
                }))
              }
              className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Types</option>
              <option value="domain">Domains Only</option>
              <option value="server">Servers / VPS</option>
              <option value="hosting">Web Hosting</option>
              <option value="ssl">SSL Certificates</option>
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Renewal Urgency
            </label>
            <select
              value={filters.urgency}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  urgency: e.target.value as ExpiryUrgency,
                }))
              }
              className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="critical">Critical (&le; 7 Days)</option>
              <option value="soon">Expiring Soon (&le; 30 Days)</option>
              <option value="month">Next 60 Days</option>
              <option value="expired">Expired</option>
              <option value="active">Active Only</option>
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Client
            </label>
            <select
              value={filters.clientId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  clientId: e.target.value,
                }))
              }
              className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 truncate"
            >
              <option value="all">All Clients</option>
              <option value="internal">Internal Agency Only</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as any,
                }))
              }
              className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="expiry_asc">Expiry: Nearest First</option>
              <option value="expiry_desc">Expiry: Furthest First</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="cost_desc">Cost: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets List / Grid / Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-slate-100 animate-pulse border border-slate-200"
            />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Globe className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No domains or servers found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {allAssets.length === 0
              ? 'Start tracking your client domains, web servers, VPS, and SSL renewals.'
              : 'No assets match your search or filter criteria. Try adjusting the filters above.'}
          </p>
          {isAdmin && allAssets.length === 0 && (
            <div className="mt-5">
              <Button type="button" onClick={handleOpenAdd} className="text-xs">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Your First Domain / Server
              </Button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <DomainServerCard
              key={asset.id}
              asset={asset}
              isAdmin={isAdmin}
              onEdit={handleOpenEdit}
              onRenew={handleOpenRenew}
              onDelete={handleDeleteAsset}
            />
          ))}
        </div>
      ) : (
        <DomainServerTable
          assets={assets}
          isAdmin={isAdmin}
          onEdit={handleOpenEdit}
          onRenew={handleOpenRenew}
          onDelete={handleDeleteAsset}
        />
      )}

      {/* Add / Edit Modal */}
      <DomainServerModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        initialAsset={editingAsset}
        onSubmit={handleSaveAsset}
      />

      {/* Quick Renew Modal */}
      <RenewModal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        asset={renewingAsset}
        onRenew={renewAsset}
      />
    </div>
  )
}

export default DomainsServersPage
