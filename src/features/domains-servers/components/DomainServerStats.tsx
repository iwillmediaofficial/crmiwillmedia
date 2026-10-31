import React from 'react'
import { Globe, Server, AlertTriangle, AlertCircle, IndianRupee, ShieldAlert } from 'lucide-react'
import { DomainServerStatsData } from '../types/domainServer.types'

interface DomainServerStatsProps {
  stats: DomainServerStatsData
  onFilterUrgency?: (urgency: 'all' | 'soon' | 'critical' | 'expired') => void
  activeUrgency?: string
}

export const DomainServerStats: React.FC<DomainServerStatsProps> = ({
  stats,
  onFilterUrgency,
  activeUrgency,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Assets */}
      <div
        onClick={() => onFilterUrgency && onFilterUrgency('all')}
        className={`bg-white border rounded-xl p-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${
          activeUrgency === 'all' || !activeUrgency
            ? 'border-brand-300 ring-2 ring-brand-100'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Assets
          </span>
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{stats.totalCount}</span>
          <span className="text-xs text-slate-500">records</span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-brand-500" />
            <strong className="text-slate-700">{stats.domainsCount}</strong> Domains
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1">
            <Server className="w-3 h-3 text-sky-500" />
            <strong className="text-slate-700">{stats.serversCount}</strong> Servers / VPS
          </span>
        </div>
      </div>

      {/* 2. Expiring in 30 Days */}
      <div
        onClick={() => onFilterUrgency && onFilterUrgency('soon')}
        className={`bg-white border rounded-xl p-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${
          activeUrgency === 'soon'
            ? 'border-amber-400 ring-2 ring-amber-100'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Expiring &le; 30 Days
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-600">{stats.expiringIn30Days}</span>
          <span className="text-xs text-amber-700 font-medium">due this month</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          Prepare client invoicing or registrar renewals
        </p>
      </div>

      {/* 3. Critical (<= 7 Days) or Expired */}
      <div
        onClick={() => onFilterUrgency && onFilterUrgency('critical')}
        className={`bg-white border rounded-xl p-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${
          activeUrgency === 'critical'
            ? 'border-rose-400 ring-2 ring-rose-100'
            : stats.criticalIn7Days > 0 || stats.expiredCount > 0
            ? 'border-rose-200 bg-rose-50/20'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Critical &le; 7 Days
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-rose-600">
            {stats.criticalIn7Days}
          </span>
          {stats.expiredCount > 0 && (
            <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
              +{stats.expiredCount} expired
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium pt-2 border-t border-slate-100">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Immediate action required</span>
        </div>
      </div>

      {/* 4. Total Annual Renewal Spend */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Est. Annual Spend
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900">
            ₹{stats.totalAnnualCost.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500">/ yr</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          Combined infrastructure renewal cost
        </p>
      </div>
    </div>
  )
}
