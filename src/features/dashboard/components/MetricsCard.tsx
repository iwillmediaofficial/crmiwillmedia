import React from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export interface MetricsCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ElementType
  iconColor?: string
  trend?: string
  onClick?: () => void
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-brand-600 bg-brand-50 border-brand-200/80',
  trend,
  onClick,
}) => {
  return (
    <Card
      hoverEffect={!!onClick}
      onClick={onClick}
      className={cn('p-5 flex flex-col justify-between', onClick && 'cursor-pointer')}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
            {value}
          </p>
        </div>
        <div className={cn('p-2.5 rounded-xl border flex items-center justify-center shrink-0', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && <span className="font-semibold text-brand-600">{trend}</span>}
        </div>
      )}
    </Card>
  )
}
