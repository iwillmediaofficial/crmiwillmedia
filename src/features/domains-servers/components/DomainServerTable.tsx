import React from 'react'
import {
  Globe,
  Server,
  HardDrive,
  ShieldCheck,
  Layers,
  ExternalLink,
  RotateCw,
  Edit2,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DomainServerAsset } from '../types/domainServer.types'

interface DomainServerTableProps {
  assets: DomainServerAsset[]
  isAdmin: boolean
  onEdit: (asset: DomainServerAsset) => void
  onRenew: (asset: DomainServerAsset) => void
  onDelete: (id: string) => void
}

export const DomainServerTable: React.FC<DomainServerTableProps> = ({
  assets,
  isAdmin,
  onEdit,
  onRenew,
  onDelete,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'domain':
        return <Globe className="w-3.5 h-3.5 text-brand-600" />
      case 'server':
        return <Server className="w-3.5 h-3.5 text-sky-600" />
      case 'hosting':
        return <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
      case 'ssl':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500" />
    }
  }

  const renderUrgencyBadge = (asset: DomainServerAsset) => {
    const days = asset.daysUntilExpiry ?? 0
    const urgency = asset.urgencyLevel || 'safe'

    if (urgency === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Expired ({Math.abs(days)}d ago)</span>
        </span>
      )
    }
    if (urgency === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>{days === 0 ? 'Today' : `${days}d left`}</span>
        </span>
      )
    }
    if (urgency === 'soon') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>{days}d left</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span>{days}d remaining</span>
      </span>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Asset / Name</th>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">Expiry Date</th>
              <th className="py-3 px-4">Cost / Cycle</th>
              <th className="py-3 px-4">Auto-Renew</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {assets.map((asset) => {
              const currencySymbol =
                asset.currency === 'USD' ? '$' : asset.currency === 'EUR' ? '€' : '₹'

              return (
                <tr
                  key={asset.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Asset & Type */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-slate-100 border border-slate-200">
                        {getTypeIcon(asset.asset_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span>{asset.name}</span>
                          {asset.admin_url && (
                            <a
                              href={
                                asset.admin_url.startsWith('http')
                                  ? asset.admin_url
                                  : `https://${asset.admin_url}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-brand-600"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {asset.ip_address && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            IP: {asset.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="py-3 px-4">
                    {asset.clients ? (
                      <span className="font-semibold text-slate-800">
                        {asset.clients.company_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Internal</span>
                    )}
                  </td>

                  {/* Provider */}
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {asset.provider}
                  </td>

                  {/* Expiry Date & Urgency */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="font-semibold text-slate-900">
                        {asset.expiry_date}
                      </span>
                      {renderUrgencyBadge(asset)}
                    </div>
                  </td>

                  {/* Cost & Cycle */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">
                      {currencySymbol}
                      {Number(asset.renewal_cost || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      /{asset.billing_cycle}
                    </span>
                  </td>

                  {/* Auto Renew */}
                  <td className="py-3 px-4">
                    {asset.auto_renew ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Enabled</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Manual</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onRenew(asset)}
                        className="text-xs h-7 px-2 flex items-center gap-1 font-semibold text-slate-700 hover:text-brand-600"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Renew</span>
                      </Button>

                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(asset)}
                            title="Edit"
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete ${asset.name}?`)) {
                                onDelete(asset.id)
                              }
                            }}
                            title="Delete"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
    </div>
  )
}
