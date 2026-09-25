import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './features/auth/AuthContext'
import { AuthLayout } from './layouts/AuthLayout'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './layouts/ProtectedRoute'

// Code splitting / Lazy-loaded routes for minimal initial Vercel bundle
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))

const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const LeadsPage = lazy(() => import('./features/leads/pages/LeadsPage').then(m => ({ default: m.LeadsPage })))
const WorkPage = lazy(() => import('./features/work/pages/WorkPage').then(m => ({ default: m.WorkPage })))
const ClientsPage = lazy(() => import('./features/clients/pages/ClientsPage').then(m => ({ default: m.ClientsPage })))
const BillingPage = lazy(() => import('./features/billing/pages/BillingPage').then(m => ({ default: m.BillingPage })))
const BillingCalendarPage = lazy(() => import('./features/calendar/pages/BillingCalendarPage').then(m => ({ default: m.BillingCalendarPage })))
const StaffPage = lazy(() => import('./features/staff/pages/StaffPage').then(m => ({ default: m.StaffPage })))
const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const MetaInstantFormPage = lazy(() => import('./features/public-form/pages/MetaInstantFormPage').then(m => ({ default: m.MetaInstantFormPage })))

const PageLoader = () => (
  <div className="h-64 flex flex-col items-center justify-center">
    <div className="w-8 h-8 rounded-lg bg-brand-600 animate-pulse" />
    <span className="text-xs text-slate-400 mt-2 font-medium">Loading view...</span>
  </div>
)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Standalone Meta Lead Form Routes */}
              <Route path="/f/:slug" element={<MetaInstantFormPage />} />
              <Route path="/form/:slug" element={<MetaInstantFormPage />} />

              {/* Public Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/work" element={<WorkPage />} />
                  <Route path="/clients" element={<ClientsPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/calendar" element={<BillingCalendarPage />} />

                  {/* Admin Only Routes */}
                  <Route element={<ProtectedRoute requiredRole="admin" />}>
                    <Route path="/staff" element={<StaffPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
