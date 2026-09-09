import React from 'react'
import ChatInterface from '@/components/chat/ChatInterface'

export default function ManufacturerChat() {
  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">BIS Saarthi — Business Assistant</h1>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Ask about ISI Mark certification, compliance requirements, lab testing, and product standards.</p>
      </div>
      <ChatInterface role="manufacturer" />
    </div>
  )
}
