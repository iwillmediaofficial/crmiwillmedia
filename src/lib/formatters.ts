import { format, parseISO, isValid } from 'date-fns'

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const num = Number(amount) || 0
  switch (currency.toUpperCase()) {
    case 'INR':
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(num)
    case 'AED':
      return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
        maximumFractionDigits: 2,
      }).format(num)
    case 'USD':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(num)
    default:
      return `${currency} ${num.toLocaleString()}`
  }
}

export function formatDate(date: string | Date | null | undefined, formatStr: string = 'MMM dd, yyyy'): string {
  if (!date) return '—'
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return '—'
  return format(parsed, formatStr)
}

export function formatTimeSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  }
  return `${pad(mins)}:${pad(secs)}`
}
