import React, { useState } from 'react'
import { Sun, Moon, Globe, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LANGUAGES } from '@/lib/constants'
import useThemeStore from '@/store/themeStore'
import { useTranslation } from '@/lib/i18n'

const TopBar = ({ theme: propTheme, toggleTheme: propToggleTheme }) => {
  const storeTheme = useThemeStore((s) => s.theme)
  const storeToggle = useThemeStore((s) => s.toggleTheme)
  const theme = propTheme || storeTheme
  const toggleTheme = propToggleTheme || storeToggle

  const { t, language, setLanguage } = useTranslation()
  const [fontSize, setFontSize]   = useState('normal')
  const [showLang,  setShowLang]  = useState(false)

  const fontSizes = ['small', 'normal', 'large']
  const cycleFontSize = (dir) => {
    const idx = fontSizes.indexOf(fontSize)
    const next = dir === 'up'
      ? Math.min(idx + 1, fontSizes.length - 1)
      : Math.max(idx - 1, 0)
    setFontSize(fontSizes[next])
    document.documentElement.style.fontSize =
      next === 0 ? '14px' : next === 2 ? '18px' : '16px'
  }

  return (
    <div className="w-full bg-bis-navy-dark dark:bg-dark-bg-secondary text-white text-xs border-b border-bis-navy/30 dark:border-dark-border z-50">
      {/* Tricolor stripe */}
      <div className="gov-divider" style={{ height: '3px' }} />

      <div className="max-w-screen-2xl mx-auto px-4 py-1 flex items-center justify-between gap-4">
        {/* Skip link + Left info */}
        <div className="flex items-center gap-4">
          <a href="#main-content" className="skip-link">
            {t('skip_to_content', 'Skip to Main Content')}
          </a>
          <span className="hidden sm:flex items-center gap-1.5 text-gray-300 dark:text-dark-text-muted">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>{t('gov_india', 'Government of India')}</span>
          </span>
          <span className="hidden md:block text-gray-500 dark:text-dark-border">|</span>
          <span className="hidden md:flex items-center gap-1 text-gray-300 dark:text-dark-text-muted">
            <span>{t('ministry_title', 'Ministry of Consumer Affairs, Food & Public Distribution')}</span>
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLang(!showLang)}
              className="flex items-center gap-1 hover:text-amber-400 transition-colors border border-white/20 dark:border-dark-border rounded px-2 py-0.5"
            >
              <Globe className="w-3 h-3 text-blue-400" />
              <span className="uppercase">{language}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {showLang && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-dark-bg-card text-gray-800 dark:text-dark-text rounded shadow-gov-lg border border-gray-200 dark:border-dark-border z-50 py-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setShowLang(false) }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs hover:bg-bis-light-bg dark:hover:bg-dark-bg-secondary transition-colors',
                      language === lang.code && 'text-bis-navy dark:text-blue-400 font-semibold'
                    )}
                  >
                    {lang.label} — {lang.native}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1 hover:text-amber-400 transition-colors border border-white/20 dark:border-dark-border rounded px-2 py-0.5"
            aria-label="Toggle dark/light mode"
          >
            {theme === 'dark' ? (
              <><Sun className="w-3 h-3 text-amber-400" /><span className="hidden sm:inline">{t('light', 'Light')}</span></>
            ) : (
              <><Moon className="w-3 h-3 text-blue-300" /><span className="hidden sm:inline">{t('dark', 'Dark')}</span></>
            )}
          </button>

          {/* Rightmost corner: Accessibility — Font size controls (A- / A / A+) */}
          <div className="flex items-center gap-1 border border-white/20 dark:border-dark-border rounded px-2 py-0.5 bg-white/5 dark:bg-dark-bg/30">
            <button
              onClick={() => cycleFontSize('down')}
              className="hover:text-amber-400 transition-colors px-1 py-0.5 font-bold text-[11px]"
              title="Decrease Font Size (A-)"
              aria-label="Decrease font size"
            >
              A-
            </button>
            <span className="text-gray-500 dark:text-dark-border text-[10px]">|</span>
            <button
              onClick={() => {
                setFontSize('normal')
                document.documentElement.style.fontSize = '16px'
              }}
              className={cn(
                "hover:text-amber-400 transition-colors px-1 py-0.5 font-bold text-xs",
                fontSize === 'normal' ? 'text-amber-400' : 'text-gray-300'
              )}
              title="Standard Font Size (A)"
              aria-label="Reset font size"
            >
              A
            </button>
            <span className="text-gray-500 dark:text-dark-border text-[10px]">|</span>
            <button
              onClick={() => cycleFontSize('up')}
              className="hover:text-amber-400 transition-colors px-1 py-0.5 font-bold text-[11px]"
              title="Increase Font Size (A+)"
              aria-label="Increase font size"
            >
              A+
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBar
