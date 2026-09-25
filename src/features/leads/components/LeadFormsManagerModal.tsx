import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  QrCode,
  Sparkles,
  Share2,
  CheckCircle2,
  MessageCircle,
  X,
  User,
  Settings,
  HelpCircle,
  Layers,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'

interface LeadFormsManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

interface CustomQuestion {
  id: string
  type: 'multiple_choice' | 'short_answer'
  title: string
  required: boolean
  options?: string[]
}

export const LeadFormsManagerModal: React.FC<LeadFormsManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [qrCodeModalUrl, setQrCodeModalUrl] = useState<string | null>(null)

  // Editor Form State
  const [editingFormId, setEditingFormId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [greetingHeadline, setGreetingHeadline] = useState('Scale Your Business With IWILLMEDIA')
  const [greetingDescription, setGreetingDescription] = useState('Fill out this quick form and our team will get in touch with you shortly.')
  const [bulletPoints, setBulletPoints] = useState<string[]>([
    'Guaranteed ROI-driven marketing campaigns',
    'Full-stack design & development team',
    'Dedicated account manager & weekly reporting',
  ])
  const [newBullet, setNewBullet] = useState('')
  
  // Field toggles
  const [enableEmail, setEnableEmail] = useState(true)
  const [enableCompany, setEnableCompany] = useState(true)
  const [enableCity, setEnableCity] = useState(false)

  // Custom questions
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([])

  // WhatsApp & Staff Routing
  const [whatsappNumber, setWhatsappNumber] = useState('919745334644')
  const [whatsappDefaultMessage, setWhatsappDefaultMessage] = useState('Hi IWILLMEDIA, I just submitted an inquiry on your Meta ad form.')
  const [assignedStaffId, setAssignedStaffId] = useState<string>('')
  const [formSaveError, setFormSaveError] = useState<string | null>(null)

  // 1. Fetch Forms List
  const { data: forms, isLoading } = useQuery({
    queryKey: ['lead-forms-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_forms')
        .select(`
          *,
          profiles:assigned_staff_id (
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: isOpen,
  })

  // 2. Fetch Active Staff for Routing
  const { data: staffList } = useQuery({
    queryKey: ['active-staff-for-lead-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, designation')
        .eq('active', true)
        .order('full_name')
      if (error) throw error
      return data
    },
    enabled: isOpen,
  })

  // Open Create Mode
  const handleOpenCreate = () => {
    setEditingFormId(null)
    setTitle('')
    setSlug('')
    setCoverImageUrl('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80')
    setGreetingHeadline('Scale Your Business With IWILLMEDIA')
    setGreetingDescription('Fill out this quick form and our team will get in touch with you shortly.')
    setBulletPoints([
      'Guaranteed ROI-driven marketing campaigns',
      'Full-stack design & development team',
      'Dedicated account manager & weekly reporting',
    ])
    setEnableEmail(true)
    setEnableCompany(true)
    setEnableCity(false)
    setCustomQuestions([
      {
        id: 'q_service',
        type: 'multiple_choice',
        title: 'What service are you looking for?',
        required: true,
        options: ['Meta & Google Ads Management', 'Custom Web & App Development', 'Complete Brand Identity & Social Media'],
      },
    ])
    setWhatsappNumber('919745334644')
    setWhatsappDefaultMessage('Hi IWILLMEDIA, I just submitted an inquiry on your Meta ad form.')
    setAssignedStaffId(staffList?.[0]?.id || '')
    setFormSaveError(null)
    setActiveTab('editor')
  }

  // Open Edit Mode
  const handleOpenEdit = (form: any) => {
    setEditingFormId(form.id)
    setTitle(form.title || '')
    setSlug(form.slug || '')
    setCoverImageUrl(form.cover_image_url || '')
    setGreetingHeadline(form.greeting_headline || '')
    setGreetingDescription(form.greeting_description || '')
    setBulletPoints(Array.isArray(form.bullet_points) ? form.bullet_points : [])
    setEnableEmail(form.enabled_fields?.email !== false)
    setEnableCompany(Boolean(form.enabled_fields?.company_name))
    setEnableCity(Boolean(form.enabled_fields?.city))
    setCustomQuestions(Array.isArray(form.custom_questions) ? form.custom_questions : [])
    setWhatsappNumber(form.whatsapp_number || '919745334644')
    setWhatsappDefaultMessage(form.whatsapp_default_message || '')
    setAssignedStaffId(form.assigned_staff_id || '')
    setFormSaveError(null)
    setActiveTab('editor')
  }

  // Auto generate slug from title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (!editingFormId) {
      const generatedSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      setSlug(generatedSlug)
    }
  }

  // Add Bullet Point
  const handleAddBullet = () => {
    if (newBullet.trim()) {
      setBulletPoints((prev) => [...prev, newBullet.trim()])
      setNewBullet('')
    }
  }

  const handleRemoveBullet = (index: number) => {
    setBulletPoints((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Add Custom Question
  const handleAddQuestion = (type: 'multiple_choice' | 'short_answer') => {
    const newQ: CustomQuestion = {
      id: `q_${Date.now()}`,
      type,
      title: type === 'multiple_choice' ? 'Select an option' : 'Brief project notes',
      required: false,
      options: type === 'multiple_choice' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    }
    setCustomQuestions((prev) => [...prev, newQ])
  }

  const handleUpdateQuestionTitle = (qId: string, title: string) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, title } : q))
    )
  }

  const handleToggleQuestionRequired = (qId: string) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, required: !q.required } : q))
    )
  }

  const handleRemoveQuestion = (qId: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== qId))
  }

  const handleAddQuestionOption = (qId: string) => {
    setCustomQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId && q.options) {
          return { ...q, options: [...q.options, `Option ${q.options.length + 1}`] }
        }
        return q
      })
    )
  }

  const handleUpdateQuestionOption = (qId: string, optIdx: number, val: string) => {
    setCustomQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId && q.options) {
          const newOpts = [...q.options]
          newOpts[optIdx] = val
          return { ...q, options: newOpts }
        }
        return q
      })
    )
  }

  const handleRemoveQuestionOption = (qId: string, optIdx: number) => {
    setCustomQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId && q.options) {
          return { ...q, options: q.options.filter((_, idx) => idx !== optIdx) }
        }
        return q
      })
    )
  }

  // Toggle Active Status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ formId, currentStatus }: { formId: string; currentStatus: boolean }) => {
      const { error } = await supabase
        .from('lead_forms')
        .update({ is_active: !currentStatus })
        .eq('id', formId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-forms-list'] })
    },
  })

  // Save Form Mutation
  const saveFormMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Form title is required.')
      if (!slug.trim()) throw new Error('URL slug is required.')

      const payload = {
        title: title.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        cover_image_url: coverImageUrl.trim() || null,
        greeting_headline: greetingHeadline.trim(),
        greeting_description: greetingDescription.trim() || null,
        bullet_points: bulletPoints,
        enabled_fields: {
          email: enableEmail,
          company_name: enableCompany,
          city: enableCity,
        },
        custom_questions: customQuestions,
        whatsapp_number: whatsappNumber.trim(),
        whatsapp_default_message: whatsappDefaultMessage.trim(),
        assigned_staff_id: assignedStaffId || null,
        updated_at: new Date().toISOString(),
      }

      if (editingFormId) {
        const { error } = await supabase
          .from('lead_forms')
          .update(payload)
          .eq('id', editingFormId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('lead_forms').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-forms-list'] })
      setActiveTab('list')
    },
    onError: (err: any) => {
      setFormSaveError(err.message || 'Failed to save form. Check if the URL slug is already taken.')
    },
  })

  // Copy Full Public Link
  const handleCopyLink = (formSlug: string, formId: string) => {
    const fullUrl = `${window.location.origin}/f/${formSlug}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(formId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meta Lead Ads Instant Forms"
      description="Create and manage mobile-native lead capture forms with automatic staff routing and instant WhatsApp connect."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Campaign Forms ({forms?.length || 0})
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'editor' && !editingFormId
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Create Form
            </button>
          </div>

          {activeTab === 'list' && (
            <Button size="sm" onClick={handleOpenCreate} className="shadow-xs bg-[#0866FF] hover:bg-[#0759D9]">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>New Form</span>
            </Button>
          )}
        </div>

        {/* ─── TAB 1: LIST VIEW ────────────────────────────────────────────── */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading campaign forms...</div>
            ) : !forms || forms.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">No Meta Forms Created Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Create your first Meta Ads Instant Form link to start capturing qualified leads directly into your CRM.
                </p>
                <Button size="sm" onClick={handleOpenCreate} className="bg-[#0866FF] hover:bg-[#0759D9]">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Create Your First Form</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                {forms.map((form: any) => {
                  const fullUrl = `${window.location.origin}/f/${form.slug}`

                  return (
                    <div
                      key={form.id}
                      className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{form.title}</h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              form.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {form.is_active ? 'Active' : 'Paused'}
                          </span>
                        </div>

                        {/* URL Pill */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 truncate max-w-xs">
                            /f/{form.slug}
                          </span>
                        </div>

                        {/* Staff Routing & WhatsApp Info */}
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap pt-0.5">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Auto-assigned: {form.profiles?.full_name || 'Unassigned'}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                            <span>+{form.whatsapp_number}</span>
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {/* Copy Link Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(form.slug, form.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copy Public Link for Meta Ads"
                        >
                          {copiedId === form.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        {/* QR Code Button */}
                        <button
                          type="button"
                          onClick={() => setQrCodeModalUrl(fullUrl)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                          title="View Mobile QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* Open in New Tab */}
                        <a
                          href={`/f/${form.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Preview Form"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(form)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-brand-600 transition-colors cursor-pointer"
                          title="Edit Form"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Toggle Active/Paused */}
                        <button
                          type="button"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              formId: form.id,
                              currentStatus: form.is_active,
                            })
                          }
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border transition-colors cursor-pointer ${
                            form.is_active
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {form.is_active ? 'Pause' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: EDITOR / CREATOR VIEW ───────────────────────────────── */}
        {activeTab === 'editor' && (
          <div className="space-y-5 max-h-[68vh] overflow-y-auto pr-1">
            {formSaveError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formSaveError}
              </div>
            )}

            {/* Basic Info */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Campaign & URL
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Campaign Form Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dubai Real Estate Meta Ads"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0866FF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Public URL Slug *
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-500 text-xs font-mono">
                      /f/
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="dubai-real-estate"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      className="w-full px-3 py-2 rounded-r-lg border border-slate-300 text-xs bg-white text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-[#0866FF]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Creative & Intro Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Greeting & Cover Creative
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Cover Banner Image URL (16:9 ratio)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0866FF]"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80')}
                      className="text-[10px] text-slate-500 hover:text-[#0866FF] underline"
                    >
                      Use Agency Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl('https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80')}
                      className="text-[10px] text-slate-500 hover:text-[#0866FF] underline"
                    >
                      Use Growth Marketing Preset
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Greeting Headline
                  </label>
                  <input
                    type="text"
                    value={greetingHeadline}
                    onChange={(e) => setGreetingHeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0866FF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Description / Offer Pitch
                  </label>
                  <textarea
                    rows={2}
                    value={greetingDescription}
                    onChange={(e) => setGreetingDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0866FF]"
                  />
                </div>

                {/* Bullet Points Builder */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Value Proposition Bullet Points
                  </label>
                  <div className="space-y-1.5">
                    {bulletPoints.map((bp, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-[#0866FF]">✓</span>
                        <span className="text-xs text-slate-800 flex-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                          {bp}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBullet(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add another selling point..."
                      value={newBullet}
                      onChange={(e) => setNewBullet(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddBullet()
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={handleAddBullet}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Standard Contact Fields & Dynamic Questions */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Contact Fields & Custom Questions
              </h4>

              {/* Standard Fields Toggle */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Standard Contact Fields
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs font-medium text-slate-800 opacity-80">
                    <span>Full Name</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Required</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs font-medium text-slate-800 opacity-80">
                    <span>Phone Number</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Required</span>
                  </div>
                  <label className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs font-medium text-slate-800 cursor-pointer hover:border-slate-300">
                    <span>Email Address</span>
                    <input
                      type="checkbox"
                      checked={enableEmail}
                      onChange={(e) => setEnableEmail(e.target.checked)}
                      className="rounded text-[#0866FF]"
                    />
                  </label>
                  <label className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs font-medium text-slate-800 cursor-pointer hover:border-slate-300">
                    <span>Company Name</span>
                    <input
                      type="checkbox"
                      checked={enableCompany}
                      onChange={(e) => setEnableCompany(e.target.checked)}
                      className="rounded text-[#0866FF]"
                    />
                  </label>
                  <label className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs font-medium text-slate-800 cursor-pointer hover:border-slate-300">
                    <span>City / Location</span>
                    <input
                      type="checkbox"
                      checked={enableCity}
                      onChange={(e) => setEnableCity(e.target.checked)}
                      className="rounded text-[#0866FF]"
                    />
                  </label>
                </div>
              </div>

              {/* Custom Questions Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Custom Questions ({customQuestions.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('multiple_choice')}
                      className="text-[11px] font-semibold text-[#0866FF] hover:underline cursor-pointer"
                    >
                      + Multiple Choice
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('short_answer')}
                      className="text-[11px] font-semibold text-[#0866FF] hover:underline cursor-pointer"
                    >
                      + Short Answer
                    </button>
                  </div>
                </div>

                {customQuestions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                          {q.type === 'multiple_choice' ? 'Multiple Choice' : 'Short Text'}
                        </span>
                        <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={() => handleToggleQuestionRequired(q.id)}
                            className="rounded text-[#0866FF]"
                          />
                          <span>Required</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Question title (e.g. What is your estimated monthly budget?)"
                        value={q.title}
                        onChange={(e) => handleUpdateQuestionTitle(q.id, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900"
                      />
                    </div>

                    {/* Options for Multiple Choice */}
                    {q.type === 'multiple_choice' && (
                      <div className="space-y-1.5 pl-2 border-l-2 border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Options
                        </span>
                        {(q.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full border border-slate-300 shrink-0" />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) =>
                                handleUpdateQuestionOption(q.id, optIdx, e.target.value)
                              }
                              className="flex-1 px-2.5 py-1 rounded-md border border-slate-200 text-xs text-slate-700 bg-slate-50/50"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionOption(q.id, optIdx)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddQuestionOption(q.id)}
                          className="text-[11px] text-[#0866FF] font-medium hover:underline pt-1 block cursor-pointer"
                        >
                          + Add Option
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Automated Staff Routing & WhatsApp Connection */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                4. Automated Routing & WhatsApp Connect
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Auto-Assign Inquiries To
                  </label>
                  <select
                    value={assignedStaffId}
                    onChange={(e) => setAssignedStaffId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0866FF]"
                  >
                    <option value="">Unassigned (General Pool)</option>
                    {staffList?.map((staff: any) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name} ({staff.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Staff member receives an instant chime alert & notification on every submission.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    WhatsApp Business Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="919876543210 (Country code + number)"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0866FF]"
                  />
                  <p className="text-[10px] text-slate-400">
                    Include country code without '+' (e.g. 919745334644 for India).
                  </p>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Default WhatsApp Message
                </label>
                <input
                  type="text"
                  placeholder="Hi IWILLMEDIA, I just submitted the consultation form on Meta."
                  value={whatsappDefaultMessage}
                  onChange={(e) => setWhatsappDefaultMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0866FF]"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setActiveTab('list')}>
                Cancel
              </Button>

              <Button
                type="button"
                disabled={saveFormMutation.isPending}
                onClick={() => saveFormMutation.mutate()}
                className="bg-[#0866FF] hover:bg-[#0759D9]"
              >
                {saveFormMutation.isPending ? 'Saving Form...' : editingFormId ? 'Update Form' : 'Publish Meta Form'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Mobile QR Code Modal ────────────────────────────────────────── */}
      {qrCodeModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Scan on Mobile</h4>
              <button
                type="button"
                onClick={() => setQrCodeModalUrl(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  qrCodeModalUrl
                )}`}
                alt="Form QR Code"
                className="w-44 h-44 mx-auto rounded-lg shadow-xs"
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Scan with your smartphone camera to test the exact Meta Instant Form mobile experience.
            </p>

            <button
              type="button"
              onClick={() => setQrCodeModalUrl(null)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
