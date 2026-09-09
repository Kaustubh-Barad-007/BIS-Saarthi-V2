import React from 'react'
import ChatInterface from '@/components/chat/ChatInterface'
export default function ProfessionalChat() {
  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">BIS Saarthi — Expert Assistant</h1>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Advanced queries on export standards, QCOs, technical specifications, and mutual recognition agreements.</p>
      </div>
      <ChatInterface role="professional" />
    </div>
  )
}
