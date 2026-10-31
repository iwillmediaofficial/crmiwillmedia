import React, { useState, useEffect } from 'react'
import {
  Timer,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldAlert,
  Moon,
  Info,
} from 'lucide-react'
import { useTimerSettings, TimerSettings } from '@/features/timer/hooks/useTimerSettings'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const PRESET_HOURS = [4, 6, 8, 9, 10, 12]

export const TimerCutoffSettingsCard: React.FC = () => {
  const {
    settings,
    isLoading,
    updateSettings,
    isUpdating,
    triggerCutoffSweep,
    isSweeping,
  } = useTimerSettings()

  const [formData, setFormData] = useState<TimerSettings>(settings)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [sweepResult, setSweepResult] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateSettings(formData)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
    } catch (err: any) {
      alert(`Error saving timer settings: ${err.message}`)
    }
  }

  const handleManualSweep = async () => {
    try {
      setSweepResult(null)
      const res = await triggerCutoffSweep()
      if (res.affected_count > 0) {
        setSweepResult(`Successfully auto-stopped ${res.affected_count} overdue staff timer${res.affected_count > 1 ? 's' : ''}!`)
      } else {
        setSweepResult('No overdue staff timers found. All running timers are within limits.')
      }
      setTimeout(() => setSweepResult(null), 5000)
    } catch (err: any) {
      alert(`Error executing sweep: ${err.message}`)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-xs text-slate-400">
          Loading timer configuration...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-brand-200/90 shadow-2xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Staff Timer & Auto Cut-off Configuration
            </CardTitle>
            <p className="text-[11px] text-slate-500 font-normal mt-0.5">
              Prevent inflated work hours when staff forget to stop their timers upon leaving
            </p>
          </div>
        </div>

        {saveSuccess && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settings saved</span>
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="space-y-0.5">
              <label htmlFor="cutoff-toggle" className="text-xs font-bold text-slate-900 cursor-pointer">
                Enforce Automatic Timer Cut-Off
              </label>
              <p className="text-[11px] text-slate-500">
                When enabled, active timers that exceed the configured threshold will be capped and stopped automatically.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                id="cutoff-toggle"
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          {/* Section: Max Continuous Duration Limit */}
          <div className={`space-y-3 transition-opacity ${!formData.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-xs font-bold text-slate-900">
                Maximum Session Duration Limit (Hours)
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Any timer running continuously beyond this limit will be capped at this duration and terminated.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Presets:</span>
              {PRESET_HOURS.map((hours) => {
                const isSelected = formData.max_duration_hours === hours
                return (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setFormData({ ...formData, max_duration_hours: hours })}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs scale-102'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-brand-400 hover:bg-slate-50'
                    }`}
                  >
                    {hours} Hours
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    step={0.5}
                    value={formData.max_duration_hours || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_duration_hours: Math.max(1, Math.min(24, parseFloat(e.target.value) || 1)),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono font-bold"
                    placeholder="e.g. 8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    hours
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Accepts values between 1 and 24 hours (e.g. 8.5 for 8h 30m).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 flex items-start gap-2 text-xs">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  Active policy: Timers cap at{' '}
                  <strong className="font-bold text-emerald-950">
                    {formData.max_duration_hours}h ({Math.round(formData.max_duration_hours * 60)} mins)
                  </strong>
                  . The database will stop any timer exceeding this duration.
                </span>
              </div>
            </div>
          </div>

          {/* Section: Optional Daily Closing Cut-Off */}
          <div className={`p-3.5 rounded-xl border border-slate-200 bg-white space-y-3 transition-opacity ${!formData.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">
                    End-of-Day Office Closing Cut-off
                  </span>
                  <Badge variant="neutral" size="sm">Optional</Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  Automatically stops all running timers at a fixed time of the evening (e.g. 08:00 PM).
                </p>
              </div>

              <input
                type="checkbox"
                checked={formData.daily_cutoff_enabled}
                onChange={(e) => setFormData({ ...formData, daily_cutoff_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 mt-1 cursor-pointer"
              />
            </div>

            {formData.daily_cutoff_enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Daily Closing Cut-off Time (24h format)
                  </label>
                  <input
                    type="time"
                    value={formData.daily_cutoff_time || '20:00'}
                    onChange={(e) => setFormData({ ...formData, daily_cutoff_time: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
                  />
                </div>

                <div className="text-[11px] text-slate-500 flex items-center">
                  <span>
                    Any timer still running at{' '}
                    <strong className="text-slate-800">{formData.daily_cutoff_time || '20:00'}</strong>{' '}
                    will be terminated with an office closing cut-off remark.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Row: Save Settings & Trigger Manual Sweep */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Background scheduler runs every 15 minutes to sweep abandoned timers.</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualSweep}
                isLoading={isSweeping}
                title="Immediately check and auto-stop any currently overdue timers in the database"
                className="text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSweeping ? 'animate-spin' : ''}`} />
                <span>Run Sweep Now</span>
              </Button>

              <Button
                type="submit"
                size="sm"
                isLoading={isUpdating}
                className="text-xs"
              >
                Save Policy
              </Button>
            </div>
          </div>
        </form>

        {/* Sweep Feedback Banner */}
        {sweepResult && (
          <div className="p-3 rounded-lg bg-brand-50 border border-brand-200 text-brand-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-600 shrink-0" />
              <span>{sweepResult}</span>
            </div>
            <button
              onClick={() => setSweepResult(null)}
              className="text-brand-500 hover:text-brand-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
