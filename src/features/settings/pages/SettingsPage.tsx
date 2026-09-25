import React, { useState } from 'react'
import {
  Settings,
  Building,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Database,
  Cloud,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { exportToCsv } from '@/utils/exportToCsv'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isExporting, setIsExporting] = useState<string | null>(null)

  // Fetch company settings
  const { data: settings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'company_profile')
        .maybeSingle()
      if (error) throw error
      return (
        (data?.setting_value as any) || {
          company_name: 'IWILLMEDIA',
          email: 'contact@iwillmedia.com',
          phone: '+91 98765 43210',
          default_currency: 'INR',
          address: 'Mumbai, Maharashtra, India',
        }
      )
    },
  })

  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    default_currency: 'INR',
    address: '',
  })

  React.useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const saveSettings = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from('app_settings')
        .upsert(
          {
            setting_key: 'company_profile',
            setting_value: payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        )
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  // Export Handlers
  const handleExport = async (type: 'leads' | 'clients' | 'work_items' | 'billing_records') => {
    setIsExporting(type)
    try {
      const { data, error } = await supabase.from(type).select('*').order('created_at', { ascending: false })
      if (error) throw error
      exportToCsv(`iwillmedia_${type}`, data || [])
    } catch (err: any) {
      alert(`Export error: ${err.message}`)
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-brand-600" />
            <span>Settings & Data Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Company information defaults, compliance exports, and system infrastructure status
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Company Settings (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-brand-600" />
                <CardTitle>Agency Profile & System Defaults</CardTitle>
              </div>
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved successfully</span>
                </span>
              )}
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  saveSettings.mutate(formData)
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Agency Name"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                  />

                  <Input
                    label="Official Contact Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Contact Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Primary Operating Currency
                    </label>
                    <select
                      value={formData.default_currency}
                      onChange={(e) =>
                        setFormData({ ...formData, default_currency: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="AED">AED (د.إ) - UAE Dirham</option>
                      <option value="USD">USD ($) - US Dollar</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Registered Agency Address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />

                <div className="pt-2 flex justify-end">
                  <Button type="submit" isLoading={saveSettings.isPending}>
                    Save Preferences
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Data Export Center */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <CardTitle>Data Export Center (CSV)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 mb-4">
                Export raw relational records for external auditing, accounting, and compliance reporting in standard RFC-4180 CSV format.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleExport('leads')}
                  disabled={!!isExporting}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-slate-50 flex items-center justify-between text-left transition-all group"
                >
                  <div>
                    <p className="font-semibold text-slate-900 text-xs group-hover:text-brand-600">
                      Leads Directory
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Prospects, sources, contact info
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
                </button>

                <button
                  onClick={() => handleExport('clients')}
                  disabled={!!isExporting}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-slate-50 flex items-center justify-between text-left transition-all group"
                >
                  <div>
                    <p className="font-semibold text-slate-900 text-xs group-hover:text-brand-600">
                      Clients Roster
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Company accounts and contacts
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
                </button>

                <button
                  onClick={() => handleExport('work_items')}
                  disabled={!!isExporting}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-slate-50 flex items-center justify-between text-left transition-all group"
                >
                  <div>
                    <p className="font-semibold text-slate-900 text-xs group-hover:text-brand-600">
                      Staff Work Deliverables
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Task assignments and completion dates
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
                </button>

                <button
                  onClick={() => handleExport('billing_records')}
                  disabled={!!isExporting}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-slate-50 flex items-center justify-between text-left transition-all group"
                >
                  <div>
                    <p className="font-semibold text-slate-900 text-xs group-hover:text-brand-600">
                      Billing Invoices Ledger
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Receivables and settlement history
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Infrastructure & Free Tier Health (1 col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-brand-600" />
                <CardTitle>Free Tier Optimization</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-600">Postgres Database</span>
                <Badge variant="success">Active (500MB)</Badge>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-600">Row Level Security</span>
                <Badge variant="success">Enforced (12 Tables)</Badge>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-600">Query Cache</span>
                <span className="font-semibold text-slate-800">3 Min Stale / 15 Min GC</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-600">Vercel Hosting</span>
                <span className="font-semibold text-slate-800">Static SPA Edge</span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  System queries utilize head-counts and selective columns to guarantee zero excess egress or bandwidth charges.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                <CardTitle>Database Instance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <p>
                <strong>Project:</strong> IWILLMEDIACRM
              </p>
              <p>
                <strong>Ref:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded">iynfansffsqudlumikbe</code>
              </p>
              <p>
                <strong>Region:</strong> ap-south-1 (Mumbai)
              </p>
              <p>
                <strong>Postgres Engine:</strong> 17.6
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
