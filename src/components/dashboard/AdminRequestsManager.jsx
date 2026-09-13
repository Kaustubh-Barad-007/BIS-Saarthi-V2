import React, { useState } from 'react'
import {
  FileText, CheckCircle2, Clock, XCircle, Search, Filter,
  Building2, User, Eye, Shield, Check, AlertCircle, ArrowUpRight,
  Sparkles, RefreshCw, ChevronRight, X, MessageSquare, AlertTriangle,
  BadgeCheck
} from 'lucide-react'
import { toast } from 'sonner'
import useDataStore from '@/store/dataStore'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

export default function AdminRequestsManager({
  initialTab = 'all',
  filterMode = null, // null | 'complaints' | 'certs'
  title = null,
  subtitle = null,
}) {
  const { t } = useTranslation()
  const {
    complaints, certifications,
    updateComplaintStatus, updateCertStatus
  } = useDataStore()

  const [activeTab, setActiveTab] = useState(filterMode || initialTab) // 'all' | 'complaints' | 'certs'
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [adminNoteInput, setAdminNoteInput] = useState('')

  // Normalize complaints and certifications into a unified request feed
  const unifiedRequests = [
    ...complaints.map((c) => ({
      id: c.id,
      kind: 'complaint',
      kindLabel: 'Consumer Complaint',
      kindBadgeCls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      title: c.subject,
      product: c.product,
      standard: c.standard || 'General Quality Standards',
      locationOrFacility: c.location,
      description: c.description,
      status: c.status || 'pending',
      date: c.date,
      updated: c.updated,
      remarks: c.remarks || '',
      submitterRole: 'Consumer',
      userEmail: c.userEmail || 'consumer@bis.gov.in',
    })),
    ...certifications.map((c) => ({
      id: c.id,
      kind: 'cert',
      kindLabel: 'Manufacturer Application',
      kindBadgeCls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      title: c.product,
      product: c.product,
      standard: c.standard,
      locationOrFacility: c.lab,
      description: `Certification application for ${c.product} under standard ${c.standard}. Designated lab: ${c.lab}. Category: ${c.category || 'General'}.`,
      status: c.status || 'pending',
      date: c.applied,
      updated: c.updated,
      remarks: c.remarks || '',
      submitterRole: 'Manufacturer / MSME',
      userEmail: c.userEmail || 'msme@bis.gov.in',
    })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

  // If filterMode is set, narrow to that category
  const relevantRequests = filterMode === 'complaints'
    ? unifiedRequests.filter((r) => r.kind === 'complaint')
    : filterMode === 'certs'
    ? unifiedRequests.filter((r) => r.kind === 'cert')
    : unifiedRequests

  // Filtered list
  const filteredRequests = relevantRequests.filter((req) => {
    // Tab filter (only if not locked by filterMode)
    if (!filterMode) {
      if (activeTab === 'complaints' && req.kind !== 'complaint') return false
      if (activeTab === 'certs' && req.kind !== 'cert') return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && req.status !== 'pending') return false
      if (statusFilter === 'review' && req.status !== 'under_review' && req.status !== 'in_progress') return false
      if (statusFilter === 'resolved_approved' && req.status !== 'resolved' && req.status !== 'approved') return false
      if (statusFilter === 'rejected' && req.status !== 'rejected') return false
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchId = req.id.toLowerCase().includes(q)
      const matchTitle = req.title.toLowerCase().includes(q)
      const matchProduct = req.product.toLowerCase().includes(q)
      const matchStd = req.standard.toLowerCase().includes(q)
      const matchLoc = (req.locationOrFacility || '').toLowerCase().includes(q)
      const matchRemarks = (req.remarks || '').toLowerCase().includes(q)
      return matchId || matchTitle || matchProduct || matchStd || matchLoc || matchRemarks
    }

    return true
  })

  // Quick Stats
  const totalCount = relevantRequests.length
  const pendingCount = relevantRequests.filter((r) => r.status === 'pending').length
  const reviewCount = relevantRequests.filter((r) => r.status === 'under_review' || r.status === 'in_progress').length
  const approvedCount = relevantRequests.filter((r) => r.status === 'resolved' || r.status === 'approved').length
  const rejectedCount = relevantRequests.filter((r) => r.status === 'rejected').length

  const handleInlineStatusChange = (req, newStatus) => {
    if (req.kind === 'complaint') {
      updateComplaintStatus(req.id, newStatus, req.remarks)
      toast.success(`Complaint ${req.id} marked as "${newStatus.replace('_', ' ').toUpperCase()}". Consumer notified!`)
    } else {
      updateCertStatus(req.id, newStatus, req.remarks)
      toast.success(`Certification ${req.id} marked as "${newStatus.replace('_', ' ').toUpperCase()}". Manufacturer notified!`)
    }
  }

  const handleOpenDossier = (req) => {
    setSelectedItem(req)
    setAdminNoteInput(req.remarks || '')
  }

  const handleSaveDossierStatus = (newStatus) => {
    if (!selectedItem) return
    const note = adminNoteInput.trim()

    if (selectedItem.kind === 'complaint') {
      updateComplaintStatus(selectedItem.id, newStatus, note)
      toast.success(`Complaint ${selectedItem.id} updated to "${newStatus.replace('_', ' ').toUpperCase()}" with official remarks.`)
    } else {
      updateCertStatus(selectedItem.id, newStatus, note)
      toast.success(`Certification ${selectedItem.id} updated to "${newStatus.replace('_', ' ').toUpperCase()}" with official remarks.`)
    }

    // Update local modal state
    setSelectedItem((prev) => ({
      ...prev,
      status: newStatus,
      remarks: note,
      updated: new Date().toISOString(),
    }))
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-3 h-3" />
            {status === 'approved' ? t('Approved & Granted', 'Approved & Granted') : t('Resolved', 'Resolved')}
          </span>
        )
      case 'under_review':
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3 animate-spin" />
            {status === 'under_review' ? t('Under Review', 'Under Review') : t('In Progress', 'In Progress')}
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="w-3 h-3" />
            {t('Rejected', 'Rejected')}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-3 h-3" />
            {t('Pending Action', 'Pending Action')}
          </span>
        )
    }
  }

  return (
    <div className="card-gov p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-dark-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            {filterMode === 'complaints' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : filterMode === 'certs' ? (
              <BadgeCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Shield className="w-5 h-5 text-bis-navy dark:text-blue-400" />
            )}
            <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text font-heading">
              {title ? t(title, title) : (
                filterMode === 'complaints'
                  ? t('Consumer Complaints Redressal Operations', 'Consumer Complaints Redressal Operations')
                  : filterMode === 'certs'
                  ? t('MSME Certification Applications & Approvals', 'MSME Certification Applications & Approvals')
                  : t('Requests & Compliance Operations Center', 'Requests & Compliance Operations Center')
              )}
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">
            {subtitle ? t(subtitle, subtitle) : (
              filterMode === 'complaints'
                ? t('Review, investigate, and resolve product quality and non-compliance complaints submitted by consumers.', 'Review, investigate, and resolve product quality and non-compliance complaints submitted by consumers.')
                : filterMode === 'certs'
                ? t('Review, verify laboratory test reports, and approve or reject Scheme-I & ISI mark certification applications from manufacturers.', 'Review, verify laboratory test reports, and approve or reject Scheme-I & ISI mark certification applications from manufacturers.')
                : t('Centralized intake and approval gateway for all Citizen Quality Complaints and MSME Certification Applications.', 'Centralized intake and approval gateway for all Citizen Quality Complaints and MSME Certification Applications.')
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-dark-text-muted">
            {t('Live Sync:', 'Live Sync:')} <strong className="text-green-600 dark:text-green-400 font-mono">{totalCount}</strong> {t('active', 'active')} {filterMode === 'complaints' ? t('complaints', 'complaints') : filterMode === 'certs' ? t('applications', 'applications') : t('cases', 'cases')}
          </span>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-gov bg-gray-50 dark:bg-dark-bg-secondary border border-gray-100 dark:border-dark-border">
          <div className="text-[11px] font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
            {filterMode === 'complaints' ? t('Total Complaints', 'Total Complaints') : filterMode === 'certs' ? t('Total Applications', 'Total Applications') : t('Total Requests', 'Total Requests')}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-dark-text mt-1">{totalCount}</div>
        </div>

        <div className="p-3 rounded-gov bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40">
          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider">{t('Pending Action', 'Pending Action')}</div>
          <div className="text-xl font-bold text-amber-800 dark:text-amber-200 mt-1">{pendingCount}</div>
        </div>

        <div className="p-3 rounded-gov bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/40">
          <div className="text-[11px] font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">{t('Under Review', 'Under Review')}</div>
          <div className="text-xl font-bold text-blue-800 dark:text-blue-200 mt-1">{reviewCount}</div>
        </div>

        <div className="p-3 rounded-gov bg-green-50/60 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/40">
          <div className="text-[11px] font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">{t('Approved / Resolved', 'Approved / Resolved')}</div>
          <div className="text-xl font-bold text-green-800 dark:text-green-200 mt-1">{approvedCount}</div>
        </div>

        <div className="p-3 rounded-gov bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/40 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-medium text-red-700 dark:text-red-300 uppercase tracking-wider">{t('Rejected', 'Rejected')}</div>
          <div className="text-xl font-bold text-red-800 dark:text-red-200 mt-1">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Filter Tabs (only when not locked to a specific mode) */}
        {!filterMode ? (
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-bg p-1 rounded-gov border border-gray-200 dark:border-dark-border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-3 py-1.5 rounded font-medium transition-all',
                activeTab === 'all'
                  ? 'bg-white dark:bg-dark-bg-card text-bis-navy dark:text-blue-300 shadow-xs'
                  : 'text-gray-600 dark:text-dark-text-muted hover:text-gray-900'
              )}
            >
              {t('All Requests', 'All Requests')} ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('complaints')}
              className={cn(
                'px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all',
                activeTab === 'complaints'
                  ? 'bg-white dark:bg-dark-bg-card text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-gray-600 dark:text-dark-text-muted hover:text-gray-900'
              )}
            >
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('Consumer Complaints', 'Consumer Complaints')} ({complaints.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('certs')}
              className={cn(
                'px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all',
                activeTab === 'certs'
                  ? 'bg-white dark:bg-dark-bg-card text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-gray-600 dark:text-dark-text-muted hover:text-gray-900'
              )}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('MSME Applications', 'MSME Applications')} ({certifications.length})</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-gov bg-gray-100 dark:bg-dark-bg-secondary text-gray-700 dark:text-dark-text border border-gray-200 dark:border-dark-border inline-flex items-center gap-1.5">
              {filterMode === 'complaints' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('Citizen Complaints Redressal', 'Citizen Complaints Redressal')}</span>
                </>
              ) : (
                <>
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('Manufacturer Licensing & Approvals', 'Manufacturer Licensing & Approvals')}</span>
                </>
              )}
            </span>
          </div>
        )}

        {/* Right: Status Dropdown & Search */}
        <div className="flex items-center gap-2">
          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white dark:bg-dark-bg-card border border-gray-200 dark:border-dark-border rounded-gov px-2.5 py-1.5 text-gray-700 dark:text-dark-text outline-none"
          >
            <option value="all">{t('All Statuses', 'All Statuses')}</option>
            <option value="pending">{t('Pending Action', 'Pending Action')}</option>
            <option value="review">{t('Under Review / In Progress', 'Under Review / In Progress')}</option>
            <option value="resolved_approved">{t('Resolved / Approved', 'Resolved / Approved')}</option>
            <option value="rejected">{t('Rejected', 'Rejected')}</option>
          </select>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search by ID, product, std...', 'Search by ID, product, std...')}
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-dark-bg-card border border-gray-200 dark:border-dark-border rounded-gov text-gray-800 dark:text-dark-text placeholder:text-gray-400 outline-none w-48 sm:w-60 focus:border-bis-navy dark:focus:border-blue-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto rounded-gov border border-gray-100 dark:border-dark-border">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-50 dark:bg-dark-bg-secondary text-gray-600 dark:text-dark-text-muted border-b border-gray-100 dark:border-dark-border">
            <tr>
              <th className="py-3 px-3.5 font-semibold">{t('Type & ID', 'Type & ID')}</th>
              <th className="py-3 px-3.5 font-semibold">{t('Subject / Product Details', 'Subject / Product Details')}</th>
              <th className="py-3 px-3.5 font-semibold">{t('Standard & Facility', 'Standard & Facility')}</th>
              <th className="py-3 px-3.5 font-semibold">{t('Date Filed', 'Date Filed')}</th>
              <th className="py-3 px-3.5 font-semibold">{t('Current Status', 'Current Status')}</th>
              <th className="py-3 px-3.5 font-semibold text-right">{t('Admin Action', 'Admin Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-dark-text-muted">
                  {t('No requests matching the selected filter or query.', 'No requests matching the selected filter or query.')}
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-dark-bg-secondary/60 transition-colors group"
                >
                  {/* Type & ID */}
                  <td className="py-3 px-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={cn('inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit', req.kindBadgeCls)}>
                        {req.kind === 'complaint' ? t('Citizen Report', 'Citizen Report') : t('MSME License', 'MSME License')}
                      </span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white text-[11px]">
                        {req.id}
                      </span>
                    </div>
                  </td>

                  {/* Subject / Product */}
                  <td className="py-3 px-3.5 max-w-xs">
                    <div className="font-semibold text-gray-900 dark:text-dark-text line-clamp-1">
                      {req.title}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-dark-text-muted line-clamp-1 mt-0.5">
                      {req.description}
                    </div>
                    {req.remarks && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-mono">
                        <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{t('Note:', 'Note:')} {req.remarks}</span>
                      </div>
                    )}
                  </td>

                  {/* Standard & Facility */}
                  <td className="py-3 px-3.5">
                    <div className="font-medium text-gray-800 dark:text-dark-text">
                      {req.standard}
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-dark-text-muted mt-0.5 truncate max-w-[180px]">
                      {req.locationOrFacility || t('General location', 'General location')}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-gray-500 dark:text-dark-text-muted text-[11px]">
                    {formatDate(req.date)}
                    {req.updated && (
                      <div className="text-[10px] text-gray-400">{t('Upd:', 'Upd:')} {formatDate(req.updated)}</div>
                    )}
                  </td>

                  {/* Current Status + Quick Dropdown */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(req.status)}

                      {/* Inline quick change dropdown */}
                      <select
                        value={req.status}
                        onChange={(e) => handleInlineStatusChange(req, e.target.value)}
                        className="text-[11px] bg-transparent hover:bg-gray-100 dark:hover:bg-dark-bg p-1 rounded border border-transparent hover:border-gray-300 dark:hover:border-dark-border text-gray-600 dark:text-dark-text-muted outline-none cursor-pointer"
                        title={t('Quickly change status directly from table', 'Quickly change status directly from table')}
                      >
                        {req.kind === 'complaint' ? (
                          <>
                            <option value="pending">{t('Pending', 'Pending')}</option>
                            <option value="in_progress">{t('In Progress', 'In Progress')}</option>
                            <option value="resolved">{t('Resolved', 'Resolved')}</option>
                            <option value="rejected">{t('Rejected', 'Rejected')}</option>
                          </>
                        ) : (
                          <>
                            <option value="pending">{t('Pending', 'Pending')}</option>
                            <option value="under_review">{t('Under Review', 'Under Review')}</option>
                            <option value="approved">{t('Approved', 'Approved')}</option>
                            <option value="rejected">{t('Rejected', 'Rejected')}</option>
                          </>
                        )}
                      </select>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenDossier(req)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 dark:bg-dark-bg-card hover:bg-bis-navy hover:text-white dark:hover:bg-blue-600 text-gray-700 dark:text-dark-text text-xs font-medium transition-colors border border-gray-200 dark:border-dark-border shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('Review Case', 'Review Case')}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detailed Case Dossier Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card border border-gray-200 dark:border-dark-border rounded-gov-xl max-w-2xl w-full shadow-gov-lg overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg-secondary/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-gov bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-dark-text font-heading">
                    {t('Official Case Dossier:', 'Official Case Dossier:')} {selectedItem.id}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">
                    <span>{t(selectedItem.kindLabel, selectedItem.kindLabel)}</span>
                    <span>•</span>
                    <span>{t('Submitter:', 'Submitter:')} {t(selectedItem.submitterRole, selectedItem.submitterRole)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Primary Info Grid */}
              <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-dark-bg-secondary p-4 rounded-gov border border-gray-100 dark:border-dark-border">
                <div>
                  <span className="text-gray-400 dark:text-dark-text-muted block text-[11px]">{t('Product / Article', 'Product / Article')}</span>
                  <strong className="text-sm text-gray-900 dark:text-dark-text block mt-0.5">{selectedItem.product}</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-dark-text-muted block text-[11px]">{t('Indian Standard (IS Code)', 'Indian Standard (IS Code)')}</span>
                  <strong className="text-sm text-gray-900 dark:text-dark-text block mt-0.5">{selectedItem.standard}</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-dark-text-muted block text-[11px]">{t('Facility / Purchase Location', 'Facility / Purchase Location')}</span>
                  <span className="text-gray-800 dark:text-dark-text block mt-0.5 font-medium">{selectedItem.locationOrFacility || t('Not specified', 'Not specified')}</span>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-dark-text-muted block text-[11px]">{t('Current Case Status', 'Current Case Status')}</span>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
              </div>

              {/* Case Subject & Narrative */}
              <div className="space-y-1.5">
                <label className="font-semibold text-gray-700 dark:text-dark-text block">{t('Case Subject / Title:', 'Case Subject / Title:')}</label>
                <div className="p-3 bg-white dark:bg-dark-bg rounded border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text">
                  {selectedItem.title}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-gray-700 dark:text-dark-text block">{t('Detailed Case Description / Inspection Request:', 'Detailed Case Description / Inspection Request:')}</label>
                <div className="p-3 bg-white dark:bg-dark-bg rounded border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text leading-relaxed whitespace-pre-wrap">
                  {selectedItem.description}
                </div>
              </div>

              {/* Official BIS Officer Notes / Remarks */}
              <div className="space-y-1.5 bg-blue-50/40 dark:bg-blue-950/20 p-4 rounded-gov border border-blue-200/50 dark:border-blue-800/40">
                <label className="font-bold text-gray-800 dark:text-dark-text flex items-center justify-between">
                  <span>{t('Official BIS Officer Remarks & Action Trail:', 'Official BIS Officer Remarks & Action Trail:')}</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">{t('Visible in real-time to applicant', 'Visible in real-time to applicant')}</span>
                </label>
                <textarea
                  rows={3}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="e.g., Factory inspection concluded. Product sample passed all mandatory testing parameters. Marking fee verified with MSME concession."
                  className="w-full p-2.5 rounded bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-bis-navy dark:focus:border-blue-500 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 dark:border-dark-border">
                <div className="font-semibold text-gray-700 dark:text-dark-text mb-2.5">
                  {t('Update Official Status & Sync to Applicant:', 'Update Official Status & Sync to Applicant:')}
                </div>
                
                {selectedItem.kind === 'complaint' ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveDossierStatus('in_progress')}
                      className="px-3 py-2 rounded-gov bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition-all"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {t('Mark In Progress (Investigating)', 'Mark In Progress (Investigating)')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveDossierStatus('resolved')}
                      className="px-3 py-2 rounded-gov bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('Resolve & Close Complaint', 'Resolve & Close Complaint')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveDossierStatus('rejected')}
                      className="px-3 py-2 rounded-gov bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 font-semibold border border-red-200 dark:border-red-800 flex items-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {t('Reject Report', 'Reject Report')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveDossierStatus('under_review')}
                      className="px-3 py-2 rounded-gov bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition-all"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {t('Mark Under Review (Factory Audit)', 'Mark Under Review (Factory Audit)')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveDossierStatus('approved')}
                      className="px-3 py-2 rounded-gov bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('Approve & Grant ISI License', 'Approve & Grant ISI License')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveDossierStatus('rejected')}
                      className="px-3 py-2 rounded-gov bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 font-semibold border border-red-200 dark:border-red-800 flex items-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {t('Reject Application', 'Reject Application')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-dark-bg-secondary border-t border-gray-100 dark:border-dark-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="btn-gov text-xs py-1.5 px-4"
              >
                {t('Close Dossier', 'Close Dossier')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
