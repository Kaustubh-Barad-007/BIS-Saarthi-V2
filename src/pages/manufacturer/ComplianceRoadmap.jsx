import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, ArrowRight, MessageSquare, Sparkles, Check, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { COMPLIANCE_STEPS, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

export default function ComplianceRoadmap() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [steps, setSteps] = useState(COMPLIANCE_STEPS)

  const completedCount = steps.filter((s) => s.status === 'completed').length
  const progressPercent = Math.round((completedCount / steps.length) * 100)

  const toggleStep = (stepId) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === stepId) {
          const nextStatus = s.status === 'completed' ? 'pending' : 'completed'
          toast.success(`${t('Step')} ${stepId} ${nextStatus === 'completed' ? t('Completed') : t('Pending')}!`)
          return { ...s, status: nextStatus }
        }
        return s
      })
    )
  }

  const setAsCurrent = (stepId) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === stepId) return { ...s, status: 'current' }
        if (s.status === 'current') return { ...s, status: 'pending' }
        return s
      })
    )
    toast.info(`${t('Step')} ${stepId} ${t('Active Milestone')}`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">{t('ISI Mark Compliance Roadmap', 'ISI Mark Compliance Roadmap')}</h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">{t('Interactive milestone tracker to achieve BIS ISI Mark certification.', 'Interactive milestone tracker to achieve BIS ISI Mark certification.')}</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.MANUFACTURER_CHAT)}
          className="btn-saffron text-sm flex items-center gap-1.5 shrink-0"
        >
          <MessageSquare className="w-4 h-4" /> {t('Consult AI Assistant', 'Consult AI Assistant')}
        </button>
      </div>

      {/* Progress Card */}
      <div className="card-gov p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">{t('Overall Compliance Progress', 'Overall Compliance Progress')}</span>
          </div>
          <span className="font-mono text-sm font-bold text-orange-600 dark:text-orange-400">
            {completedCount} {t('of')} {steps.length} {t('Steps')} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-dark-border h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="card-gov p-6">
        <div className="relative">
          <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-dark-border" />
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.id} className="relative flex gap-5">
                {/* Connector dot */}
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  title={`${t('Step')} ${step.id}`}
                  className={cn(
                    'w-14 h-14 rounded-full border-4 flex items-center justify-center shrink-0 z-10 font-bold text-sm transition-all cursor-pointer',
                    step.status === 'completed' ? 'border-green-500 bg-green-500 text-white hover:scale-105' :
                    step.status === 'current'   ? 'border-orange-500 bg-orange-500 text-white shadow-lg scale-110' :
                    'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-card text-gray-400 dark:text-dark-text-muted hover:border-orange-400'
                  )}
                >
                  {step.status === 'completed'
                    ? <CheckCircle2 className="w-7 h-7" />
                    : <span>{step.id}</span>
                  }
                </button>
                <div className={cn(
                  'flex-1 rounded-gov-xl p-4 border-2 mb-0 transition-colors',
                  step.status === 'completed' ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' :
                  step.status === 'current'   ? 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10' :
                  'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-bg-card'
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3 className={cn('font-bold font-heading text-sm sm:text-base',
                        step.status === 'completed' ? 'text-green-700 dark:text-green-400' :
                        step.status === 'current'   ? 'text-orange-700 dark:text-orange-400' :
                        'text-gray-700 dark:text-dark-text'
                      )}>
                        {t('Step')} {step.id}: {t(step.title, step.title)}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-muted mt-1">{t(step.desc, step.desc)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {step.status === 'current' && (
                        <span className="badge-gov bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
                          ● {t('Active Milestone', 'Active Milestone')}
                        </span>
                      )}
                      {step.status === 'completed' && (
                        <span className="badge-gov status-approved text-xs">{t('Completed', 'Completed')}</span>
                      )}
                    </div>
                  </div>

                  {step.status === 'current' && (
                    <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-2">{t('Required Actions:', 'Required Actions:')}</p>
                      <ul className="text-xs text-gray-600 dark:text-dark-text-muted space-y-1">
                        <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-orange-400" /> {t('Submit application on BIS Connect portal', 'Submit application on BIS Connect portal')}</li>
                        <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-orange-400" /> {t('Upload factory layout and process flow diagram', 'Upload factory layout and process flow diagram')}</li>
                        <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-orange-400" /> {t('Attach NABL lab test reports', 'Attach NABL lab test reports')}</li>
                      </ul>
                    </div>
                  )}

                  {/* Interactive Action Bar */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id)}
                      className="btn-gov-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      {step.status === 'completed' ? (
                        <><RotateCcw className="w-3.5 h-3.5" /> {t('Reopen Step', 'Reopen Step')}</>
                      ) : (
                        <><Check className="w-3.5 h-3.5 text-green-500" /> {t('Mark as Done', 'Mark as Done')}</>
                      )}
                    </button>

                    {step.status !== 'current' && step.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => setAsCurrent(step.id)}
                        className="text-xs text-orange-600 dark:text-orange-400 hover:underline px-2"
                      >
                        {t('Set as Current Milestone', 'Set as Current Milestone')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.MANUFACTURER_CHAT)}
                      className="text-xs text-bis-navy dark:text-blue-400 hover:underline flex items-center gap-1 ml-auto"
                    >
                      <MessageSquare className="w-3 h-3" /> {t('Ask BIS Saarthi about Step', 'Ask BIS Saarthi about Step')} {step.id} &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-gov p-5 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">📋 {t('Key Documents Required', 'Key Documents Required')}</h3>
        <ul className="grid sm:grid-cols-2 gap-1 text-sm text-blue-700 dark:text-blue-400">
          {['Factory Registration Certificate', 'Product drawings / specifications', 'NABL accredited lab test reports', 'Quality Control Manual', 'List of manufacturing equipment', 'Organizational chart with QC personnel'].map((doc) => (
            <li key={doc} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{t(doc, doc)}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
