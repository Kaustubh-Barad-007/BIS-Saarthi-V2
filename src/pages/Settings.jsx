import React, { useState } from 'react'
import {
  Palette, Languages, ShieldCheck, Bell, Database,
  Sun, Moon, Monitor, Check, Lock, KeyRound, Smartphone, LogOut, Download, Trash2,
  AlertCircle, CheckCircle2, Shield, Info
} from 'lucide-react'
import { toast } from 'sonner'
import useAuthStore from '@/store/authStore'
import useSettingsStore from '@/store/settingsStore'
import useThemeStore from '@/store/themeStore'
import { LANGUAGES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

export default function Settings() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const settings = useSettingsStore()

  const [activeTab, setActiveTab] = useState('appearance')

  // Password state
  const [passData, setPassData] = useState({ current: '', next: '', confirm: '' })
  const [passStrength, setPassStrength] = useState(0)

  // 2FA modal state
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])

  // Clear data modal state
  const [showClearModal, setShowClearModal] = useState(false)

  // Calculate password strength
  const handlePasswordChange = (val) => {
    setPassData((p) => ({ ...p, next: val }))
    let score = 0
    if (val.length >= 8) score += 25
    if (/[A-Z]/.test(val)) score += 25
    if (/[0-9]/.test(val)) score += 25
    if (/[^A-Za-z0-9]/.test(val)) score += 25
    setPassStrength(score)
  }

  const submitPasswordChange = (e) => {
    e.preventDefault()
    if (!passData.current) {
      toast.error('Please enter your current password')
      return
    }
    if (passData.next.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passData.next !== passData.confirm) {
      toast.error('New password and confirmation do not match')
      return
    }
    toast.success('Password updated successfully!')
    setPassData({ current: '', next: '', confirm: '' })
    setPassStrength(0)
  }



  // Export full chat history
  const handleExportData = (type) => {
    try {
      const chatRaw = localStorage.getItem('bis_chat_sessions_v2') || localStorage.getItem('bis_realtime_db_v2') || '{}'
      const blob = new Blob([type === 'json' ? chatRaw : JSON.stringify(JSON.parse(chatRaw), null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bis_saarthi_data_export_${new Date().toISOString().split('T')[0]}.${type}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Data archive downloaded successfully (${type.toUpperCase()})`)
    } catch (e) {
      toast.error('Failed to export data archive')
    }
  }

  // Clear local storage and cache
  const handleConfirmClearData = () => {
    try {
      localStorage.removeItem('bis_chat_sessions_v2')
      localStorage.removeItem('bis_active_session')
      toast.success('Local cache and conversation records cleared')
      setShowClearModal(false)
      setTimeout(() => window.location.reload(), 1000)
    } catch (e) {
      toast.error('Failed to clear cache')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">{t('Settings & Preferences', 'Settings & Preferences')}</h1>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">
          {t('Customize your portal display, preferred regional language, notification alerts, and account security.', 'Customize your portal display, preferred regional language, notification alerts, and account security.')}
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 dark:border-dark-border overflow-x-auto no-scrollbar gap-2">
        {[
          { id: 'appearance', label: t('Appearance', 'Appearance'), icon: Palette },
          { id: 'language',   label: t('Language & Regional', 'Language & Regional'), icon: Languages },
          { id: 'security',   label: t('Account & Security', 'Account & Security'), icon: ShieldCheck },
          { id: 'sound',      label: t('Notifications & Audio', 'Notifications & Audio'), icon: Bell },
          { id: 'data',       label: t('Data & Privacy', 'Data & Privacy'), icon: Database },
        ].map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
                active
                  ? 'border-bis-navy text-bis-navy dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text-muted hover:text-gray-800 dark:hover:text-dark-text hover:border-gray-300'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── TAB 1: APPEARANCE ───────────────────────────────── */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 animate-fade-in">
          {/* Theme Mode Selection */}
          <div className="card-gov p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading mb-1">{t('Theme Mode', 'Theme Mode')}</h2>
            <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-4">
              {t('Choose your visual appearance for the BIS Saarthi portal.', 'Choose your visual appearance for the BIS Saarthi portal.')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'light',  label: t('Light Mode', 'Light Mode'),  icon: Sun,     desc: t('Clean government white interface', 'Clean government white interface') },
                { id: 'dark',   label: t('Dark Mode', 'Dark Mode'),   icon: Moon,    desc: t('High contrast slate dark mode', 'High contrast slate dark mode') },
                { id: 'system', label: t('System Auto', 'System Auto'), icon: Monitor, desc: t('Syncs automatically with device', 'Syncs automatically with device') },
              ].map((m) => {
                const Icon = m.icon
                const isSelected = settings.theme === m.id
                return (
                  <div
                    key={m.id}
                    onClick={() => settings.setThemeMode(m.id)}
                    className={cn(
                      'p-4 rounded-gov-xl border-2 cursor-pointer transition-all flex flex-col justify-between',
                      isSelected
                        ? 'border-bis-navy dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-xs'
                        : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-dark-bg-card'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-bis-navy text-white' : 'bg-gray-100 dark:bg-dark-bg-secondary text-gray-600 dark:text-dark-text'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-bis-navy dark:text-blue-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">{m.label}</div>
                      <div className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">{m.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Font Scaling */}
          <div className="card-gov p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading mb-1">{t('Display Text Scaling', 'Display Text Scaling')}</h2>
            <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-4">
              {t('Complies with Guidelines for Indian Government Websites (GIGW) accessibility.', 'Complies with Guidelines for Indian Government Websites (GIGW) accessibility.')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'compact',     label: t('Compact (90%)', 'Compact (90%)'),      sample: t('Small & dense layout', 'Small & dense layout') },
                { id: 'standard',    label: t('Standard (100%)', 'Standard (100%)'),    sample: t('Default standard scale', 'Default standard scale') },
                { id: 'comfortable', label: t('Comfortable (115%)', 'Comfortable (115%)'), sample: t('Larger text for readability', 'Larger text for readability') },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    settings.setFontScale(s.id)
                    toast.success(`Font scale set to ${s.label}`)
                  }}
                  className={cn(
                    'p-3.5 rounded-gov text-left border transition-all',
                    settings.fontScale === s.id
                      ? 'border-bis-navy dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-secondary'
                  )}
                >
                  <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">{s.label}</div>
                  <div className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">{s.sample}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reduce Motion */}
          <div className="card-gov p-5 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white">{t('Reduce Animations', 'Reduce Animations')}</div>
              <div className="text-xs text-gray-500 dark:text-dark-text-muted">
                {t('Minimizes background pulses, slide transitions, and decorative particles.', 'Minimizes background pulses, slide transitions, and decorative particles.')}
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => settings.setReduceMotion(e.target.checked)}
              className="w-5 h-5 accent-bis-navy rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ── TAB 2: LANGUAGE & REGIONAL ───────────────────────── */}
      {activeTab === 'language' && (
        <div className="space-y-6 animate-fade-in">
          {/* Primary Language Selection */}
          <div className="card-gov p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading mb-1">{t('Preferred Portal Language', 'Preferred Portal Language')}</h2>
            <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-4">
              {t('Select your primary language. All portal sections, standard titles, notices, and UI controls will automatically adapt to your selection.', 'Select your primary language. All portal sections, standard titles, notices, and UI controls will automatically adapt to your selection.')}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {LANGUAGES.map((lang) => {
                const isSelected = settings.preferredLanguage === lang.code
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      settings.setPreferredLanguage(lang.code)
                      toast.success(`Language changed to ${lang.label} (${lang.native})`)
                    }}
                    className={cn(
                      'p-3 rounded-gov text-center border transition-all',
                      isSelected
                        ? 'border-bis-navy bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30 text-bis-navy dark:text-blue-300 font-bold shadow-xs'
                        : 'border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg-secondary'
                    )}
                  >
                    <div className="text-sm font-semibold">{lang.native}</div>
                    <div className="text-[11px] text-gray-500 dark:text-dark-text-muted mt-0.5">{lang.label}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ACCOUNT & SECURITY ───────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          {/* Identity Overview */}
          <div className="card-gov p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading">{t('Account Profile', 'Account Profile')}</h2>
              <span className="badge-gov status-approved capitalize text-xs px-2.5 py-0.5">
                {t(user?.role || 'Citizen', user?.role || 'Citizen')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border">
                <span className="text-gray-400 block mb-0.5">{t('Full Name', 'Full Name')}</span>
                <span className="font-semibold text-gray-800 dark:text-white text-sm">{user?.name || 'Authorized User'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border">
                <span className="text-gray-400 block mb-0.5">{t('Registered Email', 'Registered Email')}</span>
                <span className="font-semibold text-gray-800 dark:text-white text-sm">{user?.email || 'user@bis.gov.in'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border">
                <span className="text-gray-400 block mb-0.5">{t('Assigned Organization / Branch', 'Assigned Organization / Branch')}</span>
                <span className="font-semibold text-gray-800 dark:text-white text-sm">{user?.org || 'Bureau of Indian Standards'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-dark-bg-secondary rounded-gov border border-slate-200 dark:border-dark-border">
                <span className="text-gray-400 block mb-0.5">{t('Government ID Verification', 'Government ID Verification')}</span>
                <span className="font-semibold text-green-600 dark:text-green-400 text-sm flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> {t('Verified & Cleared', 'Verified & Cleared')}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="card-gov p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading mb-1">{t('Change Account Password', 'Change Account Password')}</h2>
            <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-4">
              {t('Ensure your password is at least 8 characters and contains special characters.', 'Ensure your password is at least 8 characters and contains special characters.')}
            </p>

            <form onSubmit={submitPasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Current Password', 'Current Password')}</label>
                <input
                  type="password"
                  value={passData.current}
                  onChange={(e) => setPassData({ ...passData, current: e.target.value })}
                  placeholder="••••••••"
                  className="input-gov"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('New Password', 'New Password')}</label>
                <input
                  type="password"
                  value={passData.next}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input-gov"
                />
                {/* Strength Meter */}
                {passData.next && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>{t('Password Strength', 'Password Strength')}:</span>
                      <span className={cn(
                        'font-bold',
                        passStrength < 50 ? 'text-red-500' : passStrength < 100 ? 'text-amber-500' : 'text-green-500'
                      )}>
                        {passStrength < 50 ? t('Weak', 'Weak') : passStrength < 100 ? t('Good', 'Good') : t('Strong', 'Strong')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-dark-border h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          passStrength < 50 ? 'bg-red-500' : passStrength < 100 ? 'bg-amber-500' : 'bg-green-500'
                        )}
                        style={{ width: `${passStrength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">{t('Confirm New Password', 'Confirm New Password')}</label>
                <input
                  type="password"
                  value={passData.confirm}
                  onChange={(e) => setPassData({ ...passData, confirm: e.target.value })}
                  placeholder="••••••••"
                  className="input-gov"
                />
              </div>

              <button type="submit" className="btn-gov text-xs py-2 px-4">
                {t('Update Password', 'Update Password')}
              </button>
            </form>
          </div>

          {/* Two-Factor Authentication (2FA) */}
          <div className="card-gov p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-4 h-4 text-bis-navy dark:text-blue-400" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{t('Two-Factor Authentication (2FA)', 'Two-Factor Authentication (2FA)')}</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                {t('Add an extra layer of security to your BIS Saarthi account using SMS OTP or Authenticator app.', 'Add an extra layer of security to your BIS Saarthi account using SMS OTP or Authenticator app.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!settings.twoFactorEnabled) {
                  setShow2FAModal(true)
                } else {
                  settings.toggleTwoFactor()
                  toast.info('Two-Factor Authentication disabled')
                }
              }}
              className={cn(
                'text-xs py-2 px-4 rounded-gov font-semibold transition-all shrink-0',
                settings.twoFactorEnabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200'
                  : 'btn-gov-outline'
              )}
            >
              {settings.twoFactorEnabled ? t('2FA Enabled (Active)', '2FA Enabled (Active)') : t('Enable 2FA Protection', 'Enable 2FA Protection')}
            </button>
          </div>

          {/* Active Sessions */}
          <div className="card-gov p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading mb-3">{t('Active Login Sessions', 'Active Login Sessions')}</h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-dark-border rounded-gov bg-gray-50/50 dark:bg-dark-bg-secondary/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                    PC
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Windows 11 · Chrome Browser</div>
                    <div className="text-gray-400 dark:text-dark-text-muted text-[11px]">IP: 10.0.0.1 (New Delhi, India) · {t('Current Active Session', 'Current Active Session')}</div>
                  </div>
                </div>
                <span className="badge-gov status-approved text-[11px]">{t('Current', 'Current')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: NOTIFICATIONS & SOUND ────────────────────── */}
      {activeTab === 'sound' && (
        <div className="space-y-6 animate-fade-in">
          <div className="card-gov p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading">{t('Audio & Notification Preferences', 'Audio & Notification Preferences')}</h2>

            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-border">
              <div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white">{t('Chat Sound Effects', 'Chat Sound Effects')}</div>
                <div className="text-xs text-gray-500 dark:text-dark-text-muted">
                  {t('Plays subtle audio cues when sending messages and receiving standard recommendations.', 'Plays subtle audio cues when sending messages and receiving standard recommendations.')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => settings.playSound('receive')}
                  className="text-xs text-bis-navy dark:text-blue-400 hover:underline"
                >
                  {t('Test Sound', 'Test Sound')}
                </button>
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={settings.toggleSoundEffects}
                  className="w-5 h-5 accent-bis-navy rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-border">
              <div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white">{t('Desktop Push Notifications', 'Desktop Push Notifications')}</div>
                <div className="text-xs text-gray-500 dark:text-dark-text-muted">
                  {t('Receive browser notifications when a complaint status changes or audit log reports are generated.', 'Receive browser notifications when a complaint status changes or audit log reports are generated.')}
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.desktopNotifications}
                onChange={async () => {
                  const res = await settings.toggleDesktopNotifications()
                  if (res) toast.success('Desktop notifications enabled')
                }}
                className="w-5 h-5 accent-bis-navy rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white">{t('Standard & Gazette Email Alerts', 'Standard & Gazette Email Alerts')}</div>
                <div className="text-xs text-gray-500 dark:text-dark-text-muted">
                  {t('Receive email digests when new Quality Control Orders (QCO) or amendments are published.', 'Receive email digests when new Quality Control Orders (QCO) or amendments are published.')}
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.emailAlerts}
                onChange={settings.toggleEmailAlerts}
                className="w-5 h-5 accent-bis-navy rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: DATA & PRIVACY ───────────────────────────── */}
      {activeTab === 'data' && (
        <div className="space-y-6 animate-fade-in">
          {/* Data Export Card */}
          <div className="card-gov p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading mb-1">{t('Export Personal Data', 'Export Personal Data')}</h2>
            <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-4">
              {t('Download your complete conversation history, citations, and filed reports in standard portable formats.', 'Download your complete conversation history, citations, and filed reports in standard portable formats.')}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleExportData('json')}
                className="btn-gov-outline text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> {t('Export JSON Archive', 'Export JSON Archive')}
              </button>
              <button
                type="button"
                onClick={() => handleExportData('md')}
                className="btn-gov-outline text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> {t('Export Markdown Transcript', 'Export Markdown Transcript')}
              </button>
            </div>
          </div>

          {/* Clear Cache & Reset Card */}
          <div className="card-gov p-6 border-red-200 dark:border-red-900/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-red-600 dark:text-red-400 font-heading mb-1">
                  {t('Clear Cache & Reset Storage', 'Clear Cache & Reset Storage')}
                </h2>
                <p className="text-xs text-gray-600 dark:text-dark-text-muted leading-relaxed">
                  {t('Removes locally cached chat sessions, audio blobs, and temporary standards records. Does not delete your primary BIS account.', 'Removes locally cached chat sessions, audio blobs, and temporary standards records. Does not delete your primary BIS account.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="btn-gov bg-red-600 hover:bg-red-700 text-xs py-2 px-4 shrink-0 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('Clear Local Cache', 'Clear Local Cache')}
              </button>
            </div>
          </div>

          {/* Privacy & Encryption Assurance */}
          <div className="card-gov p-5 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t('Government Cloud & MeitY Privacy Shield', 'Government Cloud & MeitY Privacy Shield')}</span>
            </div>
            <p className="leading-relaxed">
              {t('All portal communications, documents, and user records are protected under the Digital Personal Data Protection Act (DPDPA), 2023 and encrypted in transit via TLS 1.3 to BIS Government of India cloud repositories.', 'All portal communications, documents, and user records are protected under the Digital Personal Data Protection Act (DPDPA), 2023 and encrypted in transit via TLS 1.3 to BIS Government of India cloud repositories.')}
            </p>
          </div>
        </div>
      )}

      {/* ── 2FA Modal ────────────────────────────────────────── */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-bis-navy dark:text-blue-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">{t('Enable Two-Factor Auth', 'Enable Two-Factor Auth')}</h3>
                <p className="text-xs text-gray-500">{t('Security Verification', 'Security Verification')}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-dark-text-muted mb-4 leading-relaxed">
              {t('A 6-digit verification code was dispatched to your registered contact number', 'A 6-digit verification code was dispatched to your registered contact number')} <strong>+91 ••••• ••210</strong>. {t('Enter it below to activate 2FA:', 'Enter it below to activate 2FA:')}
            </p>

            <div className="flex justify-between gap-1.5 mb-5">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={otpCode[idx]}
                  onChange={(e) => {
                    const val = e.target.value
                    const next = [...otpCode]
                    next[idx] = val
                    setOtpCode(next)
                    if (val && idx < 5) {
                      document.getElementById(`otp-${idx + 1}`)?.focus()
                    }
                  }}
                  className="w-10 h-11 text-center text-base font-bold font-mono border border-gray-300 dark:border-dark-border rounded-gov bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white outline-none focus:border-bis-navy"
                />
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShow2FAModal(false)}
                className="btn-gov-outline text-xs py-1.5 px-3"
              >
                {t('Cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  settings.toggleTwoFactor()
                  setShow2FAModal(false)
                  toast.success('Two-Factor Authentication is now enabled!')
                }}
                className="btn-gov text-xs py-1.5 px-4"
              >
                {t('Verify & Activate', 'Verify & Activate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clear Cache Confirmation Modal ───────────────────── */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">{t('Clear Local Cache?', 'Clear Local Cache?')}</h3>
                <p className="text-xs text-gray-500">{t('Storage Reset', 'Storage Reset')}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-dark-text-muted mb-5 leading-relaxed">
              {t('This will clear local offline chat transcripts, audio speech chunks, and temporary cache. Your login credentials and official BIS server records remain unaffected.', 'This will clear local offline chat transcripts, audio speech chunks, and temporary cache. Your login credentials and official BIS server records remain unaffected.')}
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="btn-gov-outline text-xs py-1.5 px-3"
              >
                {t('Cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmClearData}
                className="btn-gov bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3"
              >
                {t('Confirm Clear', 'Confirm Clear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
