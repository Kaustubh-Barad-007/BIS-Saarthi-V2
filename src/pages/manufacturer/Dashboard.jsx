import React from 'react'
import {
  BadgeCheck, FileText, FlaskConical, MessageSquare,
  Clock, ArrowRight, CheckCircle2, RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import useDataStore from '@/store/dataStore'
import StatCard from '@/components/dashboard/StatCard'
import { ROUTES, COMPLIANCE_STEPS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

const STATUS_STYLE = {
  approved:     'status-approved',
  pending:      'status-pending',
  under_review: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  rejected:     'status-rejected',
}

export default function ManufacturerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { certifications, manufacturerDocs, syncWithDb, isDbSyncing, lastSyncedAt } = useDataStore()

  const activeCerts = certifications.filter((c) => c.status === 'approved').length
  const pendingCerts = certifications.filter((c) => c.status !== 'approved').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-gov-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-gov-md">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-bold font-heading">{t('Welcome', 'Welcome')}, {user?.name?.split(' ')[0]}!</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping inline-block" />
              <span>Live DB Synced (5s)</span>
            </span>
            <button
              onClick={() => syncWithDb()}
              disabled={isDbSyncing}
              title="Force sync now"
              className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDbSyncing ? 'animate-spin text-white' : ''}`} />
            </button>
          </div>
          <p className="text-orange-100 text-sm">
            {user?.organization || t('enterprise_portal_sub', 'Your Enterprise Portal · MSME / Manufacturer (Real-Time Database Live)')}
            {lastSyncedAt && <span className="ml-2 text-xs opacity-80">· Synced {new Date(lastSyncedAt).toLocaleTimeString()}</span>}
          </p>
        </div>
        <Link to={ROUTES.MANUFACTURER_CHAT} className="bg-white dark:bg-dark-bg-card text-orange-600 dark:text-orange-400 font-semibold text-sm px-4 py-2 rounded-gov hover:bg-orange-50 dark:hover:bg-dark-bg-secondary transition-colors inline-flex items-center justify-center gap-2 shadow-xs shrink-0 self-start sm:self-auto">
          <MessageSquare className="w-4 h-4" /> {t('ask_bis_saarthi', 'Ask BIS Saarthi')}
        </Link>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('Active Licenses', 'Active Licenses')}       value={activeCerts}  delta="+1"  color="green"  icon={BadgeCheck}  />
        <StatCard label={t('Pending Applications', 'Pending Applications')}  value={pendingCerts} delta={pendingCerts > 0 ? `+${pendingCerts}` : '0'} color="orange" icon={Clock}       />
        <StatCard label={t('Lab Reports Filed', 'Lab Reports Filed')}     value={8}            delta="+3"  color="blue"   icon={FlaskConical} />
        <StatCard label={t('Compliance Inquiries', 'Compliance Inquiries')}  value={t('Direct AI', 'Direct AI')}    delta="Live"  color="purple" icon={MessageSquare} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compliance Progress */}
        <div className="card-gov p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading">{t('Certification Journey', 'Certification Journey')}</h2>
            <Link to={ROUTES.MANUFACTURER_COMPLIANCE} className="text-xs text-orange-500 hover:underline flex items-center gap-1 font-medium">
              {t('Full Roadmap', 'Full Roadmap')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {COMPLIANCE_STEPS.map((step) => (
              <div key={step.id} className={cn(
                'flex items-center gap-3 p-3 rounded-gov border-l-4 transition-all',
                step.status === 'completed' ? 'border-green-500 bg-green-50/50 dark:bg-green-900/15' :
                step.status === 'current'   ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/15' :
                'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-secondary'
              )}>
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  step.status === 'completed' ? 'bg-green-500 text-white' :
                  step.status === 'current'   ? 'bg-orange-500 text-white' :
                  'bg-gray-200 dark:bg-dark-border text-gray-500 dark:text-dark-text-muted'
                )}>
                  {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <div className="flex-1">
                  <div className={cn('text-sm font-medium',
                    step.status === 'completed' ? 'text-green-700 dark:text-green-400' :
                    step.status === 'current'   ? 'text-orange-700 dark:text-orange-400' :
                    'text-gray-600 dark:text-dark-text-muted'
                  )}>{t(step.title, step.title)}</div>
                  <div className="text-xs text-gray-400 dark:text-dark-text-muted">{t(step.desc, step.desc)}</div>
                </div>
                {step.status === 'current' && (
                  <span className="badge-gov bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs">{t('Current', 'Current')}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Certifications Live Summary */}
        <div className="card-gov p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 dark:text-dark-text font-heading">{t('My Certifications', 'My Certifications')} ({t('Real-Time', 'Real-Time')})</h2>
            <Link to={ROUTES.MANUFACTURER_CERTIFICATION} className="text-xs text-orange-500 hover:underline flex items-center gap-1 font-medium">
              {t('Manage', 'Manage')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {certifications.slice(0, 3).map((cert) => (
              <div key={cert.id} className="p-3 border border-gray-100 dark:border-dark-border rounded-gov hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400 dark:text-dark-text-muted font-semibold">{cert.id}</span>
                  <span className={`badge-gov text-xs px-2 py-0.5 ${STATUS_STYLE[cert.status] || 'status-pending'}`}>
                    {t(cert.status, cert.status.replace('_', ' '))}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-800 dark:text-dark-text mt-1">{cert.product}</div>
                <div className="text-xs text-gray-400 dark:text-dark-text-muted flex items-center gap-3 mt-0.5">
                  <span>{t('Standard', 'Standard')}: {cert.standard || 'IS 374'}</span>
                  {cert.validity && <span>{t('Validity', 'Validity')}: {cert.validity}</span>}
                </div>
              </div>
            ))}
          </div>
          <Link to={ROUTES.MANUFACTURER_CERTIFICATION} className="btn-saffron w-full text-center text-sm mt-4 block py-2 shadow-xs">
            + {t('Apply for New License', 'Apply for New License')}
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('Ask BIS Saarthi', 'Ask BIS Saarthi'),   href: ROUTES.MANUFACTURER_CHAT,         icon: MessageSquare, color: 'text-blue-500'   },
          { label: t('New Certification', 'New Certification'),  href: ROUTES.MANUFACTURER_CERTIFICATION, icon: BadgeCheck,    color: 'text-green-500'  },
          { label: t('Full Roadmap', 'Full Roadmap'),    href: ROUTES.MANUFACTURER_COMPLIANCE,    icon: Clock,        color: 'text-orange-500' },
          { label: t('Upload Document', 'Upload Document'),   href: ROUTES.MANUFACTURER_DOCUMENTS,     icon: FileText,      color: 'text-purple-500' },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={label} to={href} className="card-gov p-4 flex items-center gap-3 hover:shadow-gov-md group transition-all">
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-dark-text group-hover:text-bis-navy dark:group-hover:text-blue-300 transition-colors">{label}</span>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-dark-border ml-auto group-hover:text-bis-navy dark:group-hover:text-blue-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
