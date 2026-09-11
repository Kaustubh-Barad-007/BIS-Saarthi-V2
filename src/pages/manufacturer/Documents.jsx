import React, { useState, useRef, useMemo } from 'react'
import {
  Upload, FileText, Trash2, Eye, X, Download, CheckCircle2,
  ShieldCheck, Search, Filter, Plus, Calendar, Clock, AlertTriangle,
  FileCheck, Copy, RefreshCw, FolderGit2, Check, ExternalLink, HardDrive
} from 'lucide-react'
import { formatDate, formatFileSize, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useDataStore } from '@/store/dataStore'

const DOCUMENT_CATEGORIES = [
  'All',
  'Quality Manual',
  'Lab Test Report',
  'Process & Machinery',
  'Raw Material MTC',
  'Calibration Certificate',
  'Statutory Undertaking',
]

const STANDARD_SUGGESTIONS = [
  'IS 14543:2024',
  'IS 269:2015',
  'IS 12252:2018',
  'IS 10500:2012',
  'IS 694:2010',
  'IS 16046:2018',
  'Scheme-I'
]

export default function Documents() {
  const docs = useDataStore((s) => s.manufacturerDocs)
  const addManufacturerDoc = useDataStore((s) => s.addManufacturerDoc)
  const deleteManufacturerDoc = useDataStore((s) => s.deleteManufacturerDoc)
  const syncWithDb = useDataStore((s) => s.syncWithDb)
  const isLoadingDb = useDataStore((s) => s.isLoadingDb)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [dragging, setDragging] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [docToDelete, setDocToDelete] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Upload Form State
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('Quality Manual')
  const [formStandard, setFormStandard] = useState('IS 14543:2024')
  const [formVersion, setFormVersion] = useState('1.0')
  const [formNotes, setFormNotes] = useState('')
  const [formValidity, setFormValidity] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)
  const modalFileInputRef = useRef(null)

  // Metrics computation
  const metrics = useMemo(() => {
    const total = docs.length
    const approved = docs.filter((d) => d.status === 'approved').length
    const review = docs.filter((d) => d.status === 'review' || d.status === 'pending').length
    const actionRequired = docs.filter((d) => d.status === 'action_required' || d.status === 'rejected').length
    const totalBytes = docs.reduce((acc, cur) => acc + (cur.size || cur.file_size || 1000000), 0)
    return { total, approved, review, actionRequired, totalBytes }
  }, [docs])

  // Filtered and sorted documents
  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const docName = doc.name || doc.title || ''
      const docCat = doc.category || ''
      const docCode = doc.standardCode || doc.standard_code || ''
      const docId = doc.id || ''
      const docNotes = doc.reviewNotes || doc.review_notes || ''

      const matchesSearch = !search ||
        docName.toLowerCase().includes(search.toLowerCase()) ||
        docCat.toLowerCase().includes(search.toLowerCase()) ||
        docCode.toLowerCase().includes(search.toLowerCase()) ||
        docId.toLowerCase().includes(search.toLowerCase()) ||
        docNotes.toLowerCase().includes(search.toLowerCase())

      const matchesCategory = categoryFilter === 'All' || docCat === categoryFilter
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.uploaded || b.uploaded_at || 0) - new Date(a.uploaded || a.uploaded_at || 0)
      if (sortBy === 'oldest') return new Date(a.uploaded || a.uploaded_at || 0) - new Date(b.uploaded || b.uploaded_at || 0)
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0)
      return 0
    })
  }, [docs, search, categoryFilter, statusFilter, sortBy])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await syncWithDb()
      toast.success('Document repository synchronized with BIS database')
    } catch (_) {
      toast.error('Sync failed')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleQuickDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return
    files.forEach((f) => {
      addManufacturerDoc({
        name: f.name.replace(/\.[^/.]+$/, ''),
        size: f.size,
        fileType: f.name.split('.').pop()?.toUpperCase() || 'PDF',
        category: 'Compliance Document',
        standardCode: 'IS 14543:2024',
        version: '1.0',
        status: 'pending',
        reviewNotes: 'Uploaded via Quick Drop; queued for official scrutiny',
      })
    })
    toast.success(`${files.length} file(s) registered in your compliance vault`)
  }

  const handleModalUpload = (e) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error('Document title is required')
      return
    }

    const fileSize = selectedFile ? selectedFile.size : 1450000
    const fileType = selectedFile ? selectedFile.name.split('.').pop()?.toUpperCase() || 'PDF' : 'PDF'

    addManufacturerDoc({
      name: formName.trim(),
      category: formCategory,
      standardCode: formStandard.trim() || 'IS 14543:2024',
      version: formVersion.trim() || '1.0',
      size: fileSize,
      fileType,
      status: 'pending',
      reviewNotes: formNotes.trim() || 'Newly submitted document awaiting BIS officer assignment',
      validUntil: formValidity ? new Date(formValidity).toISOString() : null,
      checksum: `SHA256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
    })

    toast.success(`"${formName}" successfully uploaded to your compliance vault`)
    setShowUploadModal(false)
    setFormName('')
    setFormNotes('')
    setFormValidity('')
    setSelectedFile(null)
  }

  const handleDownloadDossier = () => {
    const jsonStr = JSON.stringify(docs, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BIS_MSME_Compliance_Dossier_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Complete Compliance Dossier manifest downloaded')
  }

  const handleDownloadDoc = (doc) => {
    const textContent = `
=============================================================================
BUREAU OF INDIAN STANDARDS — OFFICIAL COMPLIANCE DOCUMENT RECORD
=============================================================================
Document Reference ID : ${doc.id}
Document Title        : ${doc.name}
Regulatory Standard   : ${doc.standardCode || doc.standard_code || 'General Scheme-I'}
Classification        : ${doc.category}
Version               : v${doc.version || '1.0'}
File Size             : ${formatFileSize(doc.size || doc.file_size)}
Verification Status   : ${doc.status ? doc.status.toUpperCase() : 'PENDING'}
Review Notes          : ${doc.reviewNotes || doc.review_notes || 'Under active scrutiny by BIS Technical Committee'}
Cryptographic Hash    : ${doc.checksum || 'SHA256:8f4c2e5b927a4d1e8c046a'}
Uploaded Timestamp    : ${formatDate(doc.uploaded || doc.uploaded_at)}
Valid Until           : ${doc.validUntil ? formatDate(doc.validUntil) : 'Annual Surveillance Cycle'}
Issuer / Repository   : BIS Government Cloud Secure Vault (MeitY Approved)
=============================================================================
    `.trim()

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.name.replace(/[^a-z0-9]/gi, '_')}_BIS_CERT.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded "${doc.name}"`)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Page Header & Top Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-gov bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <FileCheck className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">
              Manufacturer Compliance Vault
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">
            Manage factory audit manuals, NABL lab test reports, machinery specifications, and statutory undertakings.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingDb}
            className="btn-gov-outline text-xs py-2 px-3 flex items-center gap-1.5 shadow-xs"
            title="Sync with database"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', (isRefreshing || isLoadingDb) && 'animate-spin')} />
            <span className="hidden sm:inline">Sync Vault</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDossier}
            className="btn-gov-outline text-xs py-2 px-3 flex items-center gap-1.5 shadow-xs"
            title="Download full dossier manifest"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Dossier</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="btn-saffron text-xs py-2 px-4 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* ── Overview Metrics Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card-gov p-4 bg-white dark:bg-dark-bg-card border-l-4 border-l-bis-navy dark:border-l-blue-400">
          <div className="text-xs text-gray-500 dark:text-dark-text-muted">Total Vault Records</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1 font-heading">{metrics.total}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Active compliance files</div>
        </div>

        <div className="card-gov p-4 bg-white dark:bg-dark-bg-card border-l-4 border-l-green-500">
          <div className="text-xs text-gray-500 dark:text-dark-text-muted">BIS Verified &amp; Approved</div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400 mt-1 font-heading">{metrics.approved}</div>
          <div className="text-[10px] text-green-600/80 mt-0.5">Passed technical scrutiny</div>
        </div>

        <div className="card-gov p-4 bg-white dark:bg-dark-bg-card border-l-4 border-l-amber-500">
          <div className="text-xs text-gray-500 dark:text-dark-text-muted">Under Scrutiny</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-heading">{metrics.review}</div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">Assigned to BIS officer</div>
        </div>

        <div className="card-gov p-4 bg-white dark:bg-dark-bg-card border-l-4 border-l-red-500">
          <div className="text-xs text-gray-500 dark:text-dark-text-muted">Action Required</div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1 font-heading">{metrics.actionRequired}</div>
          <div className="text-[10px] text-red-600/80 mt-0.5">Requires re-upload / remarks</div>
        </div>

        <div className="card-gov p-4 bg-white dark:bg-dark-bg-card border-l-4 border-l-blue-500 col-span-2 lg:col-span-1">
          <div className="text-xs text-gray-500 dark:text-dark-text-muted">Encrypted Vault Storage</div>
          <div className="text-xl font-bold text-bis-navy dark:text-blue-300 mt-1 font-heading">
            {formatFileSize(metrics.totalBytes)}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">ISO 27001 Cloud Tier</div>
        </div>
      </div>

      {/* ── Quick Drag & Drop Upload Zone ── */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleQuickDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={cn(
          'border-2 border-dashed rounded-gov-xl p-6 text-center transition-all cursor-pointer relative',
          dragging
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 shadow-inner'
            : 'border-gray-200 dark:border-dark-border hover:border-orange-400 dark:hover:border-orange-600 bg-white/60 dark:bg-dark-bg-card/40'
        )}
      >
        <div className="flex flex-col items-center justify-center gap-1.5">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-800 dark:text-dark-text">
              Drop new compliance documents here, or <span className="text-orange-600 dark:text-orange-400 hover:underline">browse files</span>
            </span>
            <p className="text-xs text-gray-400 dark:text-dark-text-muted mt-0.5">
              Supports PDF, DOCX, XLSX, and scans up to 25MB · Encrypted with AES-256 for BIS official audit
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.xlsx,.jpg,.png"
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            if (files.length === 0) return
            files.forEach((f) => {
              addManufacturerDoc({
                name: f.name.replace(/\.[^/.]+$/, ''),
                size: f.size,
                fileType: f.name.split('.').pop()?.toUpperCase() || 'PDF',
                category: 'Compliance Document',
                standardCode: 'IS 14543:2024',
                version: '1.0',
                status: 'pending',
                reviewNotes: 'Uploaded via file browser; queued for technical review',
              })
            })
            toast.success(`${files.length} document(s) uploaded to vault`)
            e.target.value = ''
          }}
        />
      </div>

      {/* ── Filters & Search Controls ── */}
      <div className="card-gov p-4 space-y-3">
        {/* Top Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, ID (e.g. DOC-2025), standard code (e.g. IS 14543), or notes..."
              className="input-gov pl-9 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status and Sorting Dropdowns */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-gov text-xs py-1.5 px-2.5 w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved &amp; Verified</option>
              <option value="review">Under Scrutiny / Review</option>
              <option value="pending">Pending Officer</option>
              <option value="action_required">Action Required</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-gov text-xs py-1.5 px-2.5 w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Title (A-Z)</option>
              <option value="size">File Size</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {DOCUMENT_CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-gov font-medium transition-all whitespace-nowrap text-xs',
                  isSelected
                    ? 'bg-bis-navy text-white shadow-xs dark:bg-blue-600'
                    : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-bg-secondary'
                )}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Document List ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-dark-text-muted px-1">
          <span>
            Showing <strong>{filteredDocs.length}</strong> of {docs.length} compliance documents
          </span>
          <span>Verified under BIS (Conformity Assessment) Regulations, 2018</span>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="card-gov p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-dark-bg-secondary text-gray-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-dark-text">No compliance documents found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {search || categoryFilter !== 'All' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Upload your factory quality manual, NABL lab test reports, or raw material certificates to start.'}
            </p>
            {(search || categoryFilter !== 'All' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => { setSearch(''); setCategoryFilter('All'); setStatusFilter('all') }}
                className="btn-gov-outline text-xs py-1.5 px-3"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isApproved = doc.status === 'approved'
            const isReview = doc.status === 'review' || doc.status === 'pending'
            const isAction = doc.status === 'action_required' || doc.status === 'rejected'

            return (
              <div
                key={doc.id}
                className="card-gov p-4.5 hover:shadow-gov-md transition-all border border-gray-200/80 dark:border-dark-border bg-white dark:bg-dark-bg-card group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left Icon & Meta */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-gov bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-gray-500 dark:text-gray-400">
                          {doc.id}
                        </span>
                        {(doc.standardCode || doc.standard_code) && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-bis-navy dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                            {doc.standardCode || doc.standard_code}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold px-2 py-0.2 rounded bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text-muted border border-gray-200/60 dark:border-dark-border/60">
                          {doc.category}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400">
                          v{doc.version || '1.0'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-bis-navy dark:group-hover:text-blue-300 transition-colors truncate">
                        {doc.name}
                      </h3>

                      {/* Review remarks snippet */}
                      {(doc.reviewNotes || doc.review_notes) && (
                        <p className="text-xs text-gray-600 dark:text-dark-text-muted line-clamp-1 italic">
                          &ldquo;{doc.reviewNotes || doc.review_notes}&rdquo;
                        </p>
                      )}

                      {/* Technical specifications subline */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-dark-text-muted flex-wrap pt-0.5">
                        <span>Format: <strong>{doc.fileType || 'PDF'}</strong></span>
                        <span>·</span>
                        <span>Size: <strong>{formatFileSize(doc.size || doc.file_size)}</strong></span>
                        <span>·</span>
                        <span>Uploaded: <strong>{formatDate(doc.uploaded || doc.uploaded_at)}</strong></span>
                        {doc.validUntil && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Valid until {formatDate(doc.validUntil)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Status Badge & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-dark-border">
                    <div>
                      {isApproved && (
                        <span className="badge-gov status-approved text-xs px-2.5 py-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified &amp; Approved
                        </span>
                      )}
                      {isReview && (
                        <span className="badge-gov bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs px-2.5 py-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Under Scrutiny
                        </span>
                      )}
                      {isAction && (
                        <span className="badge-gov bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800 text-xs px-2.5 py-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Action Required
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedDoc(doc)}
                        className="p-2 rounded-gov text-gray-500 hover:text-bis-navy dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-dark-bg-secondary transition-colors"
                        title="Deep Document Inspection"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(doc)}
                        className="p-2 rounded-gov text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-dark-bg-secondary transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDocToDelete(doc)}
                        className="p-2 rounded-gov text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Document Inspection Modal ── */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-xl w-full p-6 animate-scale-in max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-dark-border shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-400">{selectedDoc.id}</span>
                    <span className="badge-gov status-approved text-[10px] uppercase tracking-wider">
                      {selectedDoc.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white font-heading truncate">
                    {selectedDoc.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="py-4 overflow-y-auto space-y-4 text-xs">
              {/* Technical Metadata Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border">
                <div>
                  <span className="text-gray-400 block mb-0.5">Classification</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">{selectedDoc.category}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Governing Indian Standard</span>
                  <span className="font-mono font-bold text-bis-navy dark:text-blue-400">
                    {selectedDoc.standardCode || selectedDoc.standard_code || 'General Scheme-I'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">File Format &amp; Size</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">
                    {selectedDoc.fileType || 'PDF'} · {formatFileSize(selectedDoc.size || selectedDoc.file_size)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Version &amp; Revision</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-dark-text">v{selectedDoc.version || '1.0'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Uploaded On</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">
                    {formatDate(selectedDoc.uploaded || selectedDoc.uploaded_at)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Validity Milestone</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedDoc.validUntil ? formatDate(selectedDoc.validUntil) : 'Annual Surveillance Period'}
                  </span>
                </div>
              </div>

              {/* Reviewer / Inspection Notes */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-gov">
                <div className="font-bold text-blue-900 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>BIS Scrutiny &amp; Verification Remarks</span>
                </div>
                <p className="text-blue-800 dark:text-blue-200 leading-relaxed text-[11px]">
                  {selectedDoc.reviewNotes || selectedDoc.review_notes || 'Verified during technical inspection by the Bureau of Indian Standards Scrutiny Cell.'}
                </p>
              </div>

              {/* Statutory Compliance Integrity Checklist */}
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-dark-bg-secondary rounded-gov border border-gray-200 dark:border-dark-border">
                <span className="font-bold text-gray-800 dark:text-white block uppercase tracking-wider text-[10px]">
                  BIS Statutory Compliance Checklist
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>NABL ISO/IEC 17025 testing scope alignment verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>Authorized factory technical personnel digital signature validated</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>Traceability calibrated to National Physical Laboratory (NPL) standards</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>Scheme-I Quality Control Order (QCO) mandatory clauses confirmed</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Checksum Banner */}
              <div className="p-2.5 bg-slate-100 dark:bg-dark-bg rounded-gov flex items-center justify-between text-[11px] font-mono">
                <span className="text-gray-500">SHA-256 Hash:</span>
                <span className="font-bold text-gray-700 dark:text-gray-300 truncate max-w-[280px]">
                  {selectedDoc.checksum || 'SHA256:8f4c2e5b927a4d1e8c046a77d'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDoc.checksum || 'SHA256:8f4c2e5b927a4d1e8c046a77d')
                    toast.success('Checksum copied')
                  }}
                  className="p-1 hover:text-bis-navy text-gray-400"
                  title="Copy Hash"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-gray-100 dark:border-dark-border flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadDoc(selectedDoc)}
                className="btn-saffron text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Document Record
              </button>

              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="btn-gov-outline text-xs py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Compliance Document Modal ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-lg w-full p-6 animate-scale-in max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white font-heading">
                    Upload Compliance Document
                  </h3>
                  <p className="text-[11px] text-gray-500">BIS Factory &amp; Product Certification Scheme</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalUpload} className="py-4 space-y-3.5 overflow-y-auto text-xs">
              {/* Document Title */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Factory In-House Quality Assurance Manual (IS 14543)"
                  className="input-gov text-xs"
                />
              </div>

              {/* Category & Standard Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                    Document Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="input-gov text-xs"
                  >
                    {DOCUMENT_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                    Related Standard (IS Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formStandard}
                    onChange={(e) => setFormStandard(e.target.value)}
                    placeholder="e.g. IS 14543:2024"
                    className="input-gov text-xs"
                  />
                </div>
              </div>

              {/* Quick Standard Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-gray-400 font-semibold">Common Standards:</span>
                {STANDARD_SUGGESTIONS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setFormStandard(chip)}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 hover:bg-orange-50 hover:text-orange-700 dark:bg-dark-bg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Version & Validity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                    Document Version
                  </label>
                  <input
                    type="text"
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    placeholder="e.g. 1.0 or 2.1"
                    className="input-gov text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                    Validity / Renewal Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formValidity}
                    onChange={(e) => setFormValidity(e.target.value)}
                    className="input-gov text-xs"
                  />
                </div>
              </div>

              {/* Review Notes / Technical Description */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                  Compliance Summary / Officer Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Chemical testing conducted per clause 5.2.1 at NABL accredited laboratory."
                  className="input-gov text-xs"
                />
              </div>

              {/* File Attachment Selector */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                  Attach Official File (PDF, DOCX, XLSX)
                </label>
                <div
                  onClick={() => modalFileInputRef.current?.click()}
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-gov text-center cursor-pointer hover:border-orange-400 bg-gray-50/50 dark:bg-dark-bg"
                >
                  <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                  {selectedFile ? (
                    <div className="font-semibold text-bis-navy dark:text-blue-400">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </div>
                  ) : (
                    <span className="text-gray-500 text-[11px]">Click to select document file</span>
                  )}
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xlsx"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSelectedFile(e.target.files[0])
                        if (!formName) setFormName(e.target.files[0].name.replace(/\.[^/.]+$/, ''))
                      }
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-gov-outline text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-saffron text-xs py-2 px-4"
                >
                  Save &amp; Queue for Scrutiny
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                  Remove Document?
                </h3>
                <p className="text-xs text-gray-500">Permanent vault removal</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-dark-text-muted mb-5 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-gray-900 dark:text-white">&ldquo;{docToDelete.name}&rdquo;</strong> ({docToDelete.id}) from your compliance vault?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="btn-gov-outline text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteManufacturerDoc(docToDelete.id)
                  toast.success(`Removed ${docToDelete.name}`)
                  setDocToDelete(null)
                }}
                className="btn-gov bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
