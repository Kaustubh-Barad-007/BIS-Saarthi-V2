import React from 'react'
import AdminRequestsManager from '@/components/dashboard/AdminRequestsManager'

export default function AdminCertifications() {
  return (
    <div className="space-y-6 animate-fade-in">
      <AdminRequestsManager
        initialTab="certs"
        filterMode="certs"
        title="MSME Certification Applications & Approvals"
        subtitle="Review, verify laboratory test reports, and approve or reject Scheme-I & ISI mark certification applications from manufacturers."
      />
    </div>
  )
}
