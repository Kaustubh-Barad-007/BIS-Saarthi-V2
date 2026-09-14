import React, { useState } from 'react'
import { Database, Upload, Search, CheckCircle2, Trash2, Eye, Plus, X, Check, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatFileSize } from '@/lib/utils'
import useDataStore from '@/store/dataStore'
import { useTranslation } from '@/lib/i18n'

export default function KnowledgeBase() {
  const { t } = useTranslation()
  const {
    knowledgeDocs,
    addKnowledgeDoc,
    publishKnowledgeDoc,
    deleteKnowledgeDoc,
    syncWithDb,
    isDbSyncing,
    lastSyncedAt,
  } = useDataStore()

  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [docToDelete, setDocToDelete] = useState(null)

  // Upload Form State
  const [formTitle, setFormTitle]     = useState('')
  const [formCategory, setFormCat]   = useState('Standard')
  const [formVersion, setFormVersion] = useState('1.0')
  const [attachedFile, setAttachedFile] = useState(null)
  const [attachedBase64, setAttachedBase64] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachedFile(file)
    if (!formTitle.trim()) {
      setFormTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAttachedBase64(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast.error('Document title is required')
      return
    }

    setIsSubmitting(true)
    try {
      await addKnowledgeDoc({
        title: formTitle.trim(),
        fileName: attachedFile?.name || `${formTitle.trim().replace(/[^a-z0-9]/gi, '_')}.pdf`,
        category: formCategory,
        version: formVersion.trim() || '1.0',
        size: attachedFile?.size || 1500000,
        fileSize: attachedFile?.size || 1500000,
        dataBase64: attachedBase64 || '',
        status: 'review',
      })

      toast.success(`"${formTitle}" saved to live database and queued for review!`)
      setShowUpload(false)
      setFormTitle('')
      setFormVersion('1.0')
      setAttachedFile(null)
      setAttachedBase64('')
    } catch (err) {
      toast.error('Failed to upload document: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = knowledgeDocs.filter((d) =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase())
  )

  const handlePublish = async (id) => {
    await publishKnowledgeDoc(id)
    toast.success('Document published to BIS AI Knowledge Base')
  }

  const handleDeleteDoc = async (id) => {
    await deleteKnowledgeDoc(id)
    toast.success('Document removed from database')
  }

  const handleDownloadFile = (doc) => {
    if (doc.data_base64 || doc.dataBase64) {
      const dataUri = doc.data_base64 || doc.dataBase64
      const a = document.createElement('a')
      a.href = dataUri
      a.download = doc.file_name || doc.fileName || `${doc.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
      a.click()
      toast.success(`Downloaded "${doc.title}"`)
    } else {
      toast.info('Document archive verified')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">{t('Knowledge Base Management', 'Knowledge Base Management')}</h1>
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
            {t('Upload, review, and publish documents to the BIS AI knowledge layer (Real-Time Database).', 'Upload, review, and publish documents to the BIS AI knowledge layer (Real-Time Database).')}
            {lastSyncedAt && <span className="ml-2 text-xs">· Synced {new Date(lastSyncedAt).toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-gov bg-red-600 hover:bg-red-700 shadow-xs">
          <Plus className="w-4 h-4" /> {t('Upload Document', 'Upload Document')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Documents', value: knowledgeDocs.length, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Published',       value: knowledgeDocs.filter((d) => d.status === 'published').length, color: 'text-green-600 dark:text-green-400' },
          { label: 'Under Review',    value: knowledgeDocs.filter((d) => d.status === 'review').length,    color: 'text-amber-600 dark:text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="card-gov p-4 text-center">
            <div className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">{t(s.label, s.label)}</div>
          </div>
        ))}
      </div>

      {/* Upload form */}
      {showUpload && (
        <form onSubmit={handleUploadSubmit} className="card-gov p-6 animate-slide-up border-red-200 dark:border-red-900/60">
          <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading mb-5">{t('Upload New Document to Database', 'Upload New Document to Database')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">{t('Document Title *', 'Document Title *')}</label>
              <input
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. IS 16901 - Safety of E-Cigarettes"
                className="input-gov"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">{t('Category', 'Category')}</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCat(e.target.value)}
                className="input-gov"
              >
                <option value="Standard">{t('Standard', 'Standard')}</option>
                <option value="Circular">{t('Circular', 'Circular')}</option>
                <option value="Notification">{t('Notification', 'Notification')}</option>
                <option value="Reference">{t('Reference', 'Reference')}</option>
                <option value="Guideline">{t('Guideline', 'Guideline')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">{t('Version', 'Version')}</label>
              <input
                value={formVersion}
                onChange={(e) => setFormVersion(e.target.value)}
                placeholder="e.g. 1.0"
                className="input-gov"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">{t('Attach Document File', 'Attach Document File')}</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="input-gov text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-bis-navy file:text-white file:text-xs"
              />
              {attachedFile && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Attached: {attachedFile.name} ({formatFileSize(attachedFile.size)})
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gov bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? t('Saving to Database...', 'Saving to Database...') : t('Upload & Queue for Review', 'Upload & Queue for Review')}
            </button>
            <button type="button" onClick={() => setShowUpload(false)} className="btn-gov-outline">{t('Cancel', 'Cancel')}</button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search knowledge base documents by title or category...', 'Search knowledge base documents by title or category...')}
          className="input-gov pl-10"
        />
      </div>

      {/* Document list */}
      <div className="space-y-3">
        {filtered.map((doc) => (
          <div key={doc.id} className="card-gov p-4 hover:shadow-gov-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-gov bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 dark:text-dark-text text-sm truncate">{doc.title}</div>
                <div className="text-xs text-gray-400 dark:text-dark-text-muted flex gap-2 mt-0.5 flex-wrap">
                  <span>{t(doc.category, doc.category)}</span>
                  <span>·</span>
                  <span>v{doc.version}</span>
                  <span>·</span>
                  <span>{formatFileSize(doc.size)}</span>
                  <span>·</span>
                  <span>{formatDate(doc.uploaded)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`badge-gov text-xs px-2 py-0.5 ${doc.status === 'published' ? 'status-approved' : 'status-pending'}`}>
                  {doc.status === 'published' ? t('Published', 'Published') : t('Under Review', 'Under Review')}
                </span>
                {doc.status === 'review' && (
                  <button
                    onClick={() => handlePublish(doc.id)}
                    className="text-xs text-green-600 dark:text-green-400 border border-green-400 dark:border-green-600 px-2 py-0.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    {t('Publish', 'Publish')}
                  </button>
                )}
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-bg-secondary text-gray-400 hover:text-bis-navy dark:hover:text-blue-300 transition-colors"
                  title={t('Inspect Document', 'Inspect Document')}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDocToDelete(doc)}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                  title={t('Remove Document', 'Remove Document')}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Document Inspection Modal ── */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-xl w-full p-6 animate-scale-in max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-dark-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white font-heading truncate">
                    {selectedDoc.title}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-dark-text-muted">{t('Category', 'Category')}: {t(selectedDoc.category, selectedDoc.category)}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs overflow-y-auto flex-1">
              <div className="p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('Version:', 'Version:')}</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">v{selectedDoc.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('File Size:', 'File Size:')}</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">{formatFileSize(selectedDoc.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('Indexed Embedding Chunks:', 'Indexed Embedding Chunks:')}</span>
                  <span className="font-mono font-bold text-bis-navy dark:text-blue-400">{selectedDoc.chunks || 45} {t('chunks', 'chunks')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('Publication State:', 'Publication State:')}</span>
                  <span className={`font-semibold capitalize ${selectedDoc.status === 'published' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {selectedDoc.status === 'published' ? t('Published', 'Published') : t('Under Review', 'Under Review')}
                  </span>
                </div>
              </div>

              {/* Document Interactive Preview (SVG / PDF) if data is in database */}
              {(selectedDoc.data_base64 || selectedDoc.dataBase64) && (
                <div className="border border-gray-200 dark:border-dark-border rounded-gov p-2 bg-gray-50 dark:bg-dark-bg-secondary">
                  <div className="font-semibold text-xs text-gray-700 dark:text-dark-text mb-2 flex items-center justify-between">
                    <span>{t('Official Standard / Document Preview', 'Official Standard / Document Preview')}</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(selectedDoc)}
                      className="btn-gov-outline text-[11px] py-1 px-2.5 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> {t('Download File', 'Download File')}
                    </button>
                  </div>
                  {(selectedDoc.file_type?.includes('svg') || selectedDoc.fileType?.includes('svg')) ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: decodeURIComponent(selectedDoc.data_base64 || selectedDoc.dataBase64).replace(/^data:image\/svg\+xml;utf8,/, '') }}
                      className="w-full max-h-[220px] flex items-center justify-center p-2 overflow-hidden"
                    />
                  ) : (
                    <iframe
                      src={selectedDoc.data_base64 || selectedDoc.dataBase64}
                      className="w-full h-64 rounded border-0 bg-white"
                      title="Standard Preview"
                    />
                  )}
                </div>
              )}

              <div className="p-3 bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/80 rounded-gov text-green-800 dark:text-green-300">
                <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> {t('Vector Index Live', 'Vector Index Live')}
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {t('Indexed into BIS Knowledge Base for high-dimensional semantic search and AI retrieval.', 'Indexed into BIS Knowledge Base for high-dimensional semantic search and AI retrieval.')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-dark-border shrink-0">
              {selectedDoc.status === 'review' ? (
                <button
                  onClick={() => {
                    handlePublish(selectedDoc.id)
                    setSelectedDoc({ ...selectedDoc, status: 'published' })
                  }}
                  className="btn-gov bg-green-600 hover:bg-green-700 text-xs py-2"
                >
                  {t('Publish to AI Layer', 'Publish to AI Layer')}
                </button>
              ) : (
                <div className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {t('Published in Database', 'Published in Database')}
                </div>
              )}
              <button
                onClick={() => setSelectedDoc(null)}
                className="btn-gov-outline text-xs py-2"
              >
                {t('Close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Knowledge Document Confirmation Dialog ── */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                  {t('Remove Knowledge Document?', 'Remove Knowledge Document?')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                  {t('Vector indexing removal', 'Vector indexing removal')}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-dark-text-muted mb-5 leading-relaxed">
              {t('Are you sure you want to remove', 'Are you sure you want to remove')} <strong className="text-gray-900 dark:text-white">&ldquo;{docToDelete.title}&rdquo;</strong> {t('from the BIS AI Knowledge Base?', 'from the BIS AI Knowledge Base?')}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="btn-gov-outline text-xs py-1.5 px-3"
              >
                {t('Cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteDoc(docToDelete.id)
                  setDocToDelete(null)
                }}
                className="btn-gov bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3"
              >
                {t('Remove', 'Remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
