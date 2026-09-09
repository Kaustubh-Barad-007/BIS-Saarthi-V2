import React, { useEffect, useState } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import TopBar  from '@/components/layout/TopBar'
import Header  from '@/components/layout/Header'
import Footer  from '@/components/layout/Footer'
import AppRouter from '@/router'
import useAuthStore from '@/store/authStore'
import useThemeStore from '@/store/themeStore'
import { PageLoader } from '@/components/common/LoadingSpinner'
import ScrollToTop from '@/components/common/ScrollToTop'
import { cn } from '@/lib/utils'

function AppContent() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()

  // Remove footer for AI assistant pages, and inside dashboard routes
  const isChatPage = location.pathname.endsWith('/chat')
  const isDashboardRoute = ['/consumer', '/manufacturer', '/admin', '/settings'].some((prefix) =>
    location.pathname.startsWith(prefix)
  )

  // Header is ALWAYS shown on homepage and public pages (whether logged in or not)
  // On dashboard pages after login: remove top header, keep only sidebar
  const showHeader = !isDashboardRoute
  const showFooter = !isDashboardRoute && !isChatPage

  return (
    <div className={cn(
      "flex flex-col bg-slate-50 dark:bg-dark-bg transition-colors duration-300 text-gray-900 dark:text-dark-text",
      isDashboardRoute ? "h-screen overflow-hidden" : "min-h-screen"
    )}>
      {/* Ensure route transitions always start from the top */}
      <ScrollToTop />

      {/* Government Topbar */}
      <div className="shrink-0">
        <TopBar theme={theme} toggleTheme={toggleTheme} />
      </div>

      {/* Header — Public pages only, removed after login */}
      {showHeader && (
        <div className="shrink-0">
          <Header theme={theme} />
        </div>
      )}

      {/* Main Content */}
      <main className={cn("flex-1 flex flex-col min-w-0", isDashboardRoute && "overflow-hidden")} id="main-content">
        <AppRouter />
      </main>

      {/* Footer — Small, compact, removed for AI assistant & after login */}
      {showFooter && <Footer />}

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        richColors
        theme={theme === 'dark' ? 'dark' : 'light'}
        toastOptions={{
          style: {
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
    </div>
  )
}

export default function App() {
  const { fetchMe } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetchMe().finally(() => setReady(true))
  }, [])

  if (!ready) return <PageLoader text="Initializing BIS Saarthi..." />

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
