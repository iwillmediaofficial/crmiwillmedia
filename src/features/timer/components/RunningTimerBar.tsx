import React from 'react'
import { Play, Square, Clock } from 'lucide-react'
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

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-900 shadow-sm animate-in fade-in">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-mono font-bold text-xs sm:text-sm text-brand-700 tracking-wider">
          {formatTimeSeconds(activeTimer.elapsedSeconds)}
        </span>
      </div>

      <div className="hidden sm:block max-w-[200px] truncate text-xs font-medium text-slate-700 border-l border-brand-200 pl-2">
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
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
      >
        <Square className="w-3 h-3 fill-current" />
        <span className="hidden sm:inline">Stop</span>
      </button>
    </div>
  )
}
