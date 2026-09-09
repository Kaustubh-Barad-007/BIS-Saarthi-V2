import React from 'react'
import ChatInterface from '@/components/chat/ChatInterface'

export default function ConsumerChat() {
  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text font-heading">BIS Saarthi AI Assistant</h1>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">Ask about standards, hallmarking, product safety, and consumer rights.</p>
      </div>
      <ChatInterface role="consumer" />
    </div>
  )
}
