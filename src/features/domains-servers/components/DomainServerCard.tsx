import React, { useState } from 'react'
import {
  Globe,
  Server,
  HardDrive,
  ShieldCheck,
  Layers,
  ExternalLink,
  Copy,
  Check,
  RotateCw,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Clock,
  Building,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DomainServerAsset } from '../types/domainServer.types'

interface DomainServerCardProps {
  asset: DomainServerAsset
  isAdmin: boolean
  onEdit: (asset: DomainServerAsset) => void
  onRenew: (asset: DomainServerAsset) => void
  onDelete: (id: string) => void
}

export const DomainServerCard: React.FC<DomainServerCardProps> = ({
  asset,
  isAdmin,
  onEdit,
  onRenew,
  onDelete,
}) => {
  const [copiedIp, setCopiedIp] = useState(false)

  const copyIp = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIp(true)
    setTimeout(() => setCopiedIp(false), 2000)
  }

  // Type Icon & styling
  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'domain':
        return {
          icon: Globe,
          label: 'Domain',
          color: 'text-brand-600 bg-brand-50 border-brand-200',
        }
      case 'server':
        return {
          icon: Server,
          label: 'Server / VPS',
          color: 'text-sky-600 bg-sky-50 border-sky-200',
        }
      case 'hosting':
        return {
          icon: HardDrive,
          label: 'Web Hosting',
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        }
      case 'ssl':
        return {
          icon: ShieldCheck,
          label: 'SSL Cert',
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        }
      default:
        return {
          icon: Layers,
          label: 'Asset',
          color: 'text-slate-600 bg-slate-50 border-slate-200',
        }
    }
  }

  const typeMeta = getTypeMeta(asset.asset_type)
  const TypeIcon = typeMeta.icon

  // Urgency computation
  const days = asset.daysUntilExpiry ?? 0
  const urgency = asset.urgencyLevel || 'safe'

  const getUrgencyBadge = () => {
    if (urgency === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Expired ({Math.abs(days)}d ago)</span>
        </span>
      )
    }
    if (urgency === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>{days === 0 ? 'Expires TODAY' : `Expires in ${days} days!`}</span>
        </span>
      )
    }
    if (urgency === 'soon') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>{days} days left</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span>{days} days remaining</span>
      </span>
    )
  }

  const currencySymbol =
    asset.currency === 'USD' ? '$' : asset.currency === 'EUR' ? '€' : '₹'

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between ${
        urgency === 'critical'
          ? 'border-rose-300 ring-1 ring-rose-200'
          : urgency === 'expired'
          ? 'border-rose-400 bg-rose-50/10'
          : urgency === 'soon'
          ? 'border-amber-300'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top bar: Asset type pill + Urgency Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${typeMeta.color}`}
            >
              <TypeIcon className="w-3 h-3" />
              <span>{typeMeta.label}</span>
            </span>

            {asset.auto_renew && (
              <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                Auto-Renew ON
              </span>
            )}
          </div>
          {getUrgencyBadge()}
        </div>

        {/* Asset Name */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 truncate tracking-tight">
              {asset.name}
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span>Via</span>
              <span className="font-semibold text-slate-700">{asset.provider}</span>
            </p>
          </div>
          {asset.admin_url && (
            <a
              href={
                asset.admin_url.startsWith('http')
                  ? asset.admin_url
                  : `https://${asset.admin_url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              title="Open Registrar/Hosting Portal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Client Tag */}
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {asset.clients ? (
            <span className="font-semibold text-slate-800 truncate">
              {asset.clients.company_name}
            </span>
          ) : (
            <span className="text-slate-500 font-medium italic">
              Internal Agency Asset
            </span>
          )}
        </div>

        {/* IP / Nameservers snippet */}
        {(asset.ip_address || asset.nameservers) && (
          <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-600 flex items-center justify-between">
            <span className="truncate">
              {asset.ip_address || asset.nameservers}
            </span>
            {asset.ip_address && (
              <button
                type="button"
                onClick={() => copyIp(asset.ip_address!)}
                title="Copy IP"
                className="ml-2 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              >
                {copiedIp ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Dates & Cost grid */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Due Date</span>
            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              {asset.expiry_date}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Renewal Cost</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {currencySymbol}
              {Number(asset.renewal_cost || 0).toLocaleString()}
              <span className="text-[10px] text-slate-500 font-normal ml-0.5">
                /{asset.billing_cycle === 'yearly' ? 'yr' : asset.billing_cycle === 'monthly' ? 'mo' : asset.billing_cycle}
              </span>
            </span>
          </div>
        </div>

        {/* Notes preview */}
        {asset.notes && (
          <p className="mt-2.5 text-[11px] text-slate-500 italic bg-slate-50/70 p-1.5 rounded border border-slate-100 line-clamp-1">
            "{asset.notes}"
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onRenew(asset)}
          className="text-xs h-7 px-2.5 flex items-center gap-1 font-semibold text-slate-700 hover:text-brand-600 hover:border-brand-200"
        >
          <RotateCw className="w-3 h-3" />
          <span>Renew</span>
        </Button>

        {isAdmin && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(asset)}
              title="Edit asset details"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${asset.name}?`)) {
                  onDelete(asset.id)
                }
              }}
              title="Delete asset"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
