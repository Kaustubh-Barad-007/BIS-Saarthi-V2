import React from 'react'
import { cn } from '@/lib/utils'

export default function LoadingSpinner({ size = 'md', className, text }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full border-bis-navy/20 border-t-bis-navy dark:border-blue-500/20 dark:border-t-blue-500 animate-spin',
          sizes[size]
        )}
        style={{ borderWidth: size === 'sm' ? '2px' : size === 'md' ? '3px' : '4px' }}
      />
      {text && (
        <p className="text-sm text-gray-500 dark:text-dark-text-muted animate-pulse">{text}</p>
      )}
    </div>
  )
}

export function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-dark-bg/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 dark:border-dark-border shadow-gov p-2 flex items-center justify-center">
          <img src="/bis-logo.svg" alt="BIS" className="w-full h-full object-contain" />
        </div>
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-gray-600 dark:text-dark-text-muted">{text}</p>
      </div>
    </div>
  )
}
