import React, { useState, useRef } from 'react'
import { Upload, FileText, Trash2, Eye, X, Download, CheckCircle2, ShieldCheck } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'
import { toast } from 'sonner'
import { useDataStore } from '@/store/dataStore'

export default function Documents() {
  const docs = useDataStore((s) => s.manufacturerDocs)
  const addManufacturerDoc = useDataStore((s) => s.addManufacturerDoc)
  const deleteManufacturerDoc = useDataStore((s) => s.deleteManufacturerDoc)
  const [dragging, setDragging] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [docToDelete, setDocToDelete] = useState(null)
  const fileInputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return
    files.forEach((f) => {
      addManufacturerDoc({
        name: f.name,
        size: f.size,
        type: 'Uploaded Document',
      })
    })
    toast.success(`${files.length} file(s) uploaded successfully`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">Document Management</h1>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Upload and manage your certification documents, lab reports, and product specs.</p>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={`border-2 border-dashed rounded-gov-xl p-10 text-center transition-all cursor-pointer ${
          dragging
            ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10'
            : 'border-gray-200 dark:border-dark-border hover:border-orange-300 dark:hover:border-orange-700'
        }`}
      >
        <Upload className="w-10 h-10 text-gray-300 dark:text-dark-text-muted mx-auto mb-3" />
        <p className="font-semibold text-gray-600 dark:text-dark-text">Drag & drop files here</p>
        <p className="text-sm text-gray-400 dark:text-dark-text-muted mt-1">or click anywhere to browse — PDF, DOC, XLSX accepted</p>
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
                name: f.name,
                size: f.size,
                type: 'Uploaded Document',
              })
            })
            toast.success(`${files.length} file(s) uploaded`)
            e.target.value = ''
          }}
        />
      </div>

      {/* Documents list */}
      <div className="card-gov p-5">
        <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading mb-4">Uploaded Documents ({docs.length})</h2>
        <div className="space-y-3">
          {docs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-dark-text-muted text-sm">
              No documents uploaded yet. Drag and drop or browse above.
            </div>
          ) : (
            docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 p-3 border border-gray-100 dark:border-dark-border rounded-gov bg-white dark:bg-dark-bg-secondary/40 hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors group">
                <div className="w-9 h-9 rounded-gov bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-dark-text truncate">{doc.name}</div>
                <div className="text-xs text-gray-400 dark:text-dark-text-muted flex gap-2 mt-0.5">
                  <span>{doc.type}</span>
                  <span>·</span>
                  <span>{formatFileSize(doc.size)}</span>
                  <span>·</span>
                  <span>{formatDate(doc.uploaded)}</span>
                </div>
              </div>
              <span className={`badge-gov text-xs px-2 py-0.5 shrink-0 ${
                doc.status === 'approved' ? 'status-approved' : 'status-pending'
              }`}>{doc.status}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
                  title="View Document Details"
                >
                  <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-dark-text-muted" />
                </button>
                <button
                  onClick={() => setDocToDelete(doc)}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      {/* ── Document Inspection Modal ── */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white font-heading truncate">
                    {selectedDoc.name}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-dark-text-muted">Type: {selectedDoc.type}</div>
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
                  <span className="text-gray-400">File Size:</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">{formatFileSize(selectedDoc.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Uploaded On:</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">{formatDate(selectedDoc.uploaded)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Review Status:</span>
                  <span className={`font-semibold capitalize ${selectedDoc.status === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>
                    {selectedDoc.status}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-gov text-blue-800 dark:text-blue-300">
                <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> BIS Encrypted Document Storage
                </div>
                <p className="text-[11px] leading-relaxed">
                  Cryptographically secured in accordance with ISO/IEC 27001 standards and stored in BIS Government Cloud.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
              <button
                onClick={() => {
                  toast.success(`Downloading ${selectedDoc.name}...`)
                }}
                className="btn-gov-outline text-xs py-2 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download File
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
                className="btn-gov text-xs py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Document Confirmation Dialog ── */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                  Delete Document?
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                  Permanent removal
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-dark-text-muted mb-5 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-gray-900 dark:text-white">&ldquo;{docToDelete.name}&rdquo;</strong> from your compliance vault?
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
                  toast.success(`Deleted ${docToDelete.name}`)
                  setDocToDelete(null)
                }}
                className="btn-gov bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
