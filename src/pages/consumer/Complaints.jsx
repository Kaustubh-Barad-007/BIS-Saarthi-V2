import React, { useState } from 'react'
import { AlertTriangle, Plus, Clock, CheckCircle2, XCircle, FileText, X, Eye, ChevronRight, Shield, ExternalLink, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import useDataStore from '@/store/dataStore'
import { useTranslation } from '@/lib/i18n'

export default function Complaints() {
  const { t } = useTranslation()
  const {
    complaints, fileComplaint, knowledgeDocs,
    lastSyncedAt, isLiveConnected, syncWithDb, isLoadingDb
  } = useDataStore()
  const [showForm, setShowForm] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    try {
      const newComp = await fileComplaint({
        subject: data.subject.trim(),
        product: data.product.trim(),
        location: data.location?.trim() || 'Not specified',
        description: data.description.trim(),
      })
      toast.success(`Complaint ${newComp?.id || ''} registered and saved in real-time database!`)
      reset()
      setShowForm(false)
    } catch (err) {
      toast.error('Failed to submit complaint. Please try again.')
    }
  }

  const statusInfo = {
    resolved:    { label: t('Resolved', 'Resolved'),     icon: CheckCircle2, cls: 'status-approved' },
    in_progress: { label: t('In Progress', 'In Progress'),  icon: Clock,        cls: 'status-pending'  },
    rejected:    { label: t('Rejected', 'Rejected'),     icon: XCircle,      cls: 'status-rejected' },
    pending:     { label: t('Pending', 'Pending'),      icon: Clock,        cls: 'status-pending'  },
    action_taken:{ label: t('Action Taken', 'Action Taken'), icon: CheckCircle2, cls: 'status-approved' },
    under_investigation: { label: t('Under Investigation', 'Under Investigation'), icon: Clock, cls: 'status-pending' }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">{t('Consumer Complaints', 'Consumer Complaints')}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-sm text-gray-500 dark:text-dark-text-muted">
              {t('Report substandard products, misleading ISI claims, or violations of BIS standards.', 'Report substandard products, misleading ISI claims, or violations of BIS standards.')}
            </p>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              Live DB Synced
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => syncWithDb()}
            disabled={isLoadingDb}
            className="btn-gov-outline text-xs p-2"
            title="Refresh database records now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-gov shadow-xs">
            <Plus className="w-4 h-4" /> {t('File Complaint', 'File Complaint')}
          </button>
        </div>
      </div>

      {/* File complaint form */}
      {showForm && (
        <div className="card-gov p-6 animate-slide-up border-orange-200 dark:border-orange-800/60">
          <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading mb-5">{t('File New Quality Complaint', 'File New Quality Complaint')}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">{t('Product Name', 'Product Name')} *</label>
                <input
                  {...register('product', { required: 'Product name is required' })}
                  placeholder="e.g. Electric Fan, PVC Cable"
                  className="input-gov"
                />
                {errors.product && <p className="text-xs text-red-500 mt-1">{errors.product.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">{t('Purchase Location', 'Purchase Location')} *</label>
                <input
                  {...register('location', { required: 'Location is required' })}
                  placeholder="City / State / Online Store"
                  className="input-gov"
                />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">{t('Complaint Subject', 'Complaint Subject')} *</label>
              <input
                {...register('subject', { required: 'Subject is required' })}
                placeholder="Brief summary of defect or BIS standard violation"
                className="input-gov"
              />
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">{t('Complaint Details', 'Complaint Details')} *</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                placeholder="Describe the defect, quality failure, or fake ISI mark in detail..."
                className="input-gov"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">{t('Supporting Invoices / Photos', 'Supporting Invoices / Photos')}</label>
              <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="input-gov text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-bis-navy file:text-white file:text-xs" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-gov">{t('Submit to BIS Database', 'Submit to BIS Database')}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-gov-outline">{t('Cancel', 'Cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Complaints list */}
      <div className="card-gov p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading">
            {t('My Registered Complaints', 'My Registered Complaints')} ({complaints.length})
          </h2>
          <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">● {t('Real-time sync', 'Real-time sync')}</span>
        </div>
        {complaints.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-text-muted">{t('No complaints filed yet.', 'No complaints filed yet.')}</div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => {
              const info = statusInfo[c.status] || statusInfo.pending
              const label = info.label
              const cls = info.cls
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedComplaint(c)}
                  className="flex items-center gap-4 p-4 border border-gray-100 dark:border-dark-border rounded-gov hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer group"
                >
                  <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 dark:text-dark-text group-hover:text-bis-navy dark:group-hover:text-blue-300 transition-colors">
                      {c.subject}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-dark-text-muted flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono font-semibold text-orange-500 dark:text-orange-400">{c.id}</span>
                      <span>·</span>
                      <span>{c.product}</span>
                      <span>·</span>
                      <span>{formatDate(c.date)}</span>
                    </div>
                  </div>
                  <span className={`badge-gov ${cls} text-xs px-2 py-0.5 shrink-0`}>{label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-dark-border group-hover:text-bis-navy dark:group-hover:text-blue-400 transition-colors shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Complaint Details Modal ── */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
              <div>
                <span className="text-xs font-mono font-bold text-orange-500 dark:text-orange-400">
                  {selectedComplaint.id}
                </span>
                <h3 className="font-bold text-base text-gray-900 dark:text-white font-heading">
                  {selectedComplaint.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border text-xs">
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('Product Name', 'Product Name')}:</span>
                  <div className="font-semibold text-gray-800 dark:text-dark-text">{selectedComplaint.product}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('Purchase Location', 'Purchase Location')}:</span>
                  <div className="font-semibold text-gray-800 dark:text-dark-text">{selectedComplaint.location}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('Date Filed', 'Date Filed')}:</span>
                  <div className="font-semibold text-gray-800 dark:text-dark-text">{formatDate(selectedComplaint.date)}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('Status', 'Status')}:</span>
                  <div className="font-semibold uppercase text-xs text-orange-600 dark:text-orange-400">
                    {t(selectedComplaint.status, selectedComplaint.status.replace('_', ' '))}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-dark-text uppercase tracking-wider block mb-1">
                  {t('Complaint Details', 'Complaint Details')}
                </span>
                <p className="text-xs text-gray-600 dark:text-dark-text-muted p-3 bg-gray-50 dark:bg-dark-bg-secondary rounded-gov border border-gray-200 dark:border-dark-border leading-relaxed">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Official Evidence link if available in database */}
              {(() => {
                const linkedDoc = (knowledgeDocs || []).find(d =>
                  (selectedComplaint.product && selectedComplaint.product.includes('Helmet') && d.id === 'DOC-IMG-HELMET')
                )
                if (!linkedDoc) return null
                return (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-gov flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                        {t('Official Seized Evidence Document Available', 'Official Seized Evidence Document Available')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(linkedDoc)}
                      className="btn-gov text-xs py-1 px-2.5 bg-amber-600 hover:bg-amber-700"
                    >
                      {t('Inspect', 'Inspect')}
                    </button>
                  </div>
                )
              })()}

              {/* Official BIS Admin Remarks */}
              {selectedComplaint.remarks && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-gov animate-fade-in">
                  <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    {t('Official BIS Officer Decision Note', 'Official BIS Officer Decision Note')}
                  </div>
                  <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
                    "{selectedComplaint.remarks}"
                  </p>
                </div>
              )}

              {/* Dynamic Status Tracker Pipeline */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-dark-text uppercase tracking-wider block mb-2">
                  {t('Investigation Pipeline', 'Investigation Pipeline')}
                </span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {t('Complaint Lodged & Verified in System', 'Complaint Lodged & Verified in System')}
                  </div>
                  
                  {selectedComplaint.status === 'in_progress' ? (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      <Clock className="w-3.5 h-3.5 shrink-0 animate-spin" /> {t('Assigned to Regional Branch Office for Inspection', 'Assigned to Regional Branch Office for Inspection')}
                    </div>
                  ) : (selectedComplaint.status === 'resolved' || selectedComplaint.status === 'rejected' || selectedComplaint.status === 'action_taken') ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {t('Regional Branch Inspection & Evidence Audit Completed', 'Regional Branch Inspection & Evidence Audit Completed')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-dark-text-muted">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> {t('Awaiting Branch Officer Assignment', 'Awaiting Branch Officer Assignment')}
                    </div>
                  )}

                  {selectedComplaint.status === 'resolved' || selectedComplaint.status === 'action_taken' ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-600" /> {t('Enforcement Action Completed & Case Resolved', 'Enforcement Action Completed & Case Resolved')}
                    </div>
                  ) : selectedComplaint.status === 'rejected' ? (
                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                      <XCircle className="w-3.5 h-3.5 shrink-0 text-red-500" /> {t('Case Closed / Rejected by Authority', 'Case Closed / Rejected by Authority')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-dark-text-muted">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> {t('Enforcement Decision & Resolution', 'Enforcement Decision & Resolution')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-dark-border">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="btn-gov text-xs py-2 px-4"
              >
                {t('Close Tracking View', 'Close Tracking View')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document / Evidence Preview Modal ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-xl w-full p-6 animate-scale-in flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white font-heading">{previewDoc.title || previewDoc.name}</h3>
                <span className="text-xs text-gray-500">{previewDoc.fileName || previewDoc.file_name}</span>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1 rounded text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 overflow-y-auto flex-1 flex items-center justify-center bg-gray-50 dark:bg-dark-bg-secondary rounded-gov mt-3">
              {previewDoc.dataBase64 || previewDoc.data_base64 ? (
                previewDoc.fileType?.includes('svg') || previewDoc.file_type?.includes('svg') ? (
                  <div dangerouslySetInnerHTML={{ __html: decodeURIComponent(previewDoc.dataBase64 || previewDoc.data_base64).replace(/^data:image\/svg\+xml;utf8,/, '') }} className="w-full max-h-[300px] flex items-center justify-center p-2" />
                ) : (
                  <iframe src={previewDoc.dataBase64 || previewDoc.data_base64} className="w-full h-80 rounded border-0" title="Dossier Preview" />
                )
              ) : (
                <p className="text-xs text-gray-500">{t('Document record verified in official BIS archive.', 'Document record verified in official BIS archive.')}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-dark-border mt-3">
              <button onClick={() => setPreviewDoc(null)} className="btn-gov text-xs py-2 px-4">
                {t('Close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="card-gov p-5 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/70">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" /> {t('Complaint Redressal Process', 'Complaint Redressal Process')}
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-400">
          <li>{t('File complaint with product details and evidence', 'File complaint with product details and evidence')}</li>
          <li>{t('BIS reviews within 7–10 working days', 'BIS reviews within 7–10 working days')}</li>
          <li>{t('Market surveillance team inspects manufacturer or distributor', 'Market surveillance team inspects manufacturer or distributor')}</li>
          <li>{t('Action taken as per Bureau of Indian Standards Act, 2016', 'Action taken as per Bureau of Indian Standards Act, 2016')}</li>
          <li>{t('You receive real-time resolution notifications', 'You receive real-time resolution notifications')}</li>
        </ol>
        <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">{t('National Consumer Helpline: 1800-11-4000 (Toll Free) | Email: bisind@bis.gov.in', 'National Consumer Helpline: 1800-11-4000 (Toll Free) | Email: bisind@bis.gov.in')}</p>
      </div>
    </div>
  )
}
