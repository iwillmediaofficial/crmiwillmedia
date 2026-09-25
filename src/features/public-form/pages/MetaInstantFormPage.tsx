import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  X,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Loader2,
  MessageCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Curated list of top international calling codes
const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
]

export const MetaInstantFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()

  const [formConfig, setFormConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Form State
  const [fullName, setFullName] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [city, setCity] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // UI Flow State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completionData, setCompletionData] = useState<any>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  // 1. Fetch form configuration from Supabase
  useEffect(() => {
    async function loadForm() {
      if (!slug) {
        setLoadError('Form link is missing a valid identifier.')
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('lead_forms')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        if (error || !data) {
          setLoadError('This inquiry form is no longer active or the link has expired.')
        } else {
          setFormConfig(data)
          // Set page title
          document.title = `${data.title} | IWILLMEDIA`
        }
      } catch (err: any) {
        setLoadError('Unable to load form. Please check your internet connection.')
      } finally {
        setIsLoading(false)
      }
    }

    loadForm()
  }, [slug])

  // Parse UTM parameters from URL
  const getUtmData = () => {
    const utmKeys = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ad_id',
      'adset_id',
      'campaign_id',
      'fbclid',
    ]
    const utmData: Record<string, string> = {}
    utmKeys.forEach((key) => {
      const val = searchParams.get(key)
      if (val) utmData[key] = val
    })
    return utmData
  }

  // Handle Question Answer Selection
  const handleSelectOption = (questionTitle: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionTitle]: option,
    }))
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Basic Validation
    if (!fullName.trim()) {
      setSubmitError('Please enter your full name.')
      return
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
    if (cleanPhone.length < 7) {
      setSubmitError('Please enter a valid phone number.')
      return
    }

    // Check required custom questions
    if (formConfig.custom_questions && Array.isArray(formConfig.custom_questions)) {
      for (const q of formConfig.custom_questions) {
        if (q.required && (!answers[q.title] || !answers[q.title].trim())) {
          setSubmitError(`Please answer: "${q.title}"`)
          return
        }
      }
    }

    setIsSubmitting(true)

    try {
      const fullPhone = `${countryCode} ${cleanPhone}`
      const utmData = getUtmData()

      const { data, error } = await supabase.rpc('submit_public_lead', {
        p_slug: slug,
        p_name: fullName.trim(),
        p_phone: fullPhone,
        p_email: email.trim() || null,
        p_company_name: companyName.trim() || null,
        p_city: city.trim() || null,
        p_answers: answers,
        p_utm_data: utmData,
      })

      if (error) {
        throw error
      }

      setCompletionData(data)
      setIsCompleted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      console.error('Submission error:', err)
      setSubmitError(err.message || 'Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate WhatsApp Link
  const getWhatsAppUrl = () => {
    if (!formConfig) return '#'
    const rawNumber = (formConfig.whatsapp_number || '919745334644').replace(/[^0-9]/g, '')
    const defaultMsg =
      formConfig.whatsapp_default_message ||
      `Hi IWILLMEDIA, I just submitted an inquiry for ${formConfig.title}.`
    return `https://wa.me/${rawNumber}?text=${encodeURIComponent(defaultMsg)}`
  }

  // ─── Loading Screen ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-[#0866FF] animate-spin mb-4" />
        <p className="text-white text-sm font-medium tracking-wide">Loading Instant Form...</p>
      </div>
    )
  }

  // ─── Error Screen ──────────────────────────────────────────────────────────
  if (loadError || !formConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <X className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Form Unavailable</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            {loadError || 'This form is no longer accepting inquiries.'}
          </p>
          <a
            href="https://iwillmedia.com"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
          >
            Visit IWILLMEDIA Website
          </a>
        </div>
      </div>
    )
  }

  const enabledFields = formConfig.enabled_fields || {}
  const customQuestions = formConfig.custom_questions || []
  const bulletPoints = formConfig.bullet_points || []

  return (
    <div className="min-h-screen bg-slate-100 sm:py-6 flex justify-center">
      {/* Container: 100% on Mobile, 440px Centered on Desktop (Meta Mobile Emulation) */}
      <div className="w-full sm:max-w-[440px] bg-white sm:rounded-3xl shadow-xl flex flex-col min-h-screen sm:min-h-0 sm:border sm:border-slate-200/90 overflow-hidden relative">
        {/* Top App Bar — Native Meta Lead Ad Navigation */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="p-1 rounded-full text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close Form"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">
              {isCompleted ? 'Completed' : 'Instant Form'}
            </span>
          </div>

          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
            IW
          </div>
        </div>

        {/* ─── SUCCESS / THANK YOU VIEW ────────────────────────────────────── */}
        {isCompleted ? (
          <div className="p-6 flex-1 flex flex-col justify-between text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-6 pt-8">
              {/* Animated Success Checkmark */}
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {completionData?.thank_you_headline || 'Thanks, you are all set!'}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {completionData?.thank_you_description ||
                    'We have received your inquiry. Connect with our growth strategists directly on WhatsApp for immediate priority consultation.'}
                </p>
              </div>

              {/* Direct WhatsApp Call to Action Button */}
              <div className="pt-4 space-y-3">
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>{completionData?.cta_label || 'Chat with us on WhatsApp'}</span>
                </a>

                {completionData?.cta_url && completionData.cta_url !== '#' && (
                  <a
                    href={completionData.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium py-2 transition-colors"
                  >
                    <span>Visit Official Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="pt-10 pb-4 text-center">
              <p className="text-[11px] text-slate-400">
                Powered by IWILLMEDIA Digital Growth Engine
              </p>
            </div>
          </div>
        ) : (
          /* ─── ACTIVE FORM FILL VIEW ─────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
            <div className="pb-28">
              {/* 16:9 Cover Banner Image */}
              {formConfig.cover_image_url ? (
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img
                    src={formConfig.cover_image_url}
                    alt={formConfig.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
              ) : (
                <div className="aspect-video w-full bg-gradient-to-br from-[#0866FF] to-violet-800 flex items-center justify-center p-6 text-white text-center">
                  <Sparkles className="w-10 h-10 opacity-70 mb-2" />
                </div>
              )}

              {/* Brand Pill & Heading Section */}
              <div className="p-5 border-b border-slate-100 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    IW
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900">IWILLMEDIA Agency</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">• Sponsored</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                    {formConfig.greeting_headline || formConfig.title}
                  </h1>
                  {formConfig.greeting_description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {formConfig.greeting_description}
                    </p>
                  )}
                </div>

                {/* Value Proposition Bullet Points */}
                {bulletPoints.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {bulletPoints.map((point: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-[#0866FF] shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ─── Contact Information Section ───────────────────────────── */}
              <div className="p-5 space-y-4">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900">Contact Information</h2>
                  <p className="text-[11px] text-slate-500">
                    We'll use your information to contact you about our services.
                  </p>
                </div>

                {/* Error Banner */}
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                    {submitError}
                  </div>
                )}

                <div className="space-y-3.5">
                  {/* Full Name (Always Required) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF] transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Number (Always Required with Country Picker) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                      Phone Number *
                    </label>
                    <div className="flex gap-2">
                      {/* Country Code Select */}
                      <div className="relative shrink-0">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="h-full pl-3 pr-7 py-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50 appearance-none focus:outline-none focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF] transition-all cursor-pointer"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={`${c.name}-${c.code}`} value={c.code}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Phone Input */}
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          placeholder="98765 43210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email Address (Optional Toggle) */}
                  {enabledFields.email !== false && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF] transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Company Name (Optional Toggle) */}
                  {enabledFields.company_name && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                        Company / Brand Name
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Acme Corp"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF] transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* City / Location (Optional Toggle) */}
                  {enabledFields.city && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                        City / Location
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Kochi, Kerala"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF] transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Custom Questions (Multiple Choice & Short Answer) ────────── */}
              {customQuestions.length > 0 && (
                <div className="p-5 border-t border-slate-100 space-y-5">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-bold text-slate-900">Custom Questions</h2>
                    <p className="text-[11px] text-slate-500">
                      Help us understand your specific project requirements.
                    </p>
                  </div>

                  {customQuestions.map((q: any, qIdx: number) => {
                    const isAnswered = Boolean(answers[q.title])

                    return (
                      <div key={q.id || qIdx} className="space-y-2">
                        <label className="text-xs font-semibold text-slate-800 block">
                          {q.title} {q.required && <span className="text-[#0866FF]">*</span>}
                        </label>

                        {/* Multiple Choice Options */}
                        {q.type === 'multiple_choice' && q.options && (
                          <div className="space-y-2">
                            {q.options.map((opt: string, optIdx: number) => {
                              const isSelected = answers[q.title] === opt
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectOption(q.title, opt)}
                                  className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? 'border-[#0866FF] bg-[#F0F5FF] text-[#0866FF] shadow-xs'
                                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'border-[#0866FF] bg-[#0866FF]'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Short Answer Text Input */}
                        {q.type === 'short_answer' && (
                          <input
                            type="text"
                            placeholder="Type your response..."
                            value={answers[q.title] || ''}
                            onChange={(e) => handleSelectOption(q.title, e.target.value)}
                            className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF] transition-all"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Privacy Notice */}
              <div className="p-5 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  By tapping Submit, you agree to share your information with IWILLMEDIA who agrees to use
                  it according to their{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-[#0866FF] underline font-medium hover:text-[#0654d2] cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  . Meta will also use it subject to their Data Policy.
                </p>
              </div>
            </div>

            {/* Sticky Bottom Action Bar — Native Meta Blue Button */}
            <div className="fixed sm:absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 z-20 shadow-lg">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0866FF] hover:bg-[#0759D9] active:scale-[0.99] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <span>Submit Inquiry</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── Exit Confirmation Dialog ────────────────────────────────────── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base">Close form?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              If you close this form now, your information won't be saved and you will leave this page.
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-2.5 rounded-xl bg-[#0866FF] text-white font-semibold text-xs hover:bg-[#0759D9] transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Privacy Policy Modal ────────────────────────────────────────── */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Privacy Policy</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>IWILLMEDIA Digital Agency</strong> is committed to safeguarding your personal
                information.
              </p>
              <p>
                Information collected via this form (such as your Name, Phone Number, and Project Goals)
                is used exclusively to evaluate your inquiry, provide consultation services, and tailor
                communication.
              </p>
              <p>
                We do not sell, rent, or distribute your personal data to unauthorized third parties. You
                may request data deletion at any time by contacting our support team.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
