import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users2,
  Briefcase,
  Building2,
  Receipt,
  CalendarDays,
  UserCheck,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads', path: '/leads', icon: Users2 },
    { label: 'Staff Work', path: '/work', icon: Briefcase },
    { label: 'Clients', path: '/clients', icon: Building2 },
    { label: 'Billing', path: '/billing', icon: Receipt },
    { label: 'Billing Calendar', path: '/calendar', icon: CalendarDays },
    ...(isAdmin
      ? [
          { label: 'Staff Roster', path: '/staff', icon: UserCheck },
          { label: 'Settings', path: '/settings', icon: Settings },
        ]
      : []),
  ]

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-charcoal-950 text-slate-300 w-64 border-r border-charcoal-800">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-6 border-b border-charcoal-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-violet-400 flex items-center justify-center shadow-md shadow-brand-500/30">
              <span className="text-white font-extrabold text-sm tracking-wider">IW</span>
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">IWILLMEDIA</span>
              <span className="block text-[10px] text-brand-400 font-semibold tracking-wider uppercase -mt-0.5">CRM System</span>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-850"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group select-none',
                    isActive
                      ? 'bg-brand-600 text-white font-semibold shadow-sm shadow-brand-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-charcoal-850'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-charcoal-800/80 bg-charcoal-900/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-charcoal-800 border border-charcoal-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {profile?.full_name ? profile.full_name.slice(0, 2).toUpperCase() : 'IW'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-white truncate">
                {profile?.full_name || 'CRM User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {profile?.designation || profile?.department || profile?.email}
              </p>
            </div>
          </div>
          <Badge
            variant={isAdmin ? 'purple' : 'neutral'}
            size="sm"
            className="capitalize shrink-0 font-semibold"
          >
            {profile?.role || 'Staff'}
          </Badge>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors border border-charcoal-800 hover:border-rose-900/40"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Slide-over */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
