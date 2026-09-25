import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X, ArrowRight, Briefcase } from 'lucide-react'
import { useNotifications } from '../NotificationContext'

export const NotificationToast: React.FC = () => {
  const { activeToast, dismissToast, markAsRead } = useNotifications()
  const navigate = useNavigate()

  if (!activeToast) return null

  const handleAction = () => {
    markAsRead(activeToast.id)
    dismissToast()
    if (activeToast.link_url) {
      navigate(activeToast.link_url)
    }
  }

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 flex items-start gap-3.5 backdrop-blur-md bg-opacity-95">
        <div className="w-9 h-9 rounded-xl bg-brand-600/30 border border-brand-500/40 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
          <Briefcase className="w-5 h-5 text-brand-400" />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-tight">
              {activeToast.title}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Live
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
            {activeToast.message}
          </p>

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleAction}
              className="text-xs font-bold text-brand-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View In Work Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={dismissToast}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
