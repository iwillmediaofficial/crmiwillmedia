import React from 'react'
import { Outlet } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-white font-extrabold text-xl tracking-wider">IW</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">IWILLMEDIA</h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-widest uppercase">Internal CRM</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl shadow-black/40 rounded-2xl sm:px-10 border border-slate-800/10">
          <Outlet />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Secured with Supabase RLS & Encrypted Auth</span>
        </div>
      </div>
    </div>
  )
}
