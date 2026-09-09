import React, { useState, useMemo } from 'react'
import {
  Bell, CheckCircle2, Clock, AlertTriangle, Info, AlertCircle,
  Check, Trash2, Search, Filter, ExternalLink, ArrowRight,
  Shield, Megaphone, Sparkles, Eye, BookOpen, Building2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import useAuthStore from '@/store/authStore'
import useDataStore from '@/store/dataStore'
import { cn, formatDateTime, formatDate } from '@/lib/utils'

export default function NotificationCenter({ role = 'consumer' }) {
  const { user } = useAuthStore()
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useDataStore()

  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'unread' | 'urgent' | category
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotif, setSelectedNotif] = useState(null)

  // Filter notifications relevant to this role (targetRole === 'all' || targetRole === role)
  const roleNotifications = useMemo(() => {
    return notifications.filter((n) => n.targetRole === 'all' || n.targetRole === role)
  }, [notifications, role])

  const userEmail = user?.email || (role === 'consumer' ? 'consumer@bis.gov.in' : 'msme@bis.gov.in')

  // Unread count
  const unreadCount = useMemo(() => {
    return roleNotifications.filter((n) => !(n.readBy || []).includes(userEmail)).length
  }, [roleNotifications, userEmail])

  const urgentCount = useMemo(() => {
    return roleNotifications.filter((n) => n.priority === 'urgent').length
  }, [roleNotifications])

  // Filtered by active tab and search
  const filteredList = useMemo(() => {
    return roleNotifications.filter((n) => {
      const isRead = (n.readBy || []).includes(userEmail)

      // Tab filter
      if (activeFilter === 'unread' && isRead) return false
      if (activeFilter === 'urgent' && n.priority !== 'urgent') return false
      if (!['all', 'unread', 'urgent'].includes(activeFilter)) {
        if (n.category !== activeFilter) return false
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = (n.title || '').toLowerCase().includes(q)
        const matchMsg = (n.message || '').toLowerCase().includes(q)
        const matchCat = (n.category || '').toLowerCase().includes(q)
        const matchSender = (n.sender || '').toLowerCase().includes(q)
        return matchTitle || matchMsg || matchCat || matchSender
      }

      return true
    })
  }, [roleNotifications, activeFilter, searchQuery, userEmail])

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(role, userEmail)
    toast.success('All notifications marked as read')
  }

  const handleToggleRead = (notif, e) => {
    if (e) e.stopPropagation()
    const isRead = (notif.readBy || []).includes(userEmail)
    if (!isRead) {
      markNotificationAsRead(notif.id, userEmail)
      toast.success('Marked as read')
    }
  }

  const handleOpenDetail = (notif) => {
    setSelectedNotif(notif)
    const isRead = (notif.readBy || []).includes(userEmail)
    if (!isRead) {
      markNotificationAsRead(notif.id, userEmail)
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            Urgent Directive
          </span>
        )
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3" />
            Advisory
          </span>
        )
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Active Benefit
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Info className="w-3 h-3" />
            Information
          </span>
        )
    }
  }

  // Distinct categories available in current feed
  const categories = useMemo(() => {
    const cats = new Set(roleNotifications.map((n) => n.category).filter(Boolean))
    return Array.from(cats)
  }, [roleNotifications])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-gov bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-bis-navy dark:text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold font-heading text-gray-900 dark:text-dark-text">
              {role === 'consumer' ? 'Official Citizen Notifications' : 'MSME Directives & Circulars'}
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white font-mono shadow-xs animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">
            {role === 'consumer'
              ? 'Real-time alerts, safety advisories, and gazette notifications broadcasted by BIS authorities.'
              : 'Regulatory mandates, QCO deadlines, standard revisions, and scheme concessions broadcasted by BIS.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-gov-outline text-xs py-2 px-3 flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card-gov p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-gov font-medium transition-all whitespace-nowrap',
                activeFilter === 'all'
                  ? 'bg-bis-navy text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text hover:bg-gray-200'
              )}
            >
              All ({roleNotifications.length})
            </button>

            <button
              onClick={() => setActiveFilter('unread')}
              className={cn(
                'px-3 py-1.5 rounded-gov font-medium transition-all whitespace-nowrap flex items-center gap-1',
                activeFilter === 'unread'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text hover:bg-gray-200'
              )}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/30 text-white font-mono font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveFilter('urgent')}
              className={cn(
                'px-3 py-1.5 rounded-gov font-medium transition-all whitespace-nowrap flex items-center gap-1',
                activeFilter === 'urgent'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text hover:bg-gray-200'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span>Urgent ({urgentCount})</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-gov font-medium transition-all whitespace-nowrap',
                  activeFilter === cat
                    ? 'bg-bis-navy text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text hover:bg-gray-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars, topics..."
              className="input-gov pl-8 pr-3 py-1.5 text-xs w-full"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="card-gov p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-bis-navy dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 opacity-60" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-dark-text text-sm">No notifications found</h3>
            <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1 max-w-sm mx-auto">
              {searchQuery || activeFilter !== 'all'
                ? 'Try adjusting your search or category filter.'
                : 'You are all caught up! Official updates and directives broadcasted by BIS will appear here.'}
            </p>
          </div>
        ) : (
          filteredList.map((notif) => {
            const isRead = (notif.readBy || []).includes(userEmail)

            return (
              <div
                key={notif.id}
                onClick={() => handleOpenDetail(notif)}
                className={cn(
                  'card-gov p-4 transition-all duration-200 cursor-pointer border relative overflow-hidden group',
                  isRead
                    ? 'bg-white dark:bg-dark-bg-card border-gray-200 dark:border-dark-border opacity-85 hover:opacity-100 hover:shadow-gov'
                    : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-gov-sm'
                )}
              >
                {/* Left accent strip for unread */}
                {!isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" />
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Unread indicator or Priority Icon */}
                    <div className="mt-0.5 shrink-0">
                      {!isRead ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-red-600 ring-4 ring-red-600/20 mt-1 animate-pulse" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-dark-border mt-1" />
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getPriorityBadge(notif.priority)}
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text-muted border border-gray-200/60 dark:border-dark-border/60">
                          {notif.category}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-dark-text-muted">
                          · {formatDateTime(notif.created)}
                        </span>
                      </div>

                      <h3 className={cn(
                        'text-sm font-heading leading-snug',
                        isRead
                          ? 'font-semibold text-gray-800 dark:text-dark-text'
                          : 'font-bold text-gray-900 dark:text-white'
                      )}>
                        {notif.title}
                      </h3>

                      <p className="text-xs text-gray-600 dark:text-dark-text-muted line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-400 dark:text-dark-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Shield className="w-3 h-3 text-bis-navy dark:text-blue-400" />
                          <span>{notif.sender || 'BIS Authority'}</span>
                        </span>
                        {notif.targetRole === 'all' && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium">
                            Public &amp; MSME Broadcast
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 sm:self-start mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                    {notif.actionUrl && (
                      <Link
                        to={notif.actionUrl}
                        className="btn-gov-outline text-xs py-1.5 px-2.5 inline-flex items-center gap-1 shadow-xs"
                      >
                        <span>Open Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleToggleRead(notif, e)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-400 hover:text-bis-navy dark:hover:text-blue-400 transition-colors"
                      title={isRead ? 'Read' : 'Mark as read'}
                    >
                      <Check className={cn('w-4 h-4', isRead ? 'text-green-500' : 'text-gray-400')} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Notification Detail Modal ── */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-lg w-full p-6 animate-scale-in space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-dark-border pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {getPriorityBadge(selectedNotif.priority)}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border">
                    {selectedNotif.category}
                  </span>
                </div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading mt-1">
                  {selectedNotif.title}
                </h2>
                <div className="text-[11px] text-gray-400 dark:text-dark-text-muted flex items-center gap-2">
                  <span>Official Circular: {selectedNotif.id}</span>
                  <span>·</span>
                  <span>{formatDateTime(selectedNotif.created)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 rounded-gov hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="py-2 text-xs sm:text-sm text-gray-700 dark:text-dark-text leading-relaxed bg-gray-50 dark:bg-dark-bg p-4 rounded-gov border border-gray-100 dark:border-dark-border space-y-2">
              <p className="whitespace-pre-line">{selectedNotif.message}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-dark-text-muted pt-2">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-bis-navy dark:text-blue-400" />
                <span>Issued by: <strong>{selectedNotif.sender}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedNotif(null)}
                  className="btn-gov-outline text-xs py-1.5 px-3"
                >
                  Close
                </button>
                {selectedNotif.actionUrl && (
                  <Link
                    to={selectedNotif.actionUrl}
                    onClick={() => setSelectedNotif(null)}
                    className="btn-gov text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Proceed to Portal Service</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
