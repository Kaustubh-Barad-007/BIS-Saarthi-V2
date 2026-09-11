import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, ExternalLink, ChevronDown, ChevronUp, X, MessageSquare, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'
import { STANDARD_CATEGORIES, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default function Standards() {
  const navigate = useNavigate()
  const [search,  setSearch]  = useState('')
  const [catFilter, setCat]   = useState('')
  const [expanded, setExpanded] = useState(null)
  const [selectedStandard, setSelectedStandard] = useState(null)
  const [standards, setStandards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const url = search ? `/api/standards?search=${encodeURIComponent(search)}` : '/api/standards'
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.standards) {
          setStandards(data.standards)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [search])

  const filtered = standards.filter((s) => {
    const matchCat = !catFilter || s.category === catFilter
    return matchCat
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">Indian Standards Browser</h1>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">
          Browse and search 22,000+ Bureau of Indian Standards publications
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by IS number or title (e.g. IS 302, IS 1417)..."
            className="input-gov pl-10"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCat(e.target.value)}
          className="input-gov w-full sm:w-56"
        >
          <option value="">All Categories</option>
          {STANDARD_CATEGORIES.map((c) => (
            <option key={c.id} value={c.label}>{c.label} ({c.count})</option>
          ))}
        </select>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCat('')}
          className={cn(
            'badge-gov px-3 py-1 cursor-pointer transition-colors border text-xs',
            !catFilter
              ? 'bg-bis-navy text-white border-bis-navy dark:bg-blue-600 dark:border-blue-600'
              : 'bg-gray-100 text-gray-700 dark:bg-dark-bg-secondary dark:text-dark-text-muted dark:border-dark-border hover:bg-gray-200 dark:hover:bg-dark-bg-card'
          )}
        >
          All
        </button>
        {STANDARD_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.label)}
            className={cn(
              'badge-gov px-3 py-1 cursor-pointer transition-colors border text-xs',
              catFilter === c.label
                ? 'bg-bis-navy text-white border-bis-navy dark:bg-blue-600 dark:border-blue-600'
                : 'bg-gray-100 text-gray-700 dark:bg-dark-bg-secondary dark:text-dark-text-muted dark:border-dark-border hover:bg-gray-200 dark:hover:bg-dark-bg-card'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-3">
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">
          Showing {filtered.length} results {search && `for "${search}"`}
        </p>
        {filtered.map((std) => (
          <div key={std.id} className="card-gov p-4 hover:shadow-gov-md transition-all">
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpanded(expanded === std.id ? null : std.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-bis-navy dark:text-blue-400 text-sm font-mono">{std.id}</span>
                  <span className={cn('badge-gov text-xs px-2 py-0.5',
                    std.status === 'current' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  )}>
                    {std.status}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-800 dark:text-dark-text">{std.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-dark-text-muted">
                  <span>{std.category}</span>
                  <span>·</span>
                  <span>Year: {std.year}</span>
                </div>
              </div>
              <button className="p-1 text-gray-400 dark:text-dark-text-muted ml-3 shrink-0">
                {expanded === std.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            {expanded === std.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border animate-fade-in">
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-dark-text-muted mb-1">Technical Committee</p>
                    <p className="text-gray-700 dark:text-dark-text">{std.committee}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-dark-text-muted mb-1">ICS Code</p>
                    <p className="text-gray-700 dark:text-dark-text">{std.ics}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setSelectedStandard(std)}
                    className="btn-gov text-xs py-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> View Standard Details
                  </button>
                  <button
                    onClick={() => window.open('https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails', '_blank')}
                    className="btn-gov-outline text-xs py-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> BIS Portal
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Standard Details Modal ── */}
      {selectedStandard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-xl w-full p-6 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-bis-navy dark:text-blue-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-sm font-bold text-bis-navy dark:text-blue-400">
                    {selectedStandard.id}
                  </span>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white font-heading line-clamp-1">
                    {selectedStandard.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedStandard(null)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border text-xs">
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">Category:</span>
                  <div className="font-semibold text-gray-800 dark:text-dark-text">{selectedStandard.category}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">Status:</span>
                  <div className="font-semibold capitalize text-green-600 dark:text-green-400">{selectedStandard.status}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">ICS Code:</span>
                  <div className="font-mono font-semibold text-gray-800 dark:text-dark-text">{selectedStandard.ics}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">Publication Year:</span>
                  <div className="font-semibold text-gray-800 dark:text-dark-text">{selectedStandard.year}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 dark:text-dark-text-muted">Sectional Committee:</span>
                  <div className="font-semibold text-gray-800 dark:text-dark-text">{selectedStandard.committee}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-xs text-gray-700 dark:text-dark-text uppercase tracking-wider mb-1">Scope &amp; Technical Requirements</h4>
                <p className="text-xs text-gray-600 dark:text-dark-text-muted leading-relaxed bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-gov border border-blue-100 dark:border-blue-900/30">
                  {selectedStandard.scope}
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-gov text-xs text-amber-800 dark:text-amber-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Applicable for mandatory certification under Gazette QCO Regulations.</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-dark-border">
              <button
                onClick={() => window.open('https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails', '_blank')}
                className="btn-gov-outline text-xs py-2"
              >
                <ExternalLink className="w-3.5 h-3.5" /> BIS Portal Record
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedStandard(null)}
                  className="btn-gov-outline text-xs py-2"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigate(ROUTES.CONSUMER_CHAT)
                  }}
                  className="btn-gov text-xs py-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Ask AI About {selectedStandard.id}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
