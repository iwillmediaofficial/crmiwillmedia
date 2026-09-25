import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (values: ForgotFormValues) => {
    setErrorMessage(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setIsSubmitted(true)
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to send password reset email. Please try again.')
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Check your inbox</h3>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          We have dispatched a password reset link to your email address. Follow the instructions to reset your password.
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full">
            Back to Sign In
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to login</span>
        </Link>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reset password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your registered email address to receive recovery instructions.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Registered Email"
          type="email"
          placeholder="name@iwillmedia.com"
          autoComplete="email"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="pt-2">
          <Button type="submit" className="w-full py-2.5" isLoading={isSubmitting}>
            Send Reset Link
          </Button>
        </div>
      </form>
    </div>
  )
}
