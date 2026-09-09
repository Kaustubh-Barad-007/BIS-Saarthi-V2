import React from 'react'
import AdminRequestsManager from '@/components/dashboard/AdminRequestsManager'

export default function AdminComplaints() {
  return (
    <div className="space-y-6 animate-fade-in">
      <AdminRequestsManager
        initialTab="complaints"
        filterMode="complaints"
        title="Consumer Complaints Redressal Operations"
        subtitle="Review, investigate, and resolve product quality and non-compliance complaints submitted by consumers."
      />
    </div>
  )
}
