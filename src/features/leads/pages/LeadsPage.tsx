import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users2,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Filter,
  Edit2,
  Trash2,
  Building2,
  CheckCircle2,
  Layers,
} from 'lucide-react'
import { useLeads, LeadFilterParams } from '../hooks/useLeads'
import { LeadModal } from '../components/LeadModal'
import { LeadFormsManagerModal } from '../components/LeadFormsManagerModal'
import { WhatsAppButton } from '../components/WhatsAppButton'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/formatters'
import { Lead } from '@/types/database.types'

export const LeadsPage: React.FC = () => {
  const { isAdmin } = useAuth()
  const [filters, setFilters] = useState<LeadFilterParams>({
    search: '',
    status: 'all',
    followUpFilter: 'all',
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormsModalOpen, setIsFormsModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  const {
    leads,
    isLoading,
    createLead,
    updateLead,
    deleteLead,
    convertLeadToClient,
    isDeleting,
    isConverting,
  } = useLeads(filters)

  const handleOpenAdd = () => {
    setEditingLead(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead)
    setIsModalOpen(true)
  }

  const handleConvertToClient = async (lead: Lead) => {
    if (confirm(`Convert lead "${lead.name}" to an official Client account in Clients Directory?`)) {
      await convertLeadToClient({ leadId: lead.id })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete lead "${name}"?`)) {
      await deleteLead(id)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="info">New</Badge>
      case 'follow_up':
        return <Badge variant="warning">Follow-up</Badge>
      case 'interested':
        return <Badge variant="purple">Interested</Badge>
      case 'won':
        return <Badge variant="success">Won</Badge>
      case 'lost':
        return <Badge variant="danger">Lost</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users2 className="w-6 h-6 text-brand-600" />
            <span>Leads Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track inquiries, manage follow-up cadences, and connect directly on WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsFormsModalOpen(true)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Layers className="w-4 h-4 mr-1.5 text-[#0866FF]" />
              <span>Meta Lead Forms</span>
            </Button>
          )}

          <Button onClick={handleOpenAdd} className="shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Lead</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New Inquiries</option>
              <option value="follow_up">Follow-ups</option>
              <option value="interested">Interested</option>
              <option value="won">Won Deals</option>
              <option value="lost">Lost Deals</option>
            </select>
          </div>

          <div>
            <select
              value={filters.followUpFilter}
              onChange={(e) =>
                setFilters({ ...filters, followUpFilter: e.target.value as any })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="all">All Follow-ups</option>
              <option value="today">Follow-up Due Today</option>
              <option value="upcoming">Upcoming Follow-ups</option>
              <option value="overdue">Overdue Follow-ups</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-900">{leads.length}</strong> leads
            </span>
            {(filters.search || filters.status !== 'all' || filters.followUpFilter !== 'all') && (
              <button
                onClick={() =>
                  setFilters({ search: '', status: 'all', followUpFilter: 'all' })
                }
                className="text-brand-600 hover:text-brand-700 font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Leads Table / Responsive Grid */}
      <Card>
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <Users2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No leads found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no leads matching your current filter criteria. Create your first lead to begin tracking.
            </p>
            <Button onClick={handleOpenAdd} size="sm" variant="outline" className="mt-4">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Lead</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Prospect</th>
                  <th className="py-3 px-4">Contact & WhatsApp</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Follow-up Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leads.map((lead) => {
                  const isOverdue =
                    lead.follow_up_date &&
                    new Date(lead.follow_up_date) < new Date() &&
                    lead.status !== 'won' &&
                    lead.status !== 'lost'

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{lead.name}</div>
                        {lead.remarks && (
                          <p className="text-[11px] font-normal text-slate-400 line-clamp-1 mt-0.5">
                            {lead.remarks}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lead.phone}</span>
                            <WhatsAppButton
                              phone={lead.phone}
                              name={lead.name}
                              className="ml-2 scale-90"
                            />
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[150px]">{lead.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="neutral" size="sm" className="capitalize">
                          {lead.lead_source}
                        </Badge>
                        {lead.campaign_details && (
                          <span className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                            {lead.campaign_details}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(lead.status)}
                          {lead.status === 'won' && (
                            <Link
                              to="/clients"
                              className="inline-flex items-center gap-1 text-[10px] text-brand-600 hover:text-brand-700 font-semibold hover:underline block"
                            >
                              <Building2 className="w-3 h-3" />
                              <span>In Clients Directory</span>
                            </Link>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {lead.profiles?.full_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                              {lead.profiles.full_name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800">
                              {lead.profiles.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {lead.follow_up_date ? (
                          <div
                            className={`flex items-center gap-1.5 ${
                              isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(lead.follow_up_date, 'MMM dd, hh:mm a')}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.status !== 'won' && (
                            <button
                              onClick={() => handleConvertToClient(lead)}
                              disabled={isConverting}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
                              title="Convert to Client"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Convert</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(lead)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                            title="Edit Lead"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(lead.id, lead.name)}
                              disabled={isDeleting}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialLead={editingLead}
        onSubmit={async (payload) => {
          if (editingLead) {
            await updateLead({ id: editingLead.id, updates: payload })
          } else {
            await createLead(payload)
          }
        }}
      />

      {/* Meta Lead Forms Manager Modal */}
      {isAdmin && (
        <LeadFormsManagerModal
          isOpen={isFormsModalOpen}
          onClose={() => setIsFormsModalOpen(false)}
        />
      )}
    </div>
  )
}
