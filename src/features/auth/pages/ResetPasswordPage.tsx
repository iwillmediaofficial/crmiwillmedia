import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetFormValues = z.infer<typeof resetSchema>

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (values: ResetFormValues) => {
    setErrorMessage(null)
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })
      if (error) throw error
      setIsSuccess(true)
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2500)
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to update password. Please try again.')
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Password Updated!</h3>
        <p className="text-xs text-slate-500 mt-2">
          Your password has been changed successfully. Redirecting to sign in...
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create new password</h2>
        <p className="text-xs text-slate-500 mt-1">Choose a strong password for your account.</p>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          icon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          icon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="pt-2">
          <Button type="submit" className="w-full py-2.5" isLoading={isSubmitting}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  )
}
