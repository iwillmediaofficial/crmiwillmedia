import React, { useState } from 'react'
import {
  Building2,
  Plus,
  Search,
  Mail,
  Phone,
  Globe,
  Edit2,
  ArrowUpRight,
} from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { ClientModal } from '../components/ClientModal'
import { ClientDetailsDrawer } from '../components/ClientDetailsDrawer'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Client } from '@/types/database.types'

export const ClientsPage: React.FC = () => {
  const { isAdmin } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { clients, isLoading, createClient, updateClient } = useClients(
    searchTerm,
    statusFilter
  )

  const handleOpenAdd = () => {
    setEditingClient(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation()
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client)
    setIsDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-brand-600" />
            <span>Clients Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized company accounts, contact persons, linked work deliverables, and retainers
          </p>
        </div>

        {isAdmin && (
          <Button onClick={handleOpenAdd} className="shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Client</span>
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, contact, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <span className="text-xs text-slate-500">
              Total Clients: <strong className="text-slate-900">{clients.length}</strong>
            </span>
          </div>
        </div>
      </Card>

      {/* Clients Table */}
      <Card>
        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="p-16 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No clients registered</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your agency clients to organize deliverables and retainers.
            </p>
            {isAdmin && (
              <Button onClick={handleOpenAdd} size="sm" variant="outline" className="mt-4">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Client</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 border border-brand-200/80 flex items-center justify-center font-bold text-xs shrink-0">
                          {client.company_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="group-hover:text-brand-600 transition-colors">
                            {client.company_name}
                          </span>
                          {client.address && (
                            <span className="block text-[11px] font-normal text-slate-400 truncate max-w-xs mt-0.5">
                              {client.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {client.contact_person}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[150px]">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {client.website ? (
                        <a
                          href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-brand-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{client.website.replace(/^https?:\/\//, '')}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={client.status === 'active' ? 'success' : 'default'} size="sm">
                        {client.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin && (
                          <button
                            onClick={(e) => handleOpenEdit(e, client)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                            title="Edit Client"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Client Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialClient={editingClient}
        onSubmit={async (payload) => {
          if (editingClient) {
            await updateClient({ id: editingClient.id, updates: payload })
          } else {
            await createClient(payload)
          }
        }}
      />

      {/* Client 360 Details Drawer */}
      <ClientDetailsDrawer
        client={selectedClient}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  )
}
