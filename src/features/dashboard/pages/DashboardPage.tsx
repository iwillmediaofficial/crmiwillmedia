import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users2,
  PhoneCall,
  PlayCircle,
  Clock,
  CheckCircle2,
  FileQuestion,
  Receipt,
  AlertTriangle,
  Calendar,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useDashboardData } from '../hooks/useDashboardData'
import { MetricsCard } from '../components/MetricsCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatters'

export const DashboardPage: React.FC = () => {
  const { profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { data: metrics, isLoading } = useDashboardData()

  const todayFormatted = formatDate(new Date(), 'EEEE, MMMM dd, yyyy')

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{todayFormatted}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isAdmin ? 'purple' : 'info'} size="md" className="capitalize font-semibold">
            {profile?.role || 'Staff'} View
          </Badge>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs font-medium text-slate-600">
            {profile?.department || 'Operations'}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isAdmin ? (
        // ADMIN METRICS GRID (8 Cards)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard
            title="Total Leads"
            value={isLoading ? '...' : metrics?.leadsTotal || 0}
            icon={Users2}
            iconColor="text-brand-600 bg-brand-50 border-brand-200"
            onClick={() => navigate('/leads')}
          />
          <MetricsCard
            title="Follow-ups Today"
            value={isLoading ? '...' : metrics?.followupsToday || 0}
            icon={PhoneCall}
            iconColor="text-sky-600 bg-sky-50 border-sky-200"
            onClick={() => navigate('/leads')}
          />
          <MetricsCard
            title="Active Works"
            value={isLoading ? '...' : metrics?.workActive || 0}
            icon={PlayCircle}
            iconColor="text-violet-600 bg-violet-50 border-violet-200"
            onClick={() => navigate('/work')}
          />
          <MetricsCard
            title="Pending Works"
            value={isLoading ? '...' : metrics?.workPending || 0}
            icon={Clock}
            iconColor="text-amber-600 bg-amber-50 border-amber-200"
            onClick={() => navigate('/work')}
          />
          <MetricsCard
            title="Completed Works"
            value={isLoading ? '...' : metrics?.workCompleted || 0}
            icon={CheckCircle2}
            iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
            onClick={() => navigate('/work')}
          />
          <MetricsCard
            title="Unbilled Works"
            value={isLoading ? '...' : metrics?.workUnbilled || 0}
            icon={FileQuestion}
            iconColor="text-indigo-600 bg-indigo-50 border-indigo-200"
            onClick={() => navigate('/billing')}
          />
          <MetricsCard
            title="Upcoming Bills"
            value={isLoading ? '...' : metrics?.billsUpcoming || 0}
            icon={Receipt}
            iconColor="text-teal-600 bg-teal-50 border-teal-200"
            onClick={() => navigate('/calendar')}
          />
          <MetricsCard
            title="Overdue Bills"
            value={isLoading ? '...' : metrics?.billsOverdue || 0}
            icon={AlertTriangle}
            iconColor="text-rose-600 bg-rose-50 border-rose-200"
            onClick={() => navigate('/billing')}
          />
        </div>
      ) : (
        // STAFF METRICS GRID (5 Cards)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricsCard
            title="My Assigned Leads"
            value={isLoading ? '...' : metrics?.leadsTotal || 0}
            icon={Users2}
            iconColor="text-brand-600 bg-brand-50 border-brand-200"
            onClick={() => navigate('/leads')}
          />
          <MetricsCard
            title="My Follow-ups Today"
            value={isLoading ? '...' : metrics?.followupsToday || 0}
            icon={PhoneCall}
            iconColor="text-sky-600 bg-sky-50 border-sky-200"
            onClick={() => navigate('/leads')}
          />
          <MetricsCard
            title="My Active Work"
            value={isLoading ? '...' : metrics?.workActive || 0}
            icon={PlayCircle}
            iconColor="text-violet-600 bg-violet-50 border-violet-200"
            onClick={() => navigate('/work')}
          />
          <MetricsCard
            title="My Pending Work"
            value={isLoading ? '...' : metrics?.workPending || 0}
            icon={Clock}
            iconColor="text-amber-600 bg-amber-50 border-amber-200"
            onClick={() => navigate('/work')}
          />
          <MetricsCard
            title="My Completed Work"
            value={isLoading ? '...' : metrics?.workCompleted || 0}
            icon={CheckCircle2}
            iconColor="text-emerald-600 bg-emerald-50 border-emerald-200"
            onClick={() => navigate('/work')}
          />
        </div>
      )}

      {/* Secondary Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deadlines Widget (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <CardTitle>Upcoming Work Deadlines</CardTitle>
            </div>
            <button
              onClick={() => navigate('/work')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {metrics?.upcomingDeadlines && metrics.upcomingDeadlines.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {metrics.upcomingDeadlines.map((item: any) => {
                  const isOverdue = new Date(item.due_date) < new Date(todayFormatted)
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate('/work')}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.title}</p>
                          <Badge
                            variant={
                              item.priority === 'urgent'
                                ? 'danger'
                                : item.priority === 'high'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                            className="capitalize"
                          >
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {item.clients?.company_name || 'Client'}
                          {isAdmin && item.profiles?.full_name && (
                            <span className="text-slate-400"> • Assigned to {item.profiles.full_name}</span>
                          )}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge
                          variant={isOverdue ? 'danger' : 'default'}
                          size="sm"
                          className={isOverdue ? 'font-bold' : ''}
                        >
                          Due {formatDate(item.due_date, 'MMM dd')}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No impending deadlines found. You are all caught up!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Pipeline Overview (1 col) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-brand-600" />
              <CardTitle>Lead Pipeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="space-y-3">
                {[
                  { label: 'New Inquiries', key: 'new', color: 'bg-sky-500' },
                  { label: 'Follow-ups Required', key: 'follow_up', color: 'bg-amber-500' },
                  { label: 'Interested Prospects', key: 'interested', color: 'bg-violet-500' },
                  { label: 'Won / Converted', key: 'won', color: 'bg-emerald-500' },
                  { label: 'Lost Deals', key: 'lost', color: 'bg-slate-400' },
                ].map((stage) => {
                  const pipelineMap = (metrics?.pipeline || {}) as Record<string, number>
                  const count = pipelineMap[stage.key] || 0
                  return (
                    <div key={stage.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-600">{stage.label}</span>
                        <span className="font-bold text-slate-900">{count}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${stage.color} rounded-full`}
                          style={{
                            width: `${metrics?.leadsTotal ? (count / metrics.leadsTotal) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}

                <div className="pt-3">
                  <button
                    onClick={() => navigate('/leads')}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Open Leads Pipeline
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-slate-600">
                <p>
                  Keep your lead remarks and follow-up dates updated. Your scheduled calls for today are ready in the Leads tab.
                </p>
                <button
                  onClick={() => navigate('/leads')}
                  className="w-full py-2 px-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  View My Leads
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
