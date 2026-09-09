import React from 'react'
import { Link } from 'react-router-dom'
import { Phone, Globe } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useTranslation()

  return (
    <footer className="bg-bis-navy-dark dark:bg-dark-bg text-white border-t border-bis-navy/30 dark:border-dark-border mt-auto">
      {/* Tricolor accent bar */}
      <div className="gov-divider" style={{ height: '3px' }} />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">

          {/* Left: Official Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center p-0.5 shadow-sm shrink-0">
              <img src="/bis-logo.svg" alt="BIS" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white tracking-wide">
                {t('bis_title_en', 'Bureau of Indian Standards')}
              </div>
              <div className="text-xs text-gray-400 dark:text-dark-text-muted mt-0.5">
                {t('ministry_title', 'Ministry of Consumer Affairs, Food & Public Distribution, Govt. of India')}
              </div>
            </div>
          </div>

          {/* Center: Helpline info */}
          <div className="flex items-center gap-4 text-gray-300 text-xs">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('toll_free', 'Toll Free')}: 1800-11-4000</span>
            </span>
            <span className="hidden sm:inline text-gray-600 dark:text-dark-text-muted">|</span>
            <a
              href="https://www.bis.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-gray-300 hover:text-amber-400 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>bis.gov.in</span>
            </a>
          </div>

          {/* Right: Essential Legal Links & Copyright */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-gray-400 dark:text-dark-text-muted text-xs">
            <span>&copy; {currentYear} BIS · {t('all_rights_reserved', 'All rights reserved.')}</span>
            <span>&bull;</span>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">{t('privacy_policy', 'Privacy Policy')}</Link>
            <span>&bull;</span>
            <Link to="/terms" className="hover:text-white transition-colors">{t('terms_of_use', 'Terms')}</Link>
            <span>&bull;</span>
            <Link to="/sitemap" className="hover:text-white transition-colors">{t('sitemap', 'Sitemap')}</Link>
          </div>

        </div>
      </div>
    </footer>
  )
}
