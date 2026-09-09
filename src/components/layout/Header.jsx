import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, MessageSquare, LogIn, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import useAuthStore from '@/store/authStore'
import { ROUTES } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'

export default function Header() {
  const navigate = useNavigate()
  const location  = useLocation()
  const { user, logout } = useAuthStore()
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sectionLinks = [
    { label: t('about_bis', 'About BIS'),       target: 'about'        },
    { label: t('role_portals', 'Role Portals'), target: 'roles'        },
    { label: t('how_it_works', 'How It Works'), target: 'how-it-works' },
    { label: t('key_features', 'Key Features'), target: 'features'     },
  ]

  // Remove header inside dashboard pages after login to keep only sidebar.
  // On homepage and public pages, Header is ALWAYS visible!
  const isDashboardRoute = ['/consumer', '/manufacturer', '/admin'].some((prefix) =>
    location.pathname.startsWith(prefix)
  )
  if (isDashboardRoute) {
    return null
  }

  const handleSectionClick = (e, target) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate(`/#${target}`)
      setTimeout(() => {
        const el = document.getElementById(target)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    } else {
      const el = document.getElementById(target)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-dark-bg-card border-b border-gray-200 dark:border-dark-border shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-[70px]">

          {/* ── Logo & Official Branding ── */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-white border border-gray-200 dark:border-dark-border flex items-center justify-center shadow-sm shrink-0 p-1">
              <img src="/bis-logo.svg" alt="BIS Emblem" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 tracking-wide uppercase hidden sm:block">
                {t('bis_title_native', 'भारतीय मानक ब्यूरो')}
              </div>
              <div className="text-base font-bold text-bis-navy dark:text-blue-300 font-heading">
                {t('bis_title_en', 'Bureau of Indian Standards')}
              </div>
              <div className="text-xs text-gray-500 dark:text-dark-text-muted tracking-wider uppercase hidden md:block">
                {t('bis_sub', 'BIS Saarthi AI Portal')}
              </div>
            </div>
          </Link>

          {/* ── Desktop Nav: Only consists of About BIS & homepage section anchors ── */}
          <nav className="hidden lg:flex items-center gap-1">
            {sectionLinks.map((item) => (
              <a
                key={item.target}
                href={`#${item.target}`}
                onClick={(e) => handleSectionClick(e, item.target)}
                className={cn(
                  'px-3.5 py-2 text-sm font-medium rounded-gov transition-colors cursor-pointer',
                  'text-gray-700 dark:text-dark-text hover:text-bis-navy dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-dark-bg-secondary'
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* ── Right Actions: Fast Direct Entry or Open Assistant if logged in ── */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link
                  to={
                    user.role === 'consumer' ? ROUTES.CONSUMER_CHAT :
                    user.role === 'manufacturer' ? ROUTES.MANUFACTURER_CHAT :
                    ROUTES.ADMIN_DASHBOARD
                  }
                  className="btn-gov text-xs sm:text-sm py-2 px-3.5 inline-flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('open_assistant', 'Open AI Assistant')}</span>
                </Link>

                <button
                  onClick={async () => {
                    await logout()
                    toast.success('Signed out successfully')
                    navigate(ROUTES.HOME)
                  }}
                  className="btn-gov-outline text-xs sm:text-sm py-2 px-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 inline-flex items-center gap-1.5"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('sign_out', 'Sign Out')}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="btn-gov text-xs sm:text-sm py-2 px-3.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('sign_in', 'Sign In')}</span>
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-gov text-gray-600 dark:text-dark-text-muted hover:bg-slate-100 dark:hover:bg-dark-bg-secondary transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Navigation ── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-card animate-slide-up">
          <nav className="px-4 py-3 space-y-1">
            {sectionLinks.map((item) => (
              <a
                key={item.target}
                href={`#${item.target}`}
                onClick={(e) => handleSectionClick(e, item.target)}
                className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-bg-secondary rounded-gov transition-colors"
              >
                {item.label}
              </a>
            ))}
            {user ? (
              <div className="pt-3 border-t border-gray-100 dark:border-dark-border flex gap-2">
                <Link
                  to={
                    user.role === 'consumer' ? ROUTES.CONSUMER_CHAT :
                    user.role === 'manufacturer' ? ROUTES.MANUFACTURER_CHAT :
                    ROUTES.ADMIN_DASHBOARD
                  }
                  onClick={() => setMobileOpen(false)}
                  className="btn-gov flex-1 text-center py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t('open_assistant', 'Open AI Assistant')}</span>
                </Link>
                <button
                  onClick={async () => {
                    setMobileOpen(false)
                    await logout()
                    toast.success('Signed out successfully')
                    navigate(ROUTES.HOME)
                  }}
                  className="btn-gov-outline text-xs py-2 px-3 text-red-600 dark:text-red-400"
                >
                  {t('sign_out', 'Sign Out')}
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-100 dark:border-dark-border">
                <Link to={ROUTES.LOGIN} onClick={() => setMobileOpen(false)} className="btn-gov w-full text-center py-2 text-xs flex items-center justify-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('sign_in', 'Sign In')}</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
