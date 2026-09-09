import React, { useState } from 'react'
import { AlertTriangle, Plus, Clock, CheckCircle2, XCircle, FileText, X, Eye, ChevronRight, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import useDataStore from '@/store/dataStore'

export default function Complaints() {
  const { complaints, fileComplaint } = useDataStore()
  const [showForm, setShowForm] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = (data) => {
    const newComp = fileComplaint({
      subject: data.subject.trim(),
      product: data.product.trim(),
      location: data.location?.trim() || 'Not specified',
      description: data.description.trim(),
    })
    toast.success(`Complaint ${newComp.id} registered and saved in real-time database!`)
    reset()
    setShowForm(false)
  }

  const statusInfo = {
    resolved:    { label: 'Resolved',     icon: CheckCircle2, cls: 'status-approved' },
    in_progress: { label: 'In Progress',  icon: Clock,        cls: 'status-pending'  },
    rejected:    { label: 'Rejected',     icon: XCircle,      cls: 'status-rejected' },
    pending:     { label: 'Pending',      icon: Clock,        cls: 'status-pending'  },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">Consumer Complaints</h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">
            Report substandard products, misleading ISI claims, or violations of BIS standards.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-gov shadow-xs">
          <Plus className="w-4 h-4" /> File Complaint
        </button>
      </div>

      {/* File complaint form */}
      {showForm && (
        <div className="card-gov p-6 animate-slide-up border-orange-200 dark:border-orange-800/60">
          <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading mb-5">File New Quality Complaint</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Product Name *</label>
                <input
                  {...register('product', { required: 'Product name is required' })}
                  placeholder="e.g. Electric Fan, PVC Cable"
                  className="input-gov"
                />
                {errors.product && <p className="text-xs text-red-500 mt-1">{errors.product.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Purchase Location *</label>
                <input
                  {...register('location', { required: 'Location is required' })}
                  placeholder="City / State / Online Store"
                  className="input-gov"
                />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Complaint Subject *</label>
              <input
                {...register('subject', { required: 'Subject is required' })}
                placeholder="Brief summary of defect or BIS standard violation"
                className="input-gov"
              />
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Detailed Description *</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                placeholder="Describe the defect, quality failure, or fake ISI mark in detail..."
                className="input-gov"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Supporting Invoices / Photos</label>
              <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="input-gov text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-bis-navy file:text-white file:text-xs" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-gov">Submit to BIS Database</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-gov-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Complaints list */}
      <div className="card-gov p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading">
            My Registered Complaints ({complaints.length})
          </h2>
          <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">● Real-time sync</span>
        </div>
        {complaints.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-dark-text-muted">No complaints filed yet.</div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => {
              const { label, icon: Icon, cls } = statusInfo[c.status] || statusInfo.pending
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
                  <span className="text-gray-500 dark:text-dark-text-muted">Target Product:</span>
                  <div className="font-semibold text-gray-800 dark:text-dark-text">{selectedComplaint.product}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">Purchase Location:</span>
                  <div className="font-semibold text-gray-800 dark:text-dark-text">{selectedComplaint.location}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">Date Lodged:</span>
                  <div className="font-semibold text-gray-800 dark:text-dark-text">{formatDate(selectedComplaint.date)}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">Current Status:</span>
                  <div className="font-semibold uppercase text-xs text-orange-600 dark:text-orange-400">
                    {selectedComplaint.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-dark-text uppercase tracking-wider block mb-1">
                  Reported Issue Description
                </span>
                <p className="text-xs text-gray-600 dark:text-dark-text-muted p-3 bg-gray-50 dark:bg-dark-bg-secondary rounded-gov border border-gray-200 dark:border-dark-border leading-relaxed">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Official BIS Admin Remarks */}
              {selectedComplaint.remarks && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-gov animate-fade-in">
                  <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Official BIS Officer Decision Note
                  </div>
                  <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
                    "{selectedComplaint.remarks}"
                  </p>
                </div>
              )}

              {/* Dynamic Status Tracker Pipeline */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-dark-text uppercase tracking-wider block mb-2">
                  Investigation Pipeline
                </span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Complaint Lodged &amp; Verified in System
                  </div>
                  
                  {selectedComplaint.status === 'in_progress' ? (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      <Clock className="w-3.5 h-3.5 shrink-0 animate-spin" /> Assigned to Regional Branch Office for Inspection
                    </div>
                  ) : (selectedComplaint.status === 'resolved' || selectedComplaint.status === 'rejected') ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Regional Branch Inspection &amp; Evidence Audit Completed
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-dark-text-muted">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> Awaiting Branch Officer Assignment
                    </div>
                  )}

                  {selectedComplaint.status === 'resolved' ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-600" /> Enforcement Action Completed &amp; Case Resolved
                    </div>
                  ) : selectedComplaint.status === 'rejected' ? (
                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                      <XCircle className="w-3.5 h-3.5 shrink-0 text-red-500" /> Case Closed / Rejected by Authority
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-dark-text-muted">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> Enforcement Decision &amp; Resolution
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
                Close Tracking View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="card-gov p-5 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/70">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Complaint Redressal Process
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-400">
          <li>File complaint with product details and evidence</li>
          <li>BIS reviews within 7–10 working days</li>
          <li>Market surveillance team inspects manufacturer or distributor</li>
          <li>Action taken as per Bureau of Indian Standards Act, 2016</li>
          <li>You receive real-time resolution notifications</li>
        </ol>
        <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">National Consumer Helpline: 1800-11-4000 (Toll Free) | Email: bisind@bis.gov.in</p>
      </div>
    </div>
  )
}
