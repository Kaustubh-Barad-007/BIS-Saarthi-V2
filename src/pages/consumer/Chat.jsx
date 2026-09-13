import React from 'react'
import ChatInterface from '@/components/chat/ChatInterface'
import { useTranslation } from '@/lib/i18n'

export default function ConsumerChat() {
  const { t } = useTranslation()
  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">{t('BIS Saarthi AI Assistant', 'BIS Saarthi AI Assistant')}</h1>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">{t('Ask about standards, hallmarking, product safety, and consumer rights.', 'Ask about standards, hallmarking, product safety, and consumer rights.')}</p>
      </div>
      <ChatInterface role="consumer" />
    </div>
  )
}
