import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCheck,
  Briefcase,
  ExternalLink,
  Clock,
  Inbox,
} from 'lucide-react'
import { useNotifications } from '../NotificationContext'
import { formatDistanceToNow } from 'date-fns'

export const NotificationDropdown: React.FC = () => {
  const {
    notifications,
    unreadCount,
    soundEnabled,
    toggleSound,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      await markAsRead(notif.id)
    }
    setIsOpen(false)
    if (notif.link_url) {
      navigate(notif.link_url)
    }
  }

  const formatTime = (isoString: string) => {
    try {
      return formatDistanceToNow(new Date(isoString), { addSuffix: true })
    } catch {
      return 'recently'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all ${
          isOpen
            ? 'bg-slate-100 text-slate-900 shadow-inner'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-3.5 px-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sound Mute/Unmute Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  soundEnabled
                    ? 'text-slate-600 hover:text-brand-600 hover:bg-slate-200/60'
                    : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                }`}
                title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-amber-600" />
                )}
              </button>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="p-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4 text-brand-600" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400">
                  You have no notifications at this time.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.is_read

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 px-4 transition-colors cursor-pointer flex items-start gap-3 relative ${
                      isUnread
                        ? 'bg-brand-50/20 hover:bg-brand-50/40'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-1.5" />
                    )}

                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isUnread
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isUnread ? 'text-slate-900 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {formatTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 bg-slate-50/60 border-t border-slate-100 text-center flex items-center justify-between text-[11px] text-slate-500">
            <span>Sound alerts: {soundEnabled ? 'Active' : 'Muted'}</span>
            <button
              onClick={() => {
                setIsOpen(false)
                navigate('/work')
              }}
              className="font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Go to Work</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
