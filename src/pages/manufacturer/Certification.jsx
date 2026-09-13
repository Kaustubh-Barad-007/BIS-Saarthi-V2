import React, { useState } from 'react'
import { BadgeCheck, Plus, Search, FlaskConical, Clock, CheckCircle2, AlertTriangle, X, Download, FileCheck, Eye, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'
import useDataStore from '@/store/dataStore'
import { useTranslation } from '@/lib/i18n'

const LABS = [
  { name: 'NABL Accredited Lab, Pune',    city: 'Pune',        state: 'Maharashtra', type: 'Electrotechnical', phone: '+91 20 2567 1122' },
  { name: 'BIS Regional Testing Lab',     city: 'New Delhi',   state: 'Delhi',       type: 'Multi-sector',     phone: '+91 11 2323 5432' },
  { name: 'National Metallurgical Lab',   city: 'Jamshedpur',  state: 'Jharkhand',   type: 'Metallurgical',    phone: '+91 657 2345 678' },
  { name: 'ERTL South India',             city: 'Bangalore',   state: 'Karnataka',   type: 'IT & Electronics', phone: '+91 80 2296 0100' },
]

const STATUS_BADGE = {
  approved:     'status-approved',
  pending:      'status-pending',
  under_review: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  rejected:     'status-rejected',
}

export default function Certification() {
  const { t } = useTranslation()
  const { certifications, applyCertification } = useDataStore()
  const [tab, setTab]               = useState('mine')
  const [showApply, setShowApply]   = useState(false)
  const [labSearch, setLabSearch]   = useState('')
  const [selectedCert, setSelectedCert] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    product: '',
    standard: '',
    category: 'Electrotechnical',
    lab: LABS[0].name,
  })

  const handleApplySubmit = (e) => {
    e.preventDefault()
    if (!formData.product.trim() || !formData.standard.trim()) {
      toast.error('Please enter product name and applicable standard')
      return
    }

    const newCert = applyCertification({
      product: formData.product.trim(),
      standard: formData.standard.trim(),
      category: formData.category,
      lab: formData.lab,
    })

    toast.success(`Application ${newCert.id} registered in real-time database! Sample collection scheduled.`)
    setShowApply(false)
    setFormData({ product: '', standard: '', category: 'Electrotechnical', lab: LABS[0].name })
    setTab('mine')
  }

  const filteredLabs = LABS.filter((l) => {
    const q = labSearch.toLowerCase()
    return !q || l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.state.toLowerCase().includes(q) || l.type.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">{t('BIS Certifications', 'BIS Certifications')}</h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">
            {t('Manage ISI Mark, CRS, and other BIS certifications for your manufacturing line.', 'Manage ISI Mark, CRS, and other BIS certifications for your manufacturing line.')}
          </p>
        </div>
        <button onClick={() => setShowApply(true)} className="btn-saffron text-sm shadow-xs">
          <Plus className="w-4 h-4" /> {t('Apply for New License', 'Apply for Certification')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-dark-border">
        {[
          { id: 'mine', label: `${t('My Certifications', 'My Certifications')} (${certifications.length})` },
          { id: 'labs', label: t('Lab Lookup Directory', 'Lab Lookup Directory') },
        ].map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={cn(
              'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === tabItem.id
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-semibold'
                : 'border-transparent text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text'
            )}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* ── My Certifications Tab ── */}
      {tab === 'mine' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-dark-text-muted">
            <span>Showing all active applications and granted licenses</span>
            <span className="text-green-600 dark:text-green-400 font-medium">● Real-time sync</span>
          </div>

          <div className="grid gap-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="card-gov p-5 hover:shadow-gov-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-bis-navy dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                          {cert.id}
                        </span>
                        <span className={`badge-gov text-xs px-2 py-0.5 ${STATUS_BADGE[cert.status] || 'status-pending'}`}>
                          {cert.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-dark-text-muted">· {cert.category}</span>
                      </div>
                      <h3 className="font-semibold text-sm text-gray-800 dark:text-dark-text">{cert.product}</h3>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-dark-text-muted flex-wrap">
                        <span>{t('Standard', 'Standard')}: <strong className="text-gray-700 dark:text-dark-text font-mono">{cert.standard || 'IS 374'}</strong></span>
                        <span>·</span>
                        <span>{t('Testing Lab', 'Testing Lab')}: {cert.lab}</span>
                        <span>·</span>
                        <span>{t('Applied Date', 'Applied')}: {formatDate(cert.applied)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="btn-gov-outline text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> {t('Details', 'Details')}
                    </button>
                    <button
                      onClick={() => toast.success(t(`Generating official certificate PDF for ${cert.id}...`, `Generating official certificate PDF for ${cert.id}...`))}
                      className="btn-gov text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> {t('Acknowledgement', 'Acknowledgement')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Labs Lookup Tab ── */}
      {tab === 'labs' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-text-muted" />
            <input
              value={labSearch}
              onChange={(e) => setLabSearch(e.target.value)}
              placeholder={t('Search accredited testing labs by city, state, or sector...', 'Search accredited testing labs by city, state, or sector...')}
              className="input-gov pl-10 pr-8"
            />
            {labSearch && (
              <button
                onClick={() => setLabSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {filteredLabs.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 dark:text-dark-text-muted">
              {t('No recognized labs match your search.', 'No recognized labs match your search.')}
              <br />
              <button onClick={() => setLabSearch('')} className="mt-2 text-orange-500 hover:underline font-semibold">
                {t('Clear filter', 'Clear filter')}
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredLabs.map((lab) => (
                <div key={lab.name} className="card-gov p-4 hover:shadow-gov-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <FlaskConical className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-800 dark:text-dark-text">{lab.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-dark-text-muted">{lab.city}, {lab.state}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="badge-gov bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5">
                          {t(lab.type, lab.type)}
                        </span>
                        <span className="font-mono text-xs text-gray-400 dark:text-dark-text-muted">{lab.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Apply Certification Modal ── */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white font-heading">{t('Apply for ISI Mark Certification', 'Apply for ISI Mark Certification')}</h3>
              </div>
              <button
                onClick={() => setShowApply(false)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Product Name', 'Product Name & Description')} *</label>
                <input
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  placeholder="e.g. Electric Storage Water Heater"
                  className="input-gov"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Applicable Indian Standard (IS Code)', 'Applicable Indian Standard (IS Code)')} *</label>
                <input
                  required
                  value={formData.standard}
                  onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                  placeholder="e.g. IS 2082:2018"
                  className="input-gov"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Product Category', 'Product Category')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-gov"
                  >
                    <option value="Electrotechnical">{t('Electrotechnical', 'Electrotechnical')}</option>
                    <option value="Mechanical">{t('Mechanical', 'Mechanical')}</option>
                    <option value="Chemical">{t('Chemical', 'Chemical')}</option>
                    <option value="Civil Engineering">{t('Civil Engineering', 'Civil Engineering')}</option>
                    <option value="Food & Agriculture">{t('Food & Agriculture', 'Food & Agriculture')}</option>
                    <option value="IT & Electronics">{t('IT & Electronics', 'IT & Electronics')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Assigned Testing Lab', 'Preferred Testing Lab')}</label>
                  <select
                    value={formData.lab}
                    onChange={(e) => setFormData({ ...formData, lab: e.target.value })}
                    className="input-gov"
                  >
                    {LABS.map((l) => (
                      <option key={l.name} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowApply(false)}
                  className="btn-gov-outline text-xs py-2"
                >
                  {t('Cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-saffron text-xs py-2"
                >
                  {t('Submit Application', 'Submit Application')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Certification Details Modal ── */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                    {selectedCert.id}
                  </span>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white font-heading">
                    {selectedCert.product}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('Standard / Scope', 'Standard / Scope')}:</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">{selectedCert.standard || 'IS 374'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('Assigned Lab', 'Assigned Lab')}:</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">{selectedCert.lab}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('Application Date', 'Application Date')}:</span>
                  <span className="font-semibold text-gray-800 dark:text-dark-text">{formatDate(selectedCert.applied)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-text-muted">{t('Validity / Status', 'Validity / Status')}:</span>
                  <span className={`font-semibold uppercase ${STATUS_BADGE[selectedCert.status] || 'text-amber-600 dark:text-amber-400'}`}>
                    {t(selectedCert.status, selectedCert.status.replace('_', ' '))}
                  </span>
                </div>
              </div>

              {/* Official BIS Admin Remarks */}
              {selectedCert.remarks && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-gov animate-fade-in">
                  <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    {t('Official BIS Officer Decision Note', 'Official BIS Officer Decision Note')}
                  </div>
                  <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
                    "{selectedCert.remarks}"
                  </p>
                </div>
              )}

              {/* Dynamic Status Explanation Banner */}
              {selectedCert.status === 'approved' ? (
                <div className="p-3 bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/80 rounded-gov text-green-800 dark:text-green-300">
                  <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> {t('License Granted & Authorized', 'License Granted & Authorized')}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {t('Official CM/L License active. You are granted statutory authorization to apply the ISI Mark to this certified product.', 'Official CM/L License active. You are granted statutory authorization to apply the ISI Mark to this certified product.')}
                  </p>
                </div>
              ) : selectedCert.status === 'rejected' ? (
                <div className="p-3 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/80 rounded-gov text-red-800 dark:text-red-300">
                  <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /> {t('Application Rejected by Authority', 'Application Rejected by Authority')}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {t('Application does not meet mandatory conformity criteria. Refer to officer remarks above for rectifications and resubmission.', 'Application does not meet mandatory conformity criteria. Refer to officer remarks above for rectifications and resubmission.')}
                  </p>
                </div>
              ) : selectedCert.status === 'under_review' ? (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800/80 rounded-gov text-blue-800 dark:text-blue-300">
                  <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {t('Technical Review & Lab Testing in Progress', 'Technical Review & Lab Testing in Progress')}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {t('Factory audit evaluation and laboratory sample tests are under review with the designated technical branch.', 'Factory audit evaluation and laboratory sample tests are under review with the designated technical branch.')}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/80 rounded-gov text-amber-800 dark:text-amber-300">
                  <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> {t('Application Pending Initial Screening', 'Application Pending Initial Screening')}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {t('Conformity assessment filed as per Scheme I of BIS (Conformity Assessment) Regulations, 2018. Awaiting officer allocation.', 'Conformity assessment filed as per Scheme I of BIS (Conformity Assessment) Regulations, 2018. Awaiting officer allocation.')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
              <button
                onClick={() => {
                  toast.success(t(`Downloading acknowledgement slip for ${selectedCert.id}...`, `Downloading acknowledgement slip for ${selectedCert.id}...`))
                }}
                className="btn-gov-outline text-xs py-2 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> {t('Download Slip', 'Download Slip')}
              </button>
              <button
                onClick={() => setSelectedCert(null)}
                className="btn-saffron text-xs py-2"
              >
                {t('Done', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
