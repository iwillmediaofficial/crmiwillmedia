import React, { useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
} from 'lucide-react'
import { useBillingCalendar } from '../hooks/useBillingCalendar'
import { CalendarBillDetailModal } from '../components/CalendarBillDetailModal'
import { useBilling } from '@/features/billing/hooks/useBilling'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { format, isSameMonth, isToday } from 'date-fns'
import { formatCurrency, formatDate } from '@/lib/formatters'

export const BillingCalendarPage: React.FC = () => {
  const {
    currentDate,
    monthStart,
    days,
    monthBills,
    billsByDate,
    isLoading,
    nextMonth,
    prevMonth,
    goToToday,
  } = useBillingCalendar()

  const { markPaid } = useBilling()
  const [selectedBill, setSelectedBill] = useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleChipClick = (bill: any) => {
    setSelectedBill(bill)
    setIsDetailModalOpen(true)
  }

  const handleMarkPaid = async (bill: any) => {
    await markPaid({ id: bill.id })
  }

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6">
      {/* Header and Month Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-brand-600" />
            <span>Monthly Billing Calendar</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual cashflow projections, recurring retainer dates, and settlement obligations
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Calendar Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Monthly List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Navigator */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-bold text-slate-900 text-xs px-3 min-w-[130px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>

            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={goToToday} className="shadow-sm">
            Today
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        // CALENDAR GRID VIEW
        <Card className="overflow-hidden border border-slate-200">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5">
            {weekDayLabels.map((day) => (
              <span key={day} className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {day}
              </span>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100/40">
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayBills = billsByDate[dateKey] || []
              const inMonth = isSameMonth(day, monthStart)
              const today = isToday(day)

              return (
                <div
                  key={dateKey}
                  className={`min-h-[105px] p-2 bg-white flex flex-col justify-between transition-colors ${
                    !inMonth ? 'bg-slate-50/60 opacity-40' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                        today
                          ? 'bg-brand-600 text-white font-bold shadow-sm'
                          : 'text-slate-700'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {dayBills.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {dayBills.length} {dayBills.length === 1 ? 'bill' : 'bills'}
                      </span>
                    )}
                  </div>

                  {/* Bill Chips */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px]">
                    {dayBills.map((bill) => {
                      const isPaid = bill.status === 'paid'
                      const isOverdue = bill.displayStatus === 'overdue'

                      return (
                        <div
                          key={bill.id}
                          onClick={() => handleChipClick(bill)}
                          className={`px-2 py-1 rounded-md text-[11px] cursor-pointer border transition-all truncate hover:scale-[1.02] shadow-xs ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                          title={`${bill.bill_title} - ${formatCurrency(bill.amount, bill.currency)}`}
                        >
                          <span className="font-semibold block truncate">
                            {bill.clients?.company_name || bill.bill_title}
                          </span>
                          <span className="font-bold text-[10px] opacity-90 block">
                            {formatCurrency(bill.amount, bill.currency)}
                          </span>
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
        // MONTHLY LIST VIEW
        <Card>
          {monthBills.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400">
              No bills scheduled for {format(currentDate, 'MMMM yyyy')}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Invoice Title</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {monthBills.map((bill: any) => (
                    <tr
                      key={bill.id}
                      onClick={() => handleChipClick(bill)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {formatDate(bill.due_date, 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {bill.clients?.company_name || 'Client'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{bill.bill_title}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(bill.amount, bill.currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            bill.status === 'paid'
                              ? 'success'
                              : bill.displayStatus === 'overdue'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {bill.displayStatus}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleChipClick(bill)
                          }}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Bill Details Modal */}
      <CalendarBillDetailModal
        bill={selectedBill}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedBill(null)
        }}
        onMarkPaid={handleMarkPaid}
      />
    </div>
  )
}
