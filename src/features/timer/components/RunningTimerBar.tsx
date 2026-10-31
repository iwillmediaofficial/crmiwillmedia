import React from 'react'
import { Square, Clock, AlertTriangle } from 'lucide-react'
import { useTimer } from '../hooks/useTimer'
import { formatTimeSeconds } from '@/lib/formatters'

export const RunningTimerBar: React.FC = () => {
  const { activeTimer, isRunning, stopTimer, isStopping } = useTimer()

  if (!isRunning || !activeTimer) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs border border-slate-200">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>No timer running</span>
      </div>
    )
  }

  const minsRemaining = activeTimer.secondsUntilCutoff
    ? Math.max(1, Math.ceil(activeTimer.secondsUntilCutoff / 60))
    : null

  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3 px-3 py-1.5 rounded-full border shadow-sm animate-in fade-in transition-all ${
        activeTimer.isNearCutoff
          ? 'bg-amber-50/90 border-amber-300 text-amber-950 ring-2 ring-amber-400/30'
          : 'bg-brand-50 border-brand-200 text-brand-900'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              activeTimer.isNearCutoff ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              activeTimer.isNearCutoff ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          ></span>
        </span>
        <span
          className={`font-mono font-bold text-xs sm:text-sm tracking-wider ${
            activeTimer.isNearCutoff ? 'text-amber-800' : 'text-brand-700'
          }`}
        >
          {formatTimeSeconds(activeTimer.elapsedSeconds)}
        </span>
      </div>

      {activeTimer.isNearCutoff && (
        <div
          title={`This timer will auto cut-off in ${minsRemaining} minute${minsRemaining === 1 ? '' : 's'} to prevent overtime.`}
          className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100/80 text-amber-900 text-[10px] font-bold border border-amber-300"
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>Cut-off in {minsRemaining}m</span>
        </div>
      )}

      <div className="hidden sm:block max-w-[180px] truncate text-xs font-medium text-slate-700 border-l border-slate-300/80 pl-2">
        <span className="text-slate-900 font-semibold">{activeTimer.workItemTitle || 'Active Work'}</span>
        {activeTimer.clientName && (
          <span className="text-slate-500 text-[11px] block truncate">
            {activeTimer.clientName}
          </span>
        )}
      </div>

      <button
        onClick={() => stopTimer()}
        disabled={isStopping}
        title="Stop timer"
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        <Square className="w-3 h-3 fill-current" />
        <span className="hidden sm:inline">Stop</span>
      </button>
    </div>
  )
}
