import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { UserRole } from '@/features/auth/types'

interface ProtectedRouteProps {
  requiredRole?: UserRole
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { user, profile, isLoading, isAdmin } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-400 flex items-center justify-center animate-pulse">
          <span className="text-white font-extrabold text-lg">IW</span>
        </div>
        <p className="text-xs text-slate-400 mt-4 tracking-wider uppercase font-semibold">
          Authenticating Session...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
