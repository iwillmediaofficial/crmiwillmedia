import React, { useState } from 'react'
import { UserCheck, Plus, Search, ShieldCheck, Mail, Phone, Edit2, Power } from 'lucide-react'
import { useStaff } from '../hooks/useStaff'
import { StaffModal } from '../components/StaffModal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Profile } from '@/types/database.types'

export const StaffPage: React.FC = () => {
  const { staffList, isLoading, createStaff, updateStaff, toggleActiveStatus } = useStaff()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null)

  const handleOpenAdd = () => {
    setEditingStaff(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (staff: Profile) => {
    setEditingStaff(staff)
    setIsModalOpen(true)
  }

  const handleToggleActive = async (staff: Profile) => {
    const action = staff.active ? 'deactivate' : 'activate'
    if (confirm(`Are you sure you want to ${action} ${staff.full_name}'s access?`)) {
      await toggleActiveStatus({ id: staff.id, active: !staff.active })
    }
  }

  const filteredStaff = staffList.filter((s) => {
    const term = searchTerm.toLowerCase()
    return (
      s.full_name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      (s.department && s.department.toLowerCase().includes(term)) ||
      (s.designation && s.designation.toLowerCase().includes(term))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-brand-600" />
            <span>Staff Roster & Permissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision staff user logins, assign departments, and configure system permissions
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Staff Member</span>
        </Button>
      </div>

      {/* Filter and Stats */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
            <span>
              Total Team: <strong className="text-slate-900">{staffList.length}</strong>
            </span>
            <span>
              Active: <strong className="text-emerald-600">{staffList.filter((s) => s.active).length}</strong>
            </span>
          </div>
        </div>
      </Card>

      {/* Staff Table */}
      <Card>
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading staff directory...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No staff members found</h3>
            <p className="text-xs text-slate-500 mt-1">Add staff users to allocate work and assign leads.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role & Permissions</th>
                  <th className="py-3 px-4">Department & Designation</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 border border-brand-200/80 flex items-center justify-center font-bold text-xs shrink-0">
                          {staff.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{staff.full_name}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span>{staff.email}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={staff.role === 'admin' ? 'purple' : 'neutral'}
                        size="sm"
                        className="capitalize font-semibold"
                      >
                        {staff.role}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{staff.designation || 'Staff'}</p>
                      <p className="text-[11px] text-slate-400">{staff.department || 'Operations'}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {staff.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{staff.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={staff.active ? 'success' : 'danger'} size="sm">
                        {staff.active ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(staff)}
                          className={`p-1.5 rounded-md transition-colors ${
                            staff.active
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={staff.active ? 'Deactivate Account' : 'Reactivate Account'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Staff Form Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialStaff={editingStaff}
        onSubmit={async (payload) => {
          if (editingStaff) {
            await updateStaff({
              id: editingStaff.id,
              updates: {
                full_name: payload.full_name,
                phone: payload.phone || null,
                department: payload.department || null,
                designation: payload.designation || null,
                role: payload.role,
              },
            })
          } else {
            await createStaff(payload)
          }
        }}
      />
    </div>
  )
}
