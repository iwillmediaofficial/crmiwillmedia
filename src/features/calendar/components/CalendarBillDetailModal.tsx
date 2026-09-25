import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { CheckCircle2, Calendar, Building2, CreditCard } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'

interface CalendarBillDetailModalProps {
  bill: any | null
  isOpen: boolean
  onClose: () => void
  onMarkPaid: (bill: any) => Promise<void>
}

export const CalendarBillDetailModal: React.FC<CalendarBillDetailModalProps> = ({
  bill,
  isOpen,
  onClose,
  onMarkPaid,
}) => {
  const { isAdmin } = useAuth()
  if (!bill) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Details"
      description="Inspect scheduled client payment details and resolve settlement status."
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Deliverable / Title
            </span>
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
          </div>
          <p className="text-sm font-bold text-slate-900">{bill.bill_title}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-slate-200/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Client
            </span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{bill.clients?.company_name || 'Client'}</span>
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Total Amount
            </span>
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-brand-600" />
              <span>{formatCurrency(bill.amount, bill.currency)}</span>
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Payment Due Date
            </span>
            <span className="font-medium text-slate-800">{formatDate(bill.due_date)}</span>
          </div>
          {bill.paid_date && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-emerald-600 block">
                Settled Date
              </span>
              <span className="font-semibold text-emerald-700">{formatDate(bill.paid_date)}</span>
            </div>
          )}
        </div>

        {bill.remarks && (
          <div className="p-3 rounded-lg border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Notes / Instructions
            </span>
            <p className="text-slate-700">{bill.remarks}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {bill.status !== 'paid' && isAdmin && (
            <Button
              onClick={async () => {
                await onMarkPaid(bill)
                onClose()
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>Mark as Paid</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
