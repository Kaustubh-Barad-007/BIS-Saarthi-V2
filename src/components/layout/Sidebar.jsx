import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, BookOpen, Award, AlertTriangle,
  BadgeCheck, Map, FileText, Globe, Users, Database, ClipboardList,
  BarChart3, ChevronLeft, ChevronRight, X, LogOut, User, Sun, Moon, Settings,
  Bell, Radio, Megaphone
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, getRoleLabel } from '@/lib/utils'
import { SIDEBAR_NAV, ROUTES } from '@/lib/constants'
import useAuthStore from '@/store/authStore'
import useThemeStore from '@/store/themeStore'
import useDataStore from '@/store/dataStore'
import { useTranslation } from '@/lib/i18n'

const ICON_MAP = {
  LayoutDashboard, MessageSquare, BookOpen, Award, AlertTriangle,
  BadgeCheck, Map, FileText, Globe, Users, Database, ClipboardList,
  BarChart3, Bell, Radio, Megaphone,
}

export default function Sidebar({ mobile = false, onClose }) {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { getUnreadNotificationsCount } = useDataStore()
  const { t } = useTranslation()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  if (!user) return null
  const navItems = SIDEBAR_NAV[user.role] || []
  const unreadNotifs = getUnreadNotificationsCount(user.role, user.email)

  const roleDefaultRoute = user.role === 'consumer' ? ROUTES.CONSUMER_DASHBOARD :
    user.role === 'manufacturer' ? ROUTES.MANUFACTURER_DASHBOARD :
    ROUTES.ADMIN_DASHBOARD

  const handleLogout = () => {
    logout()
    toast.success(t('sign_out_success', 'Signed out successfully'))
    navigate(ROUTES.LOGIN)
    if (onClose) onClose()
  }

  const getNavLabel = (item) => {
    switch (item.label) {
      case 'Dashboard': return t('nav_dashboard', 'Dashboard')
      case 'BIS Saarthi AI': return t('nav_ai', 'BIS Saarthi AI')
      case 'Standards': return t('nav_standards', 'Standards')
      case 'Hallmarking': return t('nav_hallmarking', 'Hallmarking')
      case 'Complaints': return t('nav_complaints', 'Complaints')
      case 'Certifications': return t('nav_certifications', 'Certifications')
      case 'Compliance Roadmap': return t('nav_compliance', 'Compliance Roadmap')
      case 'Documents': return t('nav_documents', 'Documents')
      case 'Notifications': return t('nav_notifications', 'Notifications')
      case 'Broadcasts': return t('nav_broadcasts', 'Broadcast Alerts')
      case 'User Management': return t('nav_users', 'User Management')
      case 'Knowledge Base': return t('nav_knowledge', 'Knowledge Base')
      case 'Audit Log': return t('nav_audit', 'Audit Log')
      case 'Analytics': return t('nav_analytics', 'Analytics')
      default: return item.label
    }
  }

  const getPortalTitle = () => {
    if (user.role === 'consumer') return t('consumer_portal', 'Consumer Portal')
    if (user.role === 'manufacturer') return t('manufacturer_portal', 'MSME Portal')
    return t('admin_portal', 'BIS Official Portal')
  }

  return (
    <aside
      className={cn(
        'flex flex-col bg-white dark:bg-dark-bg-card border-r border-gray-200 dark:border-dark-border transition-all duration-300 h-full select-none',
        collapsed ? 'w-16' : 'w-64',
        mobile ? 'w-64 fixed top-0 left-0 h-full z-50 shadow-2xl' : 'relative'
      )}
    >
      {/* ── Brand & Portal Header ── */}
      <div className={cn(
        'flex items-center border-b border-gray-200 dark:border-dark-border p-3.5',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed ? (
          <Link
            to={roleDefaultRoute}
            onClick={mobile ? onClose : undefined}
            className="flex items-center gap-2.5 overflow-hidden group hover:opacity-85 transition-opacity"
            title={getPortalTitle()}
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 dark:border-dark-border flex items-center justify-center shrink-0 p-0.5 shadow-xs group-hover:scale-105 transition-transform">
              <img src="/bis-logo.svg" alt="BIS" className="w-full h-full object-contain" />
            </div>
            <div className="leading-none truncate">
              <div className="text-sm font-bold text-bis-navy dark:text-blue-300 tracking-wide uppercase font-heading group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t('portal_brand', 'BIS Saarthi')}
              </div>
              <div className="text-xs text-gray-500 dark:text-dark-text-muted mt-1 capitalize">
                {getPortalTitle()}
              </div>
            </div>
          </Link>
        ) : (
          <Link
            to={roleDefaultRoute}
            onClick={mobile ? onClose : undefined}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 dark:border-dark-border flex items-center justify-center shrink-0 p-0.5 shadow-xs hover:scale-105 transition-transform"
            title={getPortalTitle()}
          >
            <img src="/bis-logo.svg" alt="BIS" className="w-full h-full object-contain" />
          </Link>
        )}

        {mobile ? (
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors ml-auto text-gray-500 dark:text-dark-text-muted"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* ── User Profile Badge (Replaces removed top header) ── */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg-secondary/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-bis-navy text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-dark-text-muted truncate">
                {user.email}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation Items ── */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">

        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          const isNotificationItem = item.label === 'Notifications'

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={mobile ? onClose : undefined}
              title={collapsed ? getNavLabel(item) : undefined}
              className={cn(
                'sidebar-item text-sm',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )}
            >
              <div className="relative">
                <Icon className="w-4 h-4 shrink-0" />
                {isNotificationItem && unreadNotifs > 0 && collapsed && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-dark-bg-card shadow-xs" />
                )}
              </div>
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate font-medium">{getNavLabel(item)}</span>
                  {isNotificationItem && unreadNotifs > 0 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-600 text-white font-mono shadow-xs">
                      {unreadNotifs}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* ── Bottom Controls: Theme Toggle, Sign Out & Version ── */}
      <div className="p-2 border-t border-gray-100 dark:border-dark-border space-y-1">
        {/* Settings Navigation Link */}
        <NavLink
          to={ROUTES.SETTINGS}
          onClick={mobile ? onClose : undefined}
          title={collapsed ? t('nav_settings', 'Settings') : undefined}
          className={cn(
            'sidebar-item w-full text-sm transition-colors text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary',
            location.pathname === ROUTES.SETTINGS && 'active',
            collapsed && 'justify-center px-2'
          )}
        >
          <Settings className="w-4 h-4 shrink-0 text-gray-600 dark:text-dark-text" />
          {!collapsed && <span>{t('nav_settings', 'Settings')}</span>}
        </NavLink>

        {/* Sign Out Button (Fast 1-click logout) */}
        <button
          onClick={handleLogout}
          title={collapsed ? t('sign_out', 'Sign Out') : undefined}
          className={cn(
            'sidebar-item w-full text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0 text-red-500" />
          {!collapsed && <span>{t('sign_out', 'Sign Out')}</span>}
        </button>

        {!collapsed && (
          <div className="pt-2 px-2 text-xs text-gray-400 dark:text-dark-text-muted">
            <div className="font-semibold text-gray-500 dark:text-dark-text-muted">{t('portal_brand', 'BIS Saarthi')}</div>
            <div>{t('bis_title_en', 'Bureau of Indian Standards')}</div>
          </div>
        )}
      </div>
    </aside>
  )
}
