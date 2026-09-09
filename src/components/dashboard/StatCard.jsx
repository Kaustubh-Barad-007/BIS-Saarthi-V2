import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLOR_MAP = {
  blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  green:  'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  red:    'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  navy:   'bg-bis-light-bg dark:bg-dark-bg-secondary text-bis-navy dark:text-blue-300 border-bis-navy/20 dark:border-dark-border',
}

const ICON_BG = {
  blue:   'bg-blue-100 dark:bg-blue-900/40',
  green:  'bg-green-100 dark:bg-green-900/40',
  orange: 'bg-orange-100 dark:bg-orange-900/40',
  red:    'bg-red-100 dark:bg-red-900/40',
  purple: 'bg-purple-100 dark:bg-purple-900/40',
  navy:   'bg-bis-navy/10 dark:bg-blue-900/40',
}

export default function StatCard({ label, value, delta, icon: Icon, color = 'blue', suffix = '', loading = false }) {
  const isPositive = delta?.startsWith('+')
  const isNegative = delta?.startsWith('-')

  if (loading) {
    return (
      <div className="card-gov p-5 border animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="skeleton w-20 h-4 rounded" />
          <div className="skeleton w-10 h-10 rounded-full" />
        </div>
        <div className="skeleton w-24 h-8 rounded mb-1" />
        <div className="skeleton w-16 h-3 rounded" />
      </div>
    )
  }

  return (
    <div className={cn('card-gov p-5 border', COLOR_MAP[color])}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</span>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', ICON_BG[color])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-bold font-heading">
        {value}{suffix && <span className="text-sm font-normal ml-1 opacity-70">{suffix}</span>}
      </div>
      {delta && (
        <div className={cn('flex items-center gap-1 mt-1.5 text-xs font-medium',
          isPositive ? 'text-green-600 dark:text-green-400' :
          isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-dark-text-muted'
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> :
           isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          <span>{delta} from last month</span>
        </div>
      )}
    </div>
  )
}
