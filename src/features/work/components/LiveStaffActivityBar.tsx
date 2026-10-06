import React from 'react'
import { Play, Clock, ArrowUpRight, Users } from 'lucide-react'
import { StaffActiveTimer } from '@/features/timer/hooks/useAdminActiveTimers'
import { formatTimeSeconds } from '@/lib/formatters'

interface LiveStaffActivityBarProps {
  activeTimers: StaffActiveTimer[]
  onFocusStaff?: (staffId: string) => void
}

export const LiveStaffActivityBar: React.FC<LiveStaffActivityBarProps> = ({
  activeTimers,
  onFocusStaff,
}) => {
  const handleScrollToStaff = (staffId: string) => {
    if (onFocusStaff) {
      onFocusStaff(staffId)
      return
    }
    const cardEl = document.getElementById(`staff-card-${staffId}`)
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      cardEl.classList.add('ring-2', 'ring-brand-500', 'transition-all')
      setTimeout(() => {
        cardEl.classList.remove('ring-2', 'ring-brand-500')
      }, 2500)
    }
  }

  if (activeTimers.length === 0) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <span className="font-medium text-slate-700">Team Status:</span>
          <span>No staff timers currently running</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">0 active sessions</span>
      </div>
    )
  }

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white shadow-2xs space-y-3 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h2 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>Currently Working Staff</span>
          </h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {activeTimers.length} active
          </span>
        </div>
        <span className="text-[11px] text-emerald-800/80 hidden sm:inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Real-time tracking</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {activeTimers.map((timer) => (
          <div
            key={timer.entryId}
            onClick={() => handleScrollToStaff(timer.staffId)}
            className="group p-3 rounded-lg border border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
            title={`Click to focus on ${timer.staffName}'s workload card`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0 border border-brand-200">
                {timer.staffName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {timer.staffName}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate hidden xs:inline">
                    ({timer.staffDesignation})
                  </span>
                </div>
                <p className="text-[11px] font-medium text-emerald-900 truncate" title={timer.workItemTitle}>
                  {timer.workItemTitle}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {timer.clientName}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold text-xs">
                <Play className="w-2.5 h-2.5 fill-current text-emerald-600 animate-pulse" />
                <span>{formatTimeSeconds(timer.elapsedSeconds)}</span>
              </div>
              <span className="text-[10px] text-brand-600 group-hover:text-brand-700 font-medium inline-flex items-center gap-0.5">
                <span>View</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
