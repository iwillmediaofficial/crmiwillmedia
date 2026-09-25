import React from 'react'
import { Menu, Bell } from 'lucide-react'
import { RunningTimerBar } from '@/features/timer/components/RunningTimerBar'

interface TopbarProps {
  onOpenMobileMenu: () => void
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline">
            IWILLMEDIA CRM
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time Work Timer Widget */}
        <RunningTimerBar />

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white" />
        </button>
      </div>
    </header>
  )
}
