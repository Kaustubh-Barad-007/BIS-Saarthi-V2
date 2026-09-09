import React, { useState } from 'react'
import { Database, Upload, Search, CheckCircle2, Trash2, Eye, Plus, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatFileSize } from '@/lib/utils'
import useDataStore from '@/store/dataStore'

export default function KnowledgeBase() {
  const {
    knowledgeDocs,
    addKnowledgeDoc,
    publishKnowledgeDoc,
    deleteKnowledgeDoc,
  } = useDataStore()

  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [docToDelete, setDocToDelete] = useState(null)

  // Upload Form State
  const [formTitle, setFormTitle]     = useState('')
  const [formCategory, setFormCat]   = useState('Standard')
  const [formVersion, setFormVersion] = useState('1.0')

  const handleUploadSubmit = (e) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast.error('Document title is required')
      return
    }

    addKnowledgeDoc({
      title: formTitle.trim(),
      category: formCategory,
      version: formVersion.trim() || '1.0',
      size: 1500000,
      status: 'review',
    })

    toast.success(`"${formTitle}" added to database and queued for review!`)
    setShowUpload(false)
    setFormTitle('')
    setFormVersion('1.0')
  }

  const filtered = knowledgeDocs.filter((d) =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase())
  )

  const handlePublish = (id) => {
    publishKnowledgeDoc(id)
    toast.success('Document published to BIS AI Knowledge Base')
  }

  const handleDeleteDoc = (id) => {
    deleteKnowledgeDoc(id)
    toast.success('Document removed from database')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">Knowledge Base Management</h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">
            Upload, review, and publish documents to the BIS AI knowledge layer (Real-Time Database).
          </p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-gov bg-red-600 hover:bg-red-700 shadow-xs">
          <Plus className="w-4 h-4" /> Upload Document
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
            <div className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upload form */}
      {showUpload && (
        <form onSubmit={handleUploadSubmit} className="card-gov p-6 animate-slide-up border-red-200 dark:border-red-900/60">
          <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading mb-5">Upload New Document to Database</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Document Title *</label>
              <input
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. IS 16901 - Safety of E-Cigarettes"
                className="input-gov"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCat(e.target.value)}
                className="input-gov"
              >
                <option>Standard</option>
                <option>Circular</option>
                <option>Notification</option>
                <option>Reference</option>
                <option>Guideline</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Version</label>
              <input
                value={formVersion}
                onChange={(e) => setFormVersion(e.target.value)}
                placeholder="e.g. 1.0"
                className="input-gov"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">Attach Document File</label>
              <input type="file" accept=".pdf,.doc,.docx" className="input-gov text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-bis-navy file:text-white file:text-xs" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button type="submit" className="btn-gov bg-red-600 hover:bg-red-700">Upload &amp; Queue for Review</button>
            <button type="button" onClick={() => setShowUpload(false)} className="btn-gov-outline">Cancel</button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search knowledge base documents by title or category..."
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
                  <span>{doc.category}</span>
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
                  {doc.status}
                </span>
                {doc.status === 'review' && (
                  <button
                    onClick={() => handlePublish(doc.id)}
                    className="text-xs text-green-600 dark:text-green-400 border border-green-400 dark:border-green-600 px-2 py-0.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    Publish
                  </button>
                )}
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-bg-secondary text-gray-400 hover:text-bis-navy dark:hover:text-blue-300 transition-colors"
                  title="Inspect Document"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDocToDelete(doc)}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove Document"
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
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white font-heading truncate">
                    {selectedDoc.title}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-dark-text-muted">Category: {selectedDoc.category}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">Version:</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">v{selectedDoc.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">File Size:</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">{formatFileSize(selectedDoc.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">Indexed Embedding Chunks:</span>
                  <span className="font-mono font-bold text-bis-navy dark:text-blue-400">{selectedDoc.chunks || 45} chunks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">Publication State:</span>
                  <span className={`font-semibold capitalize ${selectedDoc.status === 'published' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {selectedDoc.status}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/80 rounded-gov text-green-800 dark:text-green-300">
                <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Vector Index Live
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Indexed into BIS Knowledge Base for high-dimensional semantic search and AI retrieval.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
              {selectedDoc.status === 'review' ? (
                <button
                  onClick={() => {
                    handlePublish(selectedDoc.id)
                    setSelectedDoc({ ...selectedDoc, status: 'published' })
                  }}
                  className="btn-gov bg-green-600 hover:bg-green-700 text-xs py-2"
                >
                  Publish to AI Layer
                </button>
              ) : (
                <div className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Published in Database
                </div>
              )}
              <button
                onClick={() => setSelectedDoc(null)}
                className="btn-gov-outline text-xs py-2"
              >
                Close
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
                  Remove Knowledge Document?
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                  Vector indexing removal
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-dark-text-muted mb-5 leading-relaxed">
              Are you sure you want to remove <strong className="text-gray-900 dark:text-white">&ldquo;{docToDelete.title}&rdquo;</strong> from the BIS AI Knowledge Base?
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
                  handleDeleteDoc(docToDelete.id)
                  setDocToDelete(null)
                }}
                className="btn-gov bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
