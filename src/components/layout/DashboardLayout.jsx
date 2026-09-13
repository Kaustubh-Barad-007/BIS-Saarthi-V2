import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import Sidebar from './Sidebar'

export default function DashboardLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const location = useLocation()
  const mainRef  = useRef(null)

  // Ensure dashboard page always starts from top when changing routes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [location.pathname])

  const isChatRoute = location.pathname.endsWith('/chat')

  return (
    <div className="flex-1 flex h-full w-full bg-slate-50 dark:bg-dark-bg overflow-hidden">
      {/* Desktop Sidebar: stays locked in view while scrolling content */}
      <div className="hidden md:flex h-full shrink-0 select-none z-20">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <Sidebar mobile onClose={() => setMobileSidebarOpen(false)} />
        </>
      )}

      {/* Main content: only this pane scrolls up and down */}
      <main ref={mainRef} className="flex-1 flex flex-col overflow-y-auto min-w-0">
        {/* Mobile header bar */}
        <div className="md:hidden flex items-center justify-between px-3 py-2 bg-white dark:bg-dark-bg-card border-b border-gray-200 dark:border-dark-border shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-dark-text-muted" />
            </button>
            <span className="text-sm font-semibold text-bis-navy dark:text-blue-300">BIS Portal</span>
          </div>
        </div>

        <div className={cn('flex-1', isChatRoute ? 'p-1 sm:p-6 flex flex-col min-h-0' : 'p-4 sm:p-6')}>
          {children}
        </div>
      </main>
    </div>
  )
}
