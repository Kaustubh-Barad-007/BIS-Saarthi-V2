import React, { useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MessageSquare, Shield, BookOpen, Award, ChevronRight,
  Building2, User, ArrowRight, CheckCircle2,
  BarChart3, Zap, Globe, Sparkles, HelpCircle, FileCheck2
} from 'lucide-react'
import { toast } from 'sonner'
import useAuthStore from '@/store/authStore'
import { BIS_STATS, NEWS_ITEMS, DEMO_CREDENTIALS, ROUTES, ROLES } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'

// Only 3 roles: Consumer, Manufacturer, Admin (Professional role completely removed)
const ROLE_CARDS = [
  {
    role: ROLES.CONSUMER,
    icon: User,
    color: 'blue',
    chatRoute: ROUTES.CONSUMER_CHAT,
    dashRoute: ROUTES.CONSUMER_DASHBOARD,
    features: ['Verify ISI Mark & Standards', 'Gold Hallmarking & HUID Info', 'File Substandard Complaints', 'AI Standards Assistant'],
  },
  {
    role: ROLES.MANUFACTURER,
    icon: Building2,
    color: 'orange',
    chatRoute: ROUTES.MANUFACTURER_CHAT,
    dashRoute: ROUTES.MANUFACTURER_DASHBOARD,
    features: ['ISI Mark Certification Wizard', 'Step-by-Step Compliance Roadmap', 'Recognized Testing Labs', 'Document Preparation Guide'],
  },
  {
    role: ROLES.ADMIN,
    icon: Shield,
    color: 'red',
    chatRoute: ROUTES.ADMIN_DASHBOARD,
    dashRoute: ROUTES.ADMIN_DASHBOARD,
    features: ['Citizen Query Analytics', 'Audit Log Monitoring', 'Knowledge Base Maintenance', 'User & Officer Management'],
  },
]

const CARD_STYLE = {
  blue: {
    wrap:   'border-blue-200 dark:border-blue-700/60 hover:border-blue-400 dark:hover:border-blue-500',
    header: 'bg-blue-50/90 dark:bg-blue-950/70 border-b border-blue-100 dark:border-blue-800/40',
    icon:   'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50',
    btn:    'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-sm transition-all',
    check:  'text-blue-500 dark:text-blue-400',
  },
  orange: {
    wrap:   'border-orange-200 dark:border-orange-800/60',
    header: 'bg-orange-50 dark:bg-orange-950/40',
    icon:   'bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-400',
    btn:    'bg-amber-700 hover:bg-amber-600 text-white',
    check:  'text-amber-600 dark:text-amber-400',
  },
  red: {
    wrap:   'border-red-200 dark:border-red-800/60',
    header: 'bg-red-50 dark:bg-red-950/40',
    icon:   'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400',
    btn:    'bg-red-600 hover:bg-red-700 text-white',
    check:  'text-red-500 dark:text-red-400',
  },
}

const FLOW_STEPS = [
  { num: '01', icon: Shield        },
  { num: '02', icon: MessageSquare  },
  { num: '03', icon: Zap            },
  { num: '04', icon: BookOpen       },
  { num: '05', icon: CheckCircle2 },
  { num: '06', icon: ArrowRight     },
]

