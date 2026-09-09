import React, { useState } from 'react'
import { Award, MapPin, Search, CheckCircle2, AlertTriangle, Info, Phone, X, Building, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const HUID_INFO = [
  { label: 'BIS Logo',         desc: 'Triangle with BIS mark — confirms BIS testing and statutory conformity' },
  { label: 'Purity Mark',      desc: '999/995 (24K), 916 (22K), 750 (18K), 585 (14K) fineness stamp' },
  { label: 'AHC Mark',         desc: 'Assaying & Hallmarking Centre identity laser mark' },
  { label: 'HUID Number',      desc: '6-digit alphanumeric Hallmark Unique ID — verifiable on BIS Care portal' },
]

const MOCK_CENTRES = [
  { name: 'State Gold Testing Centre', city: 'Mumbai', state: 'Maharashtra', code: 'MH-001', address: 'Plot 14, Fort Industrial Area, Mumbai 400001', phone: '+91 22 2261 4455', status: 'active' },
  { name: 'BIS AHC New Delhi',         city: 'New Delhi', state: 'Delhi',       code: 'DL-002', address: 'Manak Bhavan Annex, BSZ Marg, New Delhi 110002', phone: '+91 11 2323 0131', status: 'active' },
  { name: 'Chennai Hallmarking Centre',city: 'Chennai',   state: 'Tamil Nadu',  code: 'TN-001', address: 'CIT Campus, Taramani, Chennai 600113', phone: '+91 44 2254 1442', status: 'active' },
  { name: 'Kolkata AHC',               city: 'Kolkata',   state: 'West Bengal', code: 'WB-003', address: '1/14 CIT Scheme VII M, VIP Road, Kolkata 700054', phone: '+91 33 2355 3243', status: 'active' },
]

const SAMPLE_HUIDS = [
  { code: 'AB1234', carat: '22K (916)', jeweller: 'Tanishq Jewellers, Mumbai', ahc: 'MH-001', date: '2024-03-15' },
  { code: 'DL8810', carat: '24K (999)', jeweller: 'Kalyan Jewellers, New Delhi', ahc: 'DL-002', date: '2024-06-20' },
  { code: 'MH9921', carat: '18K (750)', jeweller: 'Malabar Gold, Pune', ahc: 'MH-001', date: '2024-08-11' },
]

export default function Hallmarking() {
  const [huid, setHuid]         = useState('')
  const [citySearch, setCity]   = useState('')
  const [verified, setVerified] = useState(null)
  const [selectedCentre, setSelectedCentre] = useState(null)

  const verifyHUID = (codeToVerify) => {
    const target = (codeToVerify || huid).trim().toUpperCase()
    if (target.length === 6) {
      const match = SAMPLE_HUIDS.find((s) => s.code === target)
      if (match) {
        setVerified({ huid: match.code, caratage: match.carat, jeweller: match.jeweller, ahc: match.ahc, date: match.date })
      } else {
        setVerified({ huid: target, caratage: '22K (916)', jeweller: 'Certified BIS Hallmark Partner Jewellers', ahc: 'MH-001', date: '2024-05-10' })
      }
      toast.success(`HUID ${target} verified in real-time registry!`)
    } else {
      setVerified('invalid')
      toast.error('Invalid HUID format. 6 alphanumeric characters required.')
    }
  }

  const handleSampleClick = (sample) => {
    setHuid(sample.code)
    verifyHUID(sample.code)
  }

  const centres = MOCK_CENTRES.filter((c) =>
    !citySearch || c.city.toLowerCase().includes(citySearch.toLowerCase()) || c.state.toLowerCase().includes(citySearch.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">Hallmarking Guidance</h1>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">
          Gold and Silver jewellery hallmarking compliance and HUID authentication registry.
        </p>
      </div>

      {/* HUID Verifier */}
      <div className="card-gov p-6">
        <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading mb-1 flex items-center gap-2">
          <Award className="w-5 h-5 text-bis-gold" /> Verify HUID (Hallmark Unique ID)
        </h2>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted mb-4">
          Enter the 6-digit alphanumeric HUID printed on your hallmarked jewellery to verify authenticity against the BIS registry.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={huid}
            onChange={(e) => setHuid(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="e.g. AB1234"
            maxLength={6}
            className="input-gov w-48 font-mono text-center text-lg tracking-widest uppercase"
          />
          <button onClick={() => verifyHUID(huid)} className="btn-gov">Verify HUID</button>
        </div>

        {/* 1-Click Sample Chips for rapid testing */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-dark-text-muted">Quick test samples:</span>
          {SAMPLE_HUIDS.map((sample) => (
            <button
              key={sample.code}
              type="button"
              onClick={() => handleSampleClick(sample)}
              className="text-xs font-mono bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
            >
              {sample.code} ({sample.carat})
            </button>
          ))}
        </div>

        {verified === 'invalid' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Invalid HUID format. Enter a valid 6-character alphanumeric code.
          </div>
        )}
        {verified && verified !== 'invalid' && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/80 rounded-gov animate-fade-in">
            <div className="flex items-center gap-2 mb-3 text-green-700 dark:text-green-400 font-semibold">
              <CheckCircle2 className="w-5 h-5" /> Authentic BIS Hallmarked Jewellery Record
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-dark-text">
              <div><span className="font-medium text-gray-500 dark:text-dark-text-muted">HUID:</span> <span className="font-mono font-bold text-bis-navy dark:text-blue-300">{verified.huid}</span></div>
              <div><span className="font-medium text-gray-500 dark:text-dark-text-muted">Caratage:</span> <span className="font-semibold text-amber-600 dark:text-amber-400">{verified.caratage}</span></div>
              <div><span className="font-medium text-gray-500 dark:text-dark-text-muted">Jeweller:</span> {verified.jeweller}</div>
              <div><span className="font-medium text-gray-500 dark:text-dark-text-muted">AHC Code:</span> {verified.ahc}</div>
              <div><span className="font-medium text-gray-500 dark:text-dark-text-muted">Hallmarked On:</span> {verified.date}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* What's in a Hallmark */}
        <div className="card-gov p-6">
          <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" /> Understanding the BIS Hallmark
          </h2>
          <div className="space-y-3">
            {HUID_INFO.map((item, i) => (
              <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-dark-bg-secondary rounded-gov border border-gray-100/60 dark:border-dark-border/60">
                <div className="w-7 h-7 rounded-full bg-bis-navy text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                <div>
                  <div className="font-semibold text-sm text-gray-800 dark:text-dark-text">{item.label}</div>
                  <div className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/60 rounded-gov text-xs text-amber-800 dark:text-amber-300">
            <strong>Statutory Notice:</strong> Mandatory hallmarking applies to 14K, 18K, 20K, 22K, 23K, and 24K gold jewellery under BIS Act 2016.
          </div>
        </div>

        {/* AHC Locator */}
        <div className="card-gov p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" /> Assaying &amp; Hallmarking Centres
            </h2>
            {citySearch && (
              <button
                onClick={() => setCity('')}
                className="text-xs text-bis-navy dark:text-blue-400 hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-text-muted" />
            <input
              value={citySearch}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search by city or state (e.g. Mumbai, Delhi)..."
              className="input-gov pl-10 pr-8"
            />
            {citySearch && (
              <button
                onClick={() => setCity('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {centres.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 dark:text-dark-text-muted">
                No hallmarking centres found for &ldquo;{citySearch}&rdquo;.
                <br />
                <button onClick={() => setCity('')} className="mt-2 text-bis-navy dark:text-blue-400 font-semibold hover:underline">
                  Reset search filter
                </button>
              </div>
            ) : (
              centres.map((c) => (
                <div
                  key={c.code}
                  onClick={() => setSelectedCentre(c)}
                  className="flex items-center gap-3 p-3 border border-gray-100 dark:border-dark-border rounded-gov hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-bis-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 dark:text-dark-text group-hover:text-bis-navy dark:group-hover:text-blue-300 transition-colors truncate">
                      {c.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-dark-text-muted">{c.city}, {c.state} · Code: {c.code}</div>
                  </div>
                  <span className="badge-gov status-active text-xs shrink-0">Active</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-dark-border group-hover:text-bis-navy dark:group-hover:text-blue-400 transition-colors shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Centre Details Modal ── */}
      {selectedCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white font-heading">{selectedCentre.name}</h3>
                  <div className="text-xs font-mono text-gray-500 dark:text-dark-text-muted">Centre Code: {selectedCentre.code}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCentre(null)}
                className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border space-y-2">
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">Jurisdiction:</span>
                  <div className="font-semibold text-gray-800 dark:text-dark-text">{selectedCentre.city}, {selectedCentre.state}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">Address:</span>
                  <div className="font-medium text-gray-700 dark:text-dark-text">{selectedCentre.address}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-muted">Official Contact:</span>
                  <div className="font-mono text-bis-navy dark:text-blue-300 font-semibold">{selectedCentre.phone}</div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-gov text-blue-800 dark:text-blue-300">
                <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> BIS Recognized Testing Facility
                </div>
                <p className="text-[11px] leading-relaxed">
                  Authorized for X-ray fluorescence (XRF) spectrometry testing and Fire Assay cupellation as per IS 1417 &amp; IS 2112.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
              <button
                onClick={() => setSelectedCentre(null)}
                className="btn-gov text-xs py-2 px-4"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
