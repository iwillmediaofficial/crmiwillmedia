import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Clock, ArrowRight, UserCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { useAdminActiveTimers } from '@/features/timer/hooks/useAdminActiveTimers'
import { formatTimeSeconds } from '@/lib/formatters'

export const ActiveTeamTimersWidget: React.FC = () => {
  const navigate = useNavigate()
  const { activeTimers, activeCount } = useAdminActiveTimers()

  return (
    <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/30 via-white to-white">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Active Team Sessions
            </CardTitle>
          </div>
          <span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {activeCount} Running
          </span>
        </div>
        <button
          onClick={() => navigate('/work')}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Staff Work</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </CardHeader>
      <CardContent>
        {activeCount === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
            <Clock className="w-5 h-5 text-slate-300" />
            <span>No staff timers currently active. Team is currently idle.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeTimers.map((timer) => (
              <div
                key={timer.entryId}
                onClick={() => navigate('/work')}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-emerald-50/30 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-brand-200">
                    {timer.staffName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {timer.staffName}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        • {timer.staffDesignation}
                      </span>
                    </p>
                    <p className="text-[11px] text-emerald-900 font-medium truncate">
                      {timer.workItemTitle}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {timer.clientName}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold text-xs">
                    <Play className="w-2.5 h-2.5 fill-current text-emerald-600 animate-pulse" />
                    <span>{formatTimeSeconds(timer.elapsedSeconds)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
