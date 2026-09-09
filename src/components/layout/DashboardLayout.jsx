import React, { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, Home } from 'lucide-react'
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
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-dark-bg-card border-b border-gray-200 dark:border-dark-border shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-dark-text-muted" />
            </button>
            <span className="text-sm font-semibold text-bis-navy dark:text-blue-300">BIS Portal Navigation</span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-bis-navy dark:text-blue-300 bg-slate-100 dark:bg-dark-bg-secondary hover:bg-slate-200 dark:hover:bg-dark-bg px-2.5 py-1.5 rounded-gov transition-colors shadow-xs"
            title="Return to Home"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>

        <div className="flex-1 p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
