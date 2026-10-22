import React, { useState } from 'react'
import {
  CalendarDays,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  LayoutGrid,
  List,
  Film,
  Palette,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Repeat,
} from 'lucide-react'
import { useDMCalendar, EnrichedDMWorkItem } from '../hooks/useDMCalendar'
import { AutoAssignMonthModal } from '../components/AutoAssignMonthModal'
import { DMDeliverablePlansModal } from '../components/DMDeliverablePlansModal'
import { DMDeliverableDetailModal } from '../components/DMDeliverableDetailModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/AuthContext'
import { format, isSameMonth, isToday, parseISO } from 'date-fns'
import { formatDate } from '@/lib/formatters'
import { DeliverableType } from '@/types/database.types'

export const DMWorkCalendarPage: React.FC = () => {
  const { isAdmin } = useAuth()
  const {
    currentDate,
    monthStart,
    days,
    deliverables,
    deliverablesByDueDate,
    monthlyMetrics,
    dmClients,
    staffList,
    clientPlans,
    filters,
    setFilters,
    isLoading,
    nextMonth,
    prevMonth,
    goToToday,
    bulkCreateWorkItems,
    updateWorkItem,
    deleteWorkItem,
    quickToggleStatus,
    unassignedRecurringClients,
    autoAssignUnassignedRecurringClients,
    toggleClientAutoRecurring,
  } = useDMCalendar()

  // View mode: Grid vs List
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isBatchGenerating, setIsBatchGenerating] = useState(false)

  // Modals state
  const [isAutoAssignModalOpen, setIsAutoAssignModalOpen] = useState(false)
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false)
  const [selectedPlanClientId, setSelectedPlanClientId] = useState<string>('')
  const [selectedDeliverable, setSelectedDeliverable] = useState<EnrichedDMWorkItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleOpenPlans = (clientId?: string) => {
    const target =
      (clientId || (filters.clientId !== 'all' ? filters.clientId : dmClients[0]?.id)) || ''
    setSelectedPlanClientId(target)
    setIsPlansModalOpen(true)
  }

  const handleDeliverableClick = (item: EnrichedDMWorkItem) => {
    setSelectedDeliverable(item)
    setIsDetailModalOpen(true)
  }

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const selectedClient = dmClients.find((c) => c.id === filters.clientId)

  return (
    <div className="space-y-6">
      {/* 1. Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck2 className="w-6 h-6 text-brand-600" />
            <span>Digital Marketing Work Calendar</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monthly recurring deliverable scheduler: auto-assign posters, videos, and content pipelines with start dates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenPlans()}
                className="text-xs shadow-sm bg-white border-slate-300"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                <span>Manage Recurring Packages</span>
              </Button>

              <Button
                onClick={() => setIsAutoAssignModalOpen(true)}
                className="text-xs shadow-md shadow-brand-500/20 bg-brand-600 hover:bg-brand-700 text-white"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>Auto-Assign 1-Month Work</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Auto-Recurring Alert Bar for Month */}
      {isAdmin && unassignedRecurringClients.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50/80 border border-purple-200 rounded-xl shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-950">
                Monthly Auto-Recurring: {unassignedRecurringClients.length} DM {unassignedRecurringClients.length === 1 ? 'client has' : 'clients have'} recurring packages ready for {format(currentDate, 'MMMM yyyy')}
              </p>
              <p className="text-[11px] text-purple-700 mt-0.5">
                {unassignedRecurringClients.map((c) => c.company_name).join(', ')}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={async () => {
              setIsBatchGenerating(true)
              try {
                const count = await autoAssignUnassignedRecurringClients()
                alert(`Successfully auto-assigned ${count} deliverables for ${format(currentDate, 'MMMM yyyy')}!`)
              } catch (err) {
                console.error(err)
                alert('Error auto-assigning deliverables.')
              } finally {
                setIsBatchGenerating(false)
              }
            }}
            disabled={isBatchGenerating}
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white shrink-0 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            <span>{isBatchGenerating ? 'Auto-Assigning...' : `Auto-Assign All (${unassignedRecurringClients.length} Clients)`}</span>
          </Button>
        </div>
      )}

      {/* 2. Monthly Quota Progress & Analytics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Posters Progress */}
        <Card className="p-4 border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Posters Quota
                </span>
                <div className="text-xl font-extrabold text-slate-900">
                  {monthlyMetrics.posters.scheduled}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    / {monthlyMetrics.posters.target} planned
                  </span>
                </div>
              </div>
            </div>
            <Badge variant="default" size="sm" className="bg-purple-100 text-purple-800 border-none font-bold">
              {monthlyMetrics.posters.completed} Done
            </Badge>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all"
              style={{
                width: `${
                  monthlyMetrics.posters.target > 0
                    ? Math.min(
                        100,
                        (monthlyMetrics.posters.scheduled / monthlyMetrics.posters.target) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </Card>

        {/* Videos Progress */}
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Videos / Reels Quota
                </span>
                <div className="text-xl font-extrabold text-slate-900">
                  {monthlyMetrics.videos.scheduled}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    / {monthlyMetrics.videos.target} planned
                  </span>
                </div>
              </div>
            </div>
            <Badge variant="default" size="sm" className="bg-emerald-100 text-emerald-800 border-none font-bold">
              {monthlyMetrics.videos.completed} Done
            </Badge>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all"
              style={{
                width: `${
                  monthlyMetrics.videos.target > 0
                    ? Math.min(
                        100,
                        (monthlyMetrics.videos.scheduled / monthlyMetrics.videos.target) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </Card>

        {/* Total Deliverables */}
        <Card className="p-4 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Deliverables
              </span>
              <div className="text-xl font-extrabold text-slate-900">
                {monthlyMetrics.totalScheduled}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Completed</span>
              <span className="text-sm font-bold text-emerald-600">
                {monthlyMetrics.completed} / {monthlyMetrics.totalScheduled}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <span>{monthlyMetrics.inProgress} in progress</span>
            <span>&bull;</span>
            <span className="inline-block w-2 h-2 rounded-full bg-slate-300" />
            <span>{monthlyMetrics.pending} pending</span>
          </div>
        </Card>

        {/* Selected DM Client Focus Card */}
        <Card className="p-4 bg-slate-900 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">
                Active Client View
              </span>
              {selectedClient && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      toggleClientAutoRecurring({
                        clientId: selectedClient.id,
                        enabled: selectedClient.dm_auto_assign_recurring === false,
                      })
                    }
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      selectedClient.dm_auto_assign_recurring !== false
                        ? 'bg-purple-500/25 text-purple-300 hover:bg-purple-500/35 border border-purple-500/30'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                    }`}
                    title="Click to toggle auto-recurring"
                  >
                    <Repeat className="w-2.5 h-2.5" />
                    <span>{selectedClient.dm_auto_assign_recurring !== false ? 'Auto: Active' : 'Auto: Paused'}</span>
                  </button>
                  <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300">
                    DM
                  </Badge>
                </div>
              )}
            </div>
            <h3 className="text-base font-bold mt-1 truncate">
              {selectedClient ? selectedClient.company_name : 'All DM Clients'}
            </h3>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Total DM Accounts: {dmClients.length}</span>
            {isAdmin && (
              <button
                onClick={() => setIsAutoAssignModalOpen(true)}
                className="text-brand-300 hover:text-brand-200 font-semibold underline flex items-center gap-1"
              >
                <span>Auto-Assign</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Controls & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Month / Year Navigator */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded hover:bg-white text-slate-700 hover:shadow-xs transition-all"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 text-xs font-bold text-slate-800 hover:bg-white rounded hover:shadow-xs transition-all"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded hover:bg-white text-slate-700 hover:shadow-xs transition-all"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="text-base font-bold text-slate-900 tracking-tight ml-2">
              {format(currentDate, 'MMMM yyyy')}
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
            {/* Client Filter */}
            <select
              value={filters.clientId}
              onChange={(e) => setFilters((prev) => ({ ...prev, clientId: e.target.value }))}
              className="text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All DM Clients ({dmClients.length})</option>
              {dmClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>

            {/* Staff Filter */}
            <select
              value={filters.staffId}
              onChange={(e) => setFilters((prev) => ({ ...prev, staffId: e.target.value }))}
              className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Staff Assignees</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.designation || 'Staff'})
                </option>
              ))}
            </select>

            {/* Deliverable Type Filter */}
            <select
              value={filters.deliverableType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, deliverableType: e.target.value }))
              }
              className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Types</option>
              <option value="poster">Posters Only</option>
              <option value="video">Videos Only</option>
              <option value="reel">Reels Only</option>
              <option value="carousel">Carousels Only</option>
            </select>

            {/* Scope Filter: Configured Deliverables Only vs All Works */}
            <select
              value={filters.scope || 'configured'}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, scope: e.target.value as 'configured' | 'all' }))
              }
              className="text-xs font-bold rounded-lg border border-purple-200 bg-purple-50/60 text-purple-900 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              title="Filter by deliverable scope"
            >
              <option value="configured">★ Configured Deliverables Only</option>
              <option value="all">All DM Tasks (Including Ad-Hoc)</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Calendar Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Agenda List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Calendar Grid View */}
      {viewMode === 'grid' ? (
        <Card className="overflow-hidden border border-slate-200 shadow-xs">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-[11px] uppercase tracking-wider text-center">
            {weekDayLabels.map((day) => (
              <div key={day} className="py-2.5">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100">
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const isCurrent = isSameMonth(day, currentDate)
              const isTodayDate = isToday(day)
              const items = deliverablesByDueDate[dateStr] || []

              return (
                <div
                  key={dateStr}
                  className={`min-h-[135px] p-2 flex flex-col justify-between transition-colors ${
                    isCurrent ? 'bg-white' : 'bg-slate-50/70 text-slate-400'
                  } ${isTodayDate ? 'ring-2 ring-brand-500 ring-inset bg-brand-50/20' : ''}`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-extrabold rounded-md w-6 h-6 flex items-center justify-center ${
                        isTodayDate
                          ? 'bg-brand-600 text-white'
                          : isCurrent
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {items.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </div>

                  {/* Deliverable Items on this day */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-0.5">
                    {items.map((item) => {
                      const isPoster = item.deliverable_type === 'poster'
                      const isVideo =
                        item.deliverable_type === 'video' || item.deliverable_type === 'reel'
                      const isCompleted = item.status === 'completed'

                      const staffName = item.profiles?.full_name?.split(' ')[0] || 'Unassigned'
                      const startText = item.start_date
                        ? format(parseISO(item.start_date), 'MMM dd')
                        : null

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleDeliverableClick(item)}
                          className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-xs group ${
                            isCompleted
                              ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-75'
                              : isPoster
                              ? 'bg-purple-50/90 border-purple-200 hover:border-purple-300 text-purple-950'
                              : isVideo
                              ? 'bg-emerald-50/90 border-emerald-200 hover:border-emerald-300 text-emerald-950'
                              : 'bg-amber-50/90 border-amber-200 hover:border-amber-300 text-amber-950'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                isPoster
                                  ? 'bg-purple-200 text-purple-800'
                                  : isVideo
                                  ? 'bg-emerald-200 text-emerald-800'
                                  : 'bg-amber-200 text-amber-800'
                              }`}
                            >
                              {item.deliverable_type}
                            </span>

                            {isCompleted ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : (
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  item.status === 'in_progress' ? 'bg-amber-500' : 'bg-slate-400'
                                }`}
                              />
                            )}
                          </div>

                          <div className="font-bold text-[11px] leading-tight truncate mt-1">
                            {item.title}
                          </div>

                          {/* Work Starting Date & Assignee */}
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/60 text-[10px] text-slate-600">
                            {startText ? (
                              <span className="flex items-center gap-0.5 text-slate-500" title={`Work starting date: ${startText}`}>
                                <Clock className="w-2.5 h-2.5 text-brand-600" />
                                <span>{startText}</span>
                              </span>
                            ) : (
                              <span />
                            )}
                            <span className="font-semibold text-slate-700 truncate max-w-[70px]">
                              {staffName}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        /* 5. Agenda List View */
        <Card>
          {deliverables.length === 0 ? (
            <div className="p-16 text-center">
              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">
                No deliverables scheduled this month
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Use Auto-Assign 1-Month Work to generate poster and video schedules for your DM
                clients.
              </p>
              {isAdmin && (
                <Button
                  onClick={() => setIsAutoAssignModalOpen(true)}
                  className="mt-4 bg-brand-600 text-white"
                  size="sm"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  <span>Auto-Assign Month</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Deliverable Title</th>
                    <th className="py-3 px-4">Work Start Date</th>
                    <th className="py-3 px-4">Submission Due Date</th>
                    <th className="py-3 px-4">Assigned Staff</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {deliverables.map((item) => {
                    const isPoster = item.deliverable_type === 'poster'
                    const isVideo =
                      item.deliverable_type === 'video' || item.deliverable_type === 'reel'

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleDeliverableClick(item)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.clients?.company_name || 'Client'}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isPoster
                                ? 'bg-purple-100 text-purple-700'
                                : isVideo
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isPoster ? <Palette className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                            {item.deliverable_type}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-900">{item.title}</td>

                        <td className="py-3 px-4 text-slate-700 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-brand-600" />
                            {formatDate(item.start_date || item.assigned_date)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-900 font-bold">
                          {formatDate(item.due_date)}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px]">
                              {item.profiles?.full_name?.slice(0, 2).toUpperCase() || 'UN'}
                            </div>
                            <span>{item.profiles?.full_name || 'Unassigned'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              item.status === 'completed'
                                ? 'success'
                                : item.status === 'in_progress'
                                ? 'warning'
                                : 'default'
                            }
                            size="sm"
                          >
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant={item.status === 'completed' ? 'outline' : 'primary'}
                            onClick={() => quickToggleStatus(item)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            {item.status === 'completed' ? 'Re-open' : 'Mark Done'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <AutoAssignMonthModal
        isOpen={isAutoAssignModalOpen}
        onClose={() => setIsAutoAssignModalOpen(false)}
        dmClients={dmClients}
        staffList={staffList}
        allPlans={clientPlans}
        initialClientId={filters.clientId}
        initialDate={currentDate}
        onConfirmAssign={async (deliverables) => {
          await bulkCreateWorkItems(deliverables)
        }}
        onSetAutoRecurring={async (cid, enabled) => {
          await toggleClientAutoRecurring({ clientId: cid, enabled })
        }}
        onOpenPlansManager={(cid) => handleOpenPlans(cid)}
      />

      <DMDeliverablePlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        client={dmClients.find((c) => c.id === selectedPlanClientId) || dmClients[0] || null}
        dmClients={dmClients}
        staffList={staffList}
        onSelectClient={(cid) => setSelectedPlanClientId(cid)}
        onToggleAutoRecurring={async (cid, enabled) => {
          await toggleClientAutoRecurring({ clientId: cid, enabled })
        }}
      />

      <DMDeliverableDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        deliverable={selectedDeliverable}
        staffList={staffList}
        onUpdate={async (id, updates) => {
          await updateWorkItem({ id, updates })
        }}
        onDelete={async (id) => {
          await deleteWorkItem(id)
        }}
        onToggleStatus={async (item) => {
          await quickToggleStatus(item)
        }}
      />
    </div>
  )
}
export default DMWorkCalendarPage
