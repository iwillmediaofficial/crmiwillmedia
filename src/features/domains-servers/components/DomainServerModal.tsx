import React, { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Check, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useClients } from '@/features/clients/hooks/useClients'
import {
  AssetType,
  BillingCycle,
  DomainServerAsset,
} from '../types/domainServer.types'

const assetSchema = z.object({
  asset_type: z.enum(['domain', 'server', 'hosting', 'ssl', 'other']),
  name: z.string().min(2, 'Name or domain is required'),
  client_id: z.string().nullable().optional(),
  provider: z.string().min(1, 'Registrar / Provider is required'),
  registration_date: z.string().optional().nullable(),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  renewal_cost: z.number().min(0, 'Cost must be >= 0'),
  currency: z.string().default('INR'),
  billing_cycle: z.enum([
    'monthly',
    'quarterly',
    'semi_annual',
    'yearly',
    'biennial',
    'multi_year',
    'one_time',
  ]),
  auto_renew: z.boolean().default(false),
  ip_address: z.string().optional().nullable(),
  nameservers: z.string().optional().nullable(),
  admin_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type AssetFormValues = z.infer<typeof assetSchema>

interface DomainServerModalProps {
  isOpen: boolean
  onClose: () => void
  initialAsset?: DomainServerAsset | null
  onSubmit: (values: Partial<DomainServerAsset>) => Promise<any>
}

const COMMON_PROVIDERS = [
  'GoDaddy',
  'Hostinger',
  'AWS (Amazon Web Services)',
  'Cloudflare',
  'DigitalOcean',
  'Namecheap',
  'Google Cloud',
  'Hetzner',
  'HostGator',
  'BigRock',
  'Vultr',
  'Linode / Akamai',
  'Bluehost',
  'SiteGround',
]

export const DomainServerModal: React.FC<DomainServerModalProps> = ({
  isOpen,
  onClose,
  initialAsset,
  onSubmit,
}) => {
  const isEditing = !!initialAsset
  const { clients } = useClients()
  const queryClient = useQueryClient()

  // Custom added providers persisted in localStorage
  const [customProviders, setCustomProviders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('iwillmedia_custom_providers')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isAddingProvider, setIsAddingProvider] = useState(false)
  const [newProviderInput, setNewProviderInput] = useState('')

  const cachedAssets = queryClient.getQueryData<DomainServerAsset[]>(['domains-servers']) || []

  const providerOptions = useMemo(() => {
    const set = new Set<string>([
      ...COMMON_PROVIDERS,
      ...customProviders,
    ])
    cachedAssets.forEach((a) => {
      if (a.provider?.trim()) set.add(a.provider.trim())
    })
    if (initialAsset?.provider?.trim()) {
      set.add(initialAsset.provider.trim())
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [customProviders, cachedAssets, initialAsset])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema) as any,
    defaultValues: {
      asset_type: 'domain',
      name: '',
      client_id: null,
      provider: '',
      registration_date: '',
      expiry_date: '',
      renewal_cost: 0,
      currency: 'INR',
      billing_cycle: 'yearly',
      auto_renew: false,
      ip_address: '',
      nameservers: '',
      admin_url: '',
      notes: '',
    },
  })

  const currentType = watch('asset_type')
  const currentProvider = watch('provider')

  const handleSaveNewProvider = () => {
    const trimmed = newProviderInput.trim()
    if (!trimmed) {
      setIsAddingProvider(false)
      return
    }
    if (!customProviders.includes(trimmed)) {
      const updated = [...customProviders, trimmed]
      setCustomProviders(updated)
      try {
        localStorage.setItem('iwillmedia_custom_providers', JSON.stringify(updated))
      } catch (e) {
        console.error(e)
      }
    }
    setValue('provider', trimmed, { shouldValidate: true })
    setNewProviderInput('')
    setIsAddingProvider(false)
  }

  useEffect(() => {
    setIsAddingProvider(false)
    setNewProviderInput('')
    if (initialAsset) {
      reset({
        asset_type: initialAsset.asset_type,
        name: initialAsset.name,
        client_id: initialAsset.client_id || null,
        provider: initialAsset.provider || '',
        registration_date: initialAsset.registration_date || '',
        expiry_date: initialAsset.expiry_date || '',
        renewal_cost: initialAsset.renewal_cost || 0,
        currency: initialAsset.currency || 'INR',
        billing_cycle: initialAsset.billing_cycle || 'yearly',
        auto_renew: initialAsset.auto_renew ?? false,
        ip_address: initialAsset.ip_address || '',
        nameservers: initialAsset.nameservers || '',
        admin_url: initialAsset.admin_url || '',
        notes: initialAsset.notes || '',
      })
    } else {
      reset({
        asset_type: 'domain',
        name: '',
        client_id: null,
        provider: '',
        registration_date: '',
        expiry_date: '',
        renewal_cost: 0,
        currency: 'INR',
        billing_cycle: 'yearly',
        auto_renew: false,
        ip_address: '',
        nameservers: '',
        admin_url: '',
        notes: '',
      })
    }
  }, [initialAsset, reset, isOpen])

  const handleFormSubmit = async (values: AssetFormValues) => {
    try {
      await onSubmit({
        ...values,
        client_id: values.client_id === '' || values.client_id === 'null' ? null : values.client_id,
        registration_date: values.registration_date ? values.registration_date : null,
        ip_address: values.ip_address?.trim() || null,
        nameservers: values.nameservers?.trim() || null,
        admin_url: values.admin_url?.trim() || null,
        notes: values.notes?.trim() || null,
      })
      onClose()
    } catch (err: any) {
      alert(err.message || 'Failed to save asset')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Asset / Domain' : 'Add New Domain or Server'}
      description="Track expiry deadline, renewal pricing, client association and server details."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
        {/* Asset Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Asset Category *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { type: 'domain', label: 'Domain' },
              { type: 'server', label: 'Server / VPS' },
              { type: 'hosting', label: 'Web Hosting' },
              { type: 'ssl', label: 'SSL Certificate' },
            ].map((item) => (
              <button
                type="button"
                key={item.type}
                onClick={() => setValue('asset_type', item.type as AssetType)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                  currentType === item.type
                    ? 'border-brand-600 bg-brand-50 text-brand-700 font-semibold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name and Client */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={
              currentType === 'domain'
                ? 'Domain Name (e.g. mysite.com) *'
                : 'Server / Asset Name *'
            }
            placeholder={currentType === 'domain' ? 'example.com' : 'AWS Mumbai Web Node'}
            {...register('name')}
            error={errors.name?.message}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Client Association
            </label>
            <select
              {...register('client_id')}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Internal Agency Asset (No Client)</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} {c.contact_person ? `(${c.contact_person})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Provider and Admin URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Provider / Registrar *
              </label>
              {!isAddingProvider && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProvider(true)
                    setNewProviderInput('')
                  }}
                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              )}
            </div>

            {isAddingProvider ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Enter provider name (e.g. OVH, Contabo)"
                    value={newProviderInput}
                    onChange={(e) => setNewProviderInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSaveNewProvider()
                      } else if (e.key === 'Escape') {
                        setIsAddingProvider(false)
                      }
                    }}
                    className="flex-1 text-sm rounded-lg border border-brand-400 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveNewProvider}
                    className="text-xs px-2.5 h-9 shrink-0 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingProvider(false)
                      setNewProviderInput('')
                    }}
                    className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Type the provider name and press Enter or click Save.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  {...register('provider')}
                  value={currentProvider || ''}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingProvider(true)
                      setNewProviderInput('')
                    } else {
                      setValue('provider', e.target.value, { shouldValidate: true })
                    }
                  }}
                  className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Select Provider / Registrar --</option>
                  {providerOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="__add_new__" className="font-semibold text-brand-600">
                    + Add New Provider...
                  </option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProvider(true)
                    setNewProviderInput('')
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                  title="Add a new custom provider"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-600" />
                  <span>Add</span>
                </button>
              </div>
            )}

            {errors.provider?.message && (
              <p className="text-xs text-rose-500 mt-1">{errors.provider.message}</p>
            )}
          </div>

          <Input
            label="Management / Portal URL"
            placeholder="https://dash.cloudflare.com"
            {...register('admin_url')}
            error={errors.admin_url?.message}
          />
        </div>

        {/* Expiry Date, Registration Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
              Expiry / Renewal Due Date *
            </label>
            <input
              type="date"
              {...register('expiry_date')}
              className="w-full text-sm rounded-lg border border-rose-300 bg-white px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
            {errors.expiry_date?.message && (
              <p className="text-xs text-rose-500 mt-1">{errors.expiry_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Registration Date (Optional)
            </label>
            <input
              type="date"
              {...register('registration_date')}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Cost, Billing Cycle, Currency & Auto-renew */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Input
            label="Renewal Cost"
            type="number"
            step="any"
            placeholder="0"
            {...register('renewal_cost', { valueAsNumber: true })}
            error={errors.renewal_cost?.message}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Currency
            </label>
            <select
              {...register('currency')}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Billing Cycle
            </label>
            <select
              {...register('billing_cycle')}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="yearly">Yearly (1 Year)</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi_annual">Semi-Annual (6 Mos)</option>
              <option value="biennial">Biennial (2 Years)</option>
              <option value="multi_year">Multi-Year</option>
              <option value="one_time">One-Time / Lifetime</option>
            </select>
          </div>
        </div>

        {/* Auto Renew Switch */}
        <div className="flex items-center gap-3 pt-1">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('auto_renew')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
          <span className="text-xs font-medium text-slate-700">
            Auto-Renew is enabled on registrar/host
          </span>
        </div>

        {/* Server IP and Nameservers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Server IP / Hostname"
            placeholder="e.g. 192.168.1.1 or vps.domain.com"
            {...register('ip_address')}
          />
          <Input
            label="Nameservers / DNS Host"
            placeholder="ns1.cloudflare.com, ns2.cloudflare.com"
            {...register('nameservers')}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Notes / Account Info / Credentials Reference
          </label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="e.g. Owned by client directly, credit card on file, linked to cPanel #12"
            className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Asset' : 'Save Asset'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
