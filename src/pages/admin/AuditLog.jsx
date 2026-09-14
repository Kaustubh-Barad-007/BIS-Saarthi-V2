import React, { useState } from 'react'
import { ClipboardList, Search, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import useDataStore from '@/store/dataStore'
import { useTranslation } from '@/lib/i18n'

const ACTION_COLOR = {
  UPLOAD:        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  QUERY:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  APPLY:         'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  DELETE:        'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  PUBLISH:       'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  LOGIN:         'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  USER_CREATE:   'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  USER_UPDATE:   'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  USER_ACTIVATE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800',
  USER_DEACTIVATE:'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800',
  COMPLAINT:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
  STATUS_CHANGE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
}

export default function AuditLog() {
  const { t } = useTranslation()
  const { auditLogs, syncWithDb, isDbSyncing, lastSyncedAt } = useDataStore()
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const filtered = auditLogs.filter((l) => {
    const q = search.toLowerCase()
    return (
      (!q || l.user.toLowerCase().includes(q) || l.resource.toLowerCase().includes(q) || l.action.toLowerCase().includes(q)) &&
      (!actionFilter || l.action === actionFilter)
    )
  })

  const handleExportCSV = () => {
    const headers = ['ID', 'User', 'Action', 'Resource', 'IP Address', 'Timestamp']
    const rows = filtered.map((l) => [
      l.id,
      `"${l.user}"`,
      l.action,
      `"${(l.resource || '').replace(/"/g, '""')}"`,
      l.ip || '10.0.0.1',
      `"${formatDateTime(l.time)}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `bis-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${filtered.length} audit records to CSV`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">{t('System Audit Log', 'System Audit Log')}</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live DB Synced (5s)
            </span>
            <button
              onClick={() => syncWithDb()}
              disabled={isDbSyncing}
              title="Force sync now"
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDbSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">
            {t('Real-time immutable trail of all administrative and user activities.', 'Real-time immutable trail of all administrative and user activities.')}
            {lastSyncedAt && <span className="ml-2 text-xs">· Synced {new Date(lastSyncedAt).toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={handleExportCSV} className="btn-gov-outline text-sm flex items-center gap-1.5 shadow-xs">
          <Download className="w-4 h-4" /> {t('Export CSV', 'Export CSV')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search by user, action, or affected resource...', 'Search by user, action, or affected resource...')}
            className="input-gov pl-10"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="input-gov w-full sm:w-44"
        >
          <option value="">{t('All Actions', 'All Actions')}</option>
          {['UPLOAD', 'QUERY', 'APPLY', 'DELETE', 'PUBLISH', 'LOGIN', 'USER_CREATE', 'USER_UPDATE', 'COMPLAINT'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Log table */}
      <div className="card-gov overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-bg-secondary border-b border-gray-100 dark:border-dark-border">
              <tr>
                {[
                  { key: 'id', label: '#' },
                  { key: 'user', label: t('User', 'User') },
                  { key: 'action', label: t('Action', 'Action') },
                  { key: 'resource', label: t('Resource', 'Resource') },
                  { key: 'ip', label: t('IP Address', 'IP Address') },
                  { key: 'time', label: t('Timestamp', 'Timestamp') },
                ].map((h) => (
                  <th key={h.key} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 dark:text-dark-text-muted">
                    {t('No matching audit records found.', 'No matching audit records found.')}
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-gray-400 dark:text-dark-text-muted">
                      #{log.id.toString().slice(-4)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-dark-text font-medium">{log.user}</td>
                    <td className="px-4 py-3">
                      <span className={`badge-gov text-[11px] px-2 py-0.5 font-mono ${ACTION_COLOR[log.action] || 'bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-text'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-dark-text-muted max-w-[260px] truncate" title={log.resource}>
                      {log.resource}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-dark-text-muted">{log.ip || '10.0.0.1'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-dark-text-muted whitespace-nowrap">
                      {formatDateTime(log.time)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-border text-xs text-gray-400 dark:text-dark-text-muted flex justify-between items-center">
          <span>{filtered.length} {t('entries shown · Database logs retained indefinitely', 'entries shown · Database logs retained indefinitely')}</span>
          <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">● {t('Real-time live', 'Real-time live')}</span>
        </div>
      </div>
    </div>
  )
}
