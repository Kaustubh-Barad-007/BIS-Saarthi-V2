import React, { useState, useMemo } from 'react'
import {
  Radio, Megaphone, Bell, Plus, Search, Filter, Trash2, Eye,
  AlertTriangle, CheckCircle2, Info, Shield, Sparkles, Send,
  Users, Building2, ExternalLink, ArrowRight, RefreshCw, X, Clock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import useDataStore from '@/store/dataStore'
import useAuthStore from '@/store/authStore'
import { cn, formatDateTime } from '@/lib/utils'

export default function AdminNotifications() {
  const { user } = useAuthStore()
  const {
    notifications,
    broadcastNotification,
    deleteNotification,
  } = useDataStore()

  // Form State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [targetRole, setTargetRole]           = useState('all') // 'all' | 'consumer' | 'manufacturer'
  const [priority, setPriority]               = useState('info') // 'info' | 'warning' | 'urgent' | 'success'
  const [category, setCategory]               = useState('Gazette Circular')
  const [title, setTitle]                     = useState('')
  const [message, setMessage]                 = useState('')
  const [actionUrl, setActionUrl]             = useState('')
  const [sender, setSender]                   = useState('BIS Central Directorate General')

  // Filter & Search State
  const [roleFilter, setRoleFilter]           = useState('all')
  const [priorityFilter, setPriorityFilter]   = useState('all')
  const [searchQuery, setSearchQuery]         = useState('')
  const [selectedNotif, setSelectedNotif]     = useState(null)
  const [notifToDelete, setNotifToDelete]     = useState(null)

  // Metrics
  const totalCount = notifications.length
  const consumerCount = notifications.filter((n) => n.targetRole === 'consumer' || n.targetRole === 'all').length
  const mfgCount = notifications.filter((n) => n.targetRole === 'manufacturer' || n.targetRole === 'all').length
  const urgentCount = notifications.filter((n) => n.priority === 'urgent').length

  // Quick Templates
  const applyTemplate = (type) => {
    if (type === 'hallmarking') {
      setTargetRole('consumer')
      setPriority('urgent')
      setCategory('Gazette Circular')
      setTitle('Mandatory 6-Digit HUID Hallmarking in 24 New Districts')
      setMessage('Department of Consumer Affairs has notified phase-IV mandatory hallmarking. Consumers must check for the 6-digit alphanumeric HUID code, BIS logo, and karatage purity (22K916) on all gold jewellery articles.')
      setActionUrl('/consumer/hallmarking')
      setSender('BIS Central Hallmarking Directorate')
      toast.success('Consumer Hallmarking template applied!')
    } else if (type === 'ev_qco') {
      setTargetRole('manufacturer')
      setPriority('urgent')
      setCategory('Compliance Alert')
      setTitle('Mandatory QCO Enforcement for EV DC Charging Couplers (IS 17840)')
      setMessage('All domestic manufacturers and importers of EV charging station accessories must possess valid BIS Scheme-I license by June 2025. Applications are open with 50% concession for registered MSMEs.')
      setActionUrl('/manufacturer/certification')
      setSender('Bureau of Indian Standards Quality Order Cell')
      toast.success('MSME EV QCO template applied!')
    } else if (type === 'water_advisory') {
      setTargetRole('consumer')
      setPriority('warning')
      setCategory('Quality Advisory')
      setTitle('Public Safety Advisory: Uncertified 20-Litre Water Dispensers')
      setMessage('State surveillance teams seized uncertified packaged drinking water jars lacking mandatory IS 14543 certification. Verify licence validity through the BIS Care App before accepting delivery.')
      setActionUrl('/consumer/standards')
      setSender('BIS Citizen Protection & Enforcement Wing')
      toast.success('Packaged Water advisory template applied!')
    } else if (type === 'msme_subsidy') {
      setTargetRole('manufacturer')
      setPriority('success')
      setCategory('Standard Update')
      setTitle('Scheme-I Annual Minimum Marking Fee 50% Relief for Small Units')
      setMessage('BIS announces continuation of 50% annual marking fee concession for Micro and Small enterprises. Submit audited turnover declarations and valid Udyam certificate to activate.')
      setActionUrl('/manufacturer/documents')
      setSender('MSME Facilitation Directorate')
      toast.success('MSME Concession template applied!')
    }
  }

  // Handle Form Submit
  const handleDispatchBroadcast = (e) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.')
      return
    }

    const newNotif = broadcastNotification({
      title: title.trim(),
      message: message.trim(),
      targetRole,
      priority,
      category,
      actionUrl: actionUrl.trim(),
      sender: sender.trim() || 'BIS Central Administration',
    })

    toast.success(`Directive ${newNotif.id} broadcasted successfully to ${targetRole.toUpperCase()} audience!`)
    setShowCreateModal(false)

    // Reset Form
    setTitle('')
    setMessage('')
    setActionUrl('')
    setPriority('info')
    setCategory('Gazette Circular')
    setTargetRole('all')
  }

  // Handle Delete Broadcast
  const confirmDelete = () => {
    if (!notifToDelete) return
    deleteNotification(notifToDelete.id)
    toast.success(`Broadcast ${notifToDelete.id} successfully recalled and removed.`)
    setNotifToDelete(null)
  }

  // Filtered Notifications List
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Role filter
      if (roleFilter !== 'all' && n.targetRole !== roleFilter && n.targetRole !== 'all') return false

      // Priority filter
      if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = (n.title || '').toLowerCase().includes(q)
        const matchMsg = (n.message || '').toLowerCase().includes(q)
        const matchCat = (n.category || '').toLowerCase().includes(q)
        const matchSender = (n.sender || '').toLowerCase().includes(q)
        const matchId = (n.id || '').toLowerCase().includes(q)
        return matchTitle || matchMsg || matchCat || matchSender || matchId
      }

      return true
    })
  }, [notifications, roleFilter, priorityFilter, searchQuery])

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            Urgent Directive
          </span>
        )
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
            Advisory
          </span>
        )
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Relief / Benefit
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

  const getTargetBadge = (role) => {
    switch (role) {
      case 'consumer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <Users className="w-3 h-3" /> Consumers Only
          </span>
        )
      case 'manufacturer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Building2 className="w-3 h-3" /> Manufacturers Only
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Radio className="w-3 h-3" /> All Stakeholders
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-gov bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-bis-navy dark:text-blue-400">
              <Radio className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold font-heading text-gray-900 dark:text-dark-text">
              Broadcast Notifications &amp; Alerts Operations
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">
            Issue and manage targeted notifications, QCO mandates, and public safety circulars for Consumers and MSMEs.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-gov text-sm py-2 px-4 flex items-center gap-2 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Broadcast New Notification</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-gov p-4">
          <div className="text-[11px] font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
            Total Broadcasts
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">{totalCount}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Active in live database</div>
        </div>

        <div className="card-gov p-4">
          <div className="text-[11px] font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wider">
            Consumer Broadcasts
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{consumerCount}</div>
          <div className="text-xs text-gray-400 dark:text-dark-text-muted mt-1">Reaching general public</div>
        </div>

        <div className="card-gov p-4">
          <div className="text-[11px] font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
            MSME / Manufacturer
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{mfgCount}</div>
          <div className="text-xs text-gray-400 dark:text-dark-text-muted mt-1">Reaching license holders</div>
        </div>

        <div className="card-gov p-4">
          <div className="text-[11px] font-medium text-red-700 dark:text-red-300 uppercase tracking-wider">
            Urgent Directives
          </div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{urgentCount}</div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">Pulsing priority status</div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="card-gov p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Role Filters */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1">
            <button
              onClick={() => setRoleFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-gov font-medium transition-all whitespace-nowrap',
                roleFilter === 'all'
                  ? 'bg-bis-navy text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text hover:bg-gray-200'
              )}
            >
              All Audiences ({totalCount})
            </button>
            <button
              onClick={() => setRoleFilter('consumer')}
              className={cn(
                'px-3 py-1.5 rounded-gov font-medium transition-all whitespace-nowrap flex items-center gap-1',
                roleFilter === 'consumer'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text hover:bg-gray-200'
              )}
            >
              <Users className="w-3 h-3" /> Consumers ({notifications.filter(n => n.targetRole === 'consumer').length})
            </button>
            <button
              onClick={() => setRoleFilter('manufacturer')}
              className={cn(
                'px-3 py-1.5 rounded-gov font-medium transition-all whitespace-nowrap flex items-center gap-1',
                roleFilter === 'manufacturer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text hover:bg-gray-200'
              )}
            >
              <Building2 className="w-3 h-3" /> MSMEs ({notifications.filter(n => n.targetRole === 'manufacturer').length})
            </button>
          </div>

          {/* Priority Filter & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-gov text-xs py-1.5 px-2.5"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent Only</option>
              <option value="warning">Warning Only</option>
              <option value="info">Info Only</option>
              <option value="success">Success Only</option>
            </select>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search circulars..."
                className="input-gov pl-8 pr-3 py-1.5 text-xs w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched Broadcasts Table */}
      <div className="card-gov overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading text-sm">
            Dispatched Broadcast Directives
          </h2>
          <span className="text-xs text-gray-400 dark:text-dark-text-muted font-mono">
            Showing {filteredNotifications.length} of {totalCount} records
          </span>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-dark-text-muted text-xs">
            No broadcast notifications match your active search or filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 hover:bg-gray-50/70 dark:hover:bg-dark-bg-secondary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-semibold text-gray-500 dark:text-dark-text-muted">
                      {notif.id}
                    </span>
                    {getTargetBadge(notif.targetRole)}
                    {getPriorityBadge(notif.priority)}
                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text-muted border border-gray-200/60 dark:border-dark-border/60">
                      {notif.category}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-dark-text-muted">
                      {formatDateTime(notif.created)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-dark-text">
                    {notif.title}
                  </h3>

                  <p className="text-xs text-gray-600 dark:text-dark-text-muted line-clamp-1 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-dark-text-muted pt-0.5">
                    <span>Issued by: <strong>{notif.sender}</strong></span>
                    {notif.actionUrl && (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                        <ExternalLink className="w-3 h-3" />
                        <span>Action: {notif.actionUrl}</span>
                      </span>
                    )}
                    <span>·</span>
                    <span className="text-green-600 dark:text-green-400 font-mono">
                      {(notif.readBy || []).length} read acknowledgements
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedNotif(notif)}
                    className="p-1.5 rounded-gov border border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-600 dark:text-dark-text transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setNotifToDelete(notif)}
                    className="p-1.5 rounded-gov border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    title="Recall & Delete Broadcast"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create New Broadcast Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-2xl w-full p-6 animate-scale-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-gov bg-bis-navy text-white flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                    Dispatch Official Broadcast Directive
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-dark-text-muted">
                    Broadcasted notices instantly synchronize to role feeds and trigger unread badges
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates Strip */}
            <div className="mb-4 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-gov border border-blue-200/50 dark:border-blue-900/40 space-y-1.5">
              <div className="text-[11px] font-semibold text-bis-navy dark:text-blue-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>1-Click Presets &amp; Templates:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTemplate('hallmarking')}
                  className="px-2 py-1 rounded bg-white dark:bg-dark-bg text-[11px] border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 transition-colors font-medium"
                >
                  Consumer Hallmarking Advisory
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('ev_qco')}
                  className="px-2 py-1 rounded bg-white dark:bg-dark-bg text-[11px] border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 hover:bg-blue-50 transition-colors font-medium"
                >
                  MSME EV QCO Mandate
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('water_advisory')}
                  className="px-2 py-1 rounded bg-white dark:bg-dark-bg text-[11px] border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 hover:bg-red-50 transition-colors font-medium"
                >
                  Packaged Water Warning
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('msme_subsidy')}
                  className="px-2 py-1 rounded bg-white dark:bg-dark-bg text-[11px] border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 hover:bg-green-50 transition-colors font-medium"
                >
                  MSME 50% Relief Notice
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleDispatchBroadcast} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Target Audience Selector */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1.5">
                  Target Audience / Recipient Portal *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetRole('all')}
                    className={cn(
                      'p-2.5 rounded-gov border text-left transition-all',
                      targetRole === 'all'
                        ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold'
                        : 'border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-purple-600" />
                      <span>All Stakeholders</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-dark-text-muted mt-1 font-normal">
                      Consumers &amp; Manufacturers
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetRole('consumer')}
                    className={cn(
                      'p-2.5 rounded-gov border text-left transition-all',
                      targetRole === 'consumer'
                        ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                        : 'border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-600" />
                      <span>Consumers Only</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-dark-text-muted mt-1 font-normal">
                      Safety, standards, hallmarking
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetRole('manufacturer')}
                    className={cn(
                      'p-2.5 rounded-gov border text-left transition-all',
                      targetRole === 'manufacturer'
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>MSME / Mfr Only</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-dark-text-muted mt-1 font-normal">
                      QCOs, testing, concessions
                    </p>
                  </button>
                </div>
              </div>

              {/* Priority & Category Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input-gov text-xs"
                  >
                    <option value="info">Info (Standard Announcement)</option>
                    <option value="warning">Warning (Public Advisory)</option>
                    <option value="urgent">Urgent (Mandatory Regulatory Directive)</option>
                    <option value="success">Success (Concession / Subsidy Benefit)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                    Directive Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-gov text-xs"
                  >
                    <option value="Gazette Circular">Gazette Circular</option>
                    <option value="Quality Advisory">Quality Advisory</option>
                    <option value="Compliance Alert">Compliance Alert</option>
                    <option value="Standard Update">Standard Update</option>
                    <option value="Surveillance Order">Surveillance Order</option>
                    <option value="Portal Notice">Portal Notice</option>
                  </select>
                </div>
              </div>

              {/* Notification Title */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                  Circular / Directive Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Mandatory BIS Certification for Solar Panels under IS 18031"
                  className="input-gov text-xs font-medium"
                />
              </div>

              {/* Directive Body / Description */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                  Detailed Official Body / Circular Text *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide precise regulatory requirements, clauses, effective dates, and compliance steps..."
                  className="input-gov text-xs resize-none"
                />
              </div>

              {/* Action Link & Sender Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                    Portal Action Route (Optional)
                  </label>
                  <input
                    type="text"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    placeholder="e.g. /consumer/hallmarking or /manufacturer/certification"
                    className="input-gov text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                    Issuing Authority / Wing
                  </label>
                  <input
                    type="text"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="e.g. Central Quality Directorate"
                    className="input-gov text-xs"
                  />
                </div>
              </div>

              {/* Live Preview */}
              {title && (
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-dark-text-muted mb-1.5 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>Live Recipient Card Preview:</span>
                  </div>
                  <div className="p-3.5 rounded-gov bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border space-y-1.5">
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(priority)}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-dark-bg-card border text-gray-600 dark:text-dark-text">
                        {category}
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white text-xs">{title}</div>
                    <p className="text-gray-600 dark:text-dark-text-muted text-[11px] leading-relaxed line-clamp-2">
                      {message || 'Body text will appear here...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-gray-100 dark:border-dark-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-gov-outline text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gov text-xs py-2 px-4 flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Directive Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Directive Details Modal ── */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-lg w-full p-6 animate-scale-in space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-dark-border pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {getTargetBadge(selectedNotif.targetRole)}
                  {getPriorityBadge(selectedNotif.priority)}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border">
                    {selectedNotif.category}
                  </span>
                </div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading mt-2">
                  {selectedNotif.title}
                </h2>
                <div className="text-[11px] text-gray-400 dark:text-dark-text-muted mt-0.5">
                  ID: {selectedNotif.id} · Broadcasted on {formatDateTime(selectedNotif.created)}
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-gov border border-gray-100 dark:border-dark-border text-xs leading-relaxed text-gray-700 dark:text-dark-text whitespace-pre-line">
              {selectedNotif.message}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-dark-border">
              <span className="text-gray-500 dark:text-dark-text-muted">
                Issued by: <strong>{selectedNotif.sender}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="btn-gov text-xs py-1.5 px-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Recall & Delete Modal ── */}
      {notifToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-sm w-full p-6 animate-scale-in space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                  Recall Broadcast Directive?
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                  Cannot be undone
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-dark-text-muted leading-relaxed">
              Are you sure you want to recall and delete <strong className="text-gray-900 dark:text-white">&ldquo;{notifToDelete.title}&rdquo;</strong>? It will immediately disappear from all recipient portals.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setNotifToDelete(null)}
                className="btn-gov-outline text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="btn-gov bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3.5"
              >
                Recall Directive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
