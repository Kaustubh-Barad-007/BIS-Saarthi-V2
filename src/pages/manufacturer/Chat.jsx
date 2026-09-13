import React from 'react'
import ChatInterface from '@/components/chat/ChatInterface'
import { useTranslation } from '@/lib/i18n'

export default function ManufacturerChat() {
  const { t } = useTranslation()
  return (
    <div className="h-full flex flex-col">
      <div className="hidden sm:block mb-3 shrink-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">{t('BIS Saarthi — Business Assistant', 'BIS Saarthi — Business Assistant')}</h1>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">{t('Ask about ISI Mark certification, compliance requirements, lab testing, and product standards.', 'Ask about ISI Mark certification, compliance requirements, lab testing, and product standards.')}</p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatInterface role="manufacturer" />
      </div>
    </div>
  )
}
