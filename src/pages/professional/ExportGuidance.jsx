import React from 'react'
import { Globe, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react'

const EXPORT_SCHEMES = [
  { country: 'Germany',         standard: 'DIN Standards',        mutual: true,  note: 'MRA signed 2019'          },
  { country: 'USA',             standard: 'ANSI/UL Standards',    mutual: false, note: 'IECEE CB Scheme applies'  },
  { country: 'UK',              standard: 'BS Standards',         mutual: true,  note: 'BIS-BSI MoU in place'     },
  { country: 'Japan',           standard: 'JIS Standards',        mutual: false, note: 'Bilateral discussions ongoing' },
  { country: 'UAE',             standard: 'ESMA',                 mutual: true,  note: 'GCC mutual recognition'   },
  { country: 'Australia',       standard: 'AS Standards',         mutual: false, note: 'Apply through SAI Global' },
]

export default function ExportGuidance() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">Export Standards Guidance</h1>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">International standards mapping and mutual recognition agreements for exporters.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_SCHEMES.map((s) => (
          <div key={s.country} className="card-gov p-5 hover:shadow-gov-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-gray-800 dark:text-dark-text">{s.country}</h3>
              </div>
              {s.mutual && (
                <span className="badge-gov status-approved text-xs px-2 py-0.5">MRA</span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-dark-text-muted mb-2">{s.standard}</p>
            <p className="text-xs text-gray-400 dark:text-dark-text-muted">{s.note}</p>
            <button className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View Details <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="card-gov p-6">
        <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading mb-4">Key QCO (Quality Control Orders)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border">
                <th className="text-left py-2 font-semibold text-gray-600 dark:text-dark-text-muted">QCO</th>
                <th className="text-left py-2 font-semibold text-gray-600 dark:text-dark-text-muted">Sector</th>
                <th className="text-left py-2 font-semibold text-gray-600 dark:text-dark-text-muted">Effective Date</th>
                <th className="text-left py-2 font-semibold text-gray-600 dark:text-dark-text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { qco: 'Electronics QCO 2021', sector: 'Electronic Goods', date: '2021-10-01', status: 'active' },
                { qco: 'Toys QCO 2020',        sector: 'Toys & Games',    date: '2020-01-01', status: 'active' },
                { qco: 'Footwear QCO 2020',    sector: 'Footwear',        date: '2020-02-01', status: 'active' },
                { qco: 'Fertilizer QCO 2021',  sector: 'Agriculture',     date: '2021-04-01', status: 'active' },
              ].map((r) => (
                <tr key={r.qco} className="border-b border-gray-50 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-secondary dark:bg-dark-bg-secondary dark:hover:bg-dark-bg transition-colors">
                  <td className="py-2.5 font-medium text-gray-800 dark:text-dark-text">{r.qco}</td>
                  <td className="py-2.5 text-gray-600 dark:text-dark-text-muted">{r.sector}</td>
                  <td className="py-2.5 text-gray-600 dark:text-dark-text-muted">{r.date}</td>
                  <td className="py-2.5"><span className="badge-gov status-approved text-xs px-2 py-0.5">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