const FEATURES = [
  { icon: MessageSquare, color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/40' },
  { icon: BookOpen,      color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
  { icon: Award,         color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
  { icon: BarChart3,     color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
  { icon: Shield,        color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
  { icon: Globe,         color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
]

export default function Home() {
  const { user, login } = useAuthStore()
  const navigate  = useNavigate()
  const tickerRef = useRef(null)
  const { t } = useTranslation()

  // Strictly block signed-in users from ever staying on Home without signing out
  useEffect(() => {
    if (user) {
      const target = {
        consumer:     ROUTES.CONSUMER_CHAT,
        manufacturer: ROUTES.MANUFACTURER_CHAT,
        admin:        ROUTES.ADMIN_DASHBOARD,
      }[user.role] || ROUTES.CONSUMER_CHAT
      navigate(target, { replace: true })
    }
  }, [user, navigate])

  if (user) return null

  const getRoleCardTitle = (role) => {
    if (role === ROLES.CONSUMER) return t('consumer_portal', 'Consumer Portal')
    if (role === ROLES.MANUFACTURER) return t('manufacturer_portal', 'MSME Portal')
    return t('admin_portal', 'BIS Official Portal')
  }

  const getRoleCardSub = (role) => {
    if (role === ROLES.CONSUMER) return t('consumer_subtitle', 'General Public & Citizens')
    if (role === ROLES.MANUFACTURER) return t('manufacturer_subtitle', 'Businesses & Industry')
    return t('admin_subtitle', 'Government Officials')
  }

  const getRoleCardDesc = (role) => {
    if (role === ROLES.CONSUMER) return t('consumer_desc', 'Get instant guidance on product safety, ISI mark verification, gold hallmarking standards, and substandard goods complaints.')
    if (role === ROLES.MANUFACTURER) return t('manufacturer_desc', 'Complete step-by-step guidance on ISI Mark certification, testing lab locator, compliance roadmaps, and Quality Control Orders.')
    return t('admin_desc', 'Oversee compliance analytics, user activity, audit logs, and knowledge base updates with real-time audit tracing.')
  }

  const getStatLabel = (label) => {
    switch (label) {
      case 'Indian Standards Published': return t('stat_standards', 'Indian Standards Published')
      case 'ISI Marked Products': return t('stat_isi', 'ISI Marked Products')
      case 'BIS Licensed Manufacturers': return t('stat_licensed', 'BIS Licensed Manufacturers')
      case 'Hallmarked Jewellery Items': return t('stat_hallmark', 'Hallmarked Jewellery Items')
      case 'Lab & Testing Centres': return t('stat_labs', 'Lab & Testing Centres')
      case 'BIS Offices Across India': return t('stat_offices', 'BIS Offices Across India')
      default: return label
    }
  }

  const getFlowStepLabel = (num) => {
    switch (num) {
      case '01': return t('step_1', '1-Click Access')
      case '02': return t('step_2', 'Ask AI')
      case '03': return t('step_3', 'Smart Retrieval')
      case '04': return t('step_4', 'BIS Standards')
      case '05': return t('step_5', 'Verified Citations')
      case '06': return t('step_6', 'Take Action')
      default: return ''
    }
  }

  const getFeatureData = (idx) => {
    const list = [
      { title: t('feat_1_title', 'Intelligent AI Chat'), desc: t('feat_1_desc', 'Ask complex regulatory queries in English, Hindi, Marathi, and 8 other Indian languages with instant answers.') },
      { title: t('feat_2_title', 'BIS Knowledge Layer'), desc: t('feat_2_desc', 'Direct indexing of 22,000+ Indian Standards with precise clause citations and verified gazette notifications.') },
      { title: t('feat_3_title', 'Hallmarking & HUID'), desc: t('feat_3_desc', 'Understand 6-digit HUID tracking, mandatory caratages, and nearest BIS-recognized hallmarking centres.') },
      { title: t('feat_4_title', 'Compliance Roadmap'), desc: t('feat_4_desc', 'Interactive step-by-step progress tracking for manufacturers seeking ISI mark certification.') },
      { title: t('feat_5_title', 'Role-Based Security'), desc: t('feat_5_desc', 'Government-grade data segregation for Citizens, MSMEs, and BIS Officers with full audit trails.') },
      { title: t('feat_6_title', 'Multilingual AI Support'), desc: t('feat_6_desc', 'Automatic detection and instant translations of official BIS standards into simple regional terminology.') },
    ]
    return list[idx] || {}
  }

  // 1-Click Quick Demo Launcher directly into AI Assistant
  const handleQuickLaunch = async (roleName) => {
    const cred = DEMO_CREDENTIALS.find((c) => c.role === roleName) || DEMO_CREDENTIALS[0]
    try {
      const { user: loggedInUser } = await login({ email: cred.email, password: cred.password })
      toast.success(`Logged in as ${loggedInUser.name}!`)
      const target = {
        consumer:     ROUTES.CONSUMER_CHAT,
        manufacturer: ROUTES.MANUFACTURER_CHAT,
        admin:        ROUTES.ADMIN_DASHBOARD,
      }[loggedInUser.role] || ROUTES.CONSUMER_CHAT
      navigate(target)
    } catch (err) {
      toast.error('Quick login failed: ' + (err.message || 'Please try again'))
    }
  }

  const handleHeroMainAction = () => {
    if (user) {
      const target = {
        consumer:     ROUTES.CONSUMER_CHAT,
        manufacturer: ROUTES.MANUFACTURER_CHAT,
        admin:        ROUTES.ADMIN_DASHBOARD,
      }[user.role] || ROUTES.CONSUMER_CHAT
      navigate(target)
    } else {
      // User requested asking bis saarthi and launch assistant redirect to login
      navigate(ROUTES.LOGIN)
    }
  }

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">

      {/* ── News Ticker ── */}
      <div className="bg-bis-navy dark:bg-[#061426] text-white py-2 overflow-hidden border-b border-bis-navy-dark dark:border-blue-950/80 shadow-sm transition-colors">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white text-[10px] sm:text-xs font-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 ml-2 sm:ml-4 rounded-full uppercase tracking-wider shadow-sm border border-amber-400/40 select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-85" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span>{t('updates', 'Updates')}</span>
          </div>
          <div className="ticker-wrap flex-1 overflow-hidden">
            <div className="ticker-track text-xs sm:text-sm text-blue-100 dark:text-blue-200/95 font-medium select-none">
              {[...NEWS_ITEMS, ...NEWS_ITEMS].map((item, i) => (
                <span key={i} className="inline-flex items-center mr-8 sm:mr-12 hover:text-amber-300 dark:hover:text-amber-300 transition-colors cursor-default">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-2 shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero: Prioritizes Early AI Chat Interface ── */}
      <section className="relative bg-[linear-gradient(135deg,#00265D_0%,#003580_60%,#1650A1_100%)] dark:bg-[linear-gradient(135deg,#020a17_0%,#061730_55%,#0a254d_100%)] text-white overflow-hidden py-10 sm:py-16 md:py-20 border-b border-transparent dark:border-blue-900/30 transition-colors">
        <div className="absolute inset-0 bg-hero-pattern opacity-30 dark:opacity-15 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 dark:bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 dark:amber-500/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">

            {/* Left: Headline & 1-Click Launch */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-blue-500/10 backdrop-blur-sm border border-white/20 dark:border-blue-400/25 rounded-full px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs text-blue-100 dark:text-blue-200 mb-4 sm:mb-5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                <span className="truncate">{t('hero_badge', 'AI-Powered BIS Assistant • Direct Verified Citations')}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold font-heading leading-[1.18] mb-4 sm:mb-5 text-white">
                {t('hero_title_1', 'BIS')} <span className="text-amber-400 dark:text-amber-400">{t('hero_title_accent', 'Saarthi')}</span>
                <br />
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-blue-200 dark:text-blue-300">
                  {t('hero_subtitle', 'Intelligent Standards Assistant')}
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-blue-100 dark:text-blue-200/90 mb-6 max-w-xl leading-relaxed">
                {t('hero_desc', 'Empowering Citizens, MSMEs, and Officials with verified answers on 22,000+ Indian Standards, ISI Mark certification, and Gold Hallmarking.')}
              </p>

              {/* ── High-Priority Quick Chat Launcher ── */}
              <div className="bg-white/10 dark:bg-slate-900/60 backdrop-blur-sm border border-white/20 dark:border-blue-800/40 rounded-gov-xl p-3.5 sm:p-4 mb-6 shadow-inner">
                <div className="text-xs font-semibold text-amber-300 dark:text-amber-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{t('ai_access_label', 'Direct AI Assistant Access by Role:')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleQuickLaunch(ROLES.CONSUMER)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white/15 dark:bg-blue-950/60 hover:bg-white/25 dark:hover:bg-blue-900/60 border border-white/25 dark:border-blue-700/50 rounded-gov text-xs font-semibold text-white dark:text-blue-100 transition-all hover:scale-[1.02]"
                  >
                    <User className="w-3.5 h-3.5 text-blue-300 dark:text-blue-300 shrink-0" />
                    <span>{t('btn_citizen_chat', 'Citizen AI Chat')}</span>
                  </button>

                  <button
                    onClick={() => handleQuickLaunch(ROLES.MANUFACTURER)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white/15 dark:bg-blue-950/60 hover:bg-white/25 dark:hover:bg-blue-900/60 border border-white/25 dark:border-blue-700/50 rounded-gov text-xs font-semibold text-white dark:text-amber-100 transition-all hover:scale-[1.02]"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-300 dark:text-amber-300 shrink-0" />
                    <span>{t('btn_msme_chat', 'MSME AI Chat')}</span>
                  </button>

                  <button
                    onClick={() => handleQuickLaunch(ROLES.ADMIN)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white/15 dark:bg-blue-950/60 hover:bg-white/25 dark:hover:bg-blue-900/60 border border-white/25 dark:border-blue-700/50 rounded-gov text-xs font-semibold text-white dark:text-red-100 transition-all hover:scale-[1.02]"
                  >
                    <Shield className="w-3.5 h-3.5 text-red-300 dark:text-red-300 shrink-0" />
                    <span>{t('btn_official_chat', 'BIS Official')}</span>
                  </button>
                </div>
              </div>

              {/* Single Primary Action Button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleHeroMainAction}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-gov shadow-lg transition-all active:scale-[0.98]"
                >
                  <MessageSquare className="w-5 h-5 shrink-0" />
                  <span>{user ? t('btn_open_assistant', 'Open Your AI Assistant') : t('btn_start_asking', 'Start Asking BIS Saarthi AI')}</span>
                  <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                </button>
              </div>
            </div>

            {/* Right: Live Clickable Chat Preview */}
            <div className="hidden lg:block animate-fade-in">
              <div className="bg-white/10 dark:bg-slate-900/75 backdrop-blur-md border border-white/20 dark:border-blue-800/50 rounded-gov-xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 dark:border-blue-800/30 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-2 text-sm text-blue-200 dark:text-blue-300 font-semibold">{t('preview_title', 'BIS Saarthi AI • Interactive Preview')}</span>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-300 dark:text-green-400 border border-green-400/30 px-2 py-0.5 rounded-full font-mono">
                    {t('preview_online', 'Online')}
                  </span>
                </div>

                {/* Sample interactive dialog */}
                <div className="space-y-3.5">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-white shrink-0">U</div>
                    <div className="bg-white/20 dark:bg-slate-800/80 rounded-gov-lg px-3.5 py-2 text-xs text-white dark:text-slate-100 max-w-[85%] border border-transparent dark:border-slate-700/50">
                      {t('preview_q', 'How do I verify if a product requires mandatory BIS certification or has a valid ISI Mark?')}
                    </div>
                  </div>

                  <div className="flex gap-2.5 justify-end">
                    <div className="bg-bis-navy/60 dark:bg-blue-950/80 border border-white/20 dark:border-blue-700/50 rounded-gov-lg px-3.5 py-2.5 text-xs text-white max-w-[88%]">
                      <div className="text-blue-200 dark:text-blue-300 text-xs mb-1 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> BIS Saarthi AI
                      </div>
                      <p className="leading-relaxed">
                        {t('preview_a', 'You can verify any product license in real time via the BIS Care App or Manakonline portal using its CM/L number. Products notified under Quality Control Orders (QCOs) cannot be manufactured, imported, or sold without a valid BIS license.')}
                      </p>
                      <div className="mt-2 pt-1.5 border-t border-white/10 dark:border-blue-800/40 text-xs text-blue-200/80 dark:text-blue-300/80 font-mono">
                        {t('preview_ref', '📚 BIS Act 2016 • Quality Control Orders (QCO) Gazette')}
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 p-0.5 shadow-sm">
                      <img src="/bis-logo.svg" alt="BIS" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Clickable Quick Prompts */}
                  <div className="pt-2">
                    <div className="text-xs text-blue-200 dark:text-blue-300 mb-2">{t('preview_try_asking', 'Try asking directly:')}</div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleQuickLaunch(ROLES.CONSUMER)}
                        className="text-xs bg-white/15 dark:bg-blue-900/40 hover:bg-white/25 dark:hover:bg-blue-800/60 text-white dark:text-blue-100 px-2.5 py-1 rounded border border-white/20 dark:border-blue-700/50 transition-colors"
                      >
                        &ldquo;{t('preview_prompt_1', 'What is 6-digit HUID in gold?')}&rdquo; &rarr;
                      </button>
                      <button
                        onClick={() => handleQuickLaunch(ROLES.MANUFACTURER)}
                        className="text-xs bg-white/15 dark:bg-blue-900/40 hover:bg-white/25 dark:hover:bg-blue-800/60 text-white dark:text-blue-100 px-2.5 py-1 rounded border border-white/20 dark:border-blue-700/50 transition-colors"
                      >
                        &ldquo;{t('preview_prompt_2', 'Steps to get ISI Mark')}&rdquo; &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-white dark:bg-dark-bg-card border-b border-gray-200 dark:border-dark-border py-6">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {BIS_STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-bis-navy dark:text-blue-400 font-heading">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-muted mt-1 leading-tight">{getStatLabel(stat.label)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION: About BIS (Target for #about in Header) ── */}
      <section id="about" className="py-16 bg-white dark:bg-dark-bg-card border-b border-gray-200 dark:border-dark-border scroll-mt-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 text-bis-navy dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 rounded-full px-3.5 py-1 text-xs font-semibold mb-4">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('about_tag', 'About Bureau of Indian Standards')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-heading tracking-tight mb-4">
                {t('about_heading', 'The National Standards Body of India')}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-muted leading-relaxed mb-4">
                {t('about_p1', 'The Bureau of Indian Standards (BIS) is the statutory body established under the Bureau of Indian Standards Act, 2016. Operating under the Ministry of Consumer Affairs, Food & Public Distribution, BIS is responsible for harmonious development of standardization, marking, and quality certification across goods and services in India.')}
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-bis-navy dark:text-blue-400" />
                    <span>{t('about_standardization_title', 'Standardization')}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                    {t('about_standardization_desc', 'Formulation of Indian Standards across 15 technical divisions covering all industry sectors.')}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{t('about_conformity_title', 'Conformity & Marks')}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                    {t('about_conformity_desc', 'Administration of ISI mark, Gold Hallmarking with HUID, and electronic CRS registration.')}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-dark-text-muted">
                {t('about_hq', 'Headquarters: Manak Bhavan, 9 Bahadur Shah Zafar Marg, New Delhi • 25+ Regional Offices nationwide.')}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-dark-bg-secondary p-8 rounded-gov-xl border border-gray-200 dark:border-dark-border">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-heading mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-bis-navy dark:text-blue-400" />
                <span>{t('about_core_title', 'Core Objectives of BIS')}</span>
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-dark-text-muted">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span><strong>{t('about_obj_1_title', 'Consumer Protection:')} </strong>{t('about_obj_1_desc', 'Protecting public health and consumer interests through rigorous testing and standard compliance.')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span><strong>{t('about_obj_2_title', 'Industry Competitiveness:')} </strong>{t('about_obj_2_desc', 'Enabling Indian MSMEs and manufacturers to produce world-class products conforming to international standards.')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span><strong>{t('about_obj_3_title', 'Hallmarking Transparency:')} </strong>{t('about_obj_3_desc', 'Ensuring 100% purity verification for precious metals with unique 6-digit alphanumeric HUID.')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span><strong>{t('about_obj_4_title', 'AI Governance via BIS Saarthi:')} </strong>{t('about_obj_4_desc', 'Instant natural language access to complex Indian Standards without bureaucratic delays.')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: Role Selection (Target for #roles in Header) ── */}
      <section id="roles" className="py-16 bg-slate-50 dark:bg-dark-bg scroll-mt-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-bis-navy/10 dark:bg-blue-950/60 text-bis-navy dark:text-blue-300 border border-bis-navy/15 dark:border-blue-800/50 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold mb-3">
              <User className="w-4 h-4" /> {t('roles_tag', 'Role-Based Specialized Portals')}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-heading tracking-tight mb-3">
              {t('roles_heading', 'Tailored Portals for Every Stakeholder')}
            </h2>
            <p className="text-gray-500 dark:text-dark-text-muted max-w-xl mx-auto text-sm sm:text-base">
              {t('roles_sub', 'Select your role to access dedicated compliance guides, verification tools, and your customized AI Assistant.')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ROLE_CARDS.map((card) => {
              const Icon = card.icon
              const c = CARD_STYLE[card.color]
              const title = getRoleCardTitle(card.role)
              const sub = getRoleCardSub(card.role)
              const desc = getRoleCardDesc(card.role)
              return (
                <div
                  key={card.role}
                  className={`card-gov border-2 ${c.wrap} p-0 flex flex-col overflow-hidden hover:scale-[1.02] transition-transform duration-200`}
                >
                  <div className={`${c.header} px-5 pt-5 pb-4`}>
                    <div className={`w-11 h-11 rounded-gov-lg flex items-center justify-center mb-3 ${c.icon}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white font-heading">{title}</h3>
                    <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">{sub}</p>
                  </div>
                  <div className="px-5 py-4 flex-1 flex flex-col">
                    <p className="text-sm text-gray-600 dark:text-dark-text-muted mb-4 leading-relaxed flex-1">{desc}</p>
                    <ul className="space-y-1.5 mb-5">
                      {card.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-text-muted">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${c.check}`} /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleQuickLaunch(card.role)}
                      className={`w-full text-center py-2.5 rounded-gov text-sm font-semibold transition-all shadow-sm ${c.btn}`}
                    >
                      {t('launch_portal_btn', 'Launch')} {title} &rarr;
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION: How It Works (Target for #how-it-works) ── */}
      <section id="how-it-works" className="py-16 bg-white dark:bg-dark-bg-card border-y border-gray-200 dark:border-dark-border scroll-mt-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-heading tracking-tight mb-3">
              {t('how_title', 'How BIS Saarthi Operates')}
            </h2>
            <p className="text-gray-500 dark:text-dark-text-muted max-w-xl mx-auto text-sm sm:text-base">
              {t('how_sub', 'From instant inquiry to verified citation in seconds.')}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {FLOW_STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="p-4 rounded-gov bg-slate-50 dark:bg-dark-bg-secondary border border-slate-200 dark:border-dark-border flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-bis-navy dark:bg-blue-600 text-white flex items-center justify-center shadow-sm dark:shadow-md dark:shadow-blue-950/50 mb-2.5 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">{step.num}</div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white mt-0.5">{getFlowStepLabel(step.num)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION: Key Features (Target for #features) ── */}
      <section id="features" className="py-16 bg-slate-50 dark:bg-dark-bg scroll-mt-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-heading tracking-tight mb-3">
              {t('features_heading', 'Comprehensive Platform Features')}
            </h2>
            <p className="text-gray-500 dark:text-dark-text-muted max-w-xl mx-auto text-sm sm:text-base">
              {t('features_sub', 'Engineered with official BIS guidelines and modern AI capabilities.')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, color }, i) => {
              const feat = getFeatureData(i)
              return (
                <div key={feat.title || i} className="card-gov p-6 hover:shadow-gov-md transition-all duration-200">
                  <div className={`w-10 h-10 rounded-gov mb-4 flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 font-heading">{feat.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-dark-text-muted leading-relaxed">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Direct Launch Banner (Replacing redundant repetitive buttons) ── */}
      <section className="py-8 sm:py-12 bg-bis-navy dark:bg-gradient-to-r dark:from-[#030d1a] dark:via-[#071935] dark:to-[#0c2b58] text-white border-t border-bis-navy-dark dark:border-blue-900/40 transition-colors">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 text-center md:text-left">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading mb-1 text-white">
              {t('cta_title', 'Ready to verify standards or explore compliance?')}
            </h2>
            <p className="text-blue-200 dark:text-blue-200/90 text-xs sm:text-sm">
              {t('cta_sub', 'Use BIS Saarthi AI Assistant instantly — no complex setup required.')}
            </p>
          </div>
          <button
            onClick={handleHeroMainAction}
            className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-gov shadow transition-all active:scale-[0.98] shrink-0"
          >
            {t('cta_btn', 'Launch BIS Saarthi Assistant Now')} &rarr;
          </button>
        </div>
      </section>

    </div>
  )
}
